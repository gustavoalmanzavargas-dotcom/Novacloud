import type express from "express";
import type { Pool } from "pg";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execute } from "./hostRuntime";

type Middleware = express.RequestHandler;
const identifier = (value: string) => '"' + value.replace(/"/g, '""') + '"';
const uuid = (value: string) =>
  /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
const userFields =
  'id, email, display_name AS "displayName", role, active, created_at AS "createdAt", last_login_at AS "lastLoginAt"';
const record = (row: any) => ({
  ...row.data,
  id: row.id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
const roles = ["admin", "operator", "viewer"];
function name(value: unknown) {
  const text = String(value || "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9 _.-]{0,79}$/.test(text))
    throw new Error(
      "Use a name of 1–80 letters, numbers, spaces, dots, underscores or hyphens",
    );
  return text;
}
export function registerManagement(
  app: express.Express,
  pool: Pool,
  auth: Middleware,
  admin: Middleware,
) {
  const audit = (
    client: any,
    actor: string,
    action: string,
    resource: string,
  ) =>
    client.query(
      "INSERT INTO activity_events (actor, action, resource, status) VALUES ($1,$2,$3,'SUCCESS')",
      [actor, action, resource],
    );
  const transaction = async (work: (client: any) => Promise<any>) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  };
  const ownedDatabase = async (id: string, client: any = pool) => {
    if (!uuid(id))
      throw Object.assign(new Error("Invalid database ID"), { status: 400 });
    const result = await client.query(
      "SELECT * FROM resources WHERE id=$1 AND type='database' AND provider='nova-native'",
      [id],
    );
    if (!result.rows[0])
      throw Object.assign(new Error("Database not found"), { status: 404 });
    const schema = `nova_db_${id.replace(/-/g, "").slice(0, 24)}`;
    if (result.rows[0].data.schema !== schema)
      throw Object.assign(
        new Error("Database schema is outside Nova ownership"),
        { status: 409 },
      );
    return result.rows[0];
  };
  const snapshotPath = (value: string) => {
    const root = path.resolve("data/database-snapshots");
    const target = path.resolve(value);
    if (
      path.dirname(target) !== root ||
      fs.lstatSync(target).isSymbolicLink() ||
      !fs.statSync(target).isFile()
    )
      throw new Error("Snapshot is outside Nova ownership");
    return target;
  };
  const pgOptions = () => {
    const url = new URL(process.env.DATABASE_URL!);
    return {
      args: [
        "--host",
        url.hostname,
        "--port",
        url.port || "5432",
        "--username",
        decodeURIComponent(url.username),
        "--dbname",
        decodeURIComponent(url.pathname.slice(1)),
      ],
      env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password) },
    };
  };

  app.get("/api/iam/users", auth, async (_req, res) => {
    res.json(
      (await pool.query(`SELECT ${userFields} FROM users ORDER BY created_at`))
        .rows,
    );
  });
  app.post("/api/iam/users", admin, async (req, res) => {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const displayName = String(req.body?.displayName || "").trim();
    const role = String(req.body?.role || "operator");
    const password = String(
      req.body?.password || crypto.randomBytes(18).toString("base64url"),
    );
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !displayName ||
      displayName.length > 120 ||
      !roles.includes(role) ||
      password.length < 12 ||
      password.length > 128
    )
      return res.status(400).json({
        error:
          "Valid email, name, role and a password of 12–128 characters are required",
      });
    try {
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await transaction(async (client) => {
        const row = await client.query(
          `INSERT INTO users (email,display_name,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING ${userFields}`,
          [email, displayName, passwordHash, role],
        );
        await audit(
          client,
          req.session.userId!,
          "iam.user.create",
          row.rows[0].id,
        );
        return row.rows[0];
      });
      res.status(201).json({
        ...user,
        temporaryPassword: req.body?.password ? undefined : password,
      });
    } catch (error: any) {
      if (error.code === "23505")
        return res.status(409).json({ error: "Email already exists" });
      throw error;
    }
  });
  app.patch("/api/iam/users/:id", admin, async (req, res) => {
    if (!uuid(req.params.id))
      return res.status(400).json({ error: "Invalid user ID" });
    try {
      const updated = await transaction(async (client) => {
        // Serialize administrator membership changes, including concurrent demotions.
        await client.query("SELECT id FROM users ORDER BY id FOR UPDATE");
        const current = (
          await client.query("SELECT * FROM users WHERE id=$1", [req.params.id])
        ).rows[0];
        if (!current)
          throw Object.assign(new Error("User not found"), { status: 404 });
        const role = String(req.body?.role ?? current.role);
        const active = req.body?.active ?? current.active;
        const displayName = String(
          req.body?.displayName ?? current.display_name,
        ).trim();
        const email = String(req.body?.email ?? current.email)
          .trim()
          .toLowerCase();
        if (
          !roles.includes(role) ||
          typeof active !== "boolean" ||
          !displayName ||
          displayName.length > 120 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        )
          throw Object.assign(new Error("Invalid account details"), {
            status: 400,
          });
        if (
          current.role === "admin" &&
          current.active &&
          (role !== "admin" || !active)
        ) {
          const remaining = (
            await client.query(
              "SELECT count(*)::int AS count FROM users WHERE role='admin' AND active=true AND id<>$1",
              [req.params.id],
            )
          ).rows[0].count;
          if (!remaining)
            throw Object.assign(
              new Error("Keep at least one active administrator"),
              { status: 409 },
            );
        }
        let hash = current.password_hash;
        if (req.body?.password !== undefined) {
          const password = String(req.body.password);
          if (password.length < 12 || password.length > 128)
            throw Object.assign(
              new Error("Password must contain 12–128 characters"),
              { status: 400 },
            );
          hash = await bcrypt.hash(password, 12);
        }
        const result = await client.query(
          `UPDATE users SET email=$2,display_name=$3,role=$4,active=$5,password_hash=$6 WHERE id=$1 RETURNING ${userFields}`,
          [req.params.id, email, displayName, role, active, hash],
        );
        await audit(
          client,
          req.session.userId!,
          "iam.user.update",
          req.params.id,
        );
        return result.rows[0];
      });
      res.json(updated);
    } catch (error: any) {
      if (error.code === "23505")
        return res.status(409).json({ error: "Email already exists" });
      throw error;
    }
  });
  app.delete("/api/iam/users/:id", admin, async (req, res) => {
    if (!uuid(req.params.id))
      return res.status(400).json({ error: "Invalid user ID" });
    if (req.params.id === req.session.userId)
      return res
        .status(409)
        .json({ error: "You cannot delete your own signed-in account" });
    await transaction(async (client) => {
      await client.query("SELECT id FROM users ORDER BY id FOR UPDATE");
      const user = (
        await client.query("SELECT * FROM users WHERE id=$1", [req.params.id])
      ).rows[0];
      if (!user)
        throw Object.assign(new Error("User not found"), { status: 404 });
      if (
        user.role === "admin" &&
        user.active &&
        !(
          await client.query(
            "SELECT id FROM users WHERE role='admin' AND active=true AND id<>$1",
            [req.params.id],
          )
        ).rows.length
      )
        throw Object.assign(
          new Error("Keep at least one active administrator"),
          { status: 409 },
        );
      await client.query("DELETE FROM users WHERE id=$1", [req.params.id]);
      await audit(
        client,
        req.session.userId!,
        "iam.user.delete",
        req.params.id,
      );
    });
    res.status(204).end();
  });
  app.post("/api/auth/password", auth, async (req, res) => {
    const user = (
      await pool.query("SELECT password_hash FROM users WHERE id=$1", [
        req.session.userId,
      ])
    ).rows[0];
    const password = String(req.body?.password || "");
    if (
      !user ||
      !(await bcrypt.compare(
        String(req.body?.currentPassword || ""),
        user.password_hash,
      ))
    )
      return res.status(400).json({ error: "Current password is incorrect" });
    if (password.length < 12 || password.length > 128)
      return res
        .status(400)
        .json({ error: "Password must contain 12–128 characters" });
    await pool.query("UPDATE users SET password_hash=$2 WHERE id=$1", [
      req.session.userId,
      await bcrypt.hash(password, 12),
    ]);
    res.json({ updated: true });
  });

  app.get("/api/settings", auth, async (_req, res) => {
    const saved = (
      await pool.query("SELECT data FROM console_settings WHERE id='workspace'")
    ).rows[0]?.data;
    res.json(saved || { organization: "NovaCloud", sessionMinutes: 480 });
  });
  app.patch("/api/settings", admin, async (req, res) => {
    const organization = String(req.body?.organization || "").trim();
    const sessionMinutes = Number(req.body?.sessionMinutes);
    if (
      !organization ||
      organization.length > 120 ||
      !Number.isInteger(sessionMinutes) ||
      sessionMinutes < 15 ||
      sessionMinutes > 1440
    )
      return res.status(400).json({
        error:
          "Organization and a session duration of 15–1440 minutes are required",
      });
    const data = { organization, sessionMinutes };
    await transaction(async (client) => {
      await client.query(
        "INSERT INTO console_settings (id,data) VALUES ('workspace',$1) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
        [data],
      );
      await audit(client, req.session.userId!, "settings.update", "workspace");
    });
    res.json(data);
  });

  app.get("/api/databases", auth, async (_req, res) => {
    const rows = (
      await pool.query(
        "SELECT * FROM resources WHERE type='database' AND provider='nova-native' ORDER BY created_at DESC",
      )
    ).rows;
    const results = [];
    for (const row of rows) {
      const schema = `nova_db_${row.id.replace(/-/g, "").slice(0, 24)}`;
      const size = await pool.query(
        "SELECT COALESCE(SUM(pg_total_relation_size(c.oid)),0)::text AS bytes FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1",
        [schema],
      );
      results.push({
        ...record(row),
        kind: "PostgreSQL schema",
        sizeBytes: Number(size.rows[0]?.bytes || 0),
      });
    }
    res.json(results);
  });
  app.post("/api/databases", admin, async (req, res) => {
    let dbName: string;
    try {
      dbName = name(req.body?.name);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
    const id = crypto.randomUUID(),
      schema = `nova_db_${id.replace(/-/g, "").slice(0, 24)}`;
    const row = await transaction(async (client) => {
      await client.query(`CREATE SCHEMA ${identifier(schema)}`);
      const version = (await client.query("SHOW server_version")).rows[0]
        .server_version;
      const saved = (
        await client.query(
          "INSERT INTO resources (id,type,provider,external_id,data) VALUES ($1,'database','nova-native',$2,$3) RETURNING *",
          [
            id,
            `database:${id}`,
            {
              name: dbName,
              schema,
              engine: "PostgreSQL",
              version,
              kind: "PostgreSQL schema",
              status: "Available",
            },
          ],
        )
      ).rows[0];
      await audit(client, req.session.userId!, "database.create", id);
      return saved;
    });
    res.status(201).json(record(row));
  });
  app.patch("/api/databases/:id", admin, async (req, res) => {
    let dbName: string;
    try {
      dbName = name(req.body?.name);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
    const row = await transaction(async (client) => {
      const current = await ownedDatabase(req.params.id, client);
      const saved = (
        await client.query(
          "UPDATE resources SET data=$2,updated_at=NOW() WHERE id=$1 RETURNING *",
          [req.params.id, { ...current.data, name: dbName }],
        )
      ).rows[0];
      await audit(
        client,
        req.session.userId!,
        "database.rename",
        req.params.id,
      );
      return saved;
    });
    res.json(record(row));
  });
  app.delete("/api/databases/:id", admin, async (req, res) => {
    await transaction(async (client) => {
      const current = await ownedDatabase(req.params.id, client);
      if (req.body?.confirmName !== current.data.name)
        throw Object.assign(
          new Error("Enter the database name to confirm deletion"),
          { status: 400 },
        );
      await client.query(
        `DROP SCHEMA ${identifier(current.data.schema)} CASCADE`,
      );
      await client.query("DELETE FROM resources WHERE id=$1", [req.params.id]);
      await audit(
        client,
        req.session.userId!,
        "database.delete",
        req.params.id,
      );
    });
    res.status(204).end();
  });
  app.post("/api/databases/:id/query", admin, async (req, res) => {
    const db = await ownedDatabase(req.params.id);
    const sql = String(req.body?.sql || "").trim();
    if (!sql || sql.length > 100000)
      return res
        .status(400)
        .json({ error: "SQL must contain 1–100000 characters" });
    // This is an administrator SQL console, not an untrusted tenant SQL sandbox.
    const result = await transaction(async (client) => {
      await client.query(
        `SET LOCAL search_path TO ${identifier(db.data.schema)}`,
      );
      await client.query("SET LOCAL statement_timeout = '15s'");
      const result = await client.query(sql);
      return Array.isArray(result) ? result[result.length - 1] : result;
    }).catch((error: any) => {
      throw Object.assign(error, { status: 400 });
    });
    res.json({
      command: result.command,
      rowCount: result.rowCount,
      fields: result.fields?.map((field: any) => field.name) || [],
      rows: result.rows?.slice(0, 1000) || [],
    });
  });
  app.get("/api/databases/:id/snapshots", auth, async (req, res) => {
    if (!uuid(req.params.id))
      return res.status(400).json({ error: "Invalid database ID" });
    res.json(
      (
        await pool.query(
          "SELECT * FROM resources WHERE type='database-snapshot' AND data->>'databaseId'=$1 ORDER BY created_at DESC",
          [req.params.id],
        )
      ).rows.map((row) => {
        const { filePath, ...data } = record(row);
        return data;
      }),
    );
  });
  app.post("/api/databases/:id/snapshots", admin, async (req, res) => {
    const db = await ownedDatabase(req.params.id);
    const root = path.resolve("data/database-snapshots");
    fs.mkdirSync(root, { recursive: true, mode: 0o700 });
    const id = crypto.randomUUID(),
      filePath = path.join(root, `${id}.sql`);
    const pg = pgOptions();
    try {
      await execute(
        "pg_dump",
        [
          ...pg.args,
          "--schema",
          db.data.schema,
          "--no-owner",
          "--no-privileges",
          "--file",
          filePath,
        ],
        120000,
        { env: pg.env },
      );
      const data = {
        databaseId: db.id,
        databaseName: db.data.name,
        name: String(req.body?.name || `${db.data.name} snapshot`).slice(0, 80),
        filePath,
        sizeBytes: fs.statSync(filePath).size,
        status: "Available",
      };
      const saved = (
        await pool.query(
          "INSERT INTO resources (id,type,provider,external_id,data) VALUES ($1,'database-snapshot','nova-native',$2,$3) RETURNING *",
          [id, `database-snapshot:${id}`, data],
        )
      ).rows[0];
      res.status(201).json({ ...record(saved), filePath: undefined });
    } catch (error) {
      fs.rmSync(filePath, { force: true });
      throw error;
    }
  });
  app.get("/api/database-snapshots", auth, async (_req, res) => {
    const rows = (
      await pool.query(
        "SELECT s.*,d.id AS database_exists FROM resources s LEFT JOIN resources d ON d.id::text=s.data->>'databaseId' AND d.type='database' WHERE s.type='database-snapshot' AND s.provider='nova-native' ORDER BY s.created_at DESC",
      )
    ).rows;
    res.json(
      rows.map((row) => {
        const { filePath, ...data } = record(row);
        return { ...data, databaseExists: Boolean(row.database_exists) };
      }),
    );
  });
  app.delete("/api/database-snapshots/:id", admin, async (req, res) => {
    const row = (
      await pool.query(
        "SELECT * FROM resources WHERE id=$1 AND type='database-snapshot' AND provider='nova-native'",
        [req.params.id],
      )
    ).rows[0];
    if (!row) return res.status(404).json({ error: "Snapshot not found" });
    fs.unlinkSync(snapshotPath(row.data.filePath));
    await pool.query("DELETE FROM resources WHERE id=$1", [req.params.id]);
    res.status(204).end();
  });
  app.get("/api/database-snapshots/:id/download", admin, async (req, res) => {
    const row = (
      await pool.query(
        "SELECT data FROM resources WHERE id=$1 AND type='database-snapshot' AND provider='nova-native'",
        [req.params.id],
      )
    ).rows[0];
    if (!row) return res.status(404).json({ error: "Snapshot not found" });
    res.download(snapshotPath(row.data.filePath), `${req.params.id}.sql`);
  });
  app.post("/api/database-snapshots/:id/restore", admin, async (req, res) => {
    const snapshot = (
      await pool.query(
        "SELECT data FROM resources WHERE id=$1 AND type='database-snapshot' AND provider='nova-native'",
        [req.params.id],
      )
    ).rows[0];
    if (!snapshot) return res.status(404).json({ error: "Snapshot not found" });
    let db: any;
    try {
      db = await ownedDatabase(snapshot.data.databaseId);
    } catch (error: any) {
      if (error.status !== 404 || req.body?.recreate !== true) throw error;
      const databaseId = String(snapshot.data.databaseId);
      if (!uuid(databaseId))
        return res.status(400).json({ error: "Invalid snapshot database ID" });
      const schema = `nova_db_${databaseId.replace(/-/g, "").slice(0, 24)}`;
      if (
        (
          await pool.query(
            "SELECT nspname FROM pg_namespace WHERE nspname=$1",
            [schema],
          )
        ).rows.length
      )
        return res.status(409).json({
          error:
            "The source schema still exists outside the database inventory; restore refused",
        });
      if (req.body?.confirmName !== snapshot.data.databaseName)
        return res
          .status(400)
          .json({ error: "Enter the snapshot database name to recreate it" });
      const pg = pgOptions();
      await execute(
        "psql",
        [
          ...pg.args,
          "--no-psqlrc",
          "--single-transaction",
          "--set=ON_ERROR_STOP=1",
          "--file",
          snapshotPath(snapshot.data.filePath),
        ],
        120000,
        { env: pg.env },
      );
      const version = (await pool.query("SHOW server_version")).rows[0]
        .server_version;
      await pool.query(
        "INSERT INTO resources (id,type,provider,external_id,data) VALUES ($1,'database','nova-native',$2,$3)",
        [
          databaseId,
          `database:${databaseId}`,
          {
            name: snapshot.data.databaseName,
            schema,
            engine: "PostgreSQL",
            version,
            kind: "PostgreSQL schema",
            status: "Available",
          },
        ],
      );
      await audit(pool, req.session.userId!, "database.recreate", databaseId);
      return res.json({ restored: true, recreated: true, databaseId });
    }
    if (req.body?.confirmName !== db.data.name)
      return res
        .status(400)
        .json({ error: "Enter the current database name to confirm restore" });
    const pg = pgOptions();
    await execute(
      "psql",
      [
        ...pg.args,
        "--no-psqlrc",
        "--single-transaction",
        "--set=ON_ERROR_STOP=1",
        "--command",
        `DROP SCHEMA ${identifier(db.data.schema)} CASCADE`,
        "--file",
        snapshotPath(snapshot.data.filePath),
      ],
      120000,
      { env: pg.env },
    );
    await audit(pool, req.session.userId!, "database.restore", db.id);
    res.json({ restored: true, databaseId: db.id });
  });
}
