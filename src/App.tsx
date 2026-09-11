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
import { SettingsView } from './components/views/SettingsView';

// Mock Data
import {
  MOCK_VMS,
  MOCK_APPLICATIONS,
  MOCK_DATABASES,
  MOCK_STORAGE,
  MOCK_SECURITY_ALERTS,
  MOCK_AI_RECOMMENDATIONS,
  MOCK_NOTIFICATIONS,
  MOCK_ACTIVITY_LOG,
} from './data/mockData';
import { ActiveView, VMInstance } from './types';

export default function App() {
  // Navigation State
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(undefined);
  const [selectedVM, setSelectedVM] = useState<VMInstance | null>(null);

  // App Shell States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [selectedEnvironment, setSelectedEnvironment] = useState('Production');
  const [selectedRegion, setSelectedRegion] = useState('us-atl-1');

  // Synchronize theme to document element
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
  const [vms, setVms] = useState<VMInstance[]>(MOCK_VMS);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

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

  const handleToggleVmStatus = (vmId: string) => {
    setVms((prev) =>
      prev.map((vm) => {
        if (vm.id === vmId) {
          const nextStatus = vm.status === 'Running' ? 'Stopped' : 'Running';
          return { ...vm, status: nextStatus };
        }
        return vm;
      })
    );
    if (selectedVM && selectedVM.id === vmId) {
      setSelectedVM((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status === 'Running' ? 'Stopped' : 'Running',
            }
          : null
      );
    }
  };

  const handleNavigate = (view: ActiveView, subTab?: string) => {
    setSelectedVM(null);
    setActiveView(view);
    setActiveSubTab(subTab);
  };

  const unreadNotificationCount = (notifications || []).filter((n) => !n?.read).length;

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
        onToggleTheme={() => setThemeMode((m) => (m === 'dark' ? 'light' : 'dark'))}
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
                applications={MOCK_APPLICATIONS}
                databases={MOCK_DATABASES}
                storage={MOCK_STORAGE}
                activities={MOCK_ACTIVITY_LOG}
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
            ) : activeView === 'applications' || activeView === 'containers' ? (
              <ApplicationsView
                applications={MOCK_APPLICATIONS}
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
              <AiView recommendations={MOCK_AI_RECOMMENDATIONS} themeMode={themeMode} />
            ) : activeView === 'databases' ? (
              <DatabasesView
                databases={MOCK_DATABASES}
                themeMode={themeMode}
                activeSubTab={activeSubTab}
                onTabChange={(tab) => setActiveSubTab(tab)}
              />
            ) : activeView === 'storage' ? (
              <StorageView
                storage={MOCK_STORAGE}
                themeMode={themeMode}
                activeSubTab={activeSubTab}
                onTabChange={(tab) => setActiveSubTab(tab)}
              />
            ) : activeView === 'security' ? (
              <SecurityView
                securityAlerts={MOCK_SECURITY_ALERTS}
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
              <ActivityView activities={MOCK_ACTIVITY_LOG} themeMode={themeMode} />
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
            ) : activeView === 'marketplace' ? (
              <MarketplaceView themeMode={themeMode} />
            ) : activeView === 'settings' ? (
              <SettingsView
                themeMode={themeMode}
                onToggleTheme={() => setThemeMode((m) => (m === 'dark' ? 'light' : 'dark'))}
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
