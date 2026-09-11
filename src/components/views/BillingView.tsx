import React, { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react';

interface BillingViewProps {
  themeMode: 'dark' | 'light';
  onNavigateToAi?: () => void;
}

export const BillingView: React.FC<BillingViewProps> = ({ themeMode, onNavigateToAi }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isLight = themeMode === 'light';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadInvoice = () => {
    showToast('Generating official monthly tax invoice #CYV-2025-FEB.pdf... Download ready.');
  };

  const serviceBreakdown = [
    { service: 'Compute (Virtual Machines & Bare Metal)', spend: 942.5, pct: 51 },
    { service: 'Databases (Managed PostgreSQL & Redis)', spend: 418.2, pct: 23 },
    { service: 'Networking (Edge ALB, NAT Gateways & Egress)', spend: 284.1, pct: 15 },
    { service: 'Storage (NVMe Volumes & S3 Buckets)', spend: 142.3, pct: 8 },
    { service: 'Nova AI & Telemetry Pipelines', spend: 54.9, pct: 3 },
  ];

  return (
    <div className="space-y-6 pb-12">
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
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-500" />
            <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Billing & Cost Optimization
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time infrastructure invoice breakdown, budget alerts, and autonomous cost optimization.
          </p>
        </div>

        <button
          onClick={handleDownloadInvoice}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Invoice (PDF)</span>
        </button>
      </div>

      {/* Spend Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="text-xs text-slate-400 font-mono">CURRENT SPEND (MTD)</div>
          <div className={`text-2xl font-bold font-mono mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>$1,842.00</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Sept 1 - Sept 7, 2026</div>
        </div>

        <div className={`p-4 rounded-xl border ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="text-xs text-slate-400 font-mono">PROJECTED END OF MONTH</div>
          <div className="text-2xl font-bold font-mono text-cyan-500 mt-1">$2,390.40</div>
          <div className="text-[10px] text-emerald-500 font-mono mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Within $2,500 budget limit
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="text-xs text-slate-400 font-mono">ACTIVE SAVINGS PLANS</div>
          <div className="text-2xl font-bold font-mono text-emerald-500 mt-1">3 Committed</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Saving ~$340 / mo</div>
        </div>

        <div className={`p-4 rounded-xl border ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="text-xs text-slate-400 font-mono">UNATTACHED DISK WASTE</div>
          <div className="text-2xl font-bold font-mono text-amber-500 mt-1">$35.00 / mo</div>
          <div className="text-[10px] text-amber-500 font-mono mt-0.5">1 Orphaned Volume</div>
        </div>
      </div>

      {/* Cost By Service Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 p-5 rounded-xl border space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Cost by Infrastructure Service</h2>
          <div className="space-y-3">
            {serviceBreakdown.map((item) => (
              <div key={item.service} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>{item.service}</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>${item.spend.toFixed(2)} ({item.pct}%)</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nova AI Cost Optimization Card */}
        <div className={`p-5 rounded-xl border flex flex-col justify-between ${
          isLight
            ? 'bg-purple-50/70 border-purple-200 shadow-xs'
            : 'bg-gradient-to-br from-purple-950/40 to-slate-900 border-purple-800/60'
        }`}>
          <div>
            <div className="flex items-center gap-2 text-purple-500 font-mono text-xs font-bold mb-2">
              <Sparkles className="w-4 h-4" />
              <span>NOVA AI COST OPTIMIZER</span>
            </div>
            <h3 className={`text-sm font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Potential Savings: $120.00 / mo
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              1. Convert on-demand instance `nova-app-01` to a 1-year Savings Plan. (Save $85/mo)
              <br />
              2. Delete unattached block volume `vol-orphaned-44`. (Save $35/mo)
            </p>
          </div>

          <div className={`pt-4 border-t ${isLight ? 'border-purple-200' : 'border-purple-900/50'}`}>
            {onNavigateToAi && (
              <button
                onClick={onNavigateToAi}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Apply Optimization in Nova AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
