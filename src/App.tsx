import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { LeftSidebar } from './components/LeftSidebar';
import { CommandPalette } from './components/CommandPalette';
import { CreateResourceModal } from './components/CreateResourceModal';
import { NovaShellDrawer } from './components/NovaShellDrawer';
import { NotificationDrawer } from './components/NotificationDrawer';

// Views
import { HomeDashboard } from './components/views/HomeDashboard';
import { ComputeView } from './components/views/ComputeView';
import { VmDetailView } from './components/views/VmDetailView';
import { NetworkingView } from './components/views/NetworkingView';
import { ApplicationsView } from './components/views/ApplicationsView';
import { ContainersView } from './components/views/ContainersView';
import { AiView } from './components/views/AiView';
import { DatabasesView } from './components/views/DatabasesView';
import { StorageView } from './components/views/StorageView';
import { SecurityView } from './components/views/SecurityView';
import { BillingView } from './components/views/BillingView';
import { ActivityView } from './components/views/ActivityView';
import { IamView } from './components/views/IamView';
import { MonitoringView } from './components/views/MonitoringView';
import { LogsView } from './components/views/LogsView';
import { BackupsView } from './components/views/BackupsView';
import { DevToolsView } from './components/views/DevToolsView';
import { MarketplaceView } from './components/views/MarketplaceView';
import { ClientInstancesView } from './components/views/ClientInstancesView';
import { SettingsView } from './components/views/SettingsView';
import { LoginScreen } from './components/LoginScreen';

import {
  ActiveView,
  ActivityEvent,
  AIRecommendation,
  ApplicationItem,
  DatabaseItem,
  NotificationItem,
  SecurityAlert,
  StorageItem,
  VMInstance,
} from './types';

export default function App() {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'anonymous'>('loading');
  // Navigation State
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(undefined);
  const [selectedVM, setSelectedVM] = useState<VMInstance | null>(null);
  const [marketplaceClientId, setMarketplaceClientId] = useState<string | undefined>(undefined);

  // App Shell States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const getSystemTheme = (): 'dark' | 'light' => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => getSystemTheme());
  const [selectedEnvironment, setSelectedEnvironment] = useState('Production');
  const [selectedRegion, setSelectedRegion] = useState('us-atl-1');

  // System theme is authoritative. Nova follows OS/browser appearance changes live.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applySystemTheme = (dark: boolean) => setThemeMode(dark ? 'dark' : 'light');
    applySystemTheme(media.matches);
    const listener = (event: MediaQueryListEvent) => applySystemTheme(event.matches);
    if (typeof media.addEventListener === 'function') media.addEventListener('change', listener);
    else if (typeof (media as any).addListener === 'function') (media as any).addListener(listener);
    return () => {
      if (typeof media.removeEventListener === 'function') media.removeEventListener('change', listener);
      else if (typeof (media as any).removeListener === 'function') (media as any).removeListener(listener);
    };
  }, []);

  useEffect(() => {
    if (themeMode === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.style.backgroundColor = '#f1f5f9';
      document.body.style.color = '#0f172a';
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#020617';
      document.body.style.color = '#f8fafc';
    }
  }, [themeMode]);

  // Drawers & Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShellOpen, setIsShellOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [launchDeployDirectly, setLaunchDeployDirectly] = useState(false);

  // Domain Data State
  const [vms, setVms] = useState<VMInstance[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [databases, setDatabases] = useState<DatabaseItem[]>([]);
  const [storage, setStorage] = useState<StorageItem[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  const loadDashboard = async () => {
    const response = await fetch('/api/dashboard');
    if (!response.ok) throw new Error('Unable to load dashboard');
    const data = await response.json();
    setVms(data.vms || []);
    setApplications(data.applications || []);
    setDatabases(data.databases || []);
    setStorage(data.storage || []);
    setNotifications(data.notifications || []);
    setSecurityAlerts(data.securityAlerts || []);
    setAiRecommendations(data.aiRecommendations || []);
    setActivities(data.activities || []);
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((response) => {
        if (!response.ok) throw new Error('anonymous');
        return response.json();
      })
      .then(async () => {
        setAuthState('authenticated');
        await loadDashboard();
      })
      .catch(() => setAuthState('anonymous'));
  }, []);

  useEffect(() => {
    if (authState !== 'authenticated') return;
    const events = new EventSource('/api/events');
    const refresh = () => {
      loadDashboard().catch(() => undefined);
    };
    events.addEventListener('resource-sync', refresh);
    events.addEventListener('job-update', refresh);
    return () => {
      events.removeEventListener('resource-sync', refresh);
      events.removeEventListener('job-update', refresh);
      events.close();
    };
  }, [authState]);

  // Keyboard Shortcuts (Ctrl+K, `)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '`' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsShellOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleVmStatus = async (vmId: string) => {
    const vm = vms.find((item) => item.id === vmId);
    if (!vm) return;
    const action = vm.status === 'Running' ? 'shutdown' : 'start';
    const response = await fetch(`/api/compute/vms/${encodeURIComponent(vmId)}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      window.alert(body?.error || `Unable to ${action} ${vm.name}`);
      return;
    }
    setVms((prev) => prev.map((item) =>
      item.id === vmId
        ? { ...item, status: action === 'start' ? 'Deploying' : 'Stopped' }
        : item
    ));
    window.setTimeout(() => {
      loadDashboard().catch(() => undefined);
    }, 2000);
  };

  const handleNavigate = (view: ActiveView, subTab?: string) => {
    setSelectedVM(null);
    setActiveView(view);
    setActiveSubTab(subTab);
  };

  const unreadNotificationCount = (notifications || []).filter((n) => !n?.read).length;

  if (authState === 'loading') {
    return <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">Starting Cyverax Nova…</div>;
  }

  if (authState === 'anonymous') {
    return <LoginScreen onAuthenticated={async () => { setAuthState('authenticated'); await loadDashboard(); }} />;
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col ${themeMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      {/* Top Persistent Console Header */}
      <TopNav
        activeEnvironment={selectedEnvironment}
        activeRegion={selectedRegion}
        onSelectEnvironment={setSelectedEnvironment}
        onSelectRegion={setSelectedRegion}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenCreateResource={() => setIsCreateModalOpen(true)}
        onToggleCloudShell={() => setIsShellOpen((prev) => !prev)}
        isTerminalOpen={isShellOpen}
        onToggleNotifications={() => setIsNotificationsOpen((prev) => !prev)}
        notifications={notifications}
        unreadNotifications={unreadNotificationCount}
        onToggleTheme={undefined}
        themeMode={themeMode}
        onNavigate={handleNavigate}
      />

      {/* Main Workbench Body: Sidebar + Dynamic Workspace Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Collapsible Left Navigation */}
        <LeftSidebar
          activeView={activeView}
          activeSubTab={activeSubTab}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenCreateResource={() => setIsCreateModalOpen(true)}
          themeMode={themeMode}
        />

        {/* Dynamic Workspace Container */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {/* View Router */}
            {selectedVM ? (
              <VmDetailView
                vm={selectedVM}
                onBack={() => setSelectedVM(null)}
                onToggleStatus={handleToggleVmStatus}
                themeMode={themeMode}
              />
            ) : activeView === 'home' ? (
              <HomeDashboard
                onNavigate={handleNavigate}
                onOpenCreateResource={() => setIsCreateModalOpen(true)}
                onSelectVM={(vm) => setSelectedVM(vm)}
                vms={vms}
                applications={applications}
                databases={databases}
                storage={storage}
                activities={activities}
                themeMode={themeMode}
              />
            ) : activeView === 'compute' ? (
              <ComputeView
                vms={vms}
                onSelectVM={(vm) => setSelectedVM(vm)}
                onOpenCreateInstance={() => setIsCreateModalOpen(true)}
                onToggleStatus={handleToggleVmStatus}
                themeMode={themeMode}
                activeSubTab={activeSubTab}
                onTabChange={(tab) => setActiveSubTab(tab)}
              />
            ) : activeView === 'containers' ? (
              <ContainersView themeMode={themeMode} />
            ) : activeView === 'applications' ? (
              <ApplicationsView
                applications={applications}
                themeMode={themeMode}
                launchWizardDirectly={launchDeployDirectly}
                onNavigateToAi={() => handleNavigate('ai')}
                activeSubTab={activeSubTab}
                onTabChange={(tab) => setActiveSubTab(tab)}
              />
            ) : activeView === 'networking' ? (
              <NetworkingView
                themeMode={themeMode}
                activeSubTab={activeSubTab}
                onTabChange={(tab) => setActiveSubTab(tab)}
              />
            ) : activeView === 'ai' ? (
              <AiView recommendations={aiRecommendations} themeMode={themeMode} />
            ) : activeView === 'databases' ? (
              <DatabasesView
                databases={databases}
                themeMode={themeMode}
                activeSubTab={activeSubTab}
                onTabChange={(tab) => setActiveSubTab(tab)}
              />
            ) : activeView === 'storage' ? (
              <StorageView
                storage={storage}
                themeMode={themeMode}
                activeSubTab={activeSubTab}
                onTabChange={(tab) => setActiveSubTab(tab)}
              />
            ) : activeView === 'security' ? (
              <SecurityView
                securityAlerts={securityAlerts}
                themeMode={themeMode}
                activeSubTab={activeSubTab}
                onTabChange={(tab) => setActiveSubTab(tab)}
              />
            ) : activeView === 'billing' ? (
              <BillingView
                themeMode={themeMode}
                onNavigateToAi={() => handleNavigate('ai')}
                activeSubTab={activeSubTab}
                onTabChange={(tab) => setActiveSubTab(tab)}
              />
            ) : activeView === 'activity' ? (
              <ActivityView activities={activities} themeMode={themeMode} />
            ) : activeView === 'iam' ? (
              <IamView
                themeMode={themeMode}
                activeSubTab={activeSubTab}
                onTabChange={(tab) => setActiveSubTab(tab)}
              />
            ) : activeView === 'monitoring' ? (
              <MonitoringView
                themeMode={themeMode}
                activeSubTab={activeSubTab}
                onTabChange={(tab) => setActiveSubTab(tab)}
              />
            ) : activeView === 'logs' ? (
              <LogsView themeMode={themeMode} />
            ) : activeView === 'backups' ? (
              <BackupsView themeMode={themeMode} />
            ) : activeView === 'dev-tools' ? (
              <DevToolsView
                themeMode={themeMode}
                activeSubTab={activeSubTab}
                onTabChange={(tab) => setActiveSubTab(tab)}
              />
            ) : activeView === 'clients' ? (
              <ClientInstancesView
                themeMode={themeMode}
                onAssumeTenant={(tenant) => {
                  setSelectedEnvironment(`${tenant.clientCompany} (VLAN ${tenant.vlanId})`);
                  handleNavigate('home');
                }}
                onNavigateToMarketplace={(clientId) => {
                  setMarketplaceClientId(clientId);
                  handleNavigate('marketplace');
                }}
              />
            ) : activeView === 'marketplace' ? (
              <MarketplaceView
                themeMode={themeMode}
                preselectedClientId={marketplaceClientId}
                onNavigateToClients={() => handleNavigate('clients')}
              />
            ) : activeView === 'settings' ? (
              <SettingsView
                themeMode={themeMode}
                onToggleTheme={undefined}
                activeSubTab={activeSubTab}
                onTabChange={(tab) => setActiveSubTab(tab)}
              />
            ) : (
              <div
                className={`p-8 rounded-xl border text-center space-y-3 ${
                  themeMode === 'light'
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-slate-900 border-slate-800 text-white'
                }`}
              >
                <h2 className="text-base font-bold capitalize">{activeView} Workspace</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Integrated telemetry and configuration for tenant org-9842 in us-atl-1. All agents are synchronized with Cyverax Nova.
                </p>
                <button
                  onClick={() => handleNavigate('home')}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded transition-colors cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        onOpenCreateResource={() => {
          setIsCommandPaletteOpen(false);
          setIsCreateModalOpen(true);
        }}
        onOpenTerminal={() => {
          setIsCommandPaletteOpen(false);
          setIsShellOpen(true);
        }}
        vms={vms}
        onSelectVM={(vm) => {
          setIsCommandPaletteOpen(false);
          setSelectedVM(vm);
        }}
        themeMode={themeMode}
      />

      {/* Global Resource Launcher Modal */}
      <CreateResourceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onNavigate={handleNavigate}
        onLaunchDeploymentWorkflow={() => {
          setLaunchDeployDirectly(true);
          handleNavigate('applications');
        }}
        themeMode={themeMode}
      />

      {/* Interactive Cloud Shell Terminal Drawer */}
      <NovaShellDrawer
        isOpen={isShellOpen}
        onClose={() => setIsShellOpen(false)}
        vms={vms}
        themeMode={themeMode}
      />

      {/* Notifications & System Alerts Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onClearAll={() => setNotifications([])}
        onMarkAsRead={(id) =>
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          )
        }
        themeMode={themeMode}
      />
    </div>
  );
}
