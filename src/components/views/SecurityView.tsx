import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Users,
  FileCheck,
  Lock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Plus,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  X,
  Check,
  Download,
} from 'lucide-react';
import { SecurityAlert } from '../../types';

interface SecurityViewProps {
  securityAlerts?: SecurityAlert[];
  themeMode: 'dark' | 'light';
  activeSubTab?: string;
  onTabChange?: (tab: string) => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({
  securityAlerts = [],
  themeMode,
  activeSubTab,
  onTabChange,
}) => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>(securityAlerts || []);
  const [activeTab, setActiveTab] = useState<'overview' | 'vulnerabilities' | 'compliance'>(
    (activeSubTab as 'overview' | 'vulnerabilities' | 'compliance') || 'overview'
  );
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Developer');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userCount, setUserCount] = useState(12);

  useEffect(() => {
    if (activeSubTab && (activeSubTab === 'overview' || activeSubTab === 'vulnerabilities' || activeSubTab === 'compliance')) {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabSwitch = (tab: 'overview' | 'vulnerabilities' | 'compliance') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const isLight = themeMode === 'light';
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRemediate = (alertId: string) => {
    setAlerts((prev) =>
      (prev || []).map((a) => {
        if (a.id === alertId) {
          showToast(`Automated remediation successfully applied for ${a.title}`);
          return { ...a, status: 'Remediated' };
        }
        return a;
      })
    );
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    setUserCount((c) => c + 1);
    setIsAddUserModalOpen(false);
    showToast(`IAM Principal ${newUserName} (${newUserRole}) provisioned with zero-trust credentials.`);
    setNewUserName('');
    setNewUserEmail('');
  };

  const activeVulnerabilities = safeAlerts.filter((a) => a.status !== 'Remediated').length;
  const postureScore = 94 + (safeAlerts.length - activeVulnerabilities) * 3;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
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
            <Shield className="w-5 h-5 text-cyan-500" />
            <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Security & Identity (IAM)
            </h1>
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Zero-trust IAM roles, automated CIS benchmark compliance, TLS certificate management, and WAF rules.
          </p>
        </div>

        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg shadow cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add IAM User / Policy</span>
        </button>
      </div>

      {/* Security Submenu Tab Bar */}
      <div
        className={`flex items-center gap-1 border-b pb-px overflow-x-auto ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}
      >
        <button
          id="tab-sec-overview"
          onClick={() => handleTabSwitch('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? isLight
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Security Posture Overview</span>
        </button>

        <button
          id="tab-sec-vulnerabilities"
          onClick={() => handleTabSwitch('vulnerabilities')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'vulnerabilities'
              ? isLight
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Vulnerability Alerts</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeVulnerabilities > 0
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {activeVulnerabilities}
          </span>
        </button>

        <button
          id="tab-sec-compliance"
          onClick={() => handleTabSwitch('compliance')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'compliance'
              ? isLight
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Compliance & CIS Reports</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-400">
            5 Passing
          </span>
        </button>
      </div>

      {/* Overview Subtab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Compliance Overview Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div
              className={`p-3.5 rounded-lg border transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Security Posture Score</div>
              <div className="text-xl font-bold font-mono text-emerald-500 mt-1">
                {Math.min(100, postureScore)} / 100
              </div>
              <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                SOC 2 Type II Compliant
              </div>
            </div>

            <div
              className={`p-3.5 rounded-lg border transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Active Vulnerabilities</div>
              <div className="text-xl font-bold font-mono text-amber-500 mt-1">{activeVulnerabilities}</div>
              <div className="text-[10px] text-amber-500 font-mono mt-0.5">
                {activeVulnerabilities > 0 ? `${activeVulnerabilities} Open Security Issues` : 'All issues remediated'}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-lg border transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>IAM Principals</div>
              <div className={`text-xl font-bold font-mono mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {userCount} Users
              </div>
              <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                4 Service Accounts
              </div>
            </div>

            <div
              className={`p-3.5 rounded-lg border transition-colors ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>TLS Certificates</div>
              <div className="text-xl font-bold font-mono text-cyan-500 mt-1">6 Active</div>
              <div className="text-[10px] text-emerald-500 font-mono mt-0.5">Auto-Renewal Active</div>
            </div>
          </div>

          {/* Security Posture Category Breakdown */}
          <div
            className={`rounded-xl border p-5 space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Security Domain Evaluation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Identity & Access Management (MFA & Least Privilege)', score: 96, status: 'Excellent', color: 'emerald' },
                { name: 'Network Ingress & Perimeter WAF Shielding', score: 92, status: 'Good', color: 'emerald' },
                { name: 'Cryptographic Storage & En-Route TLS 1.3', score: 100, status: 'Flawless', color: 'emerald' },
                { name: 'Automated Container & Image Scanning', score: 88, status: 'Fair', color: 'amber' },
              ].map((domain, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-lg border ${
                    isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-950/50 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>{domain.name}</span>
                    <span className="font-mono text-cyan-400">{domain.score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${domain.score >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${domain.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vulnerabilities Subtab */}
      {activeTab === 'vulnerabilities' && (
        /* Security Alerts & Remediation Actions */
        <div
          className={`rounded-xl border p-5 space-y-4 transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-100' : 'border-slate-800/80'}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Active Security Findings & Remediation
              </h2>
            </div>
            <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Real-Time CIS Guard
            </span>
          </div>

          <div className="space-y-3">
            {safeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  alert.status === 'Remediated'
                    ? isLight
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-slate-950/40 border-slate-800 opacity-60'
                    : alert.severity === 'critical'
                    ? isLight
                      ? 'bg-red-50/80 border-red-200'
                      : 'bg-red-500/10 border-red-500/30'
                    : isLight
                    ? 'bg-amber-50/80 border-amber-200'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        alert.severity === 'critical'
                          ? isLight
                            ? 'bg-red-100 text-red-700'
                            : 'bg-red-500/20 text-red-300'
                          : isLight
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {alert.title}
                    </h3>
                  </div>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{alert.description}</p>
                  <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Target Resource: <span className="text-cyan-600 font-semibold">{alert.resource}</span>
                  </div>
                </div>

                <div>
                  {alert.status === 'Remediated' ? (
                    <span className="text-xs font-mono text-emerald-600 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Remediated
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRemediate(alert.id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                    >
                      {alert.remediationAction}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Subtab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Regulatory Compliance & CIS Benchmarking
              </h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Continuous automated audit evidence collection against global security standards.
              </p>
            </div>
            <button
              onClick={() => showToast('Audit PDF bundle generated and downloaded successfully.')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Package</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { framework: 'SOC 2 Type II', status: 'Compliant', passed: '142 / 145 Controls', renewed: 'Valid thru Jan 2026', badge: 'Certified' },
              { framework: 'ISO / IEC 27001', status: 'Certified', passed: '114 / 114 Controls', renewed: 'Audited Nov 2024', badge: 'ISMS Active' },
              { framework: 'HIPAA Security Rule', status: 'Passing', passed: '42 / 42 Safeguards', renewed: 'BAA In Effect', badge: 'ePHI Shielded' },
              { framework: 'PCI-DSS v4.0', status: 'Level 1 Service', passed: '12 / 12 Requirements', renewed: 'AOC Signed 2025', badge: 'SAQ-D Verified' },
              { framework: 'CIS Cloud Benchmark v2.0', status: 'Passing (94%)', passed: '148 / 156 Checks', renewed: 'Scanned 1 hr ago', badge: 'Continuous' },
              { framework: 'GDPR / CCPA Privacy', status: 'Compliant', passed: 'DPA Enforced', renewed: 'EU Data Boundary', badge: 'Enforced' },
            ].map((c, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border space-y-2.5 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-200">{c.framework}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {c.badge}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{c.status}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                  <span>{c.passed}</span>
                  <span>{c.renewed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add User / Policy Modal */}
      {isAddUserModalOpen && (
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
                <Users className="w-4 h-4 text-cyan-500" />
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Add IAM Principal / Policy
                </h3>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Principal Username
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. dev-alex"
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none font-mono ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                      : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. alex@company.com"
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none font-mono ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                      : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Role & Policy Assignment
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                      : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
                  }`}
                >
                  <option value="Administrator">Administrator (Full Access)</option>
                  <option value="Developer">Developer (Compute & Applications)</option>
                  <option value="SecurityAuditor">Security Auditor (Read-Only)</option>
                  <option value="DatabaseOperator">Database Operator</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
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
                  Create Principal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
