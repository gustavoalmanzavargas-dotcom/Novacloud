import type express from "express";
import type { Pool } from "pg";
import crypto from "node:crypto";
export function registerCatalog(
  app: express.Express,
  pool: Pool,
  auth: express.RequestHandler,
  admin: express.RequestHandler,
  agentRequest: (
    path: string,
    method?: string,
    body?: any,
    timeout?: number,
  ) => Promise<any>,
) {
  const list = async (type: string) =>
    (
      await pool.query(
        "SELECT * FROM resources WHERE type=$1 AND provider='nova-native' ORDER BY created_at DESC",
        [type],
      )
    ).rows.map((r) => ({ ...r.data, id: r.id, createdAt: r.created_at }));
  const insert = async (type: string, data: any, actor: string) => {
    const id = crypto.randomUUID();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const row = (
        await client.query(
          "INSERT INTO resources (id,type,provider,external_id,data) VALUES ($1,$2,'nova-native',$3,$4) RETURNING *",
          [id, type, `${type}:${id}`, data],
        )
      ).rows[0];
      await client.query(
        "INSERT INTO activity_events (actor,action,resource,status) VALUES ($1,$2,$3,'SUCCESS')",
        [actor, `${type}.create`, id],
      );
      await client.query("COMMIT");
      return { ...row.data, id, createdAt: row.created_at };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  };
  app.get("/api/billing", auth, async (_req, res) =>
    res.json({
      mode: "manual-invoices",
      paymentsEnabled: false,
      invoices: await list("invoice"),
    }),
  );
  app.post("/api/billing/invoices", admin, async (req, res) => {
    const customer = String(req.body?.customer || "").trim(),
      description = String(req.body?.description || "").trim(),
      amountCents = Number(req.body?.amountCents);
    if (
      !customer ||
      customer.length > 120 ||
      !description ||
      description.length > 500 ||
      !Number.isSafeInteger(amountCents) ||
      amountCents < 0 ||
      amountCents > 100000000
    )
      return res
        .status(400)
        .json({
          error:
            "Customer, description and an amount of 0–100000000 cents are required",
        });
    res
      .status(201)
      .json(
        await insert(
          "invoice",
          {
            customer,
            description,
            amountCents,
            currency: "USD",
            status: "draft",
          },
          req.session.userId!,
        ),
      );
  });
  app.patch("/api/billing/invoices/:id", admin, async (req, res) => {
    if (!["draft", "issued", "void"].includes(req.body?.status))
      return res.status(400).json({ error: "Select draft, issued or void" });
    const row = (
      await pool.query(
        "UPDATE resources SET data=jsonb_set(data,'{status}',$2::jsonb),updated_at=NOW() WHERE id=$1 AND type='invoice' AND provider='nova-native' RETURNING *",
        [req.params.id, JSON.stringify(req.body.status)],
      )
    ).rows[0];
    if (!row) return res.status(404).json({ error: "Invoice not found" });
    res.json({ ...row.data, id: row.id, createdAt: row.created_at });
  });
  app.get("/api/marketplace/catalog", auth, async (_req, res) => {
    const apps = await list("application-template");
    res.json({ total: apps.length, apps });
  });
  app.post("/api/marketplace/catalog", admin, async (req, res) => {
    const fields = [
      "name",
      "repoUrl",
      "branch",
      "buildCommand",
      "startCommand",
    ] as const;
    const data = Object.fromEntries(
      fields.map((key) => [key, String(req.body?.[key] || "").trim()]),
    );
    if (
      fields.some((key) => !data[key] || data[key].length > 4096) ||
      !/^https?:\/\//.test(data.repoUrl) ||
      /[\r\n]/.test(data.branch)
    )
      return res
        .status(400)
        .json({
          error:
            "A name, HTTP(S) Git URL, branch, build command and start command are required",
        });
    res
      .status(201)
      .json(await insert("application-template", data, req.session.userId!));
  });
  app.delete("/api/marketplace/catalog/:id", admin, async (req, res) => {
    const result = await pool.query(
      "DELETE FROM resources WHERE id=$1 AND type='application-template' AND provider='nova-native' RETURNING id",
      [req.params.id],
    );
    if (!result.rows[0])
      return res.status(404).json({ error: "Template not found" });
    res.status(204).end();
  });
  app.post("/api/marketplace/catalog/:id/deploy", admin, async (req, res) => {
    const template = (
      await pool.query(
        "SELECT data FROM resources WHERE id=$1 AND type='application-template' AND provider='nova-native'",
        [req.params.id],
      )
    ).rows[0];
    if (!template) return res.status(404).json({ error: "Template not found" });
    const name = String(req.body?.name || "").trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$/.test(name))
      return res.status(400).json({ error: "Enter a valid deployment name" });
    res
      .status(201)
      .json(
        await agentRequest(
          "/v1/apps",
          "POST",
          { ...template.data, name, sourceType: "git" },
          900000,
        ),
      );
  });
}
