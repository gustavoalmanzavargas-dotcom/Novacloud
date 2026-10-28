import { test } from "node:test";
import assert from "node:assert/strict";
import { managementHarness } from "./management-fixture.ts";
import { featureMap } from "../server/capabilities.ts";

test(
  "management APIs persist real users, database edits/deletion, settings, invoices and catalog recipes",
  { timeout: 60000 },
  async () => {
    const h = await managementHarness();
    try {
      const admin = await h.api("/api/auth/login", "POST", {
        email: h.email,
        password: "test-password-123",
      });
      assert.equal(admin.status, 200);
      const cookie = admin.cookie;
      assert.equal((await h.api("/api/iam/users")).status, 401);
      const created = await h.api(
        "/api/iam/users",
        "POST",
        { email: "viewer@example.test", displayName: "Viewer", role: "viewer" },
        cookie,
      );
      assert.equal(created.status, 201);
      assert.ok(created.body.temporaryPassword.length >= 12);
      assert.equal(created.body.password_hash, undefined);
      const viewer = await h.api("/api/auth/login", "POST", {
        email: "viewer@example.test",
        password: created.body.temporaryPassword,
      });
      assert.equal(
        (
          await h.api(
            "/api/iam/users",
            "POST",
            { email: "bad@example.test", displayName: "No", role: "admin" },
            viewer.cookie,
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await h.api(
            "/api/databases",
            "POST",
            { name: "Forbidden" },
            viewer.cookie,
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await h.api(
            `/api/iam/users/${h.administrator.id}`,
            "PATCH",
            { active: false },
            cookie,
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await h.api(
            `/api/iam/users/${created.body.id}`,
            "PATCH",
            { displayName: "Edited viewer", active: false },
            cookie,
          )
        ).status,
        200,
      );
      assert.equal(
        (await h.api("/api/iam/users", "GET", undefined, viewer.cookie)).status,
        401,
      );
      assert.equal(
        (
          await h.api(
            `/api/iam/users/${created.body.id}`,
            "DELETE",
            undefined,
            cookie,
          )
        ).status,
        204,
      );

      await h.query("CREATE TABLE lightnas_guard (value TEXT)");
      await h.query("INSERT INTO lightnas_guard VALUES ('preserve')");
      const db = await h.api(
        "/api/databases",
        "POST",
        { name: "Application DB" },
        cookie,
      );
      assert.equal(db.status, 201);
      const dbid = db.body.id,
        schema = db.body.schema;
      assert.equal(
        (
          await h.api(
            `/api/databases/${dbid}`,
            "PATCH",
            { name: "Renamed DB" },
            cookie,
          )
        ).body.name,
        "Renamed DB",
      );
      assert.equal(
        (
          await h.api(
            `/api/databases/${dbid}/query`,
            "POST",
            { sql: "CREATE TABLE records (value TEXT)" },
            cookie,
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await h.api(
            `/api/databases/${dbid}/query`,
            "POST",
            { sql: "INSERT INTO records VALUES ('real data')" },
            cookie,
          )
        ).status,
        200,
      );
      const select = await h.api(
        `/api/databases/${dbid}/query`,
        "POST",
        { sql: "SELECT * FROM records" },
        cookie,
      );
      assert.equal(select.body.rows[0].value, "real data");
      let snapshotId: string | undefined;
      if (process.env.TEST_DATABASE_URL) {
        process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
        const snapshot = await h.api(
          `/api/databases/${dbid}/snapshots`,
          "POST",
          { name: "Before change" },
          cookie,
        );
        assert.equal(snapshot.status, 201, JSON.stringify(snapshot.body));
        snapshotId = snapshot.body.id;
        await h.api(
          `/api/databases/${dbid}/query`,
          "POST",
          { sql: "INSERT INTO records VALUES ('after snapshot')" },
          cookie,
        );
        const restore = await h.api(
          `/api/database-snapshots/${snapshot.body.id}/restore`,
          "POST",
          { confirmName: "Renamed DB" },
          cookie,
        );
        assert.equal(restore.status, 200, JSON.stringify(restore.body));
        assert.equal(
          (
            await h.api(
              `/api/databases/${dbid}/query`,
              "POST",
              { sql: "SELECT * FROM records" },
              cookie,
            )
          ).body.rows.length,
          1,
        );
        const download = await fetch(
          h.base + `/api/database-snapshots/${snapshot.body.id}/download`,
          { headers: { Cookie: cookie } },
        );
        assert.equal(download.status, 200);
        assert.match(await download.text(), /real data/);
      }

      assert.equal(
        (await h.api("/api/databases", "GET", undefined, cookie)).body[0].name,
        "Renamed DB",
      );
      assert.equal(
        (
          await h.api(
            `/api/databases/${dbid}`,
            "DELETE",
            { confirmName: "wrong" },
            cookie,
          )
        ).status,
        400,
      );
      await h.query(
        "UPDATE resources SET data=jsonb_set(data,'{schema}','\"public\"') WHERE id=$1",
        [dbid],
      );
      assert.equal(
        (
          await h.api(
            `/api/databases/${dbid}`,
            "DELETE",
            { confirmName: "Renamed DB" },
            cookie,
          )
        ).status,
        409,
      );
      await h.query(
        "UPDATE resources SET data=jsonb_set(data,'{schema}',$2::jsonb) WHERE id=$1",
        [dbid, JSON.stringify(schema)],
      );
      assert.equal(
        (
          await h.api(
            `/api/databases/${dbid}`,
            "DELETE",
            { confirmName: "Renamed DB" },
            cookie,
          )
        ).status,
        204,
      );
      assert.equal(
        (await h.query("SELECT * FROM lightnas_guard")).rows[0].value,
        "preserve",
      );
      assert.equal(
        (
          await h.query("SELECT nspname FROM pg_namespace WHERE nspname=$1", [
            schema,
          ])
        ).rows.length,
        0,
      );
      if (snapshotId) {
        const backups = await h.api(
          "/api/database-snapshots",
          "GET",
          undefined,
          cookie,
        );
        assert.equal(
          backups.body.find((b: any) => b.id === snapshotId).databaseExists,
          false,
        );
        const recreated = await h.api(
          `/api/database-snapshots/${snapshotId}/restore`,
          "POST",
          { confirmName: "Renamed DB", recreate: true },
          cookie,
        );
        assert.equal(recreated.status, 200, JSON.stringify(recreated.body));
        assert.equal(
          (
            await h.api(
              `/api/databases/${dbid}/query`,
              "POST",
              { sql: "SELECT * FROM records" },
              cookie,
            )
          ).body.rows[0].value,
          "real data",
        );
        assert.equal(
          (
            await h.api(
              `/api/databases/${dbid}`,
              "DELETE",
              { confirmName: "Renamed DB" },
              cookie,
            )
          ).status,
          204,
        );
        assert.equal(
          (
            await h.api(
              `/api/database-snapshots/${snapshotId}`,
              "DELETE",
              undefined,
              cookie,
            )
          ).status,
          204,
        );
      }
      assert.equal(
        (
          await h.api(
            "/api/settings",
            "PATCH",
            { organization: "Gus Nova", sessionMinutes: 90 },
            cookie,
          )
        ).status,
        200,
      );
      assert.equal(
        (await h.api("/api/settings", "GET", undefined, cookie)).body
          .organization,
        "Gus Nova",
      );
      assert.equal(
        (
          await h.api(
            "/api/settings",
            "PATCH",
            { organization: "Gus Nova", sessionMinutes: 0 },
            cookie,
          )
        ).status,
        400,
      );
      const invoice = await h.api(
        "/api/billing/invoices",
        "POST",
        {
          customer: "Internal customer",
          description: "Manual service record",
          amountCents: 3799,
        },
        cookie,
      );
      assert.equal(invoice.status, 201);
      assert.equal(invoice.body.amountCents, 3799);
      assert.equal(
        (
          await h.api(
            `/api/billing/invoices/${invoice.body.id}`,
            "PATCH",
            { status: "issued" },
            cookie,
          )
        ).body.status,
        "issued",
      );
      assert.equal(
        (
          await h.api(
            "/api/billing/invoices",
            "POST",
            { customer: "Invalid", description: "Invalid", amountCents: -1 },
            cookie,
          )
        ).status,
        400,
      );
      const template = await h.api(
        "/api/marketplace/catalog",
        "POST",
        {
          name: "My app",
          repoUrl: "https://example.test/app.git",
          branch: "main",
          buildCommand: "none",
          startCommand: "npm start",
        },
        cookie,
      );
      assert.equal(template.status, 201);
      assert.equal(
        (
          await h.api(
            `/api/marketplace/catalog/${template.body.id}/deploy`,
            "POST",
            { name: "my-app" },
            cookie,
          )
        ).status,
        201,
      );
      assert.equal(h.deployments[0].url, "/v1/apps");
      assert.equal(
        h.deployments[0].body.repoUrl,
        "https://example.test/app.git",
      );
      assert.equal(
        (
          await h.api(
            `/api/marketplace/catalog/${template.body.id}`,
            "DELETE",
            undefined,
            cookie,
          )
        ).status,
        204,
      );
    } finally {
      await h.close();
    }
  },
);

test("capabilities keep software QEMU available without KVM while blocking TAP and native containers", () => {
  const f = featureMap(
    {
      capabilities: {
        qemu: true,
        qemuImg: true,
        kvm: false,
        tapNetworking: false,
        containers: false,
        bridgeCreation: false,
        nftables: true,
      },
    },
    true,
    false,
  );
  assert.equal(f.virtualMachines.available, true);
  assert.equal(f.kvm.available, false);
  assert.equal(f.tapNetworking.available, false);
  assert.equal(f.networks.available, false);
  assert.equal(f.ai.available, false);
  assert.equal(featureMap(null, false, false).volumes.available, false);
});
