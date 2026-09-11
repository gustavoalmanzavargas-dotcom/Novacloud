import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Database,
  Server,
  Layers,
  Activity,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Plus,
  Brain,
  Cpu,
  Palette,
  MessageSquare,
  Workflow,
  HardDrive,
  BarChart2,
  Boxes,
  PlayCircle,
  Package,
  Globe,
  Zap,
  FileText,
  Shield,
  ShieldCheck,
  Lock,
  Terminal,
  RefreshCw,
  Box,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { api, MarketplaceAppResponse } from '../../services/api';
import { ClientTenantInstance } from '../../types';

interface MarketplaceViewProps {
  themeMode?: 'dark' | 'light';
  preselectedClientId?: string;
  onNavigateToClients?: () => void;
}

const CATEGORIES = [
  'All',
  'AI & LLMs',
  'Databases & Cache',
  'DevOps & CI/CD',
  'Web & Frameworks',
  'Security & Network',
  'Observability',
] as const;

type CategoryType = typeof CATEGORIES[number];

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  themeMode = 'dark',
  preselectedClientId,
  onNavigateToClients,
}) => {
  const isLight = themeMode === 'light';

  const [apps, setApps] = useState<MarketplaceAppResponse[]>([]);
  const [clients, setClients] = useState<ClientTenantInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppForInstall, setSelectedAppForInstall] = useState<MarketplaceAppResponse | null>(null);
  const [targetClientId, setTargetClientId] = useState<string>(preselectedClientId || '');
  const [isInstalling, setIsInstalling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [catalogRes, clientsRes] = await Promise.all([
        api.getMarketplaceCatalog(),
        api.getClientTenants(),
      ]);
      setApps(catalogRes.apps || []);
      setClients(clientsRes || []);
      if (!targetClientId && clientsRes.length > 0) {
        setTargetClientId(clientsRes[0].id);
      }
    } catch (err) {
      console.error('Failed to load marketplace catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (preselectedClientId) {
      setTargetClientId(preselectedClientId);
    }
  }, [preselectedClientId]);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'AI & LLMs':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'Databases & Cache':
        return <Database className="w-4 h-4 text-blue-400" />;
      case 'DevOps & CI/CD':
        return <Boxes className="w-4 h-4 text-amber-400" />;
      case 'Web & Frameworks':
        return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'Security & Network':
        return <Shield className="w-4 h-4 text-red-400" />;
      case 'Observability':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      default:
        return <Box className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredApps = apps.filter((a) => {
    const matchesCat = selectedCategory === 'All' || a.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      a.name.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.dockerImage.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const handleInstallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForInstall || !targetClientId) return;

    setIsInstalling(true);
    try {
      const res = await api.installMarketplaceApp(targetClientId, selectedAppForInstall.id);
      const clientName = clients.find((c) => c.id === targetClientId)?.clientCompany || 'client instance';
      showToast(`Installed "${selectedAppForInstall.name}" into ${clientName}'s isolated VLAN ${res.client.vlanId}!`);
      setSelectedAppForInstall(null);
      // Refresh client list
      const updatedClients = await api.getClientTenants();
      setClients(updatedClients);
    } catch (err: any) {
      alert(err.message || 'Failed to install application to client instance');
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-cyan-950 text-cyan-200 border border-cyan-500 rounded-xl shadow-2xl animate-fade-in text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div
        className={`p-6 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800 shadow-xl'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                EXPANDED CLOUD MARKETPLACE
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-[11px] font-mono text-pink-400 font-semibold uppercase">
                {apps.length} PRODUCTION APPLIANCES & LLMS
              </span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Enterprise Application & AI Marketplace
            </h1>
            <p className={`text-sm mt-1.5 max-w-3xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              1-click install hardened open-weight LLMs, databases, developer stacks, and security appliances directly into your clients' isolated VLAN sandboxes.
              Containers bind to the client's private RFC 1918 CIDR with zero exposure to other tenants.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onNavigateToClients && (
              <button
                onClick={onNavigateToClients}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <Server className="w-4 h-4 text-cyan-400" />
                <span>Manage Client Instances</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-6 pt-5 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-400 text-slate-950 font-bold shadow-xs'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 border border-slate-750'
                }`}
              >
                {cat !== 'All' && getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar & Target Client Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search 28+ apps by name, tag, or container image..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 text-xs rounded-lg border transition-colors outline-none ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 focus:border-cyan-500'
                : 'bg-slate-900 border-slate-800 text-white focus:border-cyan-400'
            }`}
          />
        </div>

        {clients.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto">
            <span className="shrink-0">Default Install Target:</span>
            <select
              value={targetClientId}
              onChange={(e) => setTargetClientId(e.target.value)}
              className={`p-1.5 rounded border text-xs font-mono outline-none cursor-pointer ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.clientCompany} (VLAN {c.vlanId})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="p-12 text-center">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-cyan-400 mb-3" />
          <p className="text-sm text-slate-400">Loading marketplace application catalog...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredApps.map((app) => {
            return (
              <div
                key={app.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all group ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                      {getCategoryIcon(app.category)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {app.popular && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          FEATURED
                        </span>
                      )}
                      {app.gpuRecommended && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          GPU ACCEL
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className={`text-base font-bold group-hover:text-cyan-400 transition-colors ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {app.name}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5 mb-2">
                    <span>v{app.version}</span>
                    <span>•</span>
                    <span>{app.publisher}</span>
                  </div>

                  <p className={`text-xs leading-relaxed line-clamp-3 mb-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {app.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {app.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          isLight
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-slate-800/80 text-slate-300 border border-slate-750'
                        }`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-3 text-xs">
                  <div className="font-mono text-[11px] text-slate-400">
                    <span>Req: {app.minCpu}vCPU / {app.minRamGb}GB</span>
                    <span className="block text-cyan-400 font-bold">{app.estimatedCost}</span>
                  </div>

                  <button
                    id={`install-btn-${app.id}`}
                    onClick={() => setSelectedAppForInstall(app)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all active:scale-98 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 font-bold" />
                    <span>Install to Client</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INSTALLATION CONFIRMATION MODAL */}
      {selectedAppForInstall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl transition-all ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  {getCategoryIcon(selectedAppForInstall.category)}
                </div>
                <div>
                  <h2 className="text-base font-bold">
                    Deploy: {selectedAppForInstall.name}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Image: {selectedAppForInstall.dockerImage}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppForInstall(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInstallSubmit} className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Select Target Client Instance / VLAN *</label>
                <select
                  required
                  value={targetClientId}
                  onChange={(e) => setTargetClientId(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs font-mono outline-none cursor-pointer ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.clientCompany} (VLAN {c.vlanId} • Subnet {c.isolatedSubnet})
                    </option>
                  ))}
                </select>
              </div>

              {/* Deployment Details & Isolation Proof */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs font-mono">
                <p className="text-cyan-400 font-semibold">Isolated Deployment Manifest:</p>
                <p className="text-slate-300">• Service Port: <strong className="text-white">TCP {selectedAppForInstall.defaultPort}</strong></p>
                <p className="text-slate-300">• Target Interface: <strong className="text-white">veth attached to Client VLAN</strong></p>
                <p className="text-slate-300">• Inter-Tenant Isolation: <strong className="text-emerald-400">100% Protected (No Crosstalk)</strong></p>
                <p className="text-slate-300">• Public Exposure: <strong className="text-cyan-400">None (Private RFC 1918 IP only)</strong></p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAppForInstall(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInstalling}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isInstalling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isInstalling ? 'Provisioning Container...' : 'Execute Deployment into Client VLAN'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
