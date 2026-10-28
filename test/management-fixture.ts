import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import { once } from "node:events";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { registerManagement } from "../server/management.ts";
import { registerCatalog } from "../server/catalog.ts";
import { createAccess } from "../server/access.ts";
import { featureMap } from "../server/capabilities.ts";

export async function managementHarness() {
  const embedded = process.env.TEST_DATABASE_URL ? null : new PGlite();
  const scope = `nova_test_${crypto.randomUUID().replaceAll("-", "")}`;
  let native = process.env.TEST_DATABASE_URL
    ? new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL })
    : null;
  if (native) {
    await native.query(`CREATE SCHEMA ${scope}`);
    await native.end();
    native = new pg.Pool({
      connectionString: process.env.TEST_DATABASE_URL,
      options: `-c search_path=${scope},public`,
    });
  }
  const query = async (sql: string, values: any[] = []) => {
    if (native) return native.query(sql, values);
    const result: any = await embedded!.query(sql, values);
    return {
      ...result,
      rowCount: result.affectedRows ?? result.rows.length,
      command: sql.split(" ")[0],
    };
  };
  const pool: any = {
    query,
    connect: native
      ? native.connect.bind(native)
      : async () => ({ query, release() {} }),
  };
  const schemaSql = fs
    .readFileSync("database/schema.sql", "utf8")
    .replace("CREATE EXTENSION IF NOT EXISTS pgcrypto;", "");
  if (embedded) await embedded.exec(schemaSql);
  else await query(schemaSql);
  const email = `admin-${crypto.randomUUID()}@example.test`;
  const administrator = (
    await query(
      "INSERT INTO users (email,display_name,password_hash,role) VALUES ($1,'Test administrator',$2,'admin') RETURNING id",
      [email, await bcrypt.hash("test-password-123", 4)],
    )
  ).rows[0];
  const app = express();
  for (const method of ["get", "post", "patch", "delete"] as const) {
    const original = app[method].bind(app);
    (app as any)[method] = (route: string, ...handlers: any[]) =>
      handlers.length
        ? original(
            route,
            ...handlers.map(
              (fn) => (req: any, res: any, next: any) =>
                Promise.resolve(fn(req, res, next)).catch(next),
            ),
          )
        : (original as any)(route);
  }
  app.use(express.json());
  app.use(
    session({
      secret: "test-session-secret",
      resave: false,
      saveUninitialized: false,
    }),
  );
  // Authentication fixture uses real password hashes and HTTP session cookies.
  app.post("/api/auth/login", async (req, res) => {
    const user = (
      await query("SELECT * FROM users WHERE email=$1 AND active=TRUE", [
        req.body.email,
      ])
    ).rows[0];
    if (!user || !(await bcrypt.compare(req.body.password, user.password_hash)))
      return res.status(401).json({ error: "Invalid credentials" });
    req.session.userId = user.id;
    res.json({ user });
  });
  app.post("/api/auth/logout", (req, res) =>
    req.session.destroy(() => res.status(204).end()),
  );
  const access = createAccess(pool);
  app.get("/api/auth/me", access.auth as any, async (req, res) => {
    const user = (
      await query(
        'SELECT id,email,display_name AS "displayName",role FROM users WHERE id=$1',
        [req.session.userId],
      )
    ).rows[0];
    res.json({ user });
  });
  registerManagement(app, pool, access.auth as any, access.admin as any);
  const deployments: any[] = [];
  registerCatalog(
    app,
    pool,
    access.auth as any,
    access.admin as any,
    async (url, method, body) => {
      deployments.push({ url, method, body });
      return { id: crypto.randomUUID(), ...body, status: "Running" };
    },
  );
  app.use((error: any, _req: any, res: any, _next: any) =>
    res.status(error.status || 500).json({ error: error.message }),
  );
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  async function api(url: string, method = "GET", body?: any, cookie = "") {
    const response = await fetch(base + url, {
      method,
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      body: response.status === 204 ? null : await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0] || cookie,
    };
  }
  return {
    app,
    pool,
    server,
    base,
    email,
    administrator,
    deployments,
    query,
    api,
    async close() {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      if (embedded) await embedded.close();
      if (native) {
        const records = (
          await native.query("SELECT data FROM resources WHERE type='database'")
        ).rows;
        for (const row of records)
          if (/^nova_db_[a-f0-9]{24}$/.test(row.data.schema))
            await native.query(
              `DROP SCHEMA IF EXISTS ${row.data.schema} CASCADE`,
            );
        await native.query(`DROP SCHEMA ${scope} CASCADE`);
        await native.end();
      }
    },
  };
}
