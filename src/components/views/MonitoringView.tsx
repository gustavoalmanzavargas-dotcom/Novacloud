import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Network,
  Clock,
  Radio,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  BellRing,
  Target,
  Plus,
  Zap,
} from 'lucide-react';

interface MonitoringViewProps {
  themeMode?: 'dark' | 'light';
  activeSubTab?: string;
  onTabChange?: (tab: string) => void;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({
  themeMode = 'dark',
  activeSubTab,
  onTabChange,
}) => {
  const isLight = themeMode === 'light';
  const [activeTab, setActiveTab] = useState<'metrics' | 'alerts' | 'slos'>(
    (activeSubTab as 'metrics' | 'alerts' | 'slos') || 'metrics'
  );
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (activeSubTab && (activeSubTab === 'metrics' || activeSubTab === 'alerts' || activeSubTab === 'slos')) {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabSwitch = (tab: 'metrics' | 'alerts' | 'slos') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const metrics = [
    { title: 'Global CPU Utilization', current: '38.4%', peak: '76.2%', status: 'Normal', icon: Cpu, trend: '+2.1%' },
    { title: 'Memory Allocated', current: '22.8 GB / 32 GB', peak: '28.1 GB', status: 'Normal', icon: HardDrive, trend: '+0.8%' },
    { title: 'Network Egress', current: '412 Mbps', peak: '1.2 Gbps', status: 'Optimal', icon: Network, trend: '-5.3%' },
    { title: 'API p99 Latency', current: '42 ms', peak: '118 ms', status: 'Healthy', icon: Clock, trend: '-8 ms' },
  ];

  const alerts = [
    { id: 'alt-1', name: 'High Memory on JobFinderAI Worker', condition: 'RAM > 85% for 5m', severity: 'Warning', active: true, target: 'worker-jobfinder-ai' },
    { id: 'alt-2', name: 'HTTP 5xx Error Spike', condition: '5xx Rate > 1.5% for 2m', severity: 'Critical', active: false, target: 'prod-alb-ingress' },
    { id: 'alt-3', name: 'NVMe Storage Pressure', condition: 'Disk Free < 15%', severity: 'Warning', active: true, target: 'postgres-primary-db' },
  ];

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
                OBSERVABILITY & TELEMETRY
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-mono text-emerald-500 font-semibold flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {isLive ? 'STREAMING ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Metrics & Telemetry Explorer
            </h1>
            <p className={`text-sm mt-1 max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              High-resolution time-series monitoring, threshold alert policies, and real-time operational health.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer border ${
                isLive
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isLive ? 'text-emerald-500' : 'text-slate-400'}`} />
              <span>{isLive ? 'Live 5s' : 'Resume'}</span>
            </button>

            <div className={`p-0.5 rounded-lg border flex items-center ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              {(['1h', '6h', '24h', '7d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                    timeRange === r
                      ? isLight
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'bg-slate-800 text-white shadow-xs'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Submenu Tab Bar */}
      <div
        className={`flex items-center gap-1 border-b pb-px overflow-x-auto ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}
      >
        <button
          id="tab-mon-metrics"
          onClick={() => handleTabSwitch('metrics')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'metrics'
              ? isLight
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Live Metrics & Telemetry</span>
        </button>

        <button
          id="tab-mon-alerts"
          onClick={() => handleTabSwitch('alerts')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'alerts'
              ? isLight
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>Alerting Rules</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            2 Firing
          </span>
        </button>

        <button
          id="tab-mon-slos"
          onClick={() => handleTabSwitch('slos')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'slos'
              ? isLight
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Service Level Objectives (SLOs)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-400">
            99.98%
          </span>
        </button>
      </div>

      {/* Metrics View */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.title}
                  className={`p-4 rounded-xl border transition-colors ${
                    isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{m.title}</span>
                    <Icon className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div className={`text-2xl font-black font-mono tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {m.current}
                  </div>
                  <div className={`flex items-center justify-between mt-2 pt-2 border-t text-[11px] font-mono ${
                    isLight ? 'border-slate-200' : 'border-slate-800'
                  }`}>
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Peak: {m.peak}</span>
                    <span className={m.trend.startsWith('+') ? 'text-amber-500' : 'text-emerald-500'}>
                      {m.trend}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Synthetic Sparkline Gauges */}
          <div
            className={`p-5 rounded-xl border ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Aggregated Cluster Compute & Throughput
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Continuously sampled telemetry across all 8 compute instances and container tasks.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-cyan-600">Region: us-atl-1</span>
            </div>

            {/* CSS-based Bar Visualizer */}
            <div className="h-32 flex items-end gap-1 sm:gap-2 px-2 pt-4">
              {[
                34, 42, 38, 55, 60, 48, 52, 70, 65, 58, 49, 44, 52, 61, 75, 68, 54, 47, 50, 62, 59, 45, 48, 53,
              ].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                  <div
                    style={{ height: `${val}%` }}
                    className={`w-full rounded-t transition-all duration-300 ${
                      val > 65
                        ? 'bg-amber-400 group-hover:bg-amber-300'
                        : 'bg-cyan-500/80 group-hover:bg-cyan-400'
                    }`}
                  />
                </div>
              ))}
            </div>
            <div className={`flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <span>{timeRange === '1h' ? '60 mins ago' : timeRange === '6h' ? '6 hours ago' : 'Earlier'}</span>
              <span>Target P99 Latency Budget: &lt;100ms</span>
              <span>Current (Now)</span>
            </div>
          </div>
        </div>
      )}

      {/* Alerts View */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Active Alert Threshold Policies
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Automated multi-channel PagerDuty, Slack webhook, and email notification policies.
              </p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              <span>Create Alert Policy</span>
            </button>
          </div>

          <div
            className={`rounded-xl border overflow-hidden ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <table className="w-full text-left text-xs">
              <thead className={isLight ? 'bg-slate-50 text-slate-600 border-b border-slate-200' : 'bg-slate-950/60 text-slate-400 border-b border-slate-800/80'}>
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Rule Name</th>
                  <th className="py-2.5 px-3 font-semibold">Target Resource</th>
                  <th className="py-2.5 px-3 font-semibold">Trigger Condition</th>
                  <th className="py-2.5 px-3 font-semibold">Severity</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/40'}`}>
                {alerts.map((a) => (
                  <tr key={a.id} className={isLight ? 'hover:bg-slate-50 transition-colors' : 'hover:bg-slate-850/50 transition-colors'}>
                    <td className={`py-3 px-4 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{a.name}</td>
                    <td className="py-3 px-3 font-mono text-cyan-600">{a.target}</td>
                    <td className={`py-3 px-3 font-mono text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{a.condition}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        a.severity === 'Critical'
                          ? 'bg-red-500/15 text-red-600'
                          : 'bg-amber-500/15 text-amber-600'
                      }`}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono ${
                        a.active
                          ? isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isLight ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${a.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {a.active ? 'Armed' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SLOs View */}
      {activeTab === 'slos' && (
        <div className="space-y-6">
          <div>
            <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Service Level Objectives (SLOs) & Error Budgets
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              SLI-backed service commitments, automated burn rate alerts, and rolling 30-day budget status.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Core API Gateway Availability', target: '99.90%', current: '99.98%', budget: '82% Remaining', burn: '0.4x Normal', status: 'Healthy' },
              { name: 'P99 Edge Ingress Latency (<100ms)', target: '99.50%', current: '99.85%', budget: '94% Remaining', burn: '0.2x Normal', status: 'Healthy' },
              { name: 'Primary Database Query SLA (<50ms)', target: '99.90%', current: '99.95%', budget: '91% Remaining', burn: '0.3x Normal', status: 'Healthy' },
              { name: 'Synthetic E2E Healthcheck Probe', target: '99.95%', current: '100.0%', budget: '100% Remaining', burn: '0.0x Normal', status: 'Flawless' },
            ].map((slo, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border space-y-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-200">{slo.name}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {slo.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">Target: {slo.target}</span>
                  <span className="text-emerald-400 font-mono font-bold">Current: {slo.current}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Error Budget: {slo.budget}</span>
                    <span>Burn: {slo.burn}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: slo.budget.split('%')[0] + '%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
