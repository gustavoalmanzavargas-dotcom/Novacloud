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
            CYVERAX NOVA SHELL
          </div>
          <div className="text-slate-400 text-xs">
            Authenticated administrator shell running as the Nova controller service account.
          </div>
          <div className="text-slate-400 text-xs">
            Standard non-interactive Linux commands are supported. Commands run with the same operating-system permissions as the Nova controller.
          </div>
        </div>
      ),
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandList, setCommandList] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [cwd, setCwd] = useState('/opt/novacloud');
  const [isRunning, setIsRunning] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, history]);

  if (!isOpen) return null;

  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed || isRunning) return;

    setCommandList((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    if (trimmed === 'clear') {
      setHistory([]);
      setInputVal('');
      return;
    }
    if (trimmed === 'exit') {
      onClose();
      return;
    }
    if (trimmed === 'help') {
      setHistory((prev) => [...prev, {
        command: trimmed,
        output: (
          <div className="text-xs space-y-1 text-slate-300 font-mono">
            <div className="text-cyan-300 font-bold">NOVA SHELL</div>
            <div>Run standard Linux commands such as <span className="text-cyan-400">ls</span>, <span className="text-cyan-400">pwd</span>, <span className="text-cyan-400">df -h</span>, <span className="text-cyan-400">ps</span>, <span className="text-cyan-400">cat</span>, and <span className="text-cyan-400">cd</span>.</div>
            <div>Commands execute on the Nova controller as the Nova service account, not as root.</div>
            <div><span className="text-cyan-400">clear</span> clears this terminal and <span className="text-cyan-400">exit</span> closes it.</div>
          </div>
        ),
      }]);
      setInputVal('');
      return;
    }

    setIsRunning(true);
    setInputVal('');
    try {
      const response = await fetch('/api/shell/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || 'Nova Shell command failed');
      if (body.cwd) setCwd(body.cwd);
      const stdout = String(body.stdout || '');
      const stderr = String(body.stderr || '');
      const outputNode = (
        <div className="text-xs font-mono whitespace-pre-wrap break-words">
          {stdout && <div className="text-slate-300">{stdout}</div>}
          {stderr && <div className={body.code === 0 ? 'text-amber-300' : 'text-red-400'}>{stderr}</div>}
          {!stdout && !stderr && body.code !== 0 && <div className="text-red-400">Command exited with code {body.code}.</div>}
        </div>
      );
      setHistory((prev) => [...prev, { command: trimmed, output: outputNode }]);
    } catch (error) {
      setHistory((prev) => [...prev, {
        command: trimmed,
        output: <div className="text-xs font-mono text-red-400">{error instanceof Error ? error.message : 'Nova Shell command failed'}</div>,
      }]);
    } finally {
      setIsRunning(false);
    }
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
            | Controller session
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
                <span className="text-emerald-400">nova@cloud$</span>
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
          nova@cloud:{cwd === '/opt/novacloud' ? '~' : cwd}$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning}
          placeholder={isRunning ? 'Command running…' : "Enter Linux command (e.g. 'ls', 'pwd', 'df -h', 'help')..."}
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
        />
        <span className="text-[10px] text-slate-400 uppercase font-mono">BASH 5.2</span>
      </div>
    </div>
  );
};
