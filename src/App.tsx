import React, { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { TopNav } from "./components/TopNav";
import { LeftSidebar } from "./components/LeftSidebar";
import { CommandPalette } from "./components/CommandPalette";
import { CreateResourceModal } from "./components/CreateResourceModal";
import { NovaShellDrawer } from "./components/NovaShellDrawer";
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
    [menu, setMenu] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    [commandOpen, setCommandOpen] = useState(false),
    [createOpen, setCreateOpen] = useState(false),
    [shellOpen, setShellOpen] = useState(false),
    [subTab, setSubTab] = useState<string | undefined>();
  const navigate = (view: string, tab?: string) => {
    setSubTab(tab);
    setMenu(false);
    location.hash = view;
  };
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
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setCommandOpen(open => !open);
      }
      if (e.key === 'Escape') { setCommandOpen(false); setCreateOpen(false); setShellOpen(false); setMenu(false); }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);
  if (starting) return <div className="nova-loading">Loading NovaCloud…</div>;
  if (!user) return <LoginScreen onAuthenticated={signIn} />;
  const views: Record<string, React.ReactNode> = {
    home: <Overview themeMode={theme} onNavigate={navigate} onCreate={() => setCreateOpen(true)} />,
    compute: subTab === "snapshots" ? <BackupManager /> : <ComputeManager activeSubTab={subTab} />,
    containers: <ContainersView themeMode={theme} />,
    applications: <ApplicationManager />,
    databases: <DatabaseManager />,
    storage: <StorageManager />,
    networking: <NetworkManager />,
    backups: <BackupManager />,
    clients: <ClientManager />,
    iam: <UserManager />,
    security: <SecurityManager />,
    monitoring: <MonitoringView themeMode={theme} activeSubTab={subTab} />,
    logs: <LogManager />,
    activity: <ActivityManager />,
    ai: <AiManager />,
    "dev-tools": <DeveloperManager />,
    billing: <BillingManager />,
    marketplace: <MarketplaceManager />,
    settings: <SettingsManager />,
  };
  const unsupported: Record<string, string> = {
    'applications/domains': 'Custom domain and TLS provisioning is not implemented in this release.',
    'networking/loadbalancers': 'The load-balancer engine is not implemented in this release.',
    'networking/firewalls': 'Tenant firewall policy enforcement is not implemented in this release.',
    'networking/routing': 'Custom route management is not implemented in this release.',
    'storage/buckets': 'An S3 object-storage engine is not implemented in this release.',
    'security/vulnerabilities': 'Automated vulnerability scanning is not implemented in this release.',
    'security/compliance': 'Compliance assessments are not implemented in this release.',
    'monitoring/alerts': 'Alert rules and notification delivery are not implemented in this release.',
    'monitoring/slos': 'SLO tracking is not implemented in this release.',
    'iam/keys': 'Application API key issuance is not implemented. VM SSH public keys are managed in Compute.',
    'dev-tools/terraform': 'A Nova Terraform provider is not implemented in this release.',
    'dev-tools/cli': 'Use the authenticated API explorer below. A standalone Nova CLI is not implemented.',
  };
  const unavailable = unsupported[`${page}/${subTab}`];
  return (
    <SessionContext.Provider value={{ user, capabilities, settings, refresh }}>
      <div className={`h-screen font-sans flex flex-col ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
        <TopNav themeMode={theme} organization={settings?.organization} hostName={capabilities?.host?.hostname}
          user={user} onNavigate={navigate} onOpenCommandPalette={() => setCommandOpen(true)}
          onOpenCreateResource={() => setCreateOpen(true)} onToggleCloudShell={() => setShellOpen(open => !open)}
          isTerminalOpen={shellOpen} onToggleNotifications={() => navigate('activity')}
          onSignOut={async () => { try { await request('/api/auth/logout', 'POST'); setUser(null); } catch (e: any) { setError(e.message); } }} />
        <button aria-label="Toggle navigation" className="nova-mobile-menu fixed bottom-4 left-4 z-40 p-3 rounded-lg bg-cyan-500 text-slate-950 shadow-lg" onClick={() => setMenu(!menu)}><Menu size={18} /></button>
        <div className="flex-1 min-h-0 flex overflow-hidden">
          <div className={`nova-original-navigation ${menu ? 'open' : ''}`}>
            <LeftSidebar activeView={page as any} activeSubTab={subTab} onNavigate={navigate} collapsed={collapsed}
              onToggleCollapse={() => setCollapsed(!collapsed)} alertsCount={0} appsDegraded={false} themeMode={theme} />
          </div>
          <main className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-8 py-6">
            <div className="max-w-7xl mx-auto">
              {page !== 'home' && <div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-[10px] font-mono uppercase tracking-widest text-cyan-500 mb-1">Cyverax Nova / Console</p><h1 className="text-2xl font-bold tracking-tight">{pages.find(([key]) => key === page)?.[1]}</h1></div><button className={`text-xs px-3 py-1.5 border rounded-md ${theme === 'dark' ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'}`} onClick={refresh}>Refresh connection</button></div>}
              {error && <div role="alert" className="nova-error">{error}</div>}
              {unavailable && <div className="nova-warning">{unavailable}</div>}
              <div className={["home", "containers", "monitoring"].includes(page) ? undefined : "nova-workspace"} key={`${page}/${subTab || ''}`}>
                {views[page]}
              </div>
            </div>
          </main>
        </div>
        <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} onNavigate={navigate}
          onOpenCreateResource={() => setCreateOpen(true)} onOpenTerminal={() => setShellOpen(true)} themeMode={theme} />
        <CreateResourceModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onNavigate={navigate} themeMode={theme} />
        <NovaShellDrawer isOpen={shellOpen} onClose={() => setShellOpen(false)} vms={[]} themeMode={theme} />
      </div>
    </SessionContext.Provider>
  );
}
