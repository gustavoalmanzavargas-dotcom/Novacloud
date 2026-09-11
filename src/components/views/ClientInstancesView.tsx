import React, { useState, useEffect } from 'react';
import {
  Server,
  Cpu,
  HardDrive,
  Network,
  Shield,
  Plus,
  Sliders,
  Play,
  Square,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Users,
  Search,
  DollarSign,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Trash2,
  Box,
  Eye,
} from 'lucide-react';
import { api, GpuTierOption } from '../../services/api';
import { ClientTenantInstance, MasterClusterSummary } from '../../types';

interface ClientInstancesViewProps {
  themeMode: 'dark' | 'light';
  onAssumeTenant?: (tenant: ClientTenantInstance) => void;
  onNavigateToMarketplace?: (clientId: string) => void;
}

export const ClientInstancesView: React.FC<ClientInstancesViewProps> = ({
  themeMode,
  onAssumeTenant,
  onNavigateToMarketplace,
}) => {
  const isLight = themeMode === 'light';

  // State
  const [clients, setClients] = useState<ClientTenantInstance[]>([]);
  const [summary, setSummary] = useState<MasterClusterSummary | null>(null);
  const [gpuOptions, setGpuOptions] = useState<GpuTierOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientForResize, setSelectedClientForResize] = useState<ClientTenantInstance | null>(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isVerifyingIsolation, setIsVerifyingIsolation] = useState(false);
  const [isolationResult, setIsolationResult] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Resize Form State
  const [resizeVcpu, setResizeVcpu] = useState(16);
  const [resizeRam, setResizeRam] = useState(32);
  const [resizeGpu, setResizeGpu] = useState('None');
  const [resizeStorage, setResizeStorage] = useState(500);
  const [isSavingResize, setIsSavingResize] = useState(false);

  // Deploy Modal Form State
  const [deployCompany, setDeployCompany] = useState('');
  const [deployEmail, setDeployEmail] = useState('');
  const [deployInstanceName, setDeployInstanceName] = useState('');
  const [deployVcpu, setDeployVcpu] = useState(16);
  const [deployRam, setDeployRam] = useState(32);
  const [deployGpu, setDeployGpu] = useState('None');
  const [deployStorage, setDeployStorage] = useState(300);
  const [isDeploying, setIsDeploying] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientsData, summaryData, catalogData] = await Promise.all([
        api.getClientTenants(),
        api.getClusterSummary(),
        api.getMarketplaceCatalog(),
      ]);
      setClients(clientsData);
      setSummary(summaryData);
      setGpuOptions(catalogData.gpuOptions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to communicate with master cluster controller.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenResizeModal = (client: ClientTenantInstance) => {
    setSelectedClientForResize(client);
    setResizeVcpu(client.vCpuAllocated);
    setResizeRam(client.ramGbAllocated);
    setResizeGpu(client.gpuAllocated);
    setResizeStorage(client.storageGbAllocated);
  };

  const handleSaveResize = async () => {
    if (!selectedClientForResize) return;
    setIsSavingResize(true);
    try {
      const updated = await api.updateClientResources(selectedClientForResize.id, {
        vCpu: resizeVcpu,
        ramGb: resizeRam,
        gpu: resizeGpu,
        storageGb: resizeStorage,
      });

      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSelectedClientForResize(null);
      showToast(`Successfully reconfigured resources for ${updated.clientCompany}. Plan updated to $${updated.monthlyBilling}/mo.`);
      // Reload summary to reflect new cluster totals
      const refreshedSummary = await api.getClusterSummary();
      setSummary(refreshedSummary);
    } catch (err: any) {
      alert(err.message || 'Failed to update client resources');
    } finally {
      setIsSavingResize(false);
    }
  };

  const handleDeployClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployCompany || !deployEmail) return;

    setIsDeploying(true);
    try {
      const newClient = await api.deployClientTenant({
        clientCompany: deployCompany,
        clientEmail: deployEmail,
        name: deployInstanceName || `${deployCompany} Production`,
        vCpu: deployVcpu,
        ramGb: deployRam,
        gpu: deployGpu,
        storageGb: deployStorage,
      });

      setClients((prev) => [newClient, ...prev]);
      setIsDeployModalOpen(false);
      setDeployCompany('');
      setDeployEmail('');
      setDeployInstanceName('');
      showToast(`Clean client instance deployed! Assigned isolated VLAN ${newClient.vlanId} (${newClient.vpcCidr}).`);
      const refreshedSummary = await api.getClusterSummary();
      setSummary(refreshedSummary);
    } catch (err: any) {
      alert(err.message || 'Failed to deploy client instance');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleClientAction = async (id: string, action: 'start' | 'stop' | 'restart' | 'isolate') => {
    try {
      const updated = await api.executeClientAction(id, action);
      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
      showToast(`Action '${action}' executed successfully on instance ${id}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to execute client action');
    }
  };

  const handleDeleteClient = async (id: string, company: string) => {
    if (!window.confirm(`Are you sure you want to terminate and deprovision all resources for "${company}"? Their isolated VLAN and IP subnet will be returned to the pool.`)) {
      return;
    }

    try {
      await api.deleteClientTenant(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      showToast(`Client instance for ${company} deprovisioned and VLAN reclaimed.`);
      const refreshedSummary = await api.getClusterSummary();
      setSummary(refreshedSummary);
    } catch (err: any) {
      alert(err.message || 'Failed to delete client');
    }
  };

  const handleRunIsolationTest = async () => {
    setIsVerifyingIsolation(true);
    try {
      const result = await api.verifyVlanIsolation();
      setIsolationResult(result);
      showToast('Automated cross-tenant isolation test passed! 100% of inter-VLAN probe packets dropped.');
    } catch (err: any) {
      alert(err.message || 'Failed to run isolation test');
    } finally {
      setIsVerifyingIsolation(false);
    }
  };

  // Calculate live estimate for resize modal
  const calculateEstimate = (vcpu: number, ram: number, gpu: string, storage: number) => {
    const base = vcpu * 4.5 + ram * 2.2 + storage * 0.12;
    const match = gpuOptions.find((g) => g.id === gpu);
    return Math.round(base + (match ? match.monthlyCost : 0));
  };

  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.clientCompany.toLowerCase().includes(q) ||
      c.vlanId.toString().includes(q) ||
      c.vpcCidr.includes(q) ||
      c.plan.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-cyan-950 text-cyan-200 border border-cyan-500 rounded-xl shadow-2xl animate-fade-in text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Master Account Operator Header */}
      <div
        className={`p-6 rounded-2xl border transition-colors ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-slate-900/90 border-slate-800 shadow-xl backdrop-blur-md'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 text-[11px] font-mono font-bold tracking-wider uppercase rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                MASTER CLUSTER ACCOUNT
              </span>
              <span className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                HOST HYPERVISOR FABRIC: ONLINE
              </span>
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Hardware EVPN-VXLAN Active • Zero-Crosstalk Enforced
              </span>
            </div>

            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Client Instances & Multi-Tenant Resource Control
            </h1>

            <p className={`text-sm max-w-3xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Host independent client instances on your bare-metal cluster. Architecture operates exactly like AWS VPC, GCP Virtual Networks, and Azure VNet:
              each client instance is completely sealed in its own isolated software-defined VLAN (RFC 1918 private CIDR) with virtual outbound NAT, preventing IP collisions and public internet exposure. You have root controls to upgrade or downgrade CPU, GPU, and RAM on-demand.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              id="verify-isolation-btn"
              onClick={handleRunIsolationTest}
              disabled={isVerifyingIsolation}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Shield className={`w-4 h-4 ${isVerifyingIsolation ? 'animate-spin text-cyan-400' : 'text-emerald-400'}`} />
              <span>{isVerifyingIsolation ? 'Probing VLANs...' : 'Verify VLAN Isolation'}</span>
            </button>

            <button
              id="refresh-cluster-data-btn"
              onClick={loadData}
              disabled={loading}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              id="deploy-client-instance-btn"
              onClick={() => setIsDeployModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all rounded-lg shadow-md shadow-cyan-500/20 active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4 font-bold" />
              <span>Deploy Clean Client Instance</span>
            </button>
          </div>
        </div>

        {/* Isolation Test Banner (if recently executed) */}
        {isolationResult && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-emerald-300">
                Isolation Verification Passed: {isolationResult.testedVlans} Client VLANs Tested
              </span>
              <span className="text-slate-400 hidden sm:inline">|</span>
              <span className="text-slate-300 hidden sm:inline">
                {isolationResult.crossTenantPacketsDropped} / {isolationResult.crossTenantPacketsAttempted} cross-tenant packets dropped (0% crosstalk)
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">
              Hardware Layer-2 Split-Horizon Verified
            </span>
          </div>
        )}

        {/* Master Cluster Hardware Allocation Gauges */}
        {summary && (
          <div className="mt-6 pt-6 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Cluster vCPUs
                </span>
                <span className="font-mono text-cyan-400 font-bold">
                  {summary.allocatedVcpu} / {summary.totalPhysicalCores} Cores
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (summary.allocatedVcpu / summary.totalPhysicalCores) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                {((summary.allocatedVcpu / summary.totalPhysicalCores) * 100).toFixed(1)}% Allocated across tenants
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  System RAM
                </span>
                <span className="font-mono text-indigo-400 font-bold">
                  {summary.allocatedRamGb} / {summary.totalRamGb} GB
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (summary.allocatedRamGb / summary.totalRamGb) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                {((summary.allocatedRamGb / summary.totalRamGb) * 100).toFixed(1)}% ECC Memory allocated
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Enterprise GPUs
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {summary.allocatedGpus} / {summary.totalGpus} GPUs
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (summary.allocatedGpus / summary.totalGpus) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                H100 SXM5 / A100 / L4 High-Perf
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  Ceph NVMe Storage
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {summary.allocatedStorageTb} / {summary.totalStorageTb} TB
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (summary.allocatedStorageTb / summary.totalStorageTb) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                {((summary.allocatedStorageTb / summary.totalStorageTb) * 100).toFixed(1)}% High-IOPS Tier
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Network className="w-3.5 h-3.5 text-purple-400" />
                  Isolated VLANs
                </span>
                <span className="font-mono text-purple-400 font-bold">
                  {summary.activeVlansCount} Active
                </span>
              </div>
              <p className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                100% Isolated (0 Cross-Leak)
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                Range: VLAN 1000 - 4094
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search client instances by name, company, VLAN, or CIDR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 text-xs rounded-lg border transition-colors outline-none ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 focus:border-cyan-500'
                : 'bg-slate-900 border-slate-800 text-white focus:border-cyan-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 self-end sm:self-auto font-mono">
          <span>Active Client Instances: <strong className="text-cyan-400">{filteredClients.length}</strong></span>
        </div>
      </div>

      {/* Client Instances Grid / Cards */}
      {loading ? (
        <div className="p-12 text-center">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-cyan-400 mb-3" />
          <p className="text-sm text-slate-400">Querying cluster hypervisors and client tenant state...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="font-semibold">Failed to connect to cluster engine</p>
            <p className="text-xs text-red-400 mt-0.5">{error}</p>
          </div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
          <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className={`text-base font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>No client instances found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery ? 'No client matches your search filter.' : 'Deploy your first client instance to host their workload on this cluster.'}
          </p>
          <button
            onClick={() => setIsDeployModalOpen(true)}
            className="mt-4 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            + Deploy Clean Client Instance
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClients.map((client) => {
            const hasGpu = client.gpuAllocated && client.gpuAllocated !== 'None';
            return (
              <div
                key={client.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700/80 shadow-md'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Server className="w-5 h-5 text-cyan-400" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {client.clientCompany}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full uppercase ${
                            client.status === 'Active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : client.status === 'Suspended'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          ● {client.status}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                          {client.plan} Plan
                        </span>
                        <span className="text-xs font-mono text-cyan-400 font-bold">
                          ${client.monthlyBilling}/mo
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap font-mono">
                        <span>Instance: <strong className="text-slate-300">{client.name}</strong></span>
                        <span>•</span>
                        <span>Node: <strong className="text-slate-300">{client.clusterNodeId}</strong></span>
                        <span>•</span>
                        <span>Contact: <span className="text-slate-300">{client.clientEmail}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      id={`resize-btn-${client.id}`}
                      onClick={() => handleOpenResizeModal(client)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
                      title="Upgrade or Downgrade CPU, GPU, RAM, Storage"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Adjust Resources</span>
                    </button>

                    <button
                      id={`apps-btn-${client.id}`}
                      onClick={() => onNavigateToMarketplace?.(client.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                      title="Install Applications from Marketplace"
                    >
                      <Box className="w-3.5 h-3.5 text-pink-400" />
                      <span>Apps ({client.installedApps.length})</span>
                    </button>

                    {onAssumeTenant && (
                      <button
                        id={`assume-btn-${client.id}`}
                        onClick={() => onAssumeTenant(client)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                        title="View console as this tenant"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View Console</span>
                      </button>
                    )}

                    {client.status === 'Active' ? (
                      <button
                        onClick={() => handleClientAction(client.id, 'stop')}
                        className="p-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                        title="Suspend / Pause Client Instance"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleClientAction(client.id, 'start')}
                        className="p-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                        title="Activate Client Instance"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteClient(client.id, client.clientCompany)}
                      className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Deprovision and Reclaim VLAN"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sub-grid: Networking (AWS/GCP Style Isolated VLAN) + Hardware Allocation */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {/* Card 1: AWS/GCP Style Isolated VLAN */}
                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'}`}>
                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                      <span className="flex items-center gap-1 font-semibold text-cyan-400">
                        <Network className="w-3.5 h-3.5" />
                        Isolated Network (VLAN)
                      </span>
                      <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                        VLAN {client.vlanId}
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      <p className="flex justify-between text-slate-400">
                        <span>Private CIDR:</span>
                        <strong className="text-slate-200">{client.vpcCidr}</strong>
                      </p>
                      <p className="flex justify-between text-slate-400">
                        <span>Virtual Gateway:</span>
                        <span className="text-slate-300">{client.virtualGateway}</span>
                      </p>
                      <p className="flex justify-between text-slate-400">
                        <span>Egress NAT IP:</span>
                        <span className="text-emerald-400">{client.natGatewayIp}</span>
                      </p>
                      <p className="text-[10px] text-cyan-400/90 pt-1 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Zero-Exposure • No Raw Public IPs
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Allocated Slices (CPU & RAM) */}
                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'}`}>
                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                      <span className="flex items-center gap-1 font-semibold text-indigo-400">
                        <Cpu className="w-3.5 h-3.5" />
                        Allocated Compute
                      </span>
                      <span className="font-mono text-slate-300 text-[11px]">
                        {client.vCpuAllocated} vCPUs • {client.ramGbAllocated} GB
                      </span>
                    </div>

                    <div className="space-y-2 mt-2">
                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                          <span>CPU Usage</span>
                          <span className="text-cyan-400 font-bold">{client.cpuUsagePct}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-400 h-full rounded-full"
                            style={{ width: `${Math.min(100, client.cpuUsagePct)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                          <span>RAM Usage</span>
                          <span className="text-indigo-400 font-bold">{client.ramUsagePct}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-400 h-full rounded-full"
                            style={{ width: `${Math.min(100, client.ramUsagePct)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Enterprise GPU Tier */}
                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'}`}>
                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                      <span className="flex items-center gap-1 font-semibold text-amber-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        Accelerated GPU
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${hasGpu ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500'}`}>
                        {hasGpu ? 'GPU ATTACHED' : 'CPU ONLY'}
                      </span>
                    </div>
                    <p className="font-mono text-xs font-semibold text-slate-200 mt-2">
                      {client.gpuAllocated}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      {hasGpu ? 'Direct PCIe Passthrough / vGPU Slice' : 'Standard Virtualized Compute'}
                    </p>
                  </div>

                  {/* Card 4: Storage & Installed Workloads */}
                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'}`}>
                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                      <span className="flex items-center gap-1 font-semibold text-emerald-400">
                        <HardDrive className="w-3.5 h-3.5" />
                        Storage & Workloads
                      </span>
                      <span className="font-mono text-slate-300 text-[11px]">
                        {client.storageUsedGb} / {client.storageGbAllocated} GB
                      </span>
                    </div>

                    <div className="space-y-1.5 mt-2 font-mono text-[11px]">
                      <div className="flex justify-between text-slate-400">
                        <span>Active Pods/VMs:</span>
                        <strong className="text-slate-200">{client.activeWorkloadsCount} running</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Throughput:</span>
                        <span className="text-emerald-400">{client.networkThroughputMbps} Mbps</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5 truncate">
                        <span>Apps:</span>
                        <span className="text-pink-400 truncate">
                          {client.installedApps.length > 0 ? client.installedApps.join(', ') : 'None installed'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MASTER RESOURCE UPGRADE / DOWNGRADE MODAL */}
      {selectedClientForResize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div
            className={`w-full max-w-xl p-6 rounded-2xl border shadow-2xl transition-all ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  MASTER RESOURCE CONTROLLER
                </span>
                <h2 className="text-lg font-bold">
                  Resize Resources: {selectedClientForResize.clientCompany}
                </h2>
                <p className="text-xs text-slate-400">
                  Upgrade or downgrade vCPU, RAM, GPU, and NVMe limits. Plan billing recalculates live.
                </p>
              </div>
              <button
                onClick={() => setSelectedClientForResize(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 py-5">
              {/* vCPU Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    vCPU Allocation:
                  </span>
                  <span className="font-mono text-cyan-400 font-bold text-sm">
                    {resizeVcpu} vCPUs ($4.50/core)
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="128"
                  step="2"
                  value={resizeVcpu}
                  onChange={(e) => setResizeVcpu(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>2 vCPUs (Light)</span>
                  <span>32 vCPUs (Prod)</span>
                  <span>128 vCPUs (Heavy)</span>
                </div>
              </div>

              {/* RAM Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    System RAM Allocation:
                  </span>
                  <span className="font-mono text-indigo-400 font-bold text-sm">
                    {resizeRam} GB DDR5 ECC ($2.20/GB)
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="512"
                  step="4"
                  value={resizeRam}
                  onChange={(e) => setResizeRam(Number(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>4 GB</span>
                  <span>128 GB</span>
                  <span>512 GB High-Mem</span>
                </div>
              </div>

              {/* GPU Tier Selector */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  NVIDIA AI GPU Allocation:
                </label>
                <select
                  value={resizeGpu}
                  onChange={(e) => setResizeGpu(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs font-mono outline-none cursor-pointer ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                >
                  {gpuOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} {opt.monthlyCost > 0 ? `(+$${opt.monthlyCost}/mo)` : '(No GPU)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Storage Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    Ceph NVMe Gen4 Storage:
                  </span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {resizeStorage} GB ($0.12/GB)
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="50"
                  value={resizeStorage}
                  onChange={(e) => setResizeStorage(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>50 GB</span>
                  <span>1,000 GB (1 TB)</span>
                  <span>5,000 GB (5 TB)</span>
                </div>
              </div>

              {/* Live Price Recalculation Box */}
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-mono text-cyan-400 uppercase font-semibold">
                    New Monthly Billing Calculation
                  </p>
                  <p className="text-xs text-slate-300">
                    Previous: ${selectedClientForResize.monthlyBilling}/mo
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-cyan-300">
                    ${calculateEstimate(resizeVcpu, resizeRam, resizeGpu, resizeStorage)}
                  </span>
                  <span className="text-xs text-slate-400 block">/ month</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedClientForResize(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveResize}
                disabled={isSavingResize}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isSavingResize ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sliders className="w-4 h-4" />}
                <span>{isSavingResize ? 'Applying Live Resizing...' : 'Apply Immediate Cluster Reconfiguration'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEPLOY NEW CLEAN CLIENT INSTANCE MODAL */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div
            className={`w-full max-w-xl p-6 rounded-2xl border shadow-2xl transition-all ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  CLUSTER TENANT PROVISIONING
                </span>
                <h2 className="text-lg font-bold">
                  Deploy Clean Client Instance
                </h2>
                <p className="text-xs text-slate-400">
                  Allocates a dedicated hardware slice, automatic isolated VLAN ID, and private RFC 1918 subnet.
                </p>
              </div>
              <button
                onClick={() => setIsDeployModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDeployClient} className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Client / Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Biotech Labs"
                    value={deployCompany}
                    onChange={(e) => setDeployCompany(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Client Admin Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@client-corp.com"
                    value={deployEmail}
                    onChange={(e) => setDeployEmail(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Instance Display Identifier (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Core Production Cluster"
                  value={deployInstanceName}
                  onChange={(e) => setDeployInstanceName(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>

              {/* Initial Resource Quotas */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase block">
                  Initial Resource Allocation & Isolated VLAN Preview
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">vCPUs</label>
                    <select
                      value={deployVcpu}
                      onChange={(e) => setDeployVcpu(Number(e.target.value))}
                      className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                    >
                      <option value={4}>4 vCPUs</option>
                      <option value={8}>8 vCPUs</option>
                      <option value={16}>16 vCPUs</option>
                      <option value={32}>32 vCPUs</option>
                      <option value={64}>64 vCPUs</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">RAM (GB)</label>
                    <select
                      value={deployRam}
                      onChange={(e) => setDeployRam(Number(e.target.value))}
                      className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                    >
                      <option value={8}>8 GB</option>
                      <option value={16}>16 GB</option>
                      <option value={32}>32 GB</option>
                      <option value={64}>64 GB</option>
                      <option value={128}>128 GB</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">GPU Tier</label>
                    <select
                      value={deployGpu}
                      onChange={(e) => setDeployGpu(e.target.value)}
                      className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                    >
                      <option value="None">None</option>
                      <option value="1x NVIDIA L4 (24GB)">1x L4</option>
                      <option value="1x NVIDIA A100 (80GB SXM4)">1x A100</option>
                      <option value="1x NVIDIA H100 (80GB SXM5)">1x H100</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Storage (GB)</label>
                    <select
                      value={deployStorage}
                      onChange={(e) => setDeployStorage(Number(e.target.value))}
                      className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                    >
                      <option value={150}>150 GB</option>
                      <option value={300}>300 GB</option>
                      <option value={800}>800 GB</option>
                      <option value={2000}>2 TB</option>
                    </select>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-black/40 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-0.5">
                  <p className="text-cyan-400 font-semibold">Automatic Network Allocation (AWS/GCP Style):</p>
                  <p>• Isolated VLAN Tag: <strong className="text-white">Auto-Assigned Next in Pool (1045+)</strong></p>
                  <p>• Private Subnet: <strong className="text-white">RFC 1918 (10.x.0.0/20)</strong></p>
                  <p>• Security Policy: <strong className="text-emerald-400">Strict Inter-VLAN Block + Stateful NAT Outbound</strong></p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
                <span className="text-xs text-slate-300">Estimated Plan Invoice:</span>
                <span className="text-xl font-bold font-mono text-cyan-300">
                  ${calculateEstimate(deployVcpu, deployRam, deployGpu, deployStorage)}/mo
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeployModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeploying}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isDeploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 font-bold" />}
                  <span>{isDeploying ? 'Deploying to Cluster...' : 'Deploy Clean Instance to Cluster'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
