import React from 'react';
import {
  Plus,
  Rocket,
  Server,
  Database,
  Network,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HardDrive,
  Cpu,
  Boxes,
  Activity,
  ArrowUpRight,
  TrendingUp,
  ExternalLink,
  ShieldAlert,
  Clock,
  Sparkles,
  Play,
  Square,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import {
  ActiveView,
  VMInstance,
  ApplicationItem,
  DatabaseItem,
  StorageItem,
  ActivityEvent,
} from '../../types';

interface HomeDashboardProps {
  onNavigate: (view: ActiveView) => void;
  onOpenCreateResource: () => void;
  onSelectVM: (vm: VMInstance) => void;
  vms?: VMInstance[];
  applications?: ApplicationItem[];
  databases?: DatabaseItem[];
  storage?: StorageItem[];
  activities?: ActivityEvent[];
  themeMode: 'dark' | 'light';
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigate,
  onOpenCreateResource,
  onSelectVM,
  vms = [],
  applications = [],
  databases = [],
  storage = [],
  activities = [],
  themeMode,
}) => {
  const isLight = themeMode === 'light';

  const safeSelectVM = (index: number) => {
    const target = vms[index] || vms[0];
    if (target) {
      onSelectVM(target);
    } else {
      onNavigate('compute');
    }
  };

  // System Health Components from Brief
  const healthComponents = [
    { name: 'Compute', status: 'Healthy', details: 'All 8 VM hypervisor nodes operational' },
    { name: 'Networking', status: 'Healthy', details: 'Global edge BGP & ALB latencies <18ms' },
    { name: 'Storage', status: 'Healthy', details: 'Object & NVMe block volumes synchronized' },
    { name: 'Databases', status: 'Healthy', details: 'Multi-AZ replication lag 0.04s' },
    {
      name: 'Application Services',
      status: 'Degraded',
      details: 'JobFinderAI memory pressure (4.8GB / 4GB limit)',
      action: 'ai',
      actionLabel: 'Analyze with Nova AI',
    },
    { name: 'Backup Services', status: 'Healthy', details: 'Last automated snapshot completed at 17:15 UTC' },
    { name: 'Security Services', status: 'Healthy', details: 'Edge WAF blocked 48k malicious requests' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Platform Welcome Header */}
      <div
        id="nova-home-header"
        className={`p-6 rounded-xl border transition-colors ${
          isLight
            ? 'bg-white border-slate-200/90 shadow-xs'
            : 'bg-slate-900/90 border-slate-800/90 shadow-lg'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-500 uppercase">
                CYVERAX NOVA CLOUD CONSOLE
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-mono text-emerald-500 flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ALL SYSTEMS OPERATIONAL (99.98%)
              </span>
            </div>
            <h1
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Welcome to Cyverax Nova
            </h1>
            <p className={`text-sm mt-1 max-w-3xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Build, deploy, secure, and manage your infrastructure from one unified cloud platform.
            </p>
          </div>

          {/* Primary & Secondary Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="home-primary-create-resource-btn"
              onClick={onOpenCreateResource}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm hover:shadow-cyan-500/25 transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Resource</span>
            </button>

            <button
              id="home-deploy-app-btn"
              onClick={() => onNavigate('applications')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
              }`}
            >
              <Rocket className="w-3.5 h-3.5 text-cyan-400" />
              <span>Deploy Application</span>
            </button>

            <button
              id="home-create-vm-btn"
              onClick={() => onNavigate('compute')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>Create VM</span>
            </button>

            <button
              id="home-create-db-btn"
              onClick={() => onNavigate('databases')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Create Database</span>
            </button>

            <button
              id="home-config-network-btn"
              onClick={() => onNavigate('networking')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-cyan-400" />
              <span>Configure Network</span>
            </button>
          </div>
        </div>
      </div>

      {/* Infrastructure Overview: Compact Operational Metric Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2
            className={`text-xs font-bold uppercase tracking-wider font-mono ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            Infrastructure Overview
          </h2>
          <span className="text-[11px] font-mono text-slate-500">Live Telemetry (Every 5s)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* Running Resources */}
          <div
            className={`p-3 rounded-lg border transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="text-[11px] font-medium text-slate-500 truncate">Running Resources</div>
            <div className={`text-xl font-bold font-mono mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              24
            </div>
            <div className="text-[10px] text-emerald-500 flex items-center gap-0.5 mt-1 font-mono font-medium">
              <TrendingUp className="w-3 h-3" /> +3 this week
            </div>
          </div>

          {/* Virtual Machines */}
          <div
            onClick={() => onNavigate('compute')}
            className={`p-3 rounded-lg border transition-colors cursor-pointer hover:border-cyan-500/50 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="text-[11px] font-medium text-slate-500 truncate">Virtual Machines</div>
            <div className={`text-xl font-bold font-mono mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              8
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">7 running • 1 stopped</div>
          </div>

          {/* Containers */}
          <div
            onClick={() => onNavigate('applications')}
            className={`p-3 rounded-lg border transition-colors cursor-pointer hover:border-cyan-500/50 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="text-[11px] font-medium text-slate-500 truncate">Containers</div>
            <div className={`text-xl font-bold font-mono mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              12
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">across 3 clusters</div>
          </div>

          {/* Applications */}
          <div
            onClick={() => onNavigate('applications')}
            className={`p-3 rounded-lg border transition-colors cursor-pointer hover:border-cyan-500/50 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="text-[11px] font-medium text-slate-500 truncate">Applications</div>
            <div className={`text-xl font-bold font-mono mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              7
            </div>
            <div className="text-[10px] text-amber-400 font-mono mt-1">1 degraded</div>
          </div>

          {/* Databases */}
          <div
            onClick={() => onNavigate('databases')}
            className={`p-3 rounded-lg border transition-colors cursor-pointer hover:border-cyan-500/50 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="text-[11px] font-medium text-slate-500 truncate">Databases</div>
            <div className={`text-xl font-bold font-mono mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              3
            </div>
            <div className="text-[10px] text-emerald-500 font-mono mt-1">Multi-AZ Sync</div>
          </div>

          {/* Storage Used */}
          <div
            onClick={() => onNavigate('storage')}
            className={`p-3 rounded-lg border transition-colors cursor-pointer hover:border-cyan-500/50 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="text-[11px] font-medium text-slate-500 truncate">Storage Used</div>
            <div className={`text-xl font-bold font-mono mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              4.8 TB
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">of 14 TB capacity</div>
          </div>

          {/* Active Alerts */}
          <div
            onClick={() => onNavigate('security')}
            className={`p-3 rounded-lg border transition-colors cursor-pointer hover:border-red-500/50 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="text-[11px] font-medium text-slate-500 truncate">Active Alerts</div>
            <div className="text-xl font-bold font-mono mt-1 text-red-500">2</div>
            <div className="text-[10px] text-red-400 font-mono mt-1 font-semibold">1 critical finding</div>
          </div>

          {/* Monthly Usage */}
          <div
            onClick={() => onNavigate('billing')}
            className={`p-3 rounded-lg border transition-colors cursor-pointer hover:border-emerald-500/50 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="text-[11px] font-medium text-slate-500 truncate">Monthly Usage</div>
            <div className={`text-xl font-bold font-mono mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              $1,842
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Est. $2,390</div>
          </div>
        </div>
      </div>

      {/* Grid: Resource Health & Nova AI Recommendation Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resource Health Visualization */}
        <div
          className={`lg:col-span-2 p-5 rounded-xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/40 mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Resource Health Status
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-500">7 Core Subsystems</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {healthComponents.map((item) => (
              <div
                key={item.name}
                className={`p-3 rounded-lg border transition-colors flex items-start justify-between ${
                  item.status === 'Healthy'
                    ? isLight
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-slate-950/40 border-slate-800/80'
                    : 'bg-amber-500/10 border-amber-500/40'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.status === 'Healthy' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                      }`}
                    />
                    <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {item.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        item.status === 'Healthy'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-amber-300 bg-amber-500/20'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{item.details}</p>
                </div>

                {item.action && (
                  <button
                    onClick={() => onNavigate(item.action as ActiveView)}
                    className="text-[10px] font-semibold text-purple-300 hover:text-purple-200 bg-purple-500/20 hover:bg-purple-500/30 px-2 py-1 rounded border border-purple-500/30 transition-colors shrink-0 ml-2"
                  >
                    {item.actionLabel}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Nova AI Autonomous Card */}
        <div
          className={`p-5 rounded-xl border flex flex-col justify-between ${
            isLight
              ? 'bg-gradient-to-br from-purple-50/70 to-indigo-50/70 border-purple-200 shadow-xs'
              : 'bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/30 border-purple-800/50'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-purple-400">
                  Nova AI Infrastructure Assistant
                </span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                ACTIVE
              </span>
            </div>

            <h3 className={`text-sm font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Container Self-Healing Recommendation
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              JobFinderAI worker is throttling under load. Nova AI formulated a zero-downtime memory scaling & replica expansion plan (+2 replicas, 4GB RAM).
            </p>

            <div className={`mt-3 p-2.5 rounded text-xs font-mono border ${isLight ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-purple-500/10 border-purple-500/20 text-purple-200'}`}>
              Estimated Monthly Cost: <span className={`font-bold ${isLight ? 'text-purple-950' : 'text-white'}`}>+$18.40</span>
            </div>
          </div>

          <div className={`mt-4 pt-3 border-t flex items-center justify-between ${isLight ? 'border-purple-200' : 'border-purple-800/40'}`}>
            <button
              onClick={() => onNavigate('ai')}
              className={`text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                isLight ? 'text-purple-700 hover:text-purple-900' : 'text-purple-300 hover:text-white'
              }`}
            >
              <span>Review Plan in Nova AI</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-slate-500 font-mono">SOC2 COMPLIANT</span>
          </div>
        </div>
      </div>

      {/* Recent Resources Table (Dense Enterprise Table) */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className={`px-5 py-3.5 border-b flex items-center justify-between ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-slate-800/60'}`}>
          <div className="flex items-center gap-3">
            <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Recent Resources
            </h2>
            <span className="text-xs text-slate-400">Showing 6 active workloads across environments</span>
          </div>
          <button
            onClick={() => onNavigate('compute')}
            className="text-xs font-semibold text-cyan-500 hover:text-cyan-600 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Compute</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className={`border-b font-mono text-[11px] uppercase tracking-wider ${
                  isLight
                    ? 'bg-slate-50 text-slate-600 border-slate-200'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800/80'
                }`}
              >
                <th className="py-2.5 px-4 font-semibold">Name</th>
                <th className="py-2.5 px-4 font-semibold">Type</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Region</th>
                <th className="py-2.5 px-4 font-semibold">IP / Endpoint</th>
                <th className="py-2.5 px-4 font-semibold">Environment</th>
                <th className="py-2.5 px-4 font-semibold">Created</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-sans ${isLight ? 'divide-slate-200' : 'divide-slate-800/40'}`}>
              {/* Row 1: nova-web-01 from Brief */}
              <tr
                onClick={() => onSelectVM(vms[0])}
                className={`${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-850/50'} transition-colors cursor-pointer`}
              >
                <td className={`py-3 px-4 font-semibold flex items-center gap-2 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  <Server className="w-3.5 h-3.5 text-slate-400" />
                  <span>nova-web-01</span>
                </td>
                <td className={`py-3 px-4 font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Virtual Machine</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Running
                  </span>
                </td>
                <td className={`py-3 px-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Atlanta</td>
                <td className={`py-3 px-4 font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>10.15.2.141</td>
                <td className="py-3 px-4">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-800 text-slate-300'}`}>
                    Production
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">26d ago</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      safeSelectVM(0);
                    }}
                    className={`hover:underline font-medium text-xs cursor-pointer ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}
                  >
                    Inspect
                  </button>
                </td>
              </tr>

              {/* Row 2: jobfinder-api from Brief */}
              <tr
                onClick={() => onNavigate('applications')}
                className={`${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-850/50'} transition-colors cursor-pointer`}
              >
                <td className={`py-3 px-4 font-semibold flex items-center gap-2 ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`}>
                  <Boxes className="w-3.5 h-3.5 text-slate-400" />
                  <span>jobfinder-api</span>
                </td>
                <td className={`py-3 px-4 font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Container</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 border border-amber-500/30 font-mono ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Warning (OOM)
                  </span>
                </td>
                <td className={`py-3 px-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Atlanta</td>
                <td className="py-3 px-4 font-mono text-slate-400">Internal (K8s Service)</td>
                <td className="py-3 px-4">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-800 text-slate-300'}`}>
                    Production
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">18d ago</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('ai');
                    }}
                    className={`hover:underline font-medium text-xs cursor-pointer ${isLight ? 'text-purple-700' : 'text-purple-400'}`}
                  >
                    Heal with AI
                  </button>
                </td>
              </tr>

              {/* Row 3: cyverax-db01 from Brief */}
              <tr
                onClick={() => onNavigate('databases')}
                className={`${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-850/50'} transition-colors cursor-pointer`}
              >
                <td className={`py-3 px-4 font-semibold flex items-center gap-2 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  <span>cyverax-db01</span>
                </td>
                <td className={`py-3 px-4 font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>PostgreSQL 16</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Running
                  </span>
                </td>
                <td className={`py-3 px-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Atlanta</td>
                <td className={`py-3 px-4 font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>10.15.2.160</td>
                <td className="py-3 px-4">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-800 text-slate-300'}`}>
                    Production
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">2mo ago</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('databases');
                    }}
                    className={`hover:underline font-medium text-xs cursor-pointer ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}
                  >
                    Inspect
                  </button>
                </td>
              </tr>

              {/* Row 4: nova-app-01 */}
              <tr
                onClick={() => safeSelectVM(1)}
                className={`${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-850/50'} transition-colors cursor-pointer`}
              >
                <td className={`py-3 px-4 font-semibold flex items-center gap-2 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  <Server className="w-3.5 h-3.5 text-slate-400" />
                  <span>nova-app-01</span>
                </td>
                <td className={`py-3 px-4 font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Virtual Machine</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Running
                  </span>
                </td>
                <td className={`py-3 px-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Atlanta</td>
                <td className={`py-3 px-4 font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>10.15.2.142</td>
                <td className="py-3 px-4">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-800 text-slate-300'}`}>
                    Production
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">26d ago</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      safeSelectVM(1);
                    }}
                    className={`hover:underline font-medium text-xs cursor-pointer ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}
                  >
                    Inspect
                  </button>
                </td>
              </tr>

              {/* Row 5: dev-sandbox-01 (Stopped) */}
              <tr
                onClick={() => safeSelectVM(5)}
                className={`${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-850/50'} transition-colors cursor-pointer opacity-75`}
              >
                <td className="py-3 px-4 font-semibold text-slate-500 flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-slate-400" />
                  <span>dev-sandbox-01</span>
                </td>
                <td className="py-3 px-4 text-slate-400 font-mono">Virtual Machine</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium font-mono ${isLight ? 'bg-slate-100 text-slate-600 border border-slate-300' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                    <Square className="w-2 h-2 fill-slate-400" />
                    Stopped
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400">Atlanta</td>
                <td className="py-3 px-4 font-mono text-slate-400">10.20.1.44</td>
                <td className="py-3 px-4">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${isLight ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-800 text-slate-400'}`}>
                    Development
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">5d ago</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      safeSelectVM(5);
                    }}
                    className={`hover:underline font-medium text-xs cursor-pointer ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Activity Timeline Preview */}
      <div
        className={`p-5 rounded-xl border ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className={`flex items-center justify-between pb-3 border-b mb-3 ${isLight ? 'border-slate-200' : 'border-slate-800/40'}`}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Recent Audit & Activity Log
            </h2>
          </div>
          <button
            onClick={() => onNavigate('activity')}
            className={`text-xs font-semibold hover:underline flex items-center gap-1 cursor-pointer ${
              isLight ? 'text-cyan-700' : 'text-cyan-400'
            }`}
          >
            <span>Open Activity Center</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className={`divide-y text-xs ${isLight ? 'divide-slate-200' : 'divide-slate-800/40'}`}>
          {activities.slice(0, 4).map((act) => (
            <div key={act.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <div>
                  <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{act.action}</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span className={`font-mono ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>{act.resource}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>{act.user}</span>
                <span>{act.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
