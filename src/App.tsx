import React, { useEffect, useState } from "react";
import { Cloud, Menu, LogOut } from "lucide-react";
import { LoginScreen } from "./components/LoginScreen";
import { ContainersView } from "./components/views/ContainersView";
import { MonitoringView } from "./components/views/MonitoringView";
import {
  SessionContext,
  Overview,
  ComputeManager,
  DatabaseManager,
  UserManager,
  SettingsManager,
  StorageManager,
  NetworkManager,
  ApplicationManager,
  BackupManager,
  ActivityManager,
  LogManager,
  DeveloperManager,
  AiManager,
  SecurityManager,
  ClientManager,
  BillingManager,
  MarketplaceManager,
} from "./components/ConsoleViews";
import { request } from "./services/console";

export const pages = [
  ["home", "Overview"],
  ["compute", "Compute"],
  ["containers", "Containers"],
  ["applications", "Applications"],
  ["databases", "Databases"],
  ["storage", "Storage"],
  ["networking", "Networking"],
  ["backups", "Backups"],
  ["clients", "Client workloads"],
  ["iam", "Users & access"],
  ["security", "Security"],
  ["monitoring", "Monitoring"],
  ["logs", "Service logs"],
  ["activity", "Activity & audit"],
  ["ai", "Nova AI"],
  ["dev-tools", "Developer tools"],
  ["billing", "Billing"],
  ["marketplace", "Marketplace"],
  ["settings", "Settings"],
];
export default function App() {
  const [user, setUser] = useState<any>(null),
    [starting, setStarting] = useState(true),
    [error, setError] = useState(""),
    [capabilities, setCapabilities] = useState<any>(null),
    [settings, setSettings] = useState<any>(null),
    [filter, setFilter] = useState(""),
    [menu, setMenu] = useState(false);
  const getPage = () =>
    pages.some(([key]) => key === location.hash.slice(1))
      ? location.hash.slice(1)
      : "home";
  const [page, setPage] = useState(getPage),
    [theme, setTheme] = useState<"dark" | "light">(() =>
      matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    );
  const refresh = async () => {
    try {
      const [caps, workspace] = await Promise.all([
        request("/api/capabilities"),
        request("/api/settings"),
      ]);
      setCapabilities(caps);
      setSettings(workspace);
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  };
  const signIn = async () => {
    setUser((await request("/api/auth/me")).user);
    await refresh();
  };
  useEffect(() => {
    signIn()
      .catch(() => setUser(null))
      .finally(() => setStarting(false));
  }, []);
  useEffect(() => {
    const listener = () => {
      setPage(getPage());
      setMenu(false);
    };
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const listener = () => setTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);
  if (starting) return <div className="nova-loading">Loading NovaCloud…</div>;
  if (!user) return <LoginScreen onAuthenticated={signIn} />;
  const views: Record<string, React.ReactNode> = {
    home: <Overview />,
    compute: <ComputeManager />,
    containers: <ContainersView themeMode={theme} />,
    applications: <ApplicationManager />,
    databases: <DatabaseManager />,
    storage: <StorageManager />,
    networking: <NetworkManager />,
    backups: <BackupManager />,
    clients: <ClientManager />,
    iam: <UserManager />,
    security: <SecurityManager />,
    monitoring: <MonitoringView themeMode={theme} />,
    logs: <LogManager />,
    activity: <ActivityManager />,
    ai: <AiManager />,
    "dev-tools": <DeveloperManager />,
    billing: <BillingManager />,
    marketplace: <MarketplaceManager />,
    settings: <SettingsManager />,
  };
  return (
    <SessionContext.Provider value={{ user, capabilities, settings, refresh }}>
      <div className="nova-console">
        <header className="nova-header">
          <button
            aria-label="Toggle navigation"
            className="nova-mobile-menu"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={18} />
          </button>
          <a className="nova-brand" href="#home">
            <Cloud size={23} />
            <span>
              NovaCloud
              <small>{settings?.organization || "Cloud console"}</small>
            </span>
          </a>
          <div className="nova-header-info">
            <span
              className={
                capabilities?.connected ? "nova-online" : "nova-offline"
              }
            >
              {capabilities?.connected
                ? "Agent connected"
                : "Agent unavailable"}
            </span>
            <button onClick={refresh}>Refresh connection</button>
            <span>
              {user.displayName} · {user.role}
            </span>
            <button
              aria-label="Sign out"
              onClick={async () => {
                try {
                  await request("/api/auth/logout", "POST");
                  setUser(null);
                } catch (e: any) {
                  setError(e.message);
                }
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <div className="nova-workbench">
          <aside className={menu ? "nova-sidebar open" : "nova-sidebar"}>
            <label className="nova-search">
              <span>Find a service</span>
              <input
                aria-label="Find a service"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </label>
            <nav>
              {pages
                .filter(([, label]) =>
                  label.toLowerCase().includes(filter.toLowerCase()),
                )
                .map(([key, label]) => (
                  <a
                    href={`#${key}`}
                    key={key}
                    aria-current={page === key ? "page" : undefined}
                  >
                    {label}
                  </a>
                ))}
            </nav>
            <p className="nova-sidebar-note">
              Nova control plane
              <br />
              Linux · QEMU · native containers
            </p>
          </aside>
          <main className="nova-main">
            <div className="nova-page-heading">
              <span>
                WORKSPACE / {pages.find(([key]) => key === page)?.[1]}
              </span>
              <h1>{pages.find(([key]) => key === page)?.[1]}</h1>
            </div>
            {error && (
              <div role="alert" className="nova-error">
                {error}
              </div>
            )}
            <div key={page}>{views[page]}</div>
          </main>
        </div>
      </div>
    </SessionContext.Provider>
  );
}
