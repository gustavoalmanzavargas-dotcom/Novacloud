import React, { useState } from 'react';
import {
  FileText,
  Search,
  Pause,
  Play,
  Trash2,
  Download,
  Filter,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
} from 'lucide-react';

interface LogsViewProps {
  themeMode?: 'dark' | 'light';
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  service: string;
  message: string;
}

export const LogsView: React.FC<LogsViewProps> = ({ themeMode = 'dark' }) => {
  const isLight = themeMode === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [isStreaming, setIsStreaming] = useState(true);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: '17:28:44.102', level: 'INFO', service: 'ingress-alb', message: 'HTTP 200 GET /api/v1/health - 1.2ms [198.51.100.24]' },
    { id: '2', timestamp: '17:28:42.855', level: 'WARN', service: 'worker-jobfinder', message: 'Queue latency exceeded 450ms; worker concurrency throttling active' },
    { id: '3', timestamp: '17:28:40.119', level: 'INFO', service: 'postgres-primary', message: 'checkpoint complete: wrote 428 buffers (2.6%); 0 WAL file(s) added' },
    { id: '4', timestamp: '17:28:38.004', level: 'ERROR', service: 'worker-jobfinder', message: 'Failed to dispatch webhook to endpoint https://partner.external/sync: timeout (5000ms)' },
    { id: '5', timestamp: '17:28:35.912', level: 'INFO', service: 'auth-service', message: 'Issued OAuth JWT token for subject usr-1 (scope: admin) [10.0.1.42]' },
    { id: '6', timestamp: '17:28:30.481', level: 'INFO', service: 'cyverax-agent', message: 'Telemetry packet synchronized with us-atl-1 coordinator' },
    { id: '7', timestamp: '17:28:28.140', level: 'WARN', service: 'redis-cache-cluster', message: 'Eviction rate increased: 142 keys evicted in last 60s under memory pressure' },
    { id: '8', timestamp: '17:28:22.771', level: 'INFO', service: 'ingress-alb', message: 'TLS handshake completed (TLS 1.3 / X25519) - client us-east-1' },
  ]);

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = levelFilter === 'ALL' || log.level === levelFilter;
    const matchesQuery =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.service.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesQuery;
  });

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleDownloadLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyverax-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
                LOGGING & AUDIT TRAIL
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-mono text-emerald-500 font-semibold">ALL CLUSTERS</span>
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Logs Explorer
            </h1>
            <p className={`text-sm mt-1 max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Centralized real-time stream aggregation across virtual machines, container pods, and platform services.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer border ${
                isStreaming
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isStreaming ? 'Stream Active' : 'Paused'}</span>
            </button>

            <button
              onClick={handleDownloadLogs}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
              title="Export filtered logs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={handleClearLogs}
              className={`p-2 rounded-lg transition-colors cursor-pointer border ${
                isLight
                  ? 'text-slate-500 hover:text-red-500 border-slate-200 hover:bg-slate-50'
                  : 'text-slate-400 hover:text-red-400 border-slate-800 hover:bg-slate-800'
              }`}
              title="Clear log console"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Level Filters */}
        <div className={`inline-flex p-1 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                levelFilter === lvl
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-slate-800 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter message or service name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 rounded-md text-xs border focus:outline-hidden ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
                : 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500'
            }`}
          />
        </div>
      </div>

      {/* Terminal-Style Log Console */}
      <div
        className={`rounded-xl border font-mono text-xs overflow-hidden ${
          isLight
            ? 'bg-slate-50 text-slate-800 border-slate-200 shadow-xs'
            : 'bg-slate-950 text-slate-200 border-slate-850'
        }`}
      >
        <div className={`px-4 py-2 border-b flex items-center justify-between text-[11px] ${
          isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-950/80 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className={`ml-2 font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>live-tail.us-atl-1.cyverax.log</span>
          </div>
          <span>{filteredLogs.length} events</span>
        </div>

        <div className="p-4 space-y-1.5 max-h-[520px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className={`py-8 text-center ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              No matching log events found. Adjust your search or level filters.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className={`flex items-start gap-2.5 p-1 rounded transition-colors ${
                isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/40'
              }`}>
                <span className={`shrink-0 select-none text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{log.timestamp}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                    log.level === 'ERROR'
                      ? isLight ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : log.level === 'WARN'
                      ? isLight ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : isLight ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {log.level}
                </span>
                <span className={`font-semibold shrink-0 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>[{log.service}]</span>
                <span className={`break-all leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
