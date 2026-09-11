import React, { useState } from 'react';
import {
  Archive,
  RotateCcw,
  CheckCircle2,
  Clock,
  HardDrive,
  Plus,
  ShieldCheck,
  Calendar,
  Trash2,
  Download,
} from 'lucide-react';

interface BackupsViewProps {
  themeMode?: 'dark' | 'light';
}

export const BackupsView: React.FC<BackupsViewProps> = ({ themeMode = 'dark' }) => {
  const isLight = themeMode === 'light';
  const [restoredId, setRestoredId] = useState<string | null>(null);
  const [manualCreating, setManualCreating] = useState(false);

  const [snapshots, setSnapshots] = useState([
    { id: 'snp-8821', resource: 'postgres-primary-db', size: '14.2 GB', type: 'Automated Daily', status: 'Available', created: '2025-03-08 17:15 UTC', retention: '30 days' },
    { id: 'snp-8820', resource: 'prod-api-worker-01', size: '28.0 GB', type: 'NVMe Disk Clone', status: 'Available', created: '2025-03-08 04:00 UTC', retention: '14 days' },
    { id: 'snp-8799', resource: 'postgres-primary-db', size: '13.9 GB', type: 'Automated Daily', status: 'Available', created: '2025-03-07 17:15 UTC', retention: '30 days' },
    { id: 'snp-8650', resource: 'redis-cache-cluster', size: '3.1 GB', type: 'RDB Dump', status: 'Available', created: '2025-03-05 12:00 UTC', retention: '7 days' },
  ]);

  const handleCreateSnapshot = () => {
    setManualCreating(true);
    setTimeout(() => {
      const newSnap = {
        id: `snp-${Date.now().toString().slice(-4)}`,
        resource: 'postgres-primary-db',
        size: '14.5 GB',
        type: 'Manual On-Demand',
        status: 'Available',
        created: 'Just now',
        retention: '60 days',
      };
      setSnapshots([newSnap, ...snapshots]);
      setManualCreating(false);
    }, 800);
  };

  const handleRestore = (id: string) => {
    setRestoredId(id);
    setTimeout(() => setRestoredId(null), 3000);
  };

  const handleDelete = (id: string) => {
    setSnapshots(snapshots.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div
        className={`p-6 rounded-xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800 shadow-lg'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-500 uppercase">
                DISASTER RECOVERY & VAULTS
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-mono text-emerald-500 font-semibold">POINT-IN-TIME ENABLED</span>
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Backups & Snapshot Vaults
            </h1>
            <p className={`text-sm mt-1 max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Encrypted automated snapshots, cross-region cold storage replication, and zero-loss restore routines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateSnapshot}
              disabled={manualCreating}
              className="flex items-center gap-2 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{manualCreating ? 'Creating Snapshot...' : 'Create Snapshot'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Snapshot Vault Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Total Vault Storage</span>
            <HardDrive className="w-4 h-4 text-cyan-500" />
          </div>
          <div className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
            59.2 GB
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across 4 retained snapshots</p>
        </div>

        <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>RPO Target</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
            &lt; 15 mins
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Continuous WAL replication active</p>
        </div>

        <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Encryption Status</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
            AES-256-GCM
          </div>
          <p className="text-[11px] text-slate-400 mt-1">KMS Key: key-cyverax-prd-vault</p>
        </div>
      </div>

      {restoredId && (
        <div className={`p-4 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
          isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>Point-in-time restore request for {restoredId} successfully dispatched to hypervisor engine.</span>
        </div>
      )}

      {/* Snapshots Table */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${isLight ? 'text-slate-800' : 'text-white'}`}>
            Snapshots Inventory
          </h3>
          <span className="text-xs text-slate-400 font-mono">{snapshots.length} Snapshots</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={isLight ? 'bg-slate-50 text-slate-600 border-b border-slate-200' : 'bg-slate-950/60 text-slate-400 border-b border-slate-800/80'}>
              <tr>
                <th className="py-2.5 px-4 font-semibold">Snapshot ID</th>
                <th className="py-2.5 px-3 font-semibold">Target Resource</th>
                <th className="py-2.5 px-3 font-semibold">Type</th>
                <th className="py-2.5 px-3 font-semibold">Compressed Size</th>
                <th className="py-2.5 px-3 font-semibold">Created</th>
                <th className="py-2.5 px-3 font-semibold">Retention</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/40'}`}>
              {snapshots.map((s) => (
                <tr key={s.id} className={isLight ? 'hover:bg-slate-50 transition-colors' : 'hover:bg-slate-850/50 transition-colors'}>
                  <td className="py-3 px-4 font-mono font-bold text-cyan-600">{s.id}</td>
                  <td className={`py-3 px-3 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{s.resource}</td>
                  <td className="py-3 px-3 text-slate-500">{s.type}</td>
                  <td className={`py-3 px-3 font-mono font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{s.size}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{s.created}</td>
                  <td className="py-3 px-3 text-slate-400">{s.retention}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleRestore(s.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 border ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                        title="Restore Snapshot"
                      >
                        <RotateCcw className="w-3 h-3 text-cyan-500" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                        title="Delete Snapshot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
