import React, { useState, useEffect } from 'react';
import {
  Home,
  LayoutDashboard,
  Cpu,
  Boxes,
  Network,
  HardDrive,
  Database,
  AppWindow,
  Sparkles,
  ShieldAlert,
  Users,
  Activity,
  FileText,
  Archive,
  Terminal,
  ShoppingBag,
  CreditCard,
  Settings,
  LifeBuoy,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Share2,
  Server,
} from 'lucide-react';
import { ActiveView } from '../types';

interface LeftSidebarProps {
  activeView: ActiveView;
  activeSubTab?: string;
  onNavigate: (view: ActiveView, subTab?: string) => void;
  isCollapsed?: boolean;
  collapsed?: boolean;
  setIsCollapsed?: (val: boolean) => void;
  onToggleCollapse?: () => void;
  alertsCount?: number;
  appsDegraded?: boolean;
  themeMode?: 'dark' | 'light';
  onOpenCreateResource?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeView,
  activeSubTab,
  onNavigate,
  isCollapsed,
  collapsed,
  setIsCollapsed,
  onToggleCollapse,
  alertsCount = 2,
  appsDegraded = true,
  themeMode = 'dark',
}) => {
  // Accordion expansion states
  const [computeOpen, setComputeOpen] = useState(true);
  const [appsOpen, setAppsOpen] = useState(false);
  const [networkingOpen, setNetworkingOpen] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);
  const [databasesOpen, setDatabasesOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [iamOpen, setIamOpen] = useState(false);
  const [monitoringOpen, setMonitoringOpen] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const collapsedState = isCollapsed ?? collapsed ?? false;
  const isLight = themeMode === 'light';

  // Automatically keep parent accordion open when activeView matches
  useEffect(() => {
    if (activeView === 'compute' || activeView === 'vm-detail') setComputeOpen(true);
    if (activeView === 'applications' || activeView === 'containers') setAppsOpen(true);
    if (activeView === 'networking') setNetworkingOpen(true);
    if (activeView === 'storage') setStorageOpen(true);
    if (activeView === 'databases') setDatabasesOpen(true);
    if (activeView === 'security') setSecurityOpen(true);
    if (activeView === 'iam') setIamOpen(true);
    if (activeView === 'monitoring') setMonitoringOpen(true);
    if (activeView === 'dev-tools') setDevToolsOpen(true);
    if (activeView === 'settings') setSettingsOpen(true);
  }, [activeView]);

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else if (setIsCollapsed) {
      setIsCollapsed(!collapsedState);
    }
  };

  const getItemClass = (isActive: boolean) => {
    if (isActive) {
      return isLight
        ? 'bg-cyan-50 text-cyan-700 font-semibold border border-cyan-300 shadow-xs'
        : 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30';
    }
    return isLight
      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      : 'text-slate-300 hover:text-white hover:bg-slate-900';
  };

  const getSubItemClass = (isActive: boolean) => {
    if (isActive) {
      return isLight
        ? 'text-cyan-700 font-semibold bg-cyan-100/70 border-l-2 border-cyan-500 pl-1.5'
        : 'text-cyan-300 font-semibold bg-cyan-500/15 border-l-2 border-cyan-400 pl-1.5';
    }
    return isLight
      ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850';
  };

  return (
    <aside
      id="cyverax-left-sidebar"
      className={`flex flex-col justify-between transition-all duration-200 z-20 select-none border-r shrink-0 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800/80 text-slate-200'
      } ${collapsedState ? 'w-14' : 'w-64'}`}
    >
      {/* Top Section: Nav items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2.5">
        {/* Collapse Toggle at top */}
        <div className="px-3 pb-2 flex items-center justify-between">
          {!collapsedState && (
            <span
              className={`text-[10px] font-bold tracking-widest uppercase font-mono ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Console Services
            </span>
          )}
          <button
            id="sidebar-collapse-toggle-btn"
            onClick={handleToggle}
            className={`p-1 rounded ml-auto transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title={collapsedState ? 'Expand navigation' : 'Collapse navigation'}
          >
            {collapsedState ? (
              <PanelLeft className="w-4 h-4 text-cyan-500" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Primary Home Views */}
        <div className="space-y-0.5 px-2">
          <button
            id="nav-home-btn"
            onClick={() => onNavigate('home')}
            className={`w-full flex items-center gap-3 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
              activeView === 'home'
            )}`}
            title="Home"
          >
            <Home className="w-4 h-4 shrink-0 text-cyan-500" />
            {!collapsedState && <span>Home</span>}
          </button>

          <button
            id="nav-dashboard-btn"
            onClick={() => onNavigate('home')}
            className={`w-full flex items-center gap-3 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
              false
            )}`}
            title="Dashboard Overview"
          >
            <LayoutDashboard className="w-4 h-4 shrink-0 text-slate-400" />
            {!collapsedState && <span>Dashboard Overview</span>}
          </button>
        </div>

        {/* Master Cluster & Multi-Tenancy Section */}
        <div className={`my-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`} />
        <div className="px-2 space-y-0.5">
          {!collapsedState && (
            <div
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider font-mono flex items-center justify-between ${
                isLight ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            >
              <span>Master Controller</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded font-semibold border border-cyan-500/40">ROOT</span>
            </div>
          )}

          <button
            id="nav-client-instances-btn"
            onClick={() => onNavigate('clients')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
              activeView === 'clients'
            )}`}
            title="Client Instances & Hardware Allocation"
          >
            <div className="flex items-center gap-3">
              <Server className="w-4 h-4 shrink-0 text-cyan-400" />
              {!collapsedState && <span>Client Instances</span>}
            </div>
            {!collapsedState && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                VLANs
              </span>
            )}
          </button>
        </div>

        {/* Infrastructure & Services Divider */}
        <div className={`my-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`} />

        {/* Core Infrastructure Section */}
        <div className="px-2 space-y-0.5">
          {!collapsedState && (
            <div
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider font-mono flex items-center justify-between ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              <span>Core Infrastructure</span>
            </div>
          )}

          {/* 1. Compute (Nested Submenu) */}
          <div>
            <button
              id="nav-compute-btn"
              onClick={() => {
                if (collapsedState) {
                  handleToggle();
                  setComputeOpen(true);
                } else {
                  setComputeOpen(!computeOpen);
                }
                onNavigate('compute', 'vms');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
                activeView === 'compute' || activeView === 'vm-detail'
              )}`}
              title="Compute Services"
            >
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 shrink-0 text-cyan-500" />
                {!collapsedState && <span>Compute</span>}
              </div>
              {!collapsedState && (
                <div>
                  {computeOpen ? (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              )}
            </button>

            {!collapsedState && computeOpen && (
              <div
                className={`ml-5 pl-3 border-l space-y-0.5 mt-0.5 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <button
                  id="nav-sub-vms-btn"
                  onClick={() => onNavigate('compute', 'vms')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    (activeView === 'compute' || activeView === 'vm-detail') &&
                      (!activeSubTab || activeSubTab === 'vms')
                  )}`}
                >
                  Virtual Machines (8)
                </button>
                <button
                  id="nav-sub-images-btn"
                  onClick={() => onNavigate('compute', 'images')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'compute' && activeSubTab === 'images'
                  )}`}
                >
                  Images & Templates
                </button>
                <button
                  id="nav-sub-snapshots-btn"
                  onClick={() => onNavigate('compute', 'snapshots')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'compute' && activeSubTab === 'snapshots'
                  )}`}
                >
                  Snapshots & Disks
                </button>
                <button
                  id="nav-sub-instance-groups-btn"
                  onClick={() => onNavigate('compute', 'instance-groups')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'compute' && activeSubTab === 'instance-groups'
                  )}`}
                >
                  Instance Groups
                </button>
                <button
                  id="nav-sub-ssh-keys-btn"
                  onClick={() => onNavigate('compute', 'ssh-keys')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'compute' && activeSubTab === 'ssh-keys'
                  )}`}
                >
                  SSH Keys & Access
                </button>
              </div>
            )}
          </div>

          {/* 2. Containers / Applications (Nested Submenu) */}
          <div>
            <button
              id="nav-containers-btn"
              onClick={() => {
                if (collapsedState) {
                  handleToggle();
                  setAppsOpen(true);
                } else {
                  setAppsOpen(!appsOpen);
                }
                onNavigate('applications', 'workloads');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
                activeView === 'containers' || activeView === 'applications'
              )}`}
              title="Containers & Microservices"
            >
              <div className="flex items-center gap-3">
                <Boxes className="w-4 h-4 shrink-0 text-indigo-500" />
                {!collapsedState && <span>Applications</span>}
              </div>
              {!collapsedState && (
                <div className="flex items-center gap-1.5">
                  {appsDegraded && (
                    <span className="text-[9px] px-1 py-0.2 font-semibold bg-amber-500/20 text-amber-700 rounded border border-amber-500/30">
                      1 Degraded
                    </span>
                  )}
                  {appsOpen ? (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              )}
            </button>

            {!collapsedState && appsOpen && (
              <div
                className={`ml-5 pl-3 border-l space-y-0.5 mt-0.5 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <button
                  id="nav-sub-workloads-btn"
                  onClick={() => onNavigate('applications', 'workloads')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    (activeView === 'applications' || activeView === 'containers') &&
                      (!activeSubTab || activeSubTab === 'workloads')
                  )}`}
                >
                  Deployed Workloads (4)
                </button>
                <button
                  id="nav-sub-deploy-app-btn"
                  onClick={() => onNavigate('applications', 'deploy')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    (activeView === 'applications' || activeView === 'containers') &&
                      activeSubTab === 'deploy'
                  )}`}
                >
                  Deploy Application
                </button>
                <button
                  id="nav-sub-domains-btn"
                  onClick={() => onNavigate('applications', 'domains')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    (activeView === 'applications' || activeView === 'containers') &&
                      activeSubTab === 'domains'
                  )}`}
                >
                  Custom Domains & SSL
                </button>
              </div>
            )}
          </div>

          {/* 3. Networking (Nested Submenu) */}
          <div>
            <button
              id="nav-networking-btn"
              onClick={() => {
                if (collapsedState) {
                  handleToggle();
                  setNetworkingOpen(true);
                } else {
                  setNetworkingOpen(!networkingOpen);
                }
                onNavigate('networking', 'topology');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
                activeView === 'networking'
              )}`}
              title="Networking"
            >
              <div className="flex items-center gap-3">
                <Network className="w-4 h-4 shrink-0 text-cyan-500" />
                {!collapsedState && <span>Networking</span>}
              </div>
              {!collapsedState && (
                <div>
                  {networkingOpen ? (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              )}
            </button>

            {!collapsedState && networkingOpen && (
              <div
                className={`ml-5 pl-3 border-l space-y-0.5 mt-0.5 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <button
                  id="nav-sub-net-topology-btn"
                  onClick={() => onNavigate('networking', 'topology')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'networking' &&
                      (!activeSubTab || activeSubTab === 'topology')
                  )}`}
                >
                  Topology Visualizer
                </button>
                <button
                  id="nav-sub-net-vpcs-btn"
                  onClick={() => onNavigate('networking', 'vpcs')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'networking' && activeSubTab === 'vpcs'
                  )}`}
                >
                  Virtual Networks (VPCs)
                </button>
                <button
                  id="nav-sub-net-subnets-btn"
                  onClick={() => onNavigate('networking', 'subnets')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'networking' && activeSubTab === 'subnets'
                  )}`}
                >
                  Subnets & CIDRs (3)
                </button>
                <button
                  id="nav-sub-net-alb-btn"
                  onClick={() => onNavigate('networking', 'loadbalancers')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'networking' && activeSubTab === 'loadbalancers'
                  )}`}
                >
                  Load Balancers (ALB)
                </button>
                <button
                  id="nav-sub-net-firewall-btn"
                  onClick={() => onNavigate('networking', 'firewalls')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'networking' && activeSubTab === 'firewalls'
                  )}`}
                >
                  Firewall Rules (14)
                </button>
                <button
                  id="nav-sub-net-routing-btn"
                  onClick={() => onNavigate('networking', 'routing')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'networking' && activeSubTab === 'routing'
                  )}`}
                >
                  DNS & Routing
                </button>
              </div>
            )}
          </div>

          {/* 4. Storage (Nested Submenu) */}
          <div>
            <button
              id="nav-storage-btn"
              onClick={() => {
                if (collapsedState) {
                  handleToggle();
                  setStorageOpen(true);
                } else {
                  setStorageOpen(!storageOpen);
                }
                onNavigate('storage', 'buckets');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
                activeView === 'storage'
              )}`}
              title="Storage Services"
            >
              <div className="flex items-center gap-3">
                <HardDrive className="w-4 h-4 shrink-0 text-blue-500" />
                {!collapsedState && <span>Storage</span>}
              </div>
              {!collapsedState && (
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    4.8TB
                  </span>
                  {storageOpen ? (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              )}
            </button>

            {!collapsedState && storageOpen && (
              <div
                className={`ml-5 pl-3 border-l space-y-0.5 mt-0.5 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <button
                  id="nav-sub-buckets-btn"
                  onClick={() => onNavigate('storage', 'buckets')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'storage' && (!activeSubTab || activeSubTab === 'buckets')
                  )}`}
                >
                  Object Storage (S3)
                </button>
                <button
                  id="nav-sub-volumes-btn"
                  onClick={() => onNavigate('storage', 'volumes')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'storage' && activeSubTab === 'volumes'
                  )}`}
                >
                  Block Volumes (NVMe)
                </button>
                <button
                  id="nav-sub-archives-btn"
                  onClick={() => onNavigate('storage', 'snapshots')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'storage' && activeSubTab === 'snapshots'
                  )}`}
                >
                  Snapshots & Archives
                </button>
              </div>
            )}
          </div>

          {/* 5. Databases (Nested Submenu) */}
          <div>
            <button
              id="nav-databases-btn"
              onClick={() => {
                if (collapsedState) {
                  handleToggle();
                  setDatabasesOpen(true);
                } else {
                  setDatabasesOpen(!databasesOpen);
                }
                onNavigate('databases', 'clusters');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
                activeView === 'databases'
              )}`}
              title="Databases"
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 shrink-0 text-emerald-500" />
                {!collapsedState && <span>Databases</span>}
              </div>
              {!collapsedState && (
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    3
                  </span>
                  {databasesOpen ? (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              )}
            </button>

            {!collapsedState && databasesOpen && (
              <div
                className={`ml-5 pl-3 border-l space-y-0.5 mt-0.5 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <button
                  id="nav-sub-db-clusters-btn"
                  onClick={() => onNavigate('databases', 'clusters')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'databases' && (!activeSubTab || activeSubTab === 'clusters')
                  )}`}
                >
                  Managed Clusters (3)
                </button>
                <button
                  id="nav-sub-db-console-btn"
                  onClick={() => onNavigate('databases', 'query-console')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'databases' && activeSubTab === 'query-console'
                  )}`}
                >
                  SQL Query Console
                </button>
                <button
                  id="nav-sub-db-backups-btn"
                  onClick={() => onNavigate('databases', 'backups')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'databases' && activeSubTab === 'backups'
                  )}`}
                >
                  Automated Backups & PITR
                </button>
              </div>
            )}
          </div>

          {/* Nova AI & Automation */}
          <button
            id="nav-ai-btn"
            onClick={() => onNavigate('ai')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer relative group ${
              activeView === 'ai'
                ? isLight
                  ? 'bg-purple-50 text-purple-800 font-semibold border border-purple-300'
                  : 'bg-purple-500/20 text-purple-200 font-semibold border border-purple-500/40 shadow-xs'
                : isLight
                ? 'text-purple-700 hover:text-purple-950 hover:bg-purple-50'
                : 'text-purple-300 hover:text-white hover:bg-purple-950/40'
            }`}
            title="Nova AI & Infrastructure Automation"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 shrink-0 text-purple-500 animate-pulse" />
              {!collapsedState && (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold">Nova AI</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                      isLight
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-purple-500/30 text-purple-200'
                    }`}
                  >
                    AUTONOMOUS
                  </span>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Security & Observability Divider */}
        <div className={`my-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`} />

        <div className="px-2 space-y-0.5">
          {!collapsedState && (
            <div
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider font-mono ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Security & Observability
            </div>
          )}

          {/* 6. Security Center (Nested Submenu) */}
          <div>
            <button
              id="nav-security-btn"
              onClick={() => {
                if (collapsedState) {
                  handleToggle();
                  setSecurityOpen(true);
                } else {
                  setSecurityOpen(!securityOpen);
                }
                onNavigate('security', 'overview');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
                activeView === 'security'
              )}`}
              title="Cyverax Security Center"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                {!collapsedState && <span>Security Center</span>}
              </div>
              {!collapsedState && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] px-1.5 py-0.2 font-mono font-bold bg-red-500/15 text-red-600 rounded border border-red-500/25">
                    —
                  </span>
                  {securityOpen ? (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              )}
            </button>

            {!collapsedState && securityOpen && (
              <div
                className={`ml-5 pl-3 border-l space-y-0.5 mt-0.5 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <button
                  id="nav-sub-sec-overview-btn"
                  onClick={() => onNavigate('security', 'overview')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'security' && (!activeSubTab || activeSubTab === 'overview')
                  )}`}
                >
                  Security Posture (Not scanned)
                </button>
                <button
                  id="nav-sub-sec-vulns-btn"
                  onClick={() => onNavigate('security', 'vulnerabilities')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'security' && activeSubTab === 'vulnerabilities'
                  )}`}
                >
                  Vulnerability Alerts (3)
                </button>
                <button
                  id="nav-sub-sec-compliance-btn"
                  onClick={() => onNavigate('security', 'compliance')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'security' && activeSubTab === 'compliance'
                  )}`}
                >
                  Compliance & CIS Reports
                </button>
              </div>
            )}
          </div>

          {/* 7. Identity & Access IAM (Nested Submenu) */}
          <div>
            <button
              id="nav-iam-btn"
              onClick={() => {
                if (collapsedState) {
                  handleToggle();
                  setIamOpen(true);
                } else {
                  setIamOpen(!iamOpen);
                }
                onNavigate('iam', 'users');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
                activeView === 'iam'
              )}`}
              title="Identity & Access (IAM)"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 shrink-0 text-cyan-500" />
                {!collapsedState && <span>Identity & Access</span>}
              </div>
              {!collapsedState && (
                <div>
                  {iamOpen ? (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              )}
            </button>

            {!collapsedState && iamOpen && (
              <div
                className={`ml-5 pl-3 border-l space-y-0.5 mt-0.5 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <button
                  id="nav-sub-iam-users-btn"
                  onClick={() => onNavigate('iam', 'users')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'iam' && (!activeSubTab || activeSubTab === 'users')
                  )}`}
                >
                  Team Members (4)
                </button>
                <button
                  id="nav-sub-iam-keys-btn"
                  onClick={() => onNavigate('iam', 'keys')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'iam' && activeSubTab === 'keys'
                  )}`}
                >
                  API Access Keys (3)
                </button>
                <button
                  id="nav-sub-iam-roles-btn"
                  onClick={() => onNavigate('iam', 'roles')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'iam' && activeSubTab === 'roles'
                  )}`}
                >
                  Roles & Permissions
                </button>
              </div>
            )}
          </div>

          {/* 8. Monitoring (Nested Submenu) */}
          <div>
            <button
              id="nav-monitoring-btn"
              onClick={() => {
                if (collapsedState) {
                  handleToggle();
                  setMonitoringOpen(true);
                } else {
                  setMonitoringOpen(!monitoringOpen);
                }
                onNavigate('monitoring', 'metrics');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
                activeView === 'monitoring'
              )}`}
              title="Monitoring & Metrics"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 shrink-0 text-emerald-500" />
                {!collapsedState && <span>Monitoring</span>}
              </div>
              {!collapsedState && (
                <div>
                  {monitoringOpen ? (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              )}
            </button>

            {!collapsedState && monitoringOpen && (
              <div
                className={`ml-5 pl-3 border-l space-y-0.5 mt-0.5 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <button
                  id="nav-sub-mon-metrics-btn"
                  onClick={() => onNavigate('monitoring', 'metrics')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'monitoring' && (!activeSubTab || activeSubTab === 'metrics')
                  )}`}
                >
                  Metrics Telemetry
                </button>
                <button
                  id="nav-sub-mon-alerts-btn"
                  onClick={() => onNavigate('monitoring', 'alerts')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'monitoring' && activeSubTab === 'alerts'
                  )}`}
                >
                  Alert Thresholds (3)
                </button>
                <button
                  id="nav-sub-mon-slo-btn"
                  onClick={() => onNavigate('monitoring', 'slos')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'monitoring' && activeSubTab === 'slos'
                  )}`}
                >
                  SLOs & Uptime (99.99%)
                </button>
              </div>
            )}
          </div>

          {/* Logs */}
          <button
            id="nav-logs-btn"
            onClick={() => onNavigate('logs')}
            className={`w-full flex items-center gap-3 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
              activeView === 'logs'
            )}`}
            title="Logs Explorer"
          >
            <FileText className="w-4 h-4 shrink-0 text-slate-400" />
            {!collapsedState && <span>Logs</span>}
          </button>

          {/* Backups */}
          <button
            id="nav-backups-btn"
            onClick={() => onNavigate('backups')}
            className={`w-full flex items-center gap-3 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
              activeView === 'backups'
            )}`}
            title="Backups & Vaults"
          >
            <Archive className="w-4 h-4 shrink-0 text-amber-500" />
            {!collapsedState && <span>Backups</span>}
          </button>
        </div>

        {/* Developer & Platform Divider */}
        <div className={`my-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`} />

        <div className="px-2 space-y-0.5">
          {!collapsedState && (
            <div
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider font-mono ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Ecosystem
            </div>
          )}

          {/* 9. Developer Tools (Nested Submenu) */}
          <div>
            <button
              id="nav-dev-tools-btn"
              onClick={() => {
                if (collapsedState) {
                  handleToggle();
                  setDevToolsOpen(true);
                } else {
                  setDevToolsOpen(!devToolsOpen);
                }
                onNavigate('dev-tools', 'cli');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
                activeView === 'dev-tools'
              )}`}
              title="Developer Tools (API, CLI, Terraform)"
            >
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 shrink-0 text-cyan-500" />
                {!collapsedState && <span>Developer Tools</span>}
              </div>
              {!collapsedState && (
                <div>
                  {devToolsOpen ? (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              )}
            </button>

            {!collapsedState && devToolsOpen && (
              <div
                className={`ml-5 pl-3 border-l space-y-0.5 mt-0.5 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <button
                  id="nav-sub-dev-cli-btn"
                  onClick={() => onNavigate('dev-tools', 'cli')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'dev-tools' && (!activeSubTab || activeSubTab === 'cli')
                  )}`}
                >
                  CLI Tooling
                </button>
                <button
                  id="nav-sub-dev-api-btn"
                  onClick={() => onNavigate('dev-tools', 'api')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'dev-tools' && activeSubTab === 'api'
                  )}`}
                >
                  REST API & Playground
                </button>
                <button
                  id="nav-sub-dev-tf-btn"
                  onClick={() => onNavigate('dev-tools', 'terraform')}
                  className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                    activeView === 'dev-tools' && activeSubTab === 'terraform'
                  )}`}
                >
                  Terraform Provider
                </button>
              </div>
            )}
          </div>

          {/* Marketplace */}
          <button
            id="nav-marketplace-btn"
            onClick={() => onNavigate('marketplace')}
            className={`w-full flex items-center gap-3 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
              activeView === 'marketplace'
            )}`}
            title="Cyverax Marketplace"
          >
            <ShoppingBag className="w-4 h-4 shrink-0 text-pink-500" />
            {!collapsedState && <span>Marketplace</span>}
          </button>

          {/* Billing */}
          <button
            id="nav-billing-btn"
            onClick={() => onNavigate('billing')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
              activeView === 'billing'
            )}`}
            title="Billing & Cost Management"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 shrink-0 text-emerald-500" />
              {!collapsedState && <span>Billing</span>}
            </div>
            {!collapsedState && (
              <span className={`text-[10px] font-mono font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                —
              </span>
            )}
          </button>

          {/* Activity Center */}
          <button
            id="nav-activity-btn"
            onClick={() => onNavigate('activity')}
            className={`w-full flex items-center gap-3 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${getItemClass(
              activeView === 'activity'
            )}`}
            title="Activity Audit Log"
          >
            <Share2 className="w-4 h-4 shrink-0 text-slate-400" />
            {!collapsedState && <span>Activity Center</span>}
          </button>
        </div>
      </div>

      {/* Bottom Footer Section: Support & Settings */}
      <div
        className={`p-2 space-y-0.5 shrink-0 border-t ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800/80 bg-slate-950/60'
        }`}
      >
        <button
          id="nav-support-btn"
          onClick={() => onNavigate('settings', 'organization')}
          className={`w-full flex items-center gap-3 px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
            isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Cyverax Enterprise Support"
        >
          <LifeBuoy className="w-4 h-4 shrink-0 text-slate-400" />
          {!collapsedState && <span>Support</span>}
        </button>

        {/* 10. Settings (Nested Submenu) */}
        <div>
          <button
            id="nav-settings-btn"
            onClick={() => {
              if (collapsedState) {
                handleToggle();
                setSettingsOpen(true);
              } else {
                setSettingsOpen(!settingsOpen);
              }
              onNavigate('settings', 'appearance');
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
              activeView === 'settings'
                ? isLight
                  ? 'bg-cyan-50 text-cyan-700 font-semibold'
                  : 'bg-cyan-500/15 text-cyan-300 font-semibold'
                : isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Console Settings"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 shrink-0 text-slate-400" />
              {!collapsedState && <span>Settings</span>}
            </div>
            {!collapsedState && (
              <div>
                {settingsOpen ? (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                )}
              </div>
            )}
          </button>

          {!collapsedState && settingsOpen && (
            <div
              className={`ml-5 pl-3 border-l space-y-0.5 mt-0.5 ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <button
                id="nav-sub-settings-theme-btn"
                onClick={() => onNavigate('settings', 'appearance')}
                className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                  activeView === 'settings' && (!activeSubTab || activeSubTab === 'appearance')
                )}`}
              >
                Theme & Appearance
              </button>
              <button
                id="nav-sub-settings-org-btn"
                onClick={() => onNavigate('settings', 'organization')}
                className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                  activeView === 'settings' && activeSubTab === 'organization'
                )}`}
              >
                Organization Profile
              </button>
              <button
                id="nav-sub-settings-sec-btn"
                onClick={() => onNavigate('settings', 'security')}
                className={`w-full text-left px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${getSubItemClass(
                  activeView === 'settings' && activeSubTab === 'security'
                )}`}
              >
                Security & Timeouts
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
