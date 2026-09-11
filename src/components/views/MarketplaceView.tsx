import React, { useState } from 'react';
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
} from 'lucide-react';

interface MarketplaceViewProps {
  themeMode?: 'dark' | 'light';
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({ themeMode = 'dark' }) => {
  const isLight = themeMode === 'light';
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Databases' | 'Web & Cache' | 'Monitoring'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [deployedItem, setDeployedItem] = useState<string | null>(null);

  const apps = [
    {
      id: 'app-pg',
      name: 'PostgreSQL HA Cluster',
      category: 'Databases',
      version: '16.2',
      description: 'Production-ready PostgreSQL with automated Patroni failover and pgBouncer pooling.',
      icon: Database,
      popular: true,
    },
    {
      id: 'app-redis',
      name: 'Redis Enterprise Sentinel',
      category: 'Web & Cache',
      version: '7.2',
      description: 'Ultra-low latency in-memory data store with master-replica replication and sentinel failover.',
      icon: Layers,
      popular: true,
    },
    {
      id: 'app-nginx',
      name: 'Nginx Ingress & WAF',
      category: 'Web & Cache',
      version: '1.25',
      description: 'High-performance reverse proxy with integrated ModSecurity web application firewall.',
      icon: Server,
      popular: false,
    },
    {
      id: 'app-grafana',
      name: 'Prometheus & Grafana Stack',
      category: 'Monitoring',
      version: '10.3',
      description: 'Pre-configured metrics collection and beautiful dashboards for full-stack cluster observability.',
      icon: Activity,
      popular: true,
    },
  ];

  const filteredApps = apps.filter((a) => {
    const matchesCat = selectedCategory === 'All' || a.category === selectedCategory;
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleDeploy = (name: string) => {
    setDeployedItem(name);
    setTimeout(() => setDeployedItem(null), 3000);
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
                ONE-CLICK TEMPLATES & BLUEPRINTS
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-mono text-pink-500 font-semibold">VERIFIED PACKAGES</span>
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Cyverax Solutions Marketplace
            </h1>
            <p className={`text-sm mt-1 max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Instantly provision pre-configured, hardened stacks and software appliances across your VPC infrastructure.
            </p>
          </div>
        </div>
      </div>

      {deployedItem && (
        <div className={`p-4 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
          isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>Deployment template initialized for <strong>{deployedItem}</strong>. Workload provisioning dispatched to cluster.</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className={`inline-flex p-1 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          {(['All', 'Databases', 'Web & Cache', 'Monitoring'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'bg-slate-800 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search solutions..."
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

      {/* App Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredApps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                isLight ? 'bg-white border-slate-200 hover:border-cyan-400 shadow-xs' : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-cyan-500/15 text-cyan-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {item.name}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        v{item.version} • {item.category}
                      </span>
                    </div>
                  </div>

                  {item.popular && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-600 border border-pink-500/20">
                      Popular
                    </span>
                  )}
                </div>

                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {item.description}
                </p>
              </div>

              <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <span className="text-[11px] font-mono text-emerald-600 font-semibold">1-Click Deploy</span>
                <button
                  onClick={() => handleDeploy(item.name)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-md transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Deploy to Cluster</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
