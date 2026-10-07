import React, { useEffect, useState } from 'react';
import { Boxes, Plus, Play, Square, RotateCw, Terminal, Trash2, X, Server } from 'lucide-react';

interface ContainerRecord {
  id: string;
  name: string;
  base: string;
  cpuLimit: number;
  memoryMb: number;
  networkMode: string;
  status: 'Running' | 'Stopped' | 'Failed' | 'Creating';
  createdAt: string;
  updatedAt: string;
}

interface ContainersViewProps {
  themeMode?: 'dark' | 'light';
}

export const ContainersView: React.FC<ContainersViewProps> = ({ themeMode = 'dark' }) => {
  const isLight = themeMode === 'light';
  const [containers, setContainers] = useState<ContainerRecord[]>([]);
  const [options, setOptions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', base: 'debian-13', cpuLimit: 1, memoryMb: 1024 });
  const [terminalContainer, setTerminalContainer] = useState<ContainerRecord | null>(null);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<{ command: string; stdout: string; stderr: string; code: number }[]>([]);
  const [terminalBusy, setTerminalBusy] = useState(false);

  const fieldClass = isLight
    ? 'w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500'
    : 'w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500';

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 4000);
  };

  const readBody = async (response: Response) => {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body?.error || 'Nova request failed');
    return body;
  };

  const load = async () => {
    setLoading(true);
    try {
      const [listResponse, optionsResponse] = await Promise.all([
        fetch('/api/containers'),
        fetch('/api/containers/options'),
      ]);
      const list = await readBody(listResponse);
      const opts = await readBody(optionsResponse);
      setContainers(Array.isArray(list) ? list : []);
      setOptions(opts);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to load containers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createContainer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (working) return;
    setWorking(true);
    try {
      const response = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await readBody(response);
      setContainers((current) => [body, ...current.filter((item) => item.id !== body.id)]);
      setShowCreate(false);
      setForm({ name: '', base: 'debian-13', cpuLimit: 1, memoryMb: 1024 });
      notify(`Container "${body.name}" created with real systemd-nspawn runtime.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Container creation failed');
    } finally {
      setWorking(false);
    }
  };

  const action = async (container: ContainerRecord, actionName: string) => {
    if (working) return;
    setWorking(true);
    try {
      const response = await fetch(`/api/containers/${encodeURIComponent(container.id)}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionName }),
      });
      const body = await readBody(response);
      setContainers((current) => current.map((item) => item.id === container.id ? body : item));
      notify(`${container.name}: ${body.status}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Container action failed');
    } finally {
      setWorking(false);
    }
  };

  const remove = async (container: ContainerRecord) => {
    if (!window.confirm(`Delete container "${container.name}" and its root filesystem?`)) return;
    setWorking(true);
    try {
      const response = await fetch(`/api/containers/${encodeURIComponent(container.id)}`, { method: 'DELETE' });
      if (!response.ok) await readBody(response);
      setContainers((current) => current.filter((item) => item.id !== container.id));
      notify(`${container.name} deleted.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Container deletion failed');
    } finally {
      setWorking(false);
    }
  };

  const openTerminal = (container: ContainerRecord) => {
    if (container.status !== 'Running') {
      notify('Start the container before opening its terminal.');
      return;
    }
    setTerminalContainer(container);
    setTerminalHistory([]);
    setTerminalInput('');
  };

  const runTerminal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!terminalContainer || !terminalInput.trim() || terminalBusy) return;
    const command = terminalInput.trim();
    setTerminalInput('');
    setTerminalBusy(true);
    try {
      const response = await fetch(`/api/containers/${encodeURIComponent(terminalContainer.id)}/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || 'Container command failed');
      setTerminalHistory((current) => [...current, {
        command,
        stdout: String(body.stdout || ''),
        stderr: String(body.stderr || ''),
        code: Number(body.code || 0),
      }]);
    } catch (error) {
      setTerminalHistory((current) => [...current, {
        command,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Container command failed',
        code: 1,
      }]);
    } finally {
      setTerminalBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] px-4 py-3 rounded-lg border border-cyan-500/40 bg-slate-900 text-cyan-200 text-xs shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold">Containers</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Nova-native systemd-nspawn containers. Containers use a terminal console; virtual machines use noVNC.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={loading || !options?.available}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> Create Container
        </button>
      </div>

      {!options?.available && !loading && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
          The connected Nova host does not currently expose the systemd-nspawn container runtime. Re-run the current Nova Agent installer on the host.
        </div>
      )}

      <div className={`rounded-xl border overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
        <table className="w-full text-left text-xs">
          <thead className={isLight ? 'bg-slate-50' : 'bg-slate-950/50'}>
            <tr className="text-[11px] uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Container</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Base</th>
              <th className="px-3 py-3">CPU</th>
              <th className="px-3 py-3">Memory</th>
              <th className="px-3 py-3">Network</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={isLight ? 'divide-y divide-slate-200 text-slate-800' : 'divide-y divide-slate-800/60 text-slate-200'}>
            {containers.map((container) => (
              <tr key={container.id}>
                <td className="px-4 py-3">
                  <div className="font-semibold">{container.name}</div>
                  <div className="font-mono text-[10px] text-slate-500">{container.id}</div>
                </td>
                <td className="px-3 py-3">
                  <span className={container.status === 'Running' ? 'text-emerald-400' : container.status === 'Failed' ? 'text-red-400' : 'text-slate-400'}>
                    {container.status}
                  </span>
                </td>
                <td className="px-3 py-3 font-mono">{container.base}</td>
                <td className="px-3 py-3 font-mono">{container.cpuLimit} vCPU</td>
                <td className="px-3 py-3 font-mono">{container.memoryMb} MiB</td>
                <td className="px-3 py-3 font-mono">{container.networkMode}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => action(container, container.status === 'Running' ? 'stop' : 'start')} className="p-1.5 rounded hover:bg-slate-800" title={container.status === 'Running' ? 'Stop' : 'Start'}>
                      {container.status === 'Running' ? <Square className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                    <button onClick={() => action(container, 'restart')} disabled={container.status !== 'Running'} className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30" title="Restart">
                      <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                    <button onClick={() => openTerminal(container)} disabled={container.status !== 'Running'} className="px-2 py-1 rounded bg-slate-800 text-cyan-300 disabled:opacity-30">
                      <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5" /> Terminal</span>
                    </button>
                    <button
                      onClick={() => remove(container)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${isLight ? 'text-red-700 hover:bg-red-50 border border-red-200' : 'text-red-400 hover:bg-red-500/10 border border-red-500/20'}`}
                      title="Delete container and root filesystem"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!containers.length && !loading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No containers created yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className={`w-full max-w-xl rounded-xl border shadow-2xl ${isLight ? 'border-slate-300 bg-white text-slate-900' : 'border-slate-700 bg-slate-900 text-slate-100'}`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2"><Server className="w-4 h-4 text-cyan-400" /> Create Container</h3>
                <p className="text-[11px] text-slate-400 mt-1">Nova prepares a real isolated Linux root filesystem before reporting the container as running.</p>
              </div>
              <button onClick={() => !working && setShowCreate(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={createContainer} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Container Name</label>
                <input required value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
                  placeholder="e.g. api-service-01" className={fieldClass} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Base OS</label>
                <select value={form.base} onChange={(e) => setForm((v) => ({ ...v, base: e.target.value }))}
                  className={fieldClass}>
                  {(options?.bases || []).map((base: any) => <option key={base.id} value={base.id}>{base.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">CPU Limit</label>
                  <input type="number" min="1" max="64" value={form.cpuLimit}
                    onChange={(e) => setForm((v) => ({ ...v, cpuLimit: Number(e.target.value) }))}
                    className={fieldClass} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Memory (MiB)</label>
                  <input type="number" min="256" step="256" value={form.memoryMb}
                    onChange={(e) => setForm((v) => ({ ...v, memoryMb: Number(e.target.value) }))}
                    className={fieldClass} />
                </div>
              </div>
              <div className={`rounded-lg border p-3 text-[11px] ${isLight ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-slate-700 bg-slate-950/60 text-slate-400'}`}>
                Network: isolated private namespace. Console: terminal. Initial Debian rootfs creation can take a few minutes.
              </div>
              <div className={`flex justify-end gap-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <button type="button" onClick={() => setShowCreate(false)} disabled={working} className={`px-3 py-2 border rounded-lg ${isLight ? 'border-slate-300 text-slate-700 hover:bg-slate-50' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}>Cancel</button>
                <button type="submit" disabled={working} className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg disabled:opacity-50">
                  {working ? 'Creating root filesystem…' : 'Create & Start Container'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {terminalContainer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-4xl h-[70vh] rounded-xl border border-slate-700 bg-slate-950 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs"><Terminal className="w-4 h-4 text-cyan-400" /><span className="font-bold">{terminalContainer.name}</span><span className="text-slate-500">root terminal</span></div>
              <button onClick={() => setTerminalContainer(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-xs space-y-3">
              <div className="text-slate-500">Nova container terminal. Commands execute inside the container namespaces.</div>
              {terminalHistory.map((entry, index) => (
                <div key={index}>
                  <div className="text-emerald-400">root@{terminalContainer.name}:~# {entry.command}</div>
                  {entry.stdout && <pre className="whitespace-pre-wrap text-slate-200">{entry.stdout}</pre>}
                  {entry.stderr && <pre className="whitespace-pre-wrap text-red-400">{entry.stderr}</pre>}
                </div>
              ))}
            </div>
            <form onSubmit={runTerminal} className="border-t border-slate-800 p-3 flex items-center gap-2 font-mono text-xs">
              <span className="text-emerald-400">root@{terminalContainer.name}:~#</span>
              <input autoFocus value={terminalInput} onChange={(e) => setTerminalInput(e.target.value)} disabled={terminalBusy}
                className="flex-1 bg-transparent outline-none text-slate-100" placeholder={terminalBusy ? 'Running…' : 'Enter command'} />
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
