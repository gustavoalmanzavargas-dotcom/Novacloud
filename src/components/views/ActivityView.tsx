import React, { useState } from 'react';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Download,
  User,
  Activity,
  X,
} from 'lucide-react';
import { ActivityEvent } from '../../types';

interface ActivityViewProps {
  activities?: ActivityEvent[];
  themeMode: 'dark' | 'light';
}

export const ActivityView: React.FC<ActivityViewProps> = ({ activities = [], themeMode }) => {
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isLight = themeMode === 'light';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const safeActivities = Array.isArray(activities) ? activities : [];

  const filtered = safeActivities.filter(
    (act) =>
      (act.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (act.user || '').toLowerCase().includes(search.toLowerCase()) ||
      (act.resource || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleExportAuditLog = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cyverax-audit-trail-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Exported ${filtered.length} SOC-2 compliance audit log event(s) to JSON.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl border text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 ${
            isLight
              ? 'bg-white border-emerald-300 text-emerald-900 shadow-emerald-500/10'
              : 'bg-slate-900 border-emerald-500/40 text-emerald-300 shadow-black/50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-500" />
            <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Activity & Audit Trail
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable SOC2/FedRAMP compliant audit log of every API action, deployment, and console operation.
          </p>
        </div>

        <button
          onClick={handleExportAuditLog}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log (JSON)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, user, or resource..."
            className={`w-full rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500 border ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                : 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
            }`}
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b text-[11px] font-mono uppercase ${
              isLight ? 'border-slate-200 text-slate-500 bg-slate-50' : 'border-slate-800 text-slate-400 bg-slate-950/60'
            }`}>
              <tr>
                <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold">User</th>
                <th className="py-2.5 px-3 font-semibold">Action</th>
                <th className="py-2.5 px-3 font-semibold">Target Resource</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Source IP</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono ${isLight ? 'divide-slate-200' : 'divide-slate-800/40'}`}>
              {filtered.map((act) => (
                <tr key={act.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50'}`}>
                  <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                    {act.timestamp}
                  </td>
                  <td className={`py-3 px-3 font-bold flex items-center gap-1.5 font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{act.user}</span>
                  </td>
                  <td className={`py-3 px-3 font-semibold font-sans ${isLight ? 'text-cyan-600' : 'text-cyan-300'}`}>{act.action}</td>
                  <td className={`py-3 px-3 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>{act.resource}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      {act.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">{act.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
