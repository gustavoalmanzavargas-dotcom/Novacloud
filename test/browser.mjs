import assert from "node:assert/strict";
import express from "express";
import path from "node:path";
import { chromium } from "playwright";
import { managementHarness } from "./management-fixture.ts";
import { featureMap } from "../server/capabilities.ts";

// Browser fixtures cover unavailable infrastructure; management writes use PostgreSQL.
const h = await managementHarness();
const features = featureMap(
  {
    capabilities: {
      qemu: true,
      qemuImg: true,
      kvm: false,
      tapNetworking: false,
      containers: false,
      bridgeCreation: false,
      nftables: false,
      applications: false,
    },
  },
  true,
  false,
);
h.app.get("/api/capabilities", (_req, res) =>
  res.json({
    connected: true,
    host: {
      hostname: "Browser test host",
      capabilities: { acceleration: "tcg" },
      interfaces: [],
    },
    features,
  }),
);
h.app.get("/api/health", (_req, res) => res.json({ status: "healthy" }));
h.app.get("/api/resources", async (_req, res) =>
  res.json((await h.query("SELECT * FROM resources")).rows),
);
h.app.get("/api/activity", async (_req, res) =>
  res.json(
    (
      await h.query(
        "SELECT *,created_at AS timestamp FROM activity_events ORDER BY created_at DESC",
      )
    ).rows,
  ),
);
for (const url of [
  "/api/jobs",
  "/api/hosts",
  "/api/compute/vms",
  "/api/storage/volumes",
  "/api/networking/vpcs",
  "/api/containers",
  "/api/compute/snapshots",
  "/api/clients",
  "/api/compute/ssh-keys",
  "/api/applications",
])
  h.app.get(url, (_req, res) => res.json([]));
h.app.get("/api/compute/options", (_req, res) =>
  res.json({ images: [], bridges: ["user"], nodes: ["Browser test host"] }),
);
h.app.get("/api/containers/options", (_req, res) =>
  res.json({
    available: false,
    reason: "Nested container permissions are unavailable in this test fixture",
    bases: [],
  }),
);
h.app.get("/api/storage/devices", (_req, res) =>
  res.json({
    devices: [],
    managedStorage: { path: "/test/nova/disks" },
    stateFilesystem: { totalBytes: 1024 ** 3, freeBytes: 1024 ** 3 },
  }),
);
h.app.get("/api/logs", (_req, res) =>
  res.status(503).json({ error: "Journal unavailable in browser fixture" }),
);
h.app.get("/api/system/summary", (_req, res) =>
  res.status(503).json({ error: "Monitoring unavailable in browser fixture" }),
);
h.app.use(express.static(path.resolve("dist")));
h.app.get("*", (_req, res) => res.sendFile(path.resolve("dist/index.html")));
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.NOVA_TEST_CHROME || undefined,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    colorScheme: "dark",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(h.base);
  await page.locator("input[type=email]").fill(h.email);
  await page.locator("input[type=password]").fill("test-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  const tabs = [
    "Overview",
    "Compute",
    "Containers",
    "Applications",
    "Databases",
    "Storage",
    "Networking",
    "Backups",
    "Client workloads",
    "Users & access",
    "Security",
    "Monitoring",
    "Service logs",
    "Activity & audit",
    "Nova AI",
    "Developer tools",
    "Billing",
    "Marketplace",
    "Settings",
  ];
  for (const label of tabs) {
    await page
      .locator("nav")
      .getByRole("link", { name: label, exact: true })
      .click();
    await page
      .getByRole("heading", { name: label, exact: true })
      .first()
      .waitFor();
    assert.ok((await page.locator("main").innerText()).length > 50, label);
  }
  await page
    .locator("nav")
    .getByRole("link", { name: "Users & access", exact: true })
    .click();
  await page.getByRole("button", { name: "Add user", exact: true }).click();
  await page
    .getByLabel("Display name", { exact: true })
    .fill("Browser operator");
  await page
    .getByLabel("Email", { exact: true })
    .fill("browser-operator@example.test");
  await page
    .getByLabel("Password (leave blank to generate)", { exact: true })
    .fill("browser-password-123");
  await page.getByRole("button", { name: "Save account", exact: true }).click();
  await page
    .getByRole("cell", { name: "browser-operator@example.test", exact: true })
    .waitFor();
  await page
    .locator("nav")
    .getByRole("link", { name: "Databases", exact: true })
    .click();
  await page.getByLabel("Database name", { exact: true }).fill("Browser DB");
  await page
    .getByRole("button", { name: "Create database", exact: true })
    .click();
  await page.getByRole("cell", { name: "Browser DB", exact: true }).waitFor();
  await page
    .getByLabel("SQL", { exact: true })
    .fill("CREATE TABLE example (value TEXT)");
  await page.getByRole("button", { name: "Run SQL", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "SQL completed" }).waitFor();
  page.once("dialog", (dialog) => dialog.accept("Browser DB renamed"));
  await page.getByRole("button", { name: "Edit name", exact: true }).click();
  await page
    .getByRole("cell", { name: "Browser DB renamed", exact: true })
    .waitFor();
  await page.screenshot({
    path: process.env.NOVA_TEST_SCREENSHOT || "/tmp/nova-console-databases.png",
    fullPage: true,
  });
  page.once("dialog", (dialog) => dialog.accept("Browser DB renamed"));
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Database deleted" })
    .waitFor();
  assert.equal(
    (
      await h.query(
        "SELECT count(*)::int AS count FROM resources WHERE type='database'",
      )
    ).rows[0].count,
    0,
  );
  await page
    .locator("nav")
    .getByRole("link", { name: "Settings", exact: true })
    .click();
  await page
    .getByLabel("Organization name", { exact: true })
    .fill("Browser Nova");
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Settings saved" })
    .waitFor();
  await page.reload();
  await page.getByLabel("Organization name", { exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("Organization name", { exact: true }).inputValue(),
    "Browser Nova",
  );
  await page
    .locator("nav")
    .getByRole("link", { name: "Compute", exact: true })
    .click();
  await page.getByLabel("Network", { exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("Network", { exact: true }).locator("option").count(),
    1,
  );
  assert.equal(
    await page.getByLabel("Network", { exact: true }).inputValue(),
    "user",
  );
  await page.getByRole("button", { name: "images", exact: true }).click();
  await page.getByLabel("Upload ISO or disk image", { exact: true }).waitFor();
  await page.getByRole("button", { name: "ssh-keys", exact: true }).click();
  await page
    .getByRole("button", { name: "Save public key", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "autoscaling", exact: true }).click();
  await page
    .getByText(
      "The autoscaling scheduler is not implemented in this release.",
      { exact: true },
    )
    .waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Toggle navigation", exact: true })
    .click();
  await page
    .locator("nav")
    .getByRole("link", { name: "Users & access", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Users & access", exact: true })
    .first()
    .waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: all 19 tabs, account creation, database SQL/rename/delete, persisted settings, capability controls and mobile navigation.",
  );
} finally {
  if (browser) await browser.close();
  await h.close();
}
