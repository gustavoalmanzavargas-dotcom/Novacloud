import React, { useState } from 'react';
import {
  ArrowLeft,
  Cpu,
  Play,
  Square,
  RotateCw,
  Terminal,
  KeyRound,
  Camera,
  Trash2,
  HardDrive,
  Network,
  Shield,
  FileText,
  Settings,
  Activity,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Layers,
  Clock,
  Server,
  X,
} from 'lucide-react';
import { VMInstance } from '../../types';

interface VmDetailViewProps {
  vm: VMInstance;
  onBack: () => void;
  onToggleStatus: (id: string) => void;
  themeMode: 'dark' | 'light';
}

type TabKey =
  | 'overview'
  | 'monitoring'
  | 'networking'
  | 'storage'
  | 'snapshots'
  | 'console'
  | 'logs'
  | 'security'
  | 'configuration';

export const VmDetailView: React.FC<VmDetailViewProps> = ({
  vm,
  onBack,
  onToggleStatus,
  themeMode,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState(vm.snapshots);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleLines, setConsoleLines] = useState<string[]>([
    '[    0.000000] Linux version 6.8.0-45-generic (buildd@lcy02-amd64-071)',
    '[    0.000000] Command line: BOOT_IMAGE=/vmlinuz-6.8.0-45-generic root=UUID=7481-9821 ro console=ttyS0',
    '[    0.004210] KVM: nested virtualization enabled',
    '[    0.142010] pci 0000:00:04.0: [1af4:1000] virtio-net ethernet interface enp0s4',
    '[    0.412890] systemd[1]: Detected architecture x86-64.',
    '[    1.240182] systemd[1]: Reached target Network (Pre).',
    '[    2.109281] systemd[1]: Starting Cyverax Telemetry Daemon...',
    '[    2.341021] systemd[1]: Started Cyverax Telemetry Daemon (agent-v4.1).',
    'Ubuntu 24.04 LTS atl-prd-web01 ttyS0',
    'atl-prd-web01 login: ',
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [telemetryRange, setTelemetryRange] = useState('1h');
  const [attachedDisks, setAttachedDisks] = useState(vm.attachedDisks);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [newDiskName, setNewDiskName] = useState('vol-data-nvme-02');
  const [newDiskSize, setNewDiskSize] = useState('120');
  const [newDiskMount, setNewDiskMount] = useState('/mnt/data');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAttachDisk = (e: React.FormEvent) => {
    e.preventDefault();
    const disk = {
      name: newDiskName,
      sizeGb: parseInt(newDiskSize, 10) || 100,
      mount: newDiskMount,
      type: 'NVMe Block',
    };
    setAttachedDisks((prev) => [...prev, disk]);
    setIsAttachModalOpen(false);
    showToast(`Attached block volume ${newDiskName} (${newDiskSize} GB) to ${vm.name} at ${newDiskMount}.`);
  };

  const isLight = themeMode === 'light';

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateSnapshot = () => {
    if (!newSnapshotName) return;
    const newSnap = {
      id: `snap-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newSnapshotName,
      sizeGb: vm.storageGb,
      created: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    };
    setSnapshots([newSnap, ...snapshots]);
    setNewSnapshotName('');
    setIsCreatingSnapshot(false);
  };

  const handleConsoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleInput.trim()) return;
    setConsoleLines((prev) => [...prev, `$ ${consoleInput}`, `Command processed: ${consoleInput}`]);
    setConsoleInput('');
  };

  return (
    <div className="space-y-5 pb-12">
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
            ×
          </button>
        </div>
      )}

      {/* Top Breadcrumb & Return */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            isLight
              ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200'
              : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Compute</span>
        </button>
        <span className="text-slate-400 font-mono">/</span>
        <span className="text-xs text-slate-400 font-mono">{vm.id}</span>
      </div>

      {/* Resource Header Bar */}
      <div
        className={`p-5 rounded-xl border ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
              <Server className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {vm.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium ${
                    vm.status === 'Running'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : isLight
                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      vm.status === 'Running' ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  {vm.status}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                  isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-800 text-slate-300'
                }`}>
                  {vm.environment}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                <span>
                  Region: <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>{vm.region}</strong>
                </span>
                <span>•</span>
                <span>
                  Private IP:{' '}
                  <strong className={`font-mono ${isLight ? 'text-cyan-600' : 'text-cyan-300'}`}>{vm.privateIp}</strong>
                </span>
                <span>•</span>
                <span>
                  Uptime: <strong className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{vm.uptime}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons from Brief */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onToggleStatus(vm.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                vm.status === 'Running'
                  ? isLight
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-500/30'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isLight
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {vm.status === 'Running' ? (
                <>
                  <Square className="w-3.5 h-3.5" /> Stop
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Start
                </>
              )}
            </button>

            <button
              onClick={() => {
                showToast(`Instance ${vm.name} restart signal issued via ACPI/Nova API.`);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                isLight
                  ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
                  : 'text-slate-200 bg-slate-800 hover:bg-slate-700 border-slate-700'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Restart</span>
            </button>

            <button
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                isLight
                  ? 'text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border-cyan-200'
                  : 'text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Console</span>
            </button>

            <button
              onClick={() => {
                copyToClipboard(`ssh -i ~/.ssh/cyverax_id_ed25519 ubuntu@${vm.publicIp}`, 'ssh');
                showToast(`SSH connection string copied: ssh -i ~/.ssh/cyverax_id_ed25519 ubuntu@${vm.publicIp}`);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                isLight
                  ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
                  : 'text-slate-200 bg-slate-800 hover:bg-slate-700 border-slate-700'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>SSH</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('snapshots');
                setIsCreatingSnapshot(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                isLight
                  ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
                  : 'text-slate-200 bg-slate-800 hover:bg-slate-700 border-slate-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              <span>Snapshot</span>
            </button>

            <button
              onClick={() => {
                if (confirm(`Are you sure you want to terminate instance ${vm.name}?`)) {
                  onBack();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 rounded-md border border-red-500/30 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* 9 Standard Resource Tabs */}
      <div className={`border-b overflow-x-auto flex items-center gap-1 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        {(
          [
            { key: 'overview', label: 'Overview', icon: Server },
            { key: 'monitoring', label: 'Monitoring', icon: Activity },
            { key: 'networking', label: 'Networking', icon: Network },
            { key: 'storage', label: 'Storage', icon: HardDrive },
            { key: 'snapshots', label: 'Snapshots', icon: Camera },
            { key: 'console', label: 'Console', icon: Terminal },
            { key: 'logs', label: 'Logs', icon: FileText },
            { key: 'security', label: 'Security', icon: Shield },
            { key: 'configuration', label: 'Configuration', icon: Settings },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-cyan-500 text-cyan-500 font-semibold'
                  : isLight
                  ? 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Compute Specs */}
            <div
              className={`p-4 rounded-xl border ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <h3 className="text-xs font-bold text-slate-400 uppercase font-mono mb-3">
                Compute Specification
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Instance ID</span>
                  <span className={`font-mono font-semibold ${isLight ? 'text-cyan-600' : 'text-cyan-300'}`}>{vm.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hostname</span>
                  <span className={`font-mono truncate max-w-[180px] ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{vm.hostname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Operating System</span>
                  <span className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{vm.os}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">vCPU Allocation</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{vm.vcpu} vCPU (Dedicated AMD EPYC)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">System Memory</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{vm.memoryGb} GB DDR5 ECC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Boot Storage</span>
                  <span className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{vm.storageGb} GB NVMe Gen4</span>
                </div>
              </div>
            </div>

            {/* Network Placement */}
            <div
              className={`p-4 rounded-xl border ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <h3 className="text-xs font-bold text-slate-400 uppercase font-mono mb-3">
                Networking & VPC Placement
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Internal IPv4</span>
                  <span className={`font-mono font-semibold ${isLight ? 'text-cyan-600' : 'text-cyan-300'}`}>{vm.privateIp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Public IPv4 (Elastic)</span>
                  <span className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{vm.publicIp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Virtual Network (VPC)</span>
                  <span className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{vm.vpc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Subnet</span>
                  <span className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{vm.subnet}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Security Policy</span>
                  <span className="font-mono text-emerald-500">{vm.securityPolicy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Availability Zone</span>
                  <span className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>us-atl-1a</span>
                </div>
              </div>
            </div>

            {/* Metadata & Dates */}
            <div
              className={`p-4 rounded-xl border ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <h3 className="text-xs font-bold text-slate-400 uppercase font-mono mb-3">
                Lifecycle & Tags
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Created Date</span>
                  <span className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{vm.created}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hypervisor Node</span>
                  <span className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>atl-node-04-kvm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monitoring Agent</span>
                  <span className="text-emerald-500 font-mono font-medium">Cyverax Agent v4.1 (Healthy)</span>
                </div>

                <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className="text-slate-400 block mb-1.5">Resource Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(vm.tags).map(([k, v]) => (
                      <span
                        key={k}
                        className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                          isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {k}={v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div
            className={`p-4 rounded-xl border ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase font-mono mb-3">
              Real-time Utilization Gauges
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">CPU Usage</span>
                  <span className="font-mono font-bold text-cyan-500">{vm.cpuUsagePct}%</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
                  <div className="bg-cyan-500 h-full" style={{ width: `${vm.cpuUsagePct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Memory Usage</span>
                  <span className="font-mono font-bold text-indigo-500">{vm.memUsagePct}%</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
                  <div className="bg-indigo-500 h-full" style={{ width: `${vm.memUsagePct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Disk IOPS</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{vm.diskIops} IOPS</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">NVMe Direct Queue</div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Network Throughput</span>
                  <span className="font-mono font-bold text-emerald-500">
                    {vm.networkInMb}M in / {vm.networkOutMb}M out
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">10 Gbps Virtual NIC</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. MONITORING */}
      {activeTab === 'monitoring' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Live Instance Telemetry</h3>
            <div className={`flex items-center gap-1 border p-0.5 rounded-md text-xs font-mono ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              {['1h', '6h', '24h', '7d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTelemetryRange(range)}
                  className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                    range === telemetryRange
                      ? isLight
                        ? 'bg-white text-cyan-700 font-bold shadow-xs'
                        : 'bg-slate-800 text-cyan-400 font-bold'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CPU Chart Container */}
            <div className={`p-4 rounded-xl border ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>CPU Utilization (%)</span>
                <span className="text-xs font-mono text-cyan-500 font-bold">{vm.cpuUsagePct}% Current</span>
              </div>
              <div className={`h-36 flex items-end gap-1 pt-4 px-2 border-b border-l ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}>
                {[18, 22, 26, 24, 28, 32, 29, 25, 23, 27, 30, 24].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className="w-full bg-cyan-500/40 group-hover:bg-cyan-500 transition-colors rounded-t"
                      style={{ height: `${val * 2.5}px` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>-60m</span>
                <span>-30m</span>
                <span>Now</span>
              </div>
            </div>

            {/* Memory Chart Container */}
            <div className={`p-4 rounded-xl border ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Memory Utilization (%)</span>
                <span className="text-xs font-mono text-indigo-500 font-bold">{vm.memUsagePct}% Current</span>
              </div>
              <div className={`h-36 flex items-end gap-1 pt-4 px-2 border-b border-l ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}>
                {[55, 56, 57, 57, 58, 59, 58, 58, 58, 59, 58, 58].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className="w-full bg-indigo-500/40 group-hover:bg-indigo-500 transition-colors rounded-t"
                      style={{ height: `${val * 1.5}px` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>-60m</span>
                <span>-30m</span>
                <span>Now</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. NETWORKING */}
      {activeTab === 'networking' && (
        <div className={`p-5 rounded-xl border space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Network Interface Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b text-[11px] font-mono uppercase ${
                isLight ? 'border-slate-200 text-slate-500 bg-slate-50' : 'border-slate-800 text-slate-400'
              }`}>
                <tr>
                  <th className="py-2 px-3">Interface</th>
                  <th className="py-2 px-3">MAC Address</th>
                  <th className="py-2 px-3">Private IP</th>
                  <th className="py-2 px-3">Public IP</th>
                  <th className="py-2 px-3">Subnet</th>
                  <th className="py-2 px-3">Security Group</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono ${isLight ? 'divide-slate-200' : 'divide-slate-800/40'}`}>
                <tr>
                  <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`}>eth0 (virtio)</td>
                  <td className="py-2.5 px-3 text-slate-400">52:54:00:12:34:56</td>
                  <td className={`py-2.5 px-3 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{vm.privateIp}</td>
                  <td className={`py-2.5 px-3 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{vm.publicIp}</td>
                  <td className="py-2.5 px-3 text-slate-400">{vm.subnet}</td>
                  <td className={`py-2.5 px-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{vm.securityPolicy}</td>
                  <td className="py-2.5 px-3 text-emerald-500 font-semibold">Attached</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. STORAGE */}
      {activeTab === 'storage' && (
        <div className={`p-5 rounded-xl border space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Attached Block Storage Disks</h3>
            <button
              onClick={() => setIsAttachModalOpen(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded border cursor-pointer transition-colors ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              Attach Volume
            </button>
          </div>

          <div className="space-y-2">
            {attachedDisks.map((disk, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <HardDrive className="w-4 h-4 text-cyan-500" />
                  <div>
                    <div className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{disk.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">Mount: {disk.mount}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 font-mono text-xs">
                  <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{disk.sizeGb} GB</span>
                  <span className="text-slate-400">{disk.type}</span>
                  <span className="text-emerald-500 font-semibold">Mounted</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. SNAPSHOTS */}
      {activeTab === 'snapshots' && (
        <div className={`p-5 rounded-xl border space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Point-in-Time Snapshots</h3>
              <p className="text-xs text-slate-400">Zero-downtime block-level snapshot restore points.</p>
            </div>
            <button
              onClick={() => setIsCreatingSnapshot(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Take Snapshot</span>
            </button>
          </div>

          {isCreatingSnapshot && (
            <div className={`p-3 rounded-lg border flex items-center gap-2 ${
              isLight ? 'bg-cyan-50/70 border-cyan-200' : 'bg-cyan-500/10 border-cyan-500/30'
            }`}>
              <input
                type="text"
                value={newSnapshotName}
                onChange={(e) => setNewSnapshotName(e.target.value)}
                placeholder="Snapshot Name (e.g. 'pre-migration-snap-01')..."
                className={`flex-1 rounded px-3 py-1 text-xs border ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
              <button
                onClick={handleCreateSnapshot}
                className="px-3 py-1 bg-cyan-500 text-slate-950 font-bold text-xs rounded cursor-pointer"
              >
                Create
              </button>
              <button
                onClick={() => setIsCreatingSnapshot(false)}
                className={`px-3 py-1 text-xs rounded cursor-pointer ${
                  isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Cancel
              </button>
            </div>
          )}

          <div className="space-y-2">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div>
                  <div className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{snap.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">ID: {snap.id} • {snap.created}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{snap.sizeGb} GB</span>
                  <button
                    onClick={() => showToast(`Restoring instance ${vm.name} to snapshot ${snap.name}. Storage rolled back successfully.`)}
                    className="text-cyan-500 hover:underline font-semibold cursor-pointer"
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. CONSOLE */}
      {activeTab === 'console' && (
        <div className={`p-4 rounded-xl border font-mono text-xs ${
          isLight ? 'bg-slate-900 text-slate-200 border-slate-700 shadow-xs' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="pb-2 border-b border-slate-800 flex items-center justify-between text-slate-400">
            <span>Direct Serial Console (ttyS0) - {vm.hostname}</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Connected 115200 8N1
            </span>
          </div>
          <div className="h-64 overflow-y-auto py-2 space-y-1 text-slate-300">
            {consoleLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
          <form onSubmit={handleConsoleSubmit} className="pt-2 border-t border-slate-800 flex items-center gap-2">
            <span className="text-cyan-400 font-bold">&gt;</span>
            <input
              type="text"
              value={consoleInput}
              onChange={(e) => setConsoleInput(e.target.value)}
              placeholder="Type command to send to serial ttyS0..."
              className="flex-1 bg-transparent text-white focus:outline-none"
            />
          </form>
        </div>
      )}

      {/* TAB CONTENT: 7. LOGS */}
      {activeTab === 'logs' && (
        <div className={`p-4 rounded-xl border space-y-2 text-xs font-mono ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className={`text-slate-400 pb-2 border-b flex justify-between ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <span>Syslog Stream (journalctl -u cyverax-agent -f)</span>
            <span className="text-slate-400">Live</span>
          </div>
          <div className="space-y-1">
            <div className="text-slate-400">[17:34:12] kernel: [12948.12] audit: type=1400 apparmor="STATUS" operation="profile_load"</div>
            <div className="text-emerald-500">[17:34:15] cyverax-agent[1042]: Metric push succeeded: 42 data points ingested in 12ms.</div>
            <div className={isLight ? 'text-slate-700' : 'text-slate-300'}>[17:34:20] sshd[4921]: Accepted publickey for ubuntu from 54.210.88.5 port 51204 ssh2</div>
            <div className="text-slate-400">[17:34:45] systemd[1]: Started Daily apt download activities.</div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. SECURITY */}
      {activeTab === 'security' && (
        <div className={`p-5 rounded-xl border space-y-4 text-xs ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Security Group Rules for {vm.securityPolicy}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono">
              <thead className={`border-b text-[11px] uppercase ${
                isLight ? 'border-slate-200 text-slate-500 bg-slate-50' : 'border-slate-800 text-slate-400'
              }`}>
                <tr>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Protocol</th>
                  <th className="py-2 px-3">Port Range</th>
                  <th className="py-2 px-3">Source CIDR</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/40'}`}>
                <tr>
                  <td className="py-2 px-3 text-emerald-500">Ingress</td>
                  <td className="py-2 px-3">TCP</td>
                  <td className="py-2 px-3">443</td>
                  <td className="py-2 px-3">0.0.0.0/0</td>
                  <td className={`py-2 px-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>HTTPS Web Traffic</td>
                  <td className="py-2 px-3 text-emerald-500">ALLOW</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-emerald-500">Ingress</td>
                  <td className="py-2 px-3">TCP</td>
                  <td className="py-2 px-3">22</td>
                  <td className="py-2 px-3">10.15.1.10/32</td>
                  <td className={`py-2 px-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Bastion SSH Ingress Only</td>
                  <td className="py-2 px-3 text-emerald-500">ALLOW</td>
                </tr>
                <tr>
                  <td className={`py-2 px-3 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`}>Egress</td>
                  <td className="py-2 px-3">ALL</td>
                  <td className="py-2 px-3">ALL</td>
                  <td className="py-2 px-3">0.0.0.0/0</td>
                  <td className={`py-2 px-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Outbound NAT Gateway</td>
                  <td className="py-2 px-3 text-emerald-500">ALLOW</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 9. CONFIGURATION */}
      {activeTab === 'configuration' && (
        <div className={`p-5 rounded-xl border space-y-4 text-xs ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Machine Configuration & User Data</h3>
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 block mb-1">Cloud-Init Bootstrap Script</label>
              <pre className={`p-3 border rounded font-mono text-[11px] ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-cyan-300'
              }`}>
{`#cloud-config
package_upgrade: true
packages:
  - curl
  - htop
  - cyverax-telemetry-agent
runcmd:
  - systemctl enable --now cyverax-agent`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Attach Volume Modal */}
      {isAttachModalOpen && (
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
                <HardDrive className="w-4 h-4 text-cyan-500" />
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Attach Block Storage Disk
                </h3>
              </div>
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAttachDisk} className="p-5 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Volume Name
                </label>
                <input
                  type="text"
                  required
                  value={newDiskName}
                  onChange={(e) => setNewDiskName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none font-mono ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                      : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Size (GB)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="4000"
                    required
                    value={newDiskSize}
                    onChange={(e) => setNewDiskSize(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-none font-mono ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                        : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Mount Path
                  </label>
                  <input
                    type="text"
                    required
                    value={newDiskMount}
                    onChange={(e) => setNewDiskMount(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-none font-mono ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                        : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAttachModalOpen(false)}
                  className={`px-3 py-1.5 text-xs rounded-lg border cursor-pointer ${
                    isLight ? 'border-slate-200 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Attach Disk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
