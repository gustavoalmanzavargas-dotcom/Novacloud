import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Cpu,
  Network,
  CreditCard,
  AppWindow,
  Bell,
  Sparkles,
  Database,
  HardDrive,
  Shield,
  Users,
  FileText,
  Terminal,
  ArrowRight,
  PlusCircle,
  Activity,
  Layers,
  Key,
} from 'lucide-react';
import { ActiveView, VMInstance } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ActiveView) => void;
  onOpenCreateResource?: () => void;
  onOpenTerminal?: () => void;
  vms?: VMInstance[];
  onSelectVM?: (vm: VMInstance) => void;
  themeMode?: 'dark' | 'light';
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Actions' | 'Navigation' | 'Resources' | 'Tools';
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  description?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenCreateResource,
  onOpenTerminal,
  vms = [],
  onSelectVM,
  themeMode = 'dark',
}) => {
  const isLight = themeMode === 'light';
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    {
      id: 'cmd-create-vm',
      title: 'Create Virtual Machine',
      category: 'Actions',
      icon: PlusCircle,
      description: 'Deploy a new high-performance cloud compute instance',
      action: () => {
        onNavigate('compute');
        onClose();
      },
    },
    {
      id: 'cmd-deploy-app',
      title: 'Deploy Application (JobFinderAI / Web)',
      category: 'Actions',
      icon: AppWindow,
      description: 'Launch guided 6-step container/repo deployment workflow',
      action: () => {
        onNavigate('applications');
        onClose();
      },
    },
    {
      id: 'cmd-run-nova-ai',
      title: 'Run Nova AI Assistant',
      category: 'Tools',
      icon: Sparkles,
      shortcut: 'AI',
      description: 'Ask Nova AI to formulate execution plans or diagnose cluster health',
      action: () => {
        onNavigate('ai');
        onClose();
      },
    },
    {
      id: 'cmd-open-terminal',
      title: 'Open Nova Shell Terminal (>_)',
      category: 'Tools',
      icon: Terminal,
      shortcut: '~',
      description: 'Spawn interactive cloud shell terminal drawer',
      action: () => {
        onOpenTerminal?.();
        onClose();
      },
    },
    {
      id: 'cmd-nav-compute',
      title: 'Go to Compute',
      category: 'Navigation',
      icon: Cpu,
      description: 'Manage 8 instances, images, snapshots, and SSH keys',
      action: () => {
        onNavigate('compute');
        onClose();
      },
    },
    {
      id: 'cmd-nav-networking',
      title: 'Go to Networking & Topology',
      category: 'Navigation',
      icon: Network,
      description: 'Inspect VPC topology, subnets, load balancers, and firewalls',
      action: () => {
        onNavigate('networking');
        onClose();
      },
    },
    {
      id: 'cmd-nav-security',
      title: 'Go to Security Center',
      category: 'Navigation',
      icon: Shield,
      description: 'View Security Score (92), findings, and 1-click remediations',
      action: () => {
        onNavigate('security');
        onClose();
      },
    },
    {
      id: 'cmd-nav-databases',
      title: 'Go to Databases',
      category: 'Navigation',
      icon: Database,
      description: 'PostgreSQL, Redis, MongoDB, and SQL Server instances',
      action: () => {
        onNavigate('databases');
        onClose();
      },
    },
    {
      id: 'cmd-nav-storage',
      title: 'Go to Storage',
      category: 'Navigation',
      icon: HardDrive,
      description: 'Object buckets, NVMe block storage, NFS shares',
      action: () => {
        onNavigate('storage');
        onClose();
      },
    },
    {
      id: 'cmd-nav-billing',
      title: 'Open Billing & Cost Management',
      category: 'Navigation',
      icon: CreditCard,
      description: 'Current month ($1,842), forecasts, invoices, budgets',
      action: () => {
        onNavigate('billing');
        onClose();
      },
    },
    {
      id: 'cmd-nav-monitoring',
      title: 'View Monitoring & Metrics',
      category: 'Navigation',
      icon: Activity,
      description: 'CPU, memory, IOPS, and network throughput charts',
      action: () => {
        onNavigate('monitoring');
        onClose();
      },
    },
    {
      id: 'cmd-nav-logs',
      title: 'Search Logs Explorer',
      category: 'Navigation',
      icon: FileText,
      description: 'Query centralized syslog, application logs, and audit trails',
      action: () => {
        onNavigate('logs');
        onClose();
      },
    },
    {
      id: 'cmd-create-resource-modal',
      title: 'Open Resource Launcher (+)',
      category: 'Actions',
      icon: Layers,
      description: 'Global resource catalog launcher',
      action: () => {
        if (onOpenCreateResource) {
          onOpenCreateResource();
        } else {
          onNavigate('compute');
        }
        onClose();
      },
    },
    ...vms.map((vm) => ({
      id: `cmd-vm-${vm.id}`,
      title: `${vm.name}${vm.privateIp ? ` (${vm.privateIp})` : ''}`,
      category: 'Resources' as const,
      icon: Cpu,
      description: `${vm.vcpu} vCPU / ${vm.memoryGb} GB • Status: ${vm.status} • Region: ${vm.region}`,
      action: () => {
        if (onSelectVM) {
          onSelectVM(vm);
        } else {
          onNavigate('compute');
        }
        onClose();
      },
    })),
  ];

  const filtered = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.description && cmd.description.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        id="command-palette-modal"
        className={`relative w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 border ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-2xl'
            : 'bg-slate-900 border-slate-700/80 text-white shadow-2xl'
        }`}
      >
        {/* Search Input Bar */}
        <div
          className={`flex items-center px-4 py-3.5 border-b ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/60'
          }`}
        >
          <Search className="w-5 h-5 text-cyan-500 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, resource name, or service (e.g. 'Deploy', 'VM', 'Nova AI', 'Billing')..."
            className={`w-full bg-transparent text-sm focus:outline-hidden ${
              isLight ? 'text-slate-900 placeholder-slate-400' : 'text-slate-100 placeholder-slate-500'
            }`}
          />
          <kbd
            className={`px-2 py-0.5 text-[10px] font-mono rounded ml-2 border ${
              isLight
                ? 'text-slate-600 bg-slate-200 border-slate-300'
                : 'text-slate-400 bg-slate-800 border-slate-700'
            }`}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          className={`max-h-[380px] overflow-y-auto p-2 divide-y ${
            isLight ? 'divide-slate-100' : 'divide-slate-800/40'
          }`}
        >
          {filtered.length === 0 ? (
            <div className={`p-8 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              No matching commands or resources found for "{query}"
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? isLight
                        ? 'bg-cyan-50 text-cyan-900 border border-cyan-300 shadow-xs'
                        : 'bg-cyan-500/15 text-white border border-cyan-500/30'
                      : isLight
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded ${
                        isSelected
                          ? isLight
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-cyan-500/30 text-cyan-300'
                          : isLight
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold flex items-center gap-2">
                        <span className={isLight ? 'text-slate-900' : 'text-white'}>{item.title}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase ${
                            isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      {item.description && (
                        <div
                          className={`text-[11px] truncate max-w-md ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.shortcut && (
                      <kbd
                        className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${
                          isLight
                            ? 'bg-slate-100 text-slate-600 border-slate-300'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                    <ArrowRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? 'text-cyan-500 translate-x-0.5' : isLight ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-4 py-2 border-t flex items-center justify-between text-[11px] font-mono ${
            isLight
              ? 'border-slate-200 bg-slate-50 text-slate-600'
              : 'border-slate-800/80 bg-slate-950/80 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <span>
              <kbd className={`px-1 py-0.2 border rounded text-[10px] ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-800 border-slate-700'}`}>↑</kbd>
              <kbd className={`px-1 py-0.2 border rounded text-[10px] ml-0.5 ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-800 border-slate-700'}`}>↓</kbd> navigate
            </span>
            <span>
              <kbd className={`px-1.5 py-0.2 border rounded text-[10px] ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-800 border-slate-700'}`}>ENTER</kbd> select
            </span>
          </div>
          <span className={`font-semibold ${isLight ? 'text-cyan-700' : 'text-cyan-400/80'}`}>CYVERAX NOVA PLATFORM</span>
        </div>
      </div>
    </div>
  );
};
