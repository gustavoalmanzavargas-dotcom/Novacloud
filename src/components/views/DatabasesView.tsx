import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  RotateCw,
  HardDrive,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Play,
  Archive,
  X,
  Layers,
  Clock,
  Key,
} from 'lucide-react';
import { DatabaseItem } from '../../types';

interface DatabasesViewProps {
  databases: DatabaseItem[];
  themeMode: 'dark' | 'light';
  activeSubTab?: string;
  onTabChange?: (tab: string) => void;
}

type DbSubTab = 'clusters' | 'query-console' | 'backups';

export const DatabasesView: React.FC<DatabasesViewProps> = ({
  databases: initialDatabases,
  themeMode,
  activeSubTab,
  onTabChange,
}) => {
  const [currentTab, setCurrentTab] = useState<DbSubTab>(
    (activeSubTab as DbSubTab) || 'clusters'
  );
  const [databases, setDatabases] = useState<DatabaseItem[]>(initialDatabases);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedConsoleDb, setSelectedConsoleDb] = useState<DatabaseItem | null>(initialDatabases[0] || null);
  const [selectedBackupsDb, setSelectedBackupsDb] = useState<DatabaseItem | null>(initialDatabases[0] || null);
  const [isCreateDbOpen, setIsCreateDbOpen] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [newDbEngine, setNewDbEngine] = useState('PostgreSQL 16');
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any[]>([]);
  const [queryFields, setQueryFields] = useState<string[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isLight = themeMode === 'light';

  useEffect(() => {
    if (activeSubTab && ['clusters', 'query-console', 'backups'].includes(activeSubTab)) {
      setCurrentTab(activeSubTab as DbSubTab);
    }
  }, [activeSubTab]);

  const loadDatabases = async () => {
    try {
      const response = await fetch('/api/databases');
      const body = await response.json().catch(() => ([]));
      if (!response.ok) throw new Error(body?.error || 'Unable to load databases');
      const list = Array.isArray(body) ? body : [];
      setDatabases(list);
      if (!selectedConsoleDb && list[0]) setSelectedConsoleDb(list[0]);
      if (!selectedBackupsDb && list[0]) setSelectedBackupsDb(list[0]);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load databases');
    }
  };

  const loadSnapshots = async (databaseId?: string) => {
    if (!databaseId) {
      setSnapshots([]);
      return;
    }
    try {
      const response = await fetch(`/api/databases/${encodeURIComponent(databaseId)}/snapshots`);
      const body = await response.json().catch(() => ([]));
      if (!response.ok) throw new Error(body?.error || 'Unable to load snapshots');
      setSnapshots(Array.isArray(body) ? body : []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load snapshots');
    }
  };

  useEffect(() => { loadDatabases(); }, []);
  useEffect(() => { loadSnapshots(selectedBackupsDb?.id); }, [selectedBackupsDb?.id]);

  const handleTabSelect = (tab: DbSubTab) => {
    setCurrentTab(tab);
    onTabChange?.(tab);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyEndpoint = (endpoint: string, id: string) => {
    navigator.clipboard?.writeText(endpoint);
    setCopiedId(id);
    showToast(`Copied connection endpoint: ${endpoint}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDbName.trim(), engine: newDbEngine }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || 'Database provisioning failed');
      setDatabases((current) => [body, ...current]);
      setSelectedConsoleDb(body);
      setSelectedBackupsDb(body);
      setIsCreateDbOpen(false);
      setNewDbName('');
      showToast(`Database "${body.name}" created.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Database provisioning failed');
    }
  };

  const handleExecuteSql = async () => {
    if (!selectedConsoleDb || !sqlQuery.trim() || isExecutingSql) return;
    setIsExecutingSql(true);
    try {
      const response = await fetch(`/api/databases/${encodeURIComponent(selectedConsoleDb?.id || '')}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || 'SQL execution failed');
      setQueryResult(Array.isArray(body.rows) ? body.rows : []);
      setQueryFields(Array.isArray(body.fields) ? body.fields : []);
      showToast(`${body.rowCount ?? 0} row(s) returned.`);
    } catch (error) {
      setQueryResult([]);
      setQueryFields([]);
      showToast(error instanceof Error ? error.message : 'SQL execution failed');
    } finally {
      setIsExecutingSql(false);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!selectedBackupsDb) return;
    try {
      const response = await fetch(`/api/databases/${encodeURIComponent(selectedBackupsDb?.id || '')}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || 'Database snapshot failed');
      setSnapshots((current) => [body, ...current]);
      showToast(`Snapshot "${body.name}" created.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Database snapshot failed');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
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
            <Database className="w-5 h-5 text-cyan-500" />
            <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Databases & In-Memory Stores
            </h1>
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Nova-managed PostgreSQL logical databases with real SQL execution and manual pg_dump snapshots.
          </p>
        </div>

        <button
          onClick={() => setIsCreateDbOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg shadow cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Database Cluster</span>
        </button>
      </div>

      {/* Database Submenu Tab Bar */}
      <div
        className={`flex items-center gap-1 border-b pb-px overflow-x-auto ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}
      >
        <button
          id="tab-db-clusters"
          onClick={() => handleTabSelect('clusters')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            currentTab === 'clusters'
              ? isLight
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Managed Clusters</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              currentTab === 'clusters'
                ? isLight
                  ? 'bg-cyan-200 text-cyan-900'
                  : 'bg-cyan-500/30 text-cyan-200'
                : isLight
                ? 'bg-slate-200 text-slate-700'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {databases.length}
          </span>
        </button>

        <button
          id="tab-db-console"
          onClick={() => handleTabSelect('query-console')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            currentTab === 'query-console'
              ? isLight
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>SQL Query Console</span>
        </button>

        <button
          id="tab-db-backups"
          onClick={() => handleTabSelect('backups')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            currentTab === 'backups'
              ? isLight
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Automated Backups & PITR</span>
        </button>
      </div>

      {/* TAB 1: CLUSTERS */}
      {currentTab === 'clusters' && (
        <div className="space-y-6">
          {/* Database Cluster Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {databases.map((db) => (
              <div
                key={db.id}
                className={`p-5 rounded-xl border flex flex-col justify-between transition-colors shadow-xs ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded bg-cyan-500/10 text-cyan-500">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {db.name}
                        </h3>
                        <div className="text-[11px] font-mono text-cyan-600 font-medium">{db.engine}</div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {db.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div
                      className={`flex justify-between py-1 border-b ${
                        isLight ? 'border-slate-100' : 'border-slate-800/60'
                      }`}
                    >
                      <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Connection Endpoint</span>
                      <div className="flex items-center gap-1">
                        <span className={`font-mono truncate max-w-[140px] ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {db.endpoint}
                        </span>
                        <button
                          onClick={() => copyEndpoint(db.endpoint, db.id)}
                          className={`cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
                          title="Copy endpoint"
                        >
                          {copiedId === db.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div
                      className={`flex justify-between py-1 border-b ${
                        isLight ? 'border-slate-100' : 'border-slate-800/60'
                      }`}
                    >
                      <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Active Connections</span>
                      <span className={`font-mono font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {db.connections}
                      </span>
                    </div>

                    <div
                      className={`flex justify-between py-1 border-b ${
                        isLight ? 'border-slate-100' : 'border-slate-800/60'
                      }`}
                    >
                      <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Multi-AZ Replicas</span>
                      <span className="text-cyan-600 font-mono font-semibold">
                        {db.replicas} Read-Replicas
                      </span>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Storage Utilization</span>
                        <span className="font-mono text-cyan-600 font-medium">
                          {db.storageUsedGb} GB of {db.storageTotalGb} GB
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${(db.storageUsedGb / db.storageTotalGb) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/40 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedConsoleDb(db);
                      handleTabSelect('query-console');
                    }}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>SQL Console</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedBackupsDb(db);
                      handleTabSelect('backups');
                    }}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Backups</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SQL QUERY CONSOLE */}
      {currentTab === 'query-console' && (
        <div
          className={`p-5 rounded-xl border space-y-4 ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Interactive Query Console
                </h3>
                <p className="text-[11px] text-slate-400">
                  Execute direct queries via pg_read_pool with sub-5ms internal VPC latency.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-semibold">Target Database:</label>
              <select
                value={selectedConsoleDb?.id || ''}
                onChange={(e) => {
                  const found = databases.find((d) => d.id === e.target.value);
                  if (found) setSelectedConsoleDb(found);
                }}
                className="px-2.5 py-1 text-xs rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono focus:outline-none"
              >
                {databases.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.engine})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">SQL Statement</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSqlQuery('SELECT id, username, email, role, created_at FROM tenant_users LIMIT 5;')}
                  className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                >
                  Load Users Query
                </button>
                <span className="text-slate-600">·</span>
                <button
                  onClick={() => setSqlQuery('SELECT schemaname, relname, n_live_tup FROM pg_stat_user_tables;')}
                  className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                >
                  Load Table Stats
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="w-full p-3 font-mono text-xs rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 focus:outline-none focus:border-cyan-500"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Connected: {selectedConsoleDb?.endpoint || 'No database selected'}
              </span>
              <button
                disabled={isExecutingSql}
                onClick={handleExecuteSql}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg shadow transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isExecutingSql ? 'Executing...' : 'Run Query'}</span>
              </button>
            </div>

            {queryResult && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-200">
                  Result Set
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b border-slate-800 text-[11px] text-slate-400 uppercase bg-slate-900">
                      <tr>
                        {queryFields.map((field) => <th key={field} className="py-2.5 px-3">{field}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {queryResult.map((row, index) => (
                        <tr key={index} className="hover:bg-slate-900/50">
                          {queryFields.map((field) => (
                            <td key={field} className="py-2.5 px-3 text-slate-300">{String(row?.[field] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BACKUPS & PITR */}
      {currentTab === 'backups' && (
        <div
          className={`p-5 rounded-xl border space-y-4 ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Database Snapshots
                </h3>
                <p className="text-[11px] text-slate-400">
                  Manual PostgreSQL schema snapshots stored by Nova on the controller.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedBackupsDb?.id || ''}
                onChange={(e) => {
                  const found = databases.find((d) => d.id === e.target.value);
                  if (found) setSelectedBackupsDb(found);
                }}
                className="px-2.5 py-1 text-xs rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono focus:outline-none"
              >
                {databases.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.engine})
                  </option>
                ))}
              </select>

              <button
                onClick={handleCreateSnapshot}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Take Snapshot Now
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {snapshots.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-between text-xs font-mono"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200">{s.id}</div>
                  <div className="text-[11px] text-slate-400">{s.createdAt ? new Date(s.createdAt).toLocaleString() : 'Unknown time'}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-cyan-400 font-bold">{((Number(s.sizeBytes || 0) / 1024 / 1024).toFixed(1))} MB</div>
                    <span className="text-[10px] text-emerald-400">{s.status}</span>
                  </div>
                  <button
                    onClick={() => showToast('Database snapshot restore is not enabled yet; Nova will not claim a restore occurred.')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[11px] cursor-pointer"
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Database Cluster Modal */}
      {isCreateDbOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div
              className={`px-5 py-3.5 border-b flex items-center justify-between ${
                isLight ? 'border-slate-100 bg-slate-50' : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-500" />
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Create New Managed Database
                </h3>
              </div>
              <button
                onClick={() => setIsCreateDbOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCluster} className="p-5 space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Cluster Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. users-auth-db"
                  value={newDbName}
                  onChange={(e) => setNewDbName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none font-mono ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-400'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Database Engine
                </label>
                <select
                  value={newDbEngine}
                  onChange={(e) => setNewDbEngine(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-400'
                  }`}
                >
                  <option value="PostgreSQL 16">PostgreSQL (Nova managed)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateDbOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Provision Cluster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
