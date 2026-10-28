import React, { useState, useEffect, createContext, useContext } from "react";
import { HomeDashboard } from "./views/HomeDashboard";
import { request, exportJson, bytes, date } from "../services/console";

export const SessionContext = createContext<any>({});
const useSession = () => useContext(SessionContext);
const id = encodeURIComponent;
export function useLoad(url: string, initial: any = []) {
  const [data, setData] = useState<any>(initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true);
    setError("");
    try {
      setData(await request(url));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    load();
  }, [url]);
  return { data, setData, error, busy, load };
}
function useAction(refresh?: () => any) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const run = async (
    work: () => Promise<any>,
    success = "Operation completed",
  ) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await work();
      setMessage(success);
      if (refresh) await refresh();
      return result;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return {
    busy,
    error,
    message,
    run,
    clear: () => {
      setError("");
      setMessage("");
    },
  };
}
export function Panel({ title, children, tools }: any) {
  return (
    <section className="nova-panel">
      <div className="nova-panel-head">
        <h2>{title}</h2>
        {tools}
      </div>
      {children}
    </section>
  );
}
function Notice({ error, message }: any) {
  return (
    <>
      {error && (
        <div role="alert" className="nova-error">
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="nova-success">
          {message}
        </div>
      )}
    </>
  );
}
function Status({ source, action }: any) {
  return (
    <Notice error={action?.error || source?.error} message={action?.message} />
  );
}
function Refresh({ source }: any) {
  return (
    <button disabled={source.busy} onClick={source.load}>
      {source.busy ? "Loading…" : "Refresh"}
    </button>
  );
}
function Field({ label, children }: any) {
  const controlId = React.useId();
  return (
    <div className="nova-field">
      <label htmlFor={controlId}>{label}</label>
      {React.isValidElement(children)
        ? React.cloneElement(children as any, { id: controlId })
        : children}
    </div>
  );
}
function Table({ headings, children, empty }: any) {
  return (
    <div className="nova-table-wrap">
      <table>
        <thead>
          <tr>
            {headings.map((h: string) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && <p className="nova-empty">No records yet.</p>}
    </div>
  );
}
function Json({ value }: any) {
  return <pre className="nova-json">{JSON.stringify(value, null, 2)}</pre>;
}
function Capability({ name }: { name: string }) {
  const { capabilities } = useSession();
  const f = capabilities?.features?.[name];
  return f && !f.available ? (
    <div className="nova-warning">{f.reason}</div>
  ) : null;
}
function allowed(name: string, adminOnly = false) {
  const { user, capabilities } = useSession();
  return (
    (adminOnly
      ? user?.role === "admin"
      : ["admin", "operator"].includes(user?.role)) &&
    capabilities?.features?.[name]?.available === true
  );
}

export function UserManager() {
  const users = useLoad("/api/iam/users"),
    action = useAction(users.load),
    { user: me } = useSession();
  const [editing, setEditing] = useState<any>(null),
    [password, setPassword] = useState(""),
    [secret, setSecret] = useState("");
  const admin = me?.role === "admin";
  const blank = { displayName: "", email: "", role: "operator", active: true };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    action.run(async () => {
      const body = { ...editing, ...(password ? { password } : {}) };
      const result = await request(
        editing.id ? `/api/iam/users/${id(editing.id)}` : "/api/iam/users",
        editing.id ? "PATCH" : "POST",
        body,
      );
      setSecret(result.temporaryPassword || "");
      setEditing(null);
      setPassword("");
    }, "Account saved");
  };
  return (
    <>
      <Panel
        title="Users & access"
        tools={
          <>
            <Refresh source={users} />
            {admin && (
              <button
                onClick={() => {
                  setEditing(blank);
                  setPassword("");
                  setSecret("");
                }}
              >
                Add user
              </button>
            )}
          </>
        }
      >
        <Status source={users} action={action} />
        {!admin && <p>Only administrators can change accounts.</p>}
        {secret && (
          <div className="nova-warning">
            Initial password (shown once): <code>{secret}</code>
            <button onClick={() => setSecret("")}>Dismiss</button>
          </div>
        )}
        <Table
          headings={[
            "Name",
            "Email",
            "Role",
            "Status",
            "Last login",
            "Actions",
          ]}
          empty={!users.data.length}
        >
          {users.data.map((u: any) => (
            <tr key={u.id}>
              <td>{u.displayName}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.active ? "Active" : "Disabled"}</td>
              <td>{date(u.lastLoginAt)}</td>
              <td>
                <div className="nova-actions">
                  <button
                    disabled={!admin || action.busy}
                    onClick={() => {
                      setEditing(u);
                      setPassword("");
                    }}
                  >
                    Edit
                  </button>
                  <button
                    disabled={!admin || me.id === u.id || action.busy}
                    onClick={() => {
                      if (window.confirm(`Delete account ${u.email}?`))
                        action.run(
                          () => request(`/api/iam/users/${id(u.id)}`, "DELETE"),
                          "Account deleted",
                        );
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      {editing && (
        <Panel title={editing.id ? "Edit account" : "Add user"}>
          <form onSubmit={save} className="nova-form">
            <Field label="Display name">
              <input
                required
                value={editing.displayName}
                onChange={(e) =>
                  setEditing({ ...editing, displayName: e.target.value })
                }
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                value={editing.email}
                onChange={(e) =>
                  setEditing({ ...editing, email: e.target.value })
                }
              />
            </Field>
            <Field label="Role">
              <select
                value={editing.role}
                onChange={(e) =>
                  setEditing({ ...editing, role: e.target.value })
                }
              >
                {["viewer", "operator", "admin"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={String(editing.active)}
                onChange={(e) =>
                  setEditing({ ...editing, active: e.target.value === "true" })
                }
              >
                <option value="true">Active</option>
                <option value="false">Disabled</option>
              </select>
            </Field>
            <Field
              label={
                editing.id
                  ? "New password (optional)"
                  : "Password (leave blank to generate)"
              }
            >
              <input
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <div className="nova-actions">
              <button disabled={action.busy}>Save account</button>
              <button type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      )}
    </>
  );
}

export function DatabaseManager() {
  const databases = useLoad("/api/databases"),
    action = useAction(databases.load),
    admin = allowed("databases", true);
  const [name, setName] = useState(""),
    [selected, setSelected] = useState(""),
    [sql, setSql] = useState(""),
    [result, setResult] = useState<any>(null),
    [snapshots, setSnapshots] = useState<any[]>([]);
  const current = databases.data.find((db: any) => db.id === selected);
  useEffect(() => {
    if (!selected && databases.data.length) setSelected(databases.data[0].id);
  }, [databases.data]);
  useEffect(() => {
    setSnapshots([]);
    setResult(null);
    if (selected)
      request(`/api/databases/${id(selected)}/snapshots`)
        .then(setSnapshots)
        .catch(() => {});
  }, [selected]);
  const loadSnapshots = async () =>
    setSnapshots(await request(`/api/databases/${id(selected)}/snapshots`));
  return (
    <>
      <Panel
        title="PostgreSQL databases"
        tools={<Refresh source={databases} />}
      >
        <Status source={databases} action={action} />
        <p>
          Nova manages named PostgreSQL schemas on the configured PostgreSQL
          server. These are logical databases; dedicated servers, HA and
          per-database resource quotas are not provisioned.
        </p>
        <form
          className="nova-inline"
          onSubmit={(e) => {
            e.preventDefault();
            action.run(async () => {
              const db = await request("/api/databases", "POST", { name });
              setName("");
              setSelected(db.id);
            }, "Database created");
          }}
        >
          <Field label="Database name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <button disabled={!admin || action.busy}>Create database</button>
        </form>
        <Table
          headings={["Database", "Schema", "Engine", "Size", "Actions"]}
          empty={!databases.data.length}
        >
          {databases.data.map((db: any) => (
            <tr key={db.id}>
              <td>{db.name}</td>
              <td>
                <code>{db.schema}</code>
              </td>
              <td>
                {db.engine} {db.version}
              </td>
              <td>{bytes(db.sizeBytes)}</td>
              <td>
                <div className="nova-actions">
                  <button onClick={() => setSelected(db.id)}>Open</button>
                  <button
                    disabled={!admin || action.busy}
                    onClick={() => {
                      const next = window.prompt("New database name", db.name);
                      if (next)
                        action.run(
                          () =>
                            request(`/api/databases/${id(db.id)}`, "PATCH", {
                              name: next,
                            }),
                          "Database renamed",
                        );
                    }}
                  >
                    Edit name
                  </button>
                  <button
                    disabled={!admin || action.busy}
                    onClick={() => {
                      const confirmName = window.prompt(
                        `Type ${db.name} to delete its schema and all tables`,
                      );
                      if (confirmName === db.name)
                        action.run(async () => {
                          await request(
                            `/api/databases/${id(db.id)}`,
                            "DELETE",
                            { confirmName },
                          );
                          if (selected === db.id) setSelected("");
                        }, "Database deleted");
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      {current && (
        <Panel title={`Database workspace: ${current.name}`}>
          <Field label="Selected database">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {databases.data.map((db: any) => (
                <option key={db.id} value={db.id}>
                  {db.name}
                </option>
              ))}
            </select>
          </Field>
          <p>
            Administrator SQL console. The default search path is this
            database’s schema. Results are limited to 1,000 rows.
          </p>
          <Field label="SQL">
            <textarea
              rows={6}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder="Enter SQL for this database"
            />
          </Field>
          <button
            disabled={!admin || action.busy || !sql.trim()}
            onClick={() =>
              action.run(
                async () =>
                  setResult(
                    await request(
                      `/api/databases/${id(selected)}/query`,
                      "POST",
                      { sql },
                    ),
                  ),
                "SQL completed",
              )
            }
          >
            Run SQL
          </button>
          {result && <Json value={result} />}
          <div className="nova-actions">
            <button
              disabled={!admin || action.busy}
              onClick={() =>
                action.run(async () => {
                  await request(
                    `/api/databases/${id(selected)}/snapshots`,
                    "POST",
                    { name: `${current.name} snapshot` },
                  );
                  await loadSnapshots();
                }, "Snapshot created")
              }
            >
              Create database snapshot
            </button>
            <button
              onClick={() => action.run(loadSnapshots, "Snapshots refreshed")}
            >
              Refresh snapshots
            </button>
          </div>
          <Table
            headings={["Snapshot", "Created", "Size", "Actions"]}
            empty={!snapshots.length}
          >
            {snapshots.map((snapshot: any) => (
              <tr key={snapshot.id}>
                <td>{snapshot.name}</td>
                <td>{date(snapshot.createdAt)}</td>
                <td>{bytes(snapshot.sizeBytes)}</td>
                <td>
                  <div className="nova-actions">
                    <a
                      href={`/api/database-snapshots/${id(snapshot.id)}/download`}
                    >
                      Download SQL
                    </a>
                    <button
                      disabled={!admin || action.busy}
                      onClick={() => {
                        const confirmName = window.prompt(
                          `Type ${current.name} to replace its schema with this snapshot`,
                        );
                        if (confirmName === current.name)
                          action.run(
                            () =>
                              request(
                                `/api/database-snapshots/${id(snapshot.id)}/restore`,
                                "POST",
                                { confirmName },
                              ),
                            "Database restored",
                          );
                      }}
                    >
                      Restore
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}
    </>
  );
}

export function SettingsManager() {
  const source = useLoad("/api/settings", null),
    action = useAction(source.load),
    { user, refresh } = useSession();
  const [form, setForm] = useState<any>(null),
    [currentPassword, setCurrentPassword] = useState(""),
    [password, setPassword] = useState("");
  useEffect(() => setForm(source.data), [source.data]);
  return (
    <>
      <Panel title="Workspace settings">
        <Status source={source} action={action} />
        {form && (
          <form
            className="nova-form"
            onSubmit={(e) => {
              e.preventDefault();
              action.run(async () => {
                await request("/api/settings", "PATCH", form);
                await refresh();
              }, "Settings saved; session duration applies to new logins");
            }}
          >
            <Field label="Organization name">
              <input
                required
                value={form.organization}
                onChange={(e) =>
                  setForm({ ...form, organization: e.target.value })
                }
              />
            </Field>
            <Field label="Session duration (minutes)">
              <input
                type="number"
                min={15}
                max={1440}
                value={form.sessionMinutes}
                onChange={(e) =>
                  setForm({ ...form, sessionMinutes: Number(e.target.value) })
                }
              />
            </Field>
            <button disabled={user.role !== "admin" || action.busy}>
              Save settings
            </button>
          </form>
        )}
        <p>
          Appearance follows your operating system. Email and Slack delivery are
          not configured in this release.
        </p>
      </Panel>
      <Panel title="Change your password">
        <form
          className="nova-form"
          onSubmit={(e) => {
            e.preventDefault();
            action.run(async () => {
              await request("/api/auth/password", "POST", {
                currentPassword,
                password,
              });
              setPassword("");
              setCurrentPassword("");
            }, "Password changed");
          }}
        >
          <Field label="Current password">
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
          <Field label="New password">
            <input
              type="password"
              required
              minLength={12}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <button disabled={action.busy}>Change password</button>
        </form>
      </Panel>
    </>
  );
}

export function ApplicationManager() {
  const apps = useLoad("/api/applications"),
    action = useAction(apps.load),
    canCreate = allowed("applications", true);
  const [form, setForm] = useState({
      name: "",
      repoUrl: "",
      branch: "main",
      buildCommand: "npm run build",
      startCommand: "npm start",
      envVars: "",
    }),
    [logs, setLogs] = useState<any>(null);
  return (
    <>
      <Panel title="Applications" tools={<Refresh source={apps} />}>
        <Capability name="applications" />
        <Status source={apps} action={action} />
        <Table
          headings={[
            "Application",
            "Status",
            "Host port",
            "Repository",
            "Actions",
          ]}
          empty={!apps.data.length}
        >
          {apps.data.map((app: any) => (
            <tr key={app.id}>
              <td>{app.name}</td>
              <td>{app.status}</td>
              <td>{app.port}</td>
              <td>{app.repoUrl}</td>
              <td>
                <div className="nova-actions">
                  {["start", "stop", "restart"].map((a) => (
                    <button
                      key={a}
                      disabled={!canCreate || action.busy}
                      onClick={() =>
                        action.run(
                          () =>
                            request(
                              `/api/applications/${id(app.id)}/action`,
                              "POST",
                              { action: a },
                            ),
                          `${app.name}: ${a} completed`,
                        )
                      }
                    >
                      {a}
                    </button>
                  ))}
                  <button
                    disabled={!canCreate || action.busy}
                    onClick={() =>
                      action.run(
                        () =>
                          request(
                            `/api/applications/${id(app.id)}/redeploy`,
                            "POST",
                            {},
                          ),
                        "Deployment completed",
                      )
                    }
                  >
                    Redeploy
                  </button>
                  <button
                    onClick={() =>
                      action.run(
                        async () =>
                          setLogs(
                            await request(
                              `/api/applications/${id(app.id)}/logs`,
                            ),
                          ),
                        "Logs loaded",
                      )
                    }
                  >
                    Logs
                  </button>
                  <button
                    disabled={!canCreate || action.busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete ${app.name} and its checked-out source?`,
                        )
                      )
                        action.run(
                          () =>
                            request(
                              `/api/applications/${id(app.id)}`,
                              "DELETE",
                            ),
                          "Application deleted",
                        );
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
        {logs && <pre className="nova-json">{logs.logs.join("\n")}</pre>}
      </Panel>
      <Panel title="Deploy from Git">
        <p>
          Build and run a repository on the connected compute host. Use a start
          command that listens on the supplied PORT environment variable. Domain
          routing and container-image deployment are unavailable.
        </p>
        <form
          className="nova-form"
          onSubmit={(e) => {
            e.preventDefault();
            action.run(
              () =>
                request("/api/applications", "POST", {
                  ...form,
                  sourceType: "git",
                }),
              "Deployment completed",
            );
          }}
        >
          {Object.entries(form).map(([key, value]) => (
            <Field
              key={key}
              label={
                (
                  {
                    name: "Application name",
                    repoUrl: "Repository URL",
                    branch: "Branch",
                    buildCommand: "Build command (use none to skip)",
                    startCommand: "Start command",
                    envVars: "Environment variables (KEY=value per line)",
                  } as any
                )[key]
              }
            >
              {key === "envVars" ? (
                <textarea
                  value={value}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              ) : (
                <input
                  required
                  value={value}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              )}
            </Field>
          ))}
          <button disabled={!canCreate || action.busy}>
            {action.busy ? "Deploying…" : "Deploy application"}
          </button>
        </form>
      </Panel>
    </>
  );
}

export function NetworkManager() {
  const source = useLoad("/api/networking/vpcs"),
    action = useAction(source.load),
    { capabilities } = useSession(),
    canCreate = allowed("networks");
  const [name, setName] = useState(""),
    [cidr, setCidr] = useState("");
  return (
    <>
      <Panel title="Networks" tools={<Refresh source={source} />}>
        <Status source={source} action={action} />
        <Capability name="networks" />
        <Capability name="tapNetworking" />
        <p>
          Nova networks use Linux bridges, DHCP and outbound NAT. Firewall
          isolation, load balancers, public IP allocation and DNS-zone hosting
          are not implemented. A separate bridge does not establish verified
          tenant isolation.
        </p>
        <Table
          headings={["Name", "Subnet", "Bridge", "Gateway", "Mode", "Actions"]}
          empty={!source.data.length}
        >
          {source.data.map((n: any) => (
            <tr key={n.id}>
              <td>{n.name}</td>
              <td>{n.cidr}</td>
              <td>{n.bridge}</td>
              <td>{n.gateway}</td>
              <td>{n.mode}</td>
              <td>
                <button
                  disabled={!canCreate || action.busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete network ${n.name}? Attached VMs will block deletion.`,
                      )
                    )
                      action.run(
                        () =>
                          request(`/api/networking/vpcs/${id(n.id)}`, "DELETE"),
                        "Network deleted",
                      );
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Panel title="Create network">
        <form
          className="nova-form"
          onSubmit={(e) => {
            e.preventDefault();
            action.run(
              () =>
                request("/api/networking/vpcs", "POST", {
                  name,
                  cidr,
                  nat: true,
                }),
              "Network created",
            );
          }}
        >
          <Field label="Name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="IPv4 subnet">
            <input
              required
              placeholder="Choose a non-overlapping subnet"
              value={cidr}
              onChange={(e) => setCidr(e.target.value)}
            />
          </Field>
          <button disabled={!canCreate || action.busy}>
            Create bridge, DHCP and NAT
          </button>
        </form>
      </Panel>
      <Panel title="Detected host interfaces">
        <Table
          headings={["Interface", "Address", "CIDR"]}
          empty={!capabilities?.host?.interfaces?.length}
        >
          {capabilities?.host?.interfaces?.map((n: any) => (
            <tr key={`${n.name}-${n.address}`}>
              <td>{n.name}</td>
              <td>{n.address}</td>
              <td>{n.cidr}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}

export function StorageManager() {
  const volumes = useLoad("/api/storage/volumes"),
    hardware = useLoad("/api/storage/devices", null),
    action = useAction(volumes.load),
    canWrite = allowed("volumes");
  const [name, setName] = useState(""),
    [sizeGb, setSize] = useState(20);
  const rows = (devices: any[], depth = 0): any[] =>
    devices.flatMap((d) => [
      <tr key={d.path}>
        <td style={{ paddingLeft: `${16 + depth * 20}px` }}>{d.path}</td>
        <td>{d.model || "—"}</td>
        <td>{bytes(d.sizeBytes)}</td>
        <td>{d.mountpoints?.join(", ") || "—"}</td>
        <td>Unassigned · discovery only</td>
      </tr>,
      ...rows(d.children || [], depth + 1),
    ]);
  return (
    <>
      <Panel title="Nova volumes" tools={<Refresh source={volumes} />}>
        <Status source={volumes} action={action} />
        <Capability name="volumes" />
        <p>
          File-backed qcow2 volumes use only the assigned Nova disk directory.
          Detach a volume before resizing or deleting it.
        </p>
        <form
          className="nova-inline"
          onSubmit={(e) => {
            e.preventDefault();
            action.run(
              () => request("/api/storage/volumes", "POST", { name, sizeGb }),
              "Volume created",
            );
          }}
        >
          <Field label="Volume name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Size (GiB)">
            <input
              type="number"
              min={1}
              max={65536}
              value={sizeGb}
              onChange={(e) => setSize(Number(e.target.value))}
            />
          </Field>
          <button disabled={!canWrite || action.busy}>Create volume</button>
        </form>
        <Table
          headings={["Name", "Size", "Status", "Attached VM", "Actions"]}
          empty={!volumes.data.length}
        >
          {volumes.data.map((v: any) => (
            <tr key={v.id}>
              <td>{v.name}</td>
              <td>{v.sizeGb} GiB</td>
              <td>{v.exists === false ? "File missing" : v.status}</td>
              <td>{v.attachedTo || "None"}</td>
              <td>
                <div className="nova-actions">
                  <button
                    disabled={!canWrite || action.busy || Boolean(v.attachedTo)}
                    onClick={() => {
                      const size = window.prompt(
                        "New size in GiB (growth only)",
                        String(v.sizeGb),
                      );
                      if (size)
                        action.run(
                          () =>
                            request(
                              `/api/storage/volumes/${id(v.id)}`,
                              "PATCH",
                              { sizeGb: Number(size) },
                            ),
                          "Volume expanded",
                        );
                    }}
                  >
                    Expand
                  </button>
                  <button
                    disabled={!canWrite || action.busy || Boolean(v.attachedTo)}
                    onClick={() => {
                      if (
                        window.confirm(`Delete volume ${v.name} and its data?`)
                      )
                        action.run(
                          () =>
                            request(
                              `/api/storage/volumes/${id(v.id)}`,
                              "DELETE",
                            ),
                          "Volume deleted",
                        );
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Panel title="Hardware discovery" tools={<Refresh source={hardware} />}>
        <Notice error={hardware.error} />
        <div className="nova-warning">
          Detected hardware is not authorized Nova storage. Ownership is
          unknown. Formatting and pool creation are disabled server-side.
        </div>
        {hardware.data && (
          <>
            <p>
              Assigned file directory:{" "}
              <code>{hardware.data.managedStorage.path}</code>
            </p>
            <p>
              Containing filesystem (may be shared):{" "}
              {bytes(hardware.data.stateFilesystem.totalBytes)} total ·{" "}
              {bytes(hardware.data.stateFilesystem.freeBytes)} free. This is not
              a dedicated Nova quota.
            </p>
            <Table
              headings={["Device", "Model", "Size", "Mounts", "Assignment"]}
              empty={!hardware.data.devices.length}
            >
              {rows(hardware.data.devices)}
            </Table>
          </>
        )}
      </Panel>
      <Panel title="Object storage">
        <Capability name="objectStorage" />
      </Panel>
    </>
  );
}

export function ComputeManager({ activeSubTab }: { activeSubTab?: string } = {}) {
  const vms = useLoad("/api/compute/vms"),
    options = useLoad("/api/compute/options", null),
    volumes = useLoad("/api/storage/volumes"),
    action = useAction(async () => {
      await vms.load();
      await volumes.load();
    });
  const [tab, setTab] = useState("instances"),
    [selected, setSelected] = useState(""),
    [imageUrl, setImageUrl] = useState(""),
    [filename, setFilename] = useState(""),
    [volumeId, setVolumeId] = useState("");
  useEffect(() => {
    const mapped: Record<string, string> = { vms: 'instances', 'instance-groups': 'autoscaling', images: 'images', 'ssh-keys': 'ssh-keys' };
    setTab(mapped[activeSubTab || 'vms'] || 'instances');
  }, [activeSubTab]);
  const [form, setForm] = useState({
    name: "",
    cores: 2,
    memoryMb: 2048,
    diskGb: 32,
    imageId: "",
    bootMode: "image",
    bridge: "user",
  });
  const canWrite = allowed("virtualMachines"),
    { capabilities } = useSession();
  const vm = vms.data.find((v: any) => v.id === selected);
  const operate = (vm: any, operation: string) =>
    action.run(
      () =>
        request(`/api/compute/vms/${id(vm.id)}/action`, "POST", {
          action: operation,
        }),
      operation === "shutdown"
        ? `${vm.name}: shutdown requested; refresh to confirm the guest stops`
        : operation === "reboot"
          ? `${vm.name}: reboot requested`
          : `${vm.name}: ${operation} completed`,
    );
  const consoleFor = (vm: any) => {
    const popup = window.open("about:blank", "_blank");
    action.run(async () => {
      try {
        const console = await request(`/api/compute/vms/${id(vm.id)}/console`);
        if (!popup) throw new Error("Allow popups to open the VM console");
        popup.location.href = console.url;
      } catch (error) {
        popup?.close();
        throw error;
      }
    }, "Console opened");
  };
  return (
    <>
      <Panel
        title="Compute"
        tools={
          <div className="nova-actions">
            <Refresh source={vms} />
            {["instances", "images", "ssh-keys", "autoscaling"].map((t) => (
              <button
                key={t}
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        }
      >
        <Status source={vms} action={action} />
        <Notice error={options.error} />
        <Capability name="virtualMachines" />
        <p>
          Acceleration:{" "}
          {capabilities?.features?.kvm?.available
            ? "KVM"
            : "QEMU software emulation when available"}
          . CPU and memory usage inside guests are not measured by this agent.
        </p>
        <Capability name="tapNetworking" />
        {tab === "instances" && (
          <Table
            headings={[
              "Instance",
              "State",
              "vCPU / memory",
              "Root disk",
              "Execution",
              "Actions",
            ]}
            empty={!vms.data.length}
          >
            {vms.data.map((v: any) => (
              <tr key={v.id}>
                <td>{v.name}</td>
                <td>{v.status}</td>
                <td>
                  {v.vcpu} / {v.memoryMb} MiB
                </td>
                <td>{v.diskGb} GiB</td>
                <td>
                  {v.acceleration} · {v.networkMode}
                </td>
                <td>
                  <div className="nova-actions">
                    <button onClick={() => setSelected(v.id)}>Manage</button>
                    <button
                      disabled={
                        !canWrite || action.busy || v.status === "Running"
                      }
                      onClick={() => operate(v, "start")}
                    >
                      Start
                    </button>
                    <button
                      disabled={
                        !canWrite || action.busy || v.status !== "Running"
                      }
                      onClick={() => {
                        if (
                          window.confirm(
                            `Force-stop ${v.name}? Guest applications will not receive a shutdown request.`,
                          )
                        )
                          operate(v, "stop");
                      }}
                    >
                      Force stop
                    </button>
                    <button
                      disabled={
                        !canWrite || action.busy || v.status !== "Running"
                      }
                      onClick={() => operate(v, "shutdown")}
                    >
                      Shutdown
                    </button>
                    <button
                      disabled={
                        !canWrite || action.busy || v.status !== "Running"
                      }
                      onClick={() => operate(v, "reboot")}
                    >
                      Reboot
                    </button>
                    <button
                      disabled={
                        !canWrite || v.status !== "Running" || action.busy
                      }
                      onClick={() => consoleFor(v)}
                    >
                      Console
                    </button>
                    <button
                      disabled={!canWrite || action.busy}
                      onClick={() => {
                        if (
                          window.confirm(`Delete ${v.name} and its root disk?`)
                        )
                          operate(v, "delete");
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
        {tab === "images" && (
          <>
            <Table
              headings={["Image", "Format", "Size", "Actions"]}
              empty={!options.data?.images?.length}
            >
              {options.data?.images?.map((image: any) => (
                <tr key={image.id}>
                  <td>{image.name}</td>
                  <td>{image.format}</td>
                  <td>{bytes(image.sizeBytes)}</td>
                  <td>
                    <button
                      disabled={!canWrite || action.busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete image ${image.name}? Dependent VMs will block deletion.`,
                          )
                        )
                          action.run(async () => {
                            await request(
                              `/api/compute/images/${id(image.id)}`,
                              "DELETE",
                            );
                            await options.load();
                          }, "Image deleted");
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
            <Field label="Upload ISO or disk image">
              <input
                type="file"
                accept=".iso,.qcow2,.img,.raw"
                disabled={!canWrite || action.busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file)
                    action.run(async () => {
                      const response = await fetch(
                        "/api/compute/images/upload",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/octet-stream",
                            "X-Nova-Filename": file.name,
                          },
                          body: file,
                        },
                      );
                      const body = await response.json();
                      if (!response.ok) throw new Error(body.error);
                      await options.load();
                    }, "Image uploaded");
                }}
              />
            </Field>
            <form
              className="nova-inline"
              onSubmit={(e) => {
                e.preventDefault();
                action.run(async () => {
                  await request("/api/compute/images/import-url", "POST", {
                    url: imageUrl,
                    filename,
                  });
                  await options.load();
                }, "Image imported");
              }}
            >
              <Field label="Image URL">
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </Field>
              <Field label="Filename">
                <input
                  required
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                />
              </Field>
              <button disabled={!canWrite || action.busy}>Import image</button>
            </form>
          </>
        )}
        {tab === "ssh-keys" && <SshKeyManager />}
        {tab === "autoscaling" && <Capability name="autoscaling" />}
      </Panel>
      {tab === "instances" && (
        <Panel title="Create virtual machine">
          <form
            className="nova-form"
            onSubmit={(e) => {
              e.preventDefault();
              action.run(async () => {
                const created = await request("/api/compute/vms", "POST", form);
                setSelected(created.id);
              }, "VM created");
            }}
          >
            <Field label="Instance name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Boot source">
              <select
                value={form.bootMode}
                onChange={(e) => setForm({ ...form, bootMode: e.target.value })}
              >
                <option value="image">Image</option>
                <option value="blank">Blank stopped VM</option>
              </select>
            </Field>
            {form.bootMode === "image" && (
              <Field label="Boot image">
                <select
                  required
                  value={form.imageId}
                  onChange={(e) =>
                    setForm({ ...form, imageId: e.target.value })
                  }
                >
                  <option value="">Select an imported image</option>
                  {options.data?.images?.map((i: any) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {(["cores", "memoryMb", "diskGb"] as const).map((key) => (
              <Field
                key={key}
                label={
                  {
                    cores: "vCPU",
                    memoryMb: "Memory (MiB)",
                    diskGb: "Root disk (GiB)",
                  }[key]
                }
              >
                <input
                  type="number"
                  required
                  min={key === "memoryMb" ? 512 : key === "diskGb" ? 4 : 1}
                  value={form[key]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: Number(e.target.value) })
                  }
                />
              </Field>
            ))}
            <Field label="Network">
              <select
                value={form.bridge}
                onChange={(e) => setForm({ ...form, bridge: e.target.value })}
              >
                {(options.data?.bridges || ["user"])
                  .filter(
                    (b: string) =>
                      b === "user" ||
                      capabilities?.features?.tapNetworking?.available,
                  )
                  .map((b: string) => (
                    <option key={b} value={b}>
                      {b === "user" ? "QEMU user NAT (no TAP required)" : b}
                    </option>
                  ))}
              </select>
            </Field>
            <button disabled={!canWrite || action.busy}>Create VM</button>
          </form>
        </Panel>
      )}
      {vm && tab === "instances" && (
        <Panel title={`Manage ${vm.name}`}>
          <div className="nova-actions">
            <button
              disabled={!canWrite || action.busy || vm.status === "Running"}
              onClick={() => {
                const vcpu = window.prompt("vCPU", String(vm.vcpu));
                if (!vcpu) return;
                const memoryMb = window.prompt(
                  "Memory in MiB",
                  String(vm.memoryMb),
                );
                if (!memoryMb) return;
                const diskGb = window.prompt(
                  "Root disk in GiB (growth only)",
                  String(vm.diskGb),
                );
                if (diskGb)
                  action.run(
                    () =>
                      request(`/api/compute/vms/${id(vm.id)}`, "PATCH", {
                        vcpu: Number(vcpu),
                        memoryMb: Number(memoryMb),
                        diskGb: Number(diskGb),
                      }),
                    "VM resources updated",
                  );
              }}
            >
              Edit CPU, memory and root disk
            </button>
            <button
              disabled={!canWrite || action.busy || vm.status === "Running"}
              onClick={() => {
                const name = window.prompt(
                  "Snapshot name (letters, numbers, underscores, hyphens)",
                );
                if (name)
                  action.run(
                    () =>
                      request(
                        `/api/compute/vms/${id(vm.id)}/snapshots`,
                        "POST",
                        { name },
                      ),
                    "Snapshot created",
                  );
              }}
            >
              Create snapshot
            </button>
          </div>
          <p>
            Resource changes and disk attachment require the VM to be stopped.
            Grow the guest filesystem inside the OS after expanding its disk.
          </p>
          <form
            className="nova-inline"
            onSubmit={(e) => {
              e.preventDefault();
              action.run(
                () =>
                  request(`/api/compute/vms/${id(vm.id)}/volumes`, "POST", {
                    volumeId,
                  }),
                "Volume attached",
              );
            }}
          >
            <Field label="Available volume">
              <select
                required
                value={volumeId}
                onChange={(e) => setVolumeId(e.target.value)}
              >
                <option value="">Select volume</option>
                {volumes.data
                  .filter((v: any) => !v.attachedTo)
                  .map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.name} · {v.sizeGb} GiB
                    </option>
                  ))}
              </select>
            </Field>
            <button
              disabled={!canWrite || action.busy || vm.status === "Running"}
            >
              Attach volume
            </button>
          </form>
          {(vm.attachedVolumes || []).map((volume: string) => (
            <div key={volume} className="nova-actions">
              <code>
                {volumes.data.find((v: any) => v.id === volume)?.name || volume}
              </code>
              <button
                disabled={!canWrite || action.busy || vm.status === "Running"}
                onClick={() =>
                  action.run(
                    () =>
                      request(
                        `/api/compute/vms/${id(vm.id)}/volumes/${id(volume)}`,
                        "DELETE",
                      ),
                    "Volume detached",
                  )
                }
              >
                Detach
              </button>
            </div>
          ))}
          <Json value={vm} />
        </Panel>
      )}
    </>
  );
}
function SshKeyManager() {
  const source = useLoad("/api/compute/ssh-keys"),
    action = useAction(source.load),
    { user } = useSession();
  const [name, setName] = useState(""),
    [key, setKey] = useState("");
  return (
    <>
      <Status source={source} action={action} />
      <p>
        Stored public-key inventory. Nova does not inject these keys into guest
        images automatically.
      </p>
      <form
        className="nova-form"
        onSubmit={(e) => {
          e.preventDefault();
          action.run(
            () =>
              request("/api/compute/ssh-keys", "POST", {
                name,
                publicKey: key,
              }),
            "Public key saved",
          );
        }}
      >
        <Field label="Key name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Public key">
          <textarea
            required
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </Field>
        <button disabled={user.role === "viewer" || action.busy}>
          Save public key
        </button>
      </form>
      <Table
        headings={["Name", "Fingerprint", "Actions"]}
        empty={!source.data.length}
      >
        {source.data.map((k: any) => (
          <tr key={k.id}>
            <td>{k.name}</td>
            <td>
              <code>{k.fingerprint}</code>
            </td>
            <td>
              <button
                disabled={user.role === "viewer" || action.busy}
                onClick={() => {
                  if (window.confirm(`Delete public key ${k.name}?`))
                    action.run(
                      () =>
                        request(`/api/compute/ssh-keys/${id(k.id)}`, "DELETE"),
                      "Public key deleted",
                    );
                }}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}

export function BackupManager() {
  const source = useLoad("/api/compute/snapshots"),
    databases = useLoad("/api/database-snapshots"),
    action = useAction(async () => {
      await source.load();
      await databases.load();
    }),
    canWrite = allowed("virtualMachines"),
    { user } = useSession();
  return (
    <>
      <Panel title="VM snapshots" tools={<Refresh source={source} />}>
        <Status source={source} action={action} />
        <p>
          Internal qcow2 snapshots require stopped VMs. These share the VM disk
          and do not protect against host disk loss. Database snapshot, restore
          and download controls are in the Databases workspace.
        </p>
        <Table
          headings={["Snapshot", "VM", "Created", "Actions"]}
          empty={!source.data.length}
        >
          {source.data.map((snapshot: any) => (
            <tr key={snapshot.id}>
              <td>{snapshot.name}</td>
              <td>{snapshot.sourceVm}</td>
              <td>{date(snapshot.created)}</td>
              <td>
                <button
                  disabled={!canWrite || action.busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Restore ${snapshot.sourceVm} to ${snapshot.name}? Newer changes will be lost.`,
                      )
                    )
                      action.run(
                        () =>
                          request("/api/compute/snapshots/rollback", "POST", {
                            id: snapshot.id,
                          }),
                        "Snapshot restored",
                      );
                  }}
                >
                  Restore stopped VM
                </button>
                <button
                  disabled={!canWrite || action.busy}
                  onClick={() => {
                    if (window.confirm(`Delete snapshot ${snapshot.name}?`))
                      action.run(
                        () =>
                          request(
                            `/api/compute/snapshots/${id(snapshot.id.split(":")[0])}/${id(snapshot.name)}`,
                            "DELETE",
                          ),
                        "Snapshot deleted",
                      );
                  }}
                >
                  Delete snapshot
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Panel title="Database backups" tools={<Refresh source={databases} />}>
        <Notice error={databases.error} />
        <Table
          headings={["Snapshot", "Source", "Created", "Actions"]}
          empty={!databases.data.length}
        >
          {databases.data.map((backup: any) => (
            <tr key={backup.id}>
              <td>{backup.name}</td>
              <td>
                {backup.databaseName} ·{" "}
                {backup.databaseExists ? "Database exists" : "Database deleted"}
              </td>
              <td>{date(backup.createdAt)}</td>
              <td>
                <div className="nova-actions">
                  <a href={`/api/database-snapshots/${id(backup.id)}/download`}>
                    Download SQL
                  </a>
                  <button
                    disabled={user.role !== "admin" || action.busy}
                    onClick={() => {
                      const confirmName = window.prompt(
                        `Type the current database name to restore it, or ${backup.databaseName} to recreate the deleted database`,
                      );
                      if (confirmName)
                        action.run(
                          () =>
                            request(
                              `/api/database-snapshots/${id(backup.id)}/restore`,
                              "POST",
                              { confirmName, recreate: !backup.databaseExists },
                            ),
                          "Database backup restored",
                        );
                    }}
                  >
                    Restore database
                  </button>
                  <button
                    disabled={user.role !== "admin" || action.busy}
                    onClick={() => {
                      if (window.confirm(`Delete backup ${backup.name}?`))
                        action.run(
                          () =>
                            request(
                              `/api/database-snapshots/${id(backup.id)}`,
                              "DELETE",
                            ),
                          "Backup deleted",
                        );
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}

export function ActivityManager() {
  const source = useLoad("/api/activity"),
    [search, setSearch] = useState("");
  const rows = source.data.filter((row: any) =>
    JSON.stringify(row).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Panel
      title="Activity & audit"
      tools={
        <>
          <Refresh source={source} />
          <button onClick={() => exportJson("nova-activity.json", rows)}>
            Export JSON
          </button>
        </>
      }
    >
      <Notice error={source.error} />
      <Field label="Filter activity">
        <input value={search} onChange={(e) => setSearch(e.target.value)} />
      </Field>
      <Table
        headings={["Time", "Actor", "Action", "Resource", "Status"]}
        empty={!rows.length}
      >
        {rows.map((row: any) => (
          <tr key={row.id}>
            <td>{date(row.timestamp)}</td>
            <td>{row.actor || row.user}</td>
            <td>{row.action}</td>
            <td>{row.resource}</td>
            <td>{row.status}</td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}
export function LogManager() {
  const [source, setSource] = useState("controller"),
    logs = useLoad(`/api/logs?source=${source}`, null);
  return (
    <Panel title="Service logs" tools={<Refresh source={logs} />}>
      <Notice error={logs.error} />
      <Field label="Service">
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="controller">Nova controller</option>
          <option value="agent">Compute agent</option>
        </select>
      </Field>
      <p>
        Latest 200 journal entries. Application logs are available in
        Applications. Administrator access is required.
      </p>
      <pre className="nova-json">
        {logs.data?.logs?.join("\n") ||
          (logs.busy ? "Loading…" : "No log entries returned.")}
      </pre>
    </Panel>
  );
}
export function DeveloperManager() {
  const [endpoint, setEndpoint] = useState("/api/health"),
    [result, setResult] = useState<any>(null),
    action = useAction();
  const endpoints = [
    "/api/health",
    "/api/capabilities",
    "/api/hosts",
    "/api/jobs",
    "/api/resources",
    "/api/databases",
    "/api/iam/users",
    "/api/activity",
  ];
  return (
    <Panel title="Developer API explorer">
      <Status action={action} />
      <p>
        Requests use your signed-in session and its permissions. Nova does not
        ship a standalone CLI or Terraform provider in this release.
      </p>
      <form
        className="nova-inline"
        onSubmit={(e) => {
          e.preventDefault();
          action.run(
            async () => setResult(await request(endpoint)),
            "API response received",
          );
        }}
      >
        <Field label="GET endpoint">
          <select
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
          >
            {endpoints.map((url) => (
              <option key={url}>{url}</option>
            ))}
          </select>
        </Field>
        <button disabled={action.busy}>Send request</button>
        {result && (
          <button
            type="button"
            onClick={() => exportJson("nova-api-response.json", result)}
          >
            Export response
          </button>
        )}
      </form>
      {result && <Json value={result} />}
    </Panel>
  );
}
export function AiManager() {
  const [prompt, setPrompt] = useState(""),
    [messages, setMessages] = useState<any[]>([]),
    action = useAction(),
    { capabilities } = useSession();
  return (
    <Panel title="Nova AI advice">
      <Capability name="ai" />
      <Status action={action} />
      <p>
        Advice is generated from the text you send. The assistant does not
        execute infrastructure changes or continuously monitor workloads.
      </p>
      {messages.map((message, i) => (
        <div className="nova-message" key={i}>
          <strong>{message.role}</strong>
          <pre>{message.text}</pre>
        </div>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const text = prompt.trim();
          if (!text) return;
          setMessages((m) => [...m, { role: "You", text }]);
          setPrompt("");
          action.run(async () => {
            const result = await request("/api/ai/query", "POST", {
              prompt: text,
            });
            setMessages((m) => [
              ...m,
              { role: "Nova AI", text: result.response },
            ]);
          }, "Response received");
        }}
      >
        <Field label="Request">
          <textarea
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </Field>
        <button
          disabled={!capabilities?.features?.ai?.available || action.busy}
        >
          {action.busy ? "Generating…" : "Send"}
        </button>
      </form>
    </Panel>
  );
}
export function SecurityManager() {
  const { capabilities, user } = useSession();
  const checks = [
    ["Current account role", user.role],
    [
      "Agent connection",
      capabilities?.connected
        ? "Authenticated agent responding"
        : capabilities?.error || "Not connected",
    ],
    [
      "Storage ownership",
      "Raw disks are discovery only; file-backed volumes are confined to the assigned Nova directory",
    ],
    [
      "Tenant network isolation",
      "Not verified; bridge and NAT do not establish a complete isolation policy",
    ],
    [
      "Compliance certification",
      "No certification is asserted by this console",
    ],
  ];
  return (
    <Panel title="Security & access posture">
      <Table headings={["Control", "Observed state"]}>
        {checks.map(([label, value]) => (
          <tr key={label}>
            <td>{label}</td>
            <td>{value}</td>
          </tr>
        ))}
      </Table>
      <p>
        Manage actual accounts and roles in Users & access. Audit records are in
        Activity. Automated remediation and firewall-policy enforcement are
        unavailable in this release.
      </p>
    </Panel>
  );
}
export function Overview({ themeMode, onNavigate, onCreate }: any) {
  const { capabilities } = useSession();
  const inventory = useLoad('/api/resources'), activity = useLoad('/api/activity');
  const byType = (type: string) => inventory.data.filter((r: any) => r.type === type).map((r: any) => ({ id: r.id, ...r.data }));
  return <>
    <Notice error={inventory.error || activity.error} />
    <HomeDashboard themeMode={themeMode} onNavigate={onNavigate} onOpenCreateResource={onCreate}
      onSelectVM={() => onNavigate('compute')} vms={byType('vm')} applications={byType('application')}
      databases={byType('database')} storage={byType('storage')} activities={activity.data}
      agentState={capabilities || { connected: false }} />
  </>;
}

export function ClientManager() {
  const source = useLoad("/api/clients"),
    options = useLoad("/api/compute/options", null),
    action = useAction(source.load),
    canWrite = allowed("networks") && allowed("virtualMachines");
  const [form, setForm] = useState({
    clientCompany: "",
    clientEmail: "",
    name: "",
    imageId: "",
    vCpu: 2,
    ramGb: 2,
    storageGb: 32,
  });
  return (
    <>
      <Panel title="Client workloads" tools={<Refresh source={source} />}>
        <Status source={source} action={action} />
        <p>
          Operator-managed client VMs and networks. Independent tenant login,
          quota enforcement and verified network isolation are not implemented.
          No fabricated VLAN IDs or billing plans are assigned.
        </p>
        <Table
          headings={[
            "Client",
            "Workload",
            "Contact",
            "VM",
            "Network",
            "Actions",
          ]}
          empty={!source.data.length}
        >
          {source.data.map((c: any) => (
            <tr key={c.id}>
              <td>{c.clientCompany}</td>
              <td>{c.name}</td>
              <td>{c.clientEmail}</td>
              <td>{c.vmId}</td>
              <td>{c.vpcCidr}</td>
              <td>
                <div className="nova-actions">
                  {["start", "stop", "restart"].map((op) => (
                    <button
                      key={op}
                      disabled={!canWrite || action.busy}
                      onClick={() =>
                        action.run(
                          () =>
                            request(`/api/clients/${id(c.id)}/action`, "POST", {
                              action: op,
                            }),
                          `${op} completed`,
                        )
                      }
                    >
                      {op}
                    </button>
                  ))}
                  <button
                    disabled={!canWrite || action.busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete ${c.name}, its VM and its network?`,
                        )
                      )
                        action.run(
                          () => request(`/api/clients/${id(c.id)}`, "DELETE"),
                          "Client workload deleted",
                        );
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Panel title="Provision client workload">
        <Capability name="networks" />
        <form
          className="nova-form"
          onSubmit={(e) => {
            e.preventDefault();
            action.run(
              () => request("/api/clients", "POST", form),
              "Client workload provisioned",
            );
          }}
        >
          {(["clientCompany", "clientEmail", "name"] as const).map((key) => (
            <Field
              key={key}
              label={
                {
                  clientCompany: "Company",
                  clientEmail: "Contact email",
                  name: "VM name",
                }[key]
              }
            >
              <input
                required
                type={key === "clientEmail" ? "email" : "text"}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </Field>
          ))}
          <Field label="Boot image">
            <select
              required
              value={form.imageId}
              onChange={(e) => setForm({ ...form, imageId: e.target.value })}
            >
              <option value="">Select imported image</option>
              {options.data?.images?.map((image: any) => (
                <option key={image.id} value={image.id}>
                  {image.name}
                </option>
              ))}
            </select>
          </Field>
          {(["vCpu", "ramGb", "storageGb"] as const).map((key) => (
            <Field
              key={key}
              label={
                {
                  vCpu: "vCPU",
                  ramGb: "Memory (GiB)",
                  storageGb: "Root disk (GiB)",
                }[key]
              }
            >
              <input
                type="number"
                min={1}
                value={form[key]}
                onChange={(e) =>
                  setForm({ ...form, [key]: Number(e.target.value) })
                }
              />
            </Field>
          ))}
          <button disabled={!canWrite || action.busy}>
            Provision client VM and network
          </button>
        </form>
      </Panel>
    </>
  );
}

export function BillingManager() {
  const source = useLoad("/api/billing", null),
    action = useAction(source.load),
    { user } = useSession();
  const [customer, setCustomer] = useState(""),
    [description, setDescription] = useState(""),
    [amount, setAmount] = useState("");
  return (
    <>
      <Panel title="Invoices" tools={<Refresh source={source} />}>
        <Status source={source} action={action} />
        <p>
          Manual invoice records in USD. Nova does not collect payments or
          invent usage charges. Issued marks the record’s internal status; it
          does not send an invoice to a customer.
        </p>
        <Table
          headings={[
            "Customer",
            "Description",
            "Amount",
            "Status",
            "Created",
            "Actions",
          ]}
          empty={!source.data?.invoices?.length}
        >
          {source.data?.invoices?.map((invoice: any) => (
            <tr key={invoice.id}>
              <td>{invoice.customer}</td>
              <td>{invoice.description}</td>
              <td>
                {(invoice.amountCents / 100).toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                })}
              </td>
              <td>{invoice.status}</td>
              <td>{date(invoice.createdAt)}</td>
              <td>
                <div className="nova-actions">
                  <button
                    onClick={() =>
                      exportJson(`nova-invoice-${invoice.id}.json`, invoice)
                    }
                  >
                    Export
                  </button>
                  {["draft", "issued", "void"]
                    .filter((s) => s !== invoice.status)
                    .map((status) => (
                      <button
                        key={status}
                        disabled={user.role !== "admin" || action.busy}
                        onClick={() =>
                          action.run(
                            () =>
                              request(
                                `/api/billing/invoices/${id(invoice.id)}`,
                                "PATCH",
                                { status },
                              ),
                            "Invoice status saved",
                          )
                        }
                      >
                        Mark {status}
                      </button>
                    ))}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Panel title="Create invoice record">
        <form
          className="nova-form"
          onSubmit={(e) => {
            e.preventDefault();
            action.run(
              () =>
                request("/api/billing/invoices", "POST", {
                  customer,
                  description,
                  amountCents: Math.round(Number(amount) * 100),
                }),
              "Invoice draft created",
            );
          }}
        >
          <Field label="Customer">
            <input
              required
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </Field>
          <Field label="Description">
            <input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="Amount (USD)">
            <input
              required
              type="number"
              min={0}
              step="0.01"
              max={1000000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <button disabled={user.role !== "admin" || action.busy}>
            Create draft
          </button>
        </form>
      </Panel>
    </>
  );
}
export function MarketplaceManager() {
  const source = useLoad("/api/marketplace/catalog", { apps: [] }),
    action = useAction(source.load),
    { user } = useSession(),
    canDeploy = allowed("applications", true);
  const [form, setForm] = useState({
    name: "",
    repoUrl: "",
    branch: "main",
    buildCommand: "npm run build",
    startCommand: "npm start",
  });
  return (
    <>
      <Panel
        title="Private application catalog"
        tools={<Refresh source={source} />}
      >
        <Status source={source} action={action} />
        <p>
          Reusable Git deployment recipes saved by your administrators. No
          third-party catalog entries, image versions or prices are fabricated.
        </p>
        <Capability name="applications" />
        <Table
          headings={["Template", "Repository", "Branch", "Actions"]}
          empty={!source.data.apps.length}
        >
          {source.data.apps.map((template: any) => (
            <tr key={template.id}>
              <td>{template.name}</td>
              <td>{template.repoUrl}</td>
              <td>{template.branch}</td>
              <td>
                <div className="nova-actions">
                  <button
                    disabled={!canDeploy || action.busy}
                    onClick={() => {
                      const name = window.prompt(
                        "Name for the new application",
                      );
                      if (name)
                        action.run(
                          () =>
                            request(
                              `/api/marketplace/catalog/${id(template.id)}/deploy`,
                              "POST",
                              { name },
                            ),
                          "Application deployed from catalog",
                        );
                    }}
                  >
                    Deploy
                  </button>
                  <button
                    disabled={user.role !== "admin" || action.busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete template ${template.name}? Existing applications are retained.`,
                        )
                      )
                        action.run(
                          () =>
                            request(
                              `/api/marketplace/catalog/${id(template.id)}`,
                              "DELETE",
                            ),
                          "Template deleted",
                        );
                    }}
                  >
                    Delete template
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Panel title="Add deployment template">
        <form
          className="nova-form"
          onSubmit={(e) => {
            e.preventDefault();
            action.run(
              () => request("/api/marketplace/catalog", "POST", form),
              "Template saved",
            );
          }}
        >
          {Object.entries(form).map(([key, value]) => (
            <Field key={key} label={key}>
              <input
                required
                value={value}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </Field>
          ))}
          <button disabled={user.role !== "admin" || action.busy}>
            Save template
          </button>
        </form>
      </Panel>
    </>
  );
}
