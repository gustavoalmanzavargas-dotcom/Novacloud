import React from 'react';
import { Activity, Boxes, Database, HardDrive, Plus, Server } from 'lucide-react';
import {
  ActiveView,
  ActivityEvent,
  ApplicationItem,
  DatabaseItem,
  StorageItem,
  VMInstance,
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
  const panel = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900 border-slate-800 text-white';
  const muted = isLight ? 'text-slate-600' : 'text-slate-400';
  const storageUsed = storage.reduce((total, item) => total + (item.usedGb || 0), 0);
  const cards = [
    { label: 'Virtual Machines', value: vms.length, icon: Server, view: 'compute' as ActiveView },
    { label: 'Applications', value: applications.length, icon: Boxes, view: 'applications' as ActiveView },
    { label: 'Databases', value: databases.length, icon: Database, view: 'databases' as ActiveView },
    { label: 'Storage Used', value: storageUsed ? `${storageUsed.toFixed(1)} GB` : '0 GB', icon: HardDrive, view: 'storage' as ActiveView },
  ];

  return (
    <div className="space-y-6 pb-12">
      <section className={`p-6 rounded-xl border ${panel}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-cyan-500 uppercase">
              CYVERAX NOVA CLOUD CONSOLE
            </div>
            <h1 className="text-3xl font-bold mt-1">Welcome to Cyverax Nova</h1>
            <p className={`text-sm mt-2 ${muted}`}>
              This installation is ready. Connect an infrastructure provider to import live resources.
            </p>
          </div>
          <button
            onClick={onOpenCreateResource}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
          >
            <Plus className="w-4 h-4" /> Add provider or resource
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, view }) => (
          <button key={label} onClick={() => onNavigate(view)} className={`p-5 rounded-xl border text-left ${panel}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${muted}`}>{label}</span>
              <Icon className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-bold mt-3">{value}</div>
          </button>
        ))}
      </section>

      <section className={`rounded-xl border overflow-hidden ${panel}`}>
        <div className="p-5 border-b border-slate-700/30 flex items-center justify-between">
          <h2 className="text-sm font-bold">Live resources</h2>
          <span className={`text-xs ${muted}`}>{vms.length} resource{vms.length === 1 ? '' : 's'}</span>
        </div>
        {vms.length === 0 ? (
          <div className="p-10 text-center">
            <Server className="w-9 h-9 mx-auto text-slate-500" />
            <h3 className="font-semibold mt-3">No infrastructure connected</h3>
            <p className={`text-sm mt-1 ${muted}`}>Your LXC installation contains no demonstration data.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {vms.slice(0, 8).map((vm) => (
              <button key={vm.id} onClick={() => onSelectVM(vm)} className="w-full p-4 flex items-center justify-between text-left hover:bg-cyan-500/5">
                <div><div className="font-semibold">{vm.name}</div><div className={`text-xs ${muted}`}>{vm.os}</div></div>
                <span className="text-xs font-mono text-cyan-500">{vm.status}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className={`rounded-xl border p-5 ${panel}`}>
        <div className="flex items-center gap-2 mb-4"><Activity className="w-4 h-4 text-cyan-500" /><h2 className="text-sm font-bold">Recent activity</h2></div>
        {activities.length === 0 ? (
          <p className={`text-sm ${muted}`}>No activity has been recorded.</p>
        ) : activities.slice(0, 5).map((event) => (
          <div key={event.id} className="py-2 text-sm flex justify-between gap-4">
            <span>{event.action} — {event.resource}</span><span className={muted}>{event.timestamp}</span>
          </div>
        ))}
      </section>
    </div>
  );
};
