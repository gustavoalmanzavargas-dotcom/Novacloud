import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  X,
  Minus,
  Maximize2,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { VMInstance } from '../types';

interface NovaShellDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vms: VMInstance[];
  themeMode?: 'dark' | 'light';
}

interface CommandHistoryItem {
  command: string;
  output: React.ReactNode;
}

export const NovaShellDrawer: React.FC<NovaShellDrawerProps> = ({
  isOpen,
  onClose,
  vms,
  themeMode = 'dark',
}) => {
  const isLight = themeMode === 'light';
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      command: 'system-init',
      output: (
        <div className="text-slate-300 space-y-1">
          <div className="text-cyan-400 font-bold">
            CYVERAX NOVA CLOUD SHELL (v2026.4.1-atl)
          </div>
          <div className="text-slate-400 text-xs">
            Connected to tenant environment: org-9842 (Cyverax Enterprise) via secure ephemeral container.
          </div>
          <div className="text-slate-400 text-xs">
            Type <span className="text-cyan-300 font-mono">help</span> or{' '}
            <span className="text-cyan-300 font-mono">nova status</span> to view available CLI commands.
          </div>
        </div>
      ),
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandList, setCommandList] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, history]);

  if (!isOpen) return null;

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setCommandList((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const parts = trimmed.split(' ');
    const root = parts[0].toLowerCase();
    const arg = parts[1]?.toLowerCase();

    let outputNode: React.ReactNode = null;

    if (root === 'clear') {
      setHistory([]);
      setInputVal('');
      return;
    } else if (root === 'exit') {
      onClose();
      return;
    } else if (root === 'help') {
      outputNode = (
        <div className="text-xs space-y-1 text-slate-300 font-mono">
          <div className="text-cyan-300 font-bold mb-1">AVAILABLE NOVA CLI COMMANDS:</div>
          <div><span className="text-cyan-400 w-36 inline-block font-semibold">nova status</span> - Check infrastructure health summary</div>
          <div><span className="text-cyan-400 w-36 inline-block font-semibold">nova compute list</span> - List all provisioned VM instances</div>
          <div><span className="text-cyan-400 w-36 inline-block font-semibold">nova app status</span> - Check JobFinderAI and portal container state</div>
          <div><span className="text-cyan-400 w-36 inline-block font-semibold">nova vpc inspect</span> - Output active VPC routing and subnets</div>
          <div><span className="text-cyan-400 w-36 inline-block font-semibold">ping &lt;ip&gt;</span> - Send ICMP packets to internal IP</div>
          <div><span className="text-cyan-400 w-36 inline-block font-semibold">top / uptime</span> - Host telemetry and cluster load averages</div>
          <div><span className="text-cyan-400 w-36 inline-block font-semibold">whoami / uname -a</span> - Identity and kernel details</div>
          <div><span className="text-cyan-400 w-36 inline-block font-semibold">clear</span> - Clear terminal screen</div>
          <div><span className="text-cyan-400 w-36 inline-block font-semibold">exit</span> - Close Cloud Shell drawer</div>
        </div>
      );
    } else if (root === 'nova' && (arg === 'status' || !arg)) {
      outputNode = (
        <div className="text-xs space-y-1 text-slate-300 font-mono">
          <div className="text-emerald-400 font-bold">CYVERAX NOVA PLATFORM HEALTH: NORMAL (99.98% SLA)</div>
          <div>Region: US East — Atlanta (us-atl-1) | AZs: 3 Active</div>
          <div>Virtual Machines: 8 Total (7 Running, 1 Stopped)</div>
          <div>Containers: 12 Active Pods (JobFinderAI: 1 replica recovering)</div>
          <div>Databases: 3 Clustered (PostgreSQL, Redis, MongoDB)</div>
          <div>VPC: vpc-atl-prod-01 (10.15.0.0/16) - Gateways OK</div>
        </div>
      );
    } else if (root === 'nova' && (arg === 'compute' || arg === 'vms' || arg === 'instances')) {
      outputNode = (
        <div className="text-xs font-mono text-slate-300">
          <div className="text-slate-400 pb-1 border-b border-slate-800 flex justify-between font-bold">
            <span className="w-32">INSTANCE</span>
            <span className="w-24">STATUS</span>
            <span className="w-20">vCPU/RAM</span>
            <span className="w-28">PRIVATE IP</span>
            <span className="w-28">PUBLIC IP</span>
          </div>
          {vms.map((vm) => (
            <div key={vm.id} className="py-0.5 flex justify-between hover:bg-slate-900/50">
              <span className="w-32 text-cyan-300 font-semibold">{vm.name}</span>
              <span className={`w-24 ${vm.status === 'Running' ? 'text-emerald-400' : 'text-slate-500'}`}>
                {vm.status}
              </span>
              <span className="w-20 text-slate-400">{vm.vcpu}c / {vm.memoryGb}G</span>
              <span className="w-28 text-slate-300">{vm.privateIp}</span>
              <span className="w-28 text-slate-400 truncate">{vm.publicIp}</span>
            </div>
          ))}
        </div>
      );
    } else if (root === 'ping') {
      const target = parts[1] || '10.15.2.141';
      outputNode = (
        <div className="text-xs space-y-0.5 font-mono text-slate-300">
          <div>PING {target} ({target}) 56(84) bytes of data.</div>
          <div>64 bytes from {target}: icmp_seq=1 ttl=64 time=0.241 ms</div>
          <div>64 bytes from {target}: icmp_seq=2 ttl=64 time=0.218 ms</div>
          <div>64 bytes from {target}: icmp_seq=3 ttl=64 time=0.198 ms</div>
          <div className="text-emerald-400">--- {target} ping statistics: 3 packets transmitted, 0% packet loss, rtt avg 0.219 ms ---</div>
        </div>
      );
    } else if (root === 'uptime') {
      outputNode = (
        <div className="text-xs font-mono text-slate-300">
          17:38:12 up 26 days, 4:18, 1 user, load average: 0.82, 0.94, 1.05
        </div>
      );
    } else if (root === 'whoami') {
      outputNode = (
        <div className="text-xs font-mono text-cyan-300">
          gustavo.vargas (uid=1000 gid=1000 groups=org-admins,devops,wheel)
        </div>
      );
    } else if (root === 'uname' || root === 'uname -a') {
      outputNode = (
        <div className="text-xs font-mono text-slate-300">
          Linux nova-shell-ephemeral-89a 6.8.0-45-generic #45-Ubuntu SMP PREEMPT x86_64 GNU/Linux
        </div>
      );
    } else {
      outputNode = (
        <div className="text-xs font-mono text-red-400">
          nova: command not found: "{trimmed}". Type <span className="text-cyan-400">help</span> for command reference.
        </div>
      );
    }

    setHistory((prev) => [...prev, { command: trimmed, output: outputNode }]);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandList.length > 0) {
        const nextIndex = historyIndex === -1 ? commandList.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIndex);
        setInputVal(commandList[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIndex = historyIndex + 1;
        if (nextIndex >= commandList.length) {
          setHistoryIndex(-1);
          setInputVal('');
        } else {
          setHistoryIndex(nextIndex);
          setInputVal(commandList[nextIndex]);
        }
      }
    }
  };

  return (
    <div
      id="nova-shell-drawer"
      className={`fixed bottom-0 left-0 right-0 z-40 border-t-2 shadow-2xl transition-all duration-200 flex flex-col font-mono select-text ${
        isExpanded ? 'h-[75vh]' : 'h-[320px]'
      } ${
        isLight
          ? 'bg-slate-900 border-cyan-500 text-slate-100'
          : 'bg-slate-950 border-cyan-500/80 text-slate-200'
      }`}
    >
      {/* Title Bar */}
      <div
        className={`h-9 px-4 border-b flex items-center justify-between select-none ${
          isLight ? 'bg-slate-800 border-slate-700' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200 tracking-wide font-mono">
            &gt;_ NOVA SHELL
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            | Session: us-atl-1 (ephemeral-sh-89a)
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1 inline-block" />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="Copy buffer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title={isExpanded ? 'Restore height' : 'Maximize terminal'}
          >
            {isExpanded ? <Minus className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors ml-1 cursor-pointer"
            title="Close shell"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Screen & Logs Output */}
      <div
        className={`flex-1 p-3 overflow-y-auto text-xs space-y-3 font-mono ${
          isLight ? 'bg-slate-950/95 text-slate-200' : 'bg-slate-950 text-slate-200'
        }`}
      >
        {history.map((item, idx) => (
          <div key={idx} className="space-y-1">
            {item.command !== 'system-init' && (
              <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                <span className="text-emerald-400">nova@cloud:~$</span>
                <span>{item.command}</span>
              </div>
            )}
            <div>{item.output}</div>
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Active Command Input Line */}
      <div
        className={`px-3 py-2 border-t flex items-center gap-2 font-mono ${
          isLight
            ? 'bg-slate-900 border-slate-750'
            : 'bg-slate-900/90 border-slate-800/80'
        }`}
      >
        <span className="text-emerald-400 text-xs font-semibold whitespace-nowrap">
          nova@cloud:~$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command (e.g. 'nova status', 'nova compute list', 'help')..."
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
        />
        <span className="text-[10px] text-slate-400 uppercase font-mono">BASH 5.2</span>
      </div>
    </div>
  );
};
