import React, { useState, useEffect } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Shield,
  Bell,
  Globe,
  CheckCircle2,
  Save,
  Building,
  Key,
  FileText,
  Download,
  Clock,
  Laptop,
} from 'lucide-react';

interface SettingsViewProps {
  themeMode?: 'dark' | 'light';
  onToggleTheme?: () => void;
  activeSubTab?: string;
  onTabChange?: (tab: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  themeMode = 'dark',
  onToggleTheme,
  activeSubTab,
  onTabChange,
}) => {
  const isLight = themeMode === 'light';
  const getInitialTab = (): 'appearance' | 'organization' | 'security' => {
    if (activeSubTab === 'organization' || activeSubTab === 'general') return 'organization';
    if (activeSubTab === 'security' || activeSubTab === 'audit') return 'security';
    return 'appearance';
  };

  const [activeTab, setActiveTab] = useState<'appearance' | 'organization' | 'security'>(getInitialTab());
  const [tenantName, setTenantName] = useState('Cyverax Core Systems');
  const [primaryRegion, setPrimaryRegion] = useState('us-atl-1 (Atlanta - East)');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T00/B00/XXXX');
  const [sessionTimeout, setSessionTimeout] = useState('1h');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [compactDensity, setCompactDensity] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  useEffect(() => {
    if (!activeSubTab) return;
    if (activeSubTab === 'appearance') {
      setActiveTab('appearance');
    } else if (activeSubTab === 'organization' || activeSubTab === 'general') {
      setActiveTab('organization');
    } else if (activeSubTab === 'security' || activeSubTab === 'audit') {
      setActiveTab('security');
    }
  }, [activeSubTab]);

  const handleTabSwitch = (tab: 'appearance' | 'organization' | 'security') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
                CONSOLE CONFIGURATION & PREFERENCES
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-mono text-emerald-500 font-semibold">TENANT: ORG-9842</span>
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Console Settings & Organization
            </h1>
            <p className={`text-sm mt-1 max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Configure workspace branding, display appearance themes, security timeouts, and alerting integrations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className={`p-4 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
          isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>Organization settings and UI preferences successfully saved and synchronized.</span>
        </div>
      )}

      {/* Settings Submenu Tab Bar */}
      <div
        className={`flex items-center gap-1 border-b pb-px overflow-x-auto ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}
      >
        <button
          id="tab-set-appearance"
          type="button"
          onClick={() => handleTabSwitch('appearance')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'appearance'
              ? isLight
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {isLight ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span>Theme & Appearance</span>
        </button>

        <button
          id="tab-set-organization"
          type="button"
          onClick={() => handleTabSwitch('organization')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'organization'
              ? isLight
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Organization Profile</span>
        </button>

        <button
          id="tab-set-security"
          type="button"
          onClick={() => handleTabSwitch('security')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? isLight
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Security & Timeouts</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization: Tenant & Profile */}
        {activeTab === 'organization' && (
          <div className="space-y-6">
            <div
              className={`p-5 rounded-xl border ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className={`flex items-center gap-2 pb-3 border-b mb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <Building className="w-4 h-4 text-cyan-500" />
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Organization Profile
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Tenant Display Name
                  </label>
                  <input
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-md border focus:outline-hidden ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500' : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Primary Cloud Region
                  </label>
                  <select
                    value={primaryRegion}
                    onChange={(e) => setPrimaryRegion(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-md border focus:outline-hidden ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500' : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                    }`}
                  >
                    <option value="us-atl-1 (Atlanta - East)">us-atl-1 (Atlanta - East)</option>
                    <option value="us-ord-1 (Chicago - Central)">us-ord-1 (Chicago - Central)</option>
                    <option value="eu-fra-1 (Frankfurt - Central)">eu-fra-1 (Frankfurt - Central)</option>
                    <option value="ap-tyo-1 (Tokyo - Asia)">ap-tyo-1 (Tokyo - Asia)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications & Webhooks */}
            <div
              className={`p-5 rounded-xl border ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className={`flex items-center gap-2 pb-3 border-b mb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <Bell className="w-4 h-4 text-cyan-500" />
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Alerting Integrations & Webhooks
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      Email Urgent Incident Notifications
                    </p>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Send high-severity system alerts to primary billing and administrator contacts.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Slack Incident Alert Webhook
                  </label>
                  <input
                    type="text"
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-md border font-mono focus:outline-hidden ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500' : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appearance Section */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div
              className={`p-5 rounded-xl border ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className={`flex items-center gap-2 pb-3 border-b mb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <Sun className="w-4 h-4 text-cyan-500" />
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Console Visual Theme
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className={`text-xs font-medium ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                    Active Color Mode
                  </p>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Switch between high-contrast Dark Nova theme and clean Light mode.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs border transition-all cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                  }`}
                >
                  {isLight ? (
                    <>
                      <Moon className="w-4 h-4 text-indigo-500" />
                      <span>Switch to Dark Theme</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Switch to Light Theme</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div
              className={`p-5 rounded-xl border ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className={`flex items-center gap-2 pb-3 border-b mb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <Laptop className="w-4 h-4 text-cyan-500" />
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Layout & Accessibility Preferences
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      High-Density Table View
                    </p>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Reduce row heights and card paddings for maximum data visibility.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={compactDensity}
                    onChange={(e) => setCompactDensity(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      Micro-Animations & Telemetry Pulses
                    </p>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Display live streaming indicator pulses and smooth transition animations.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={animationsEnabled}
                    onChange={(e) => setAnimationsEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Subtab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Security & Sessions */}
            <div
              className={`p-5 rounded-xl border ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className={`flex items-center gap-2 pb-3 border-b mb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <Shield className="w-4 h-4 text-emerald-500" />
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Security & Session Policies
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Session Inactivity Timeout
                  </label>
                  <select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-md border focus:outline-hidden ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500' : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                    }`}
                  >
                    <option value="15m">15 Minutes</option>
                    <option value="30m">30 Minutes</option>
                    <option value="1h">1 Hour (Recommended)</option>
                    <option value="4h">4 Hours</option>
                    <option value="8h">8 Hours</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Multi-Factor Authentication (MFA)
                  </label>
                  <div className={`p-2.5 rounded-md border text-xs font-mono flex items-center justify-between ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-emerald-400'
                  }`}>
                    <span>Enforced for all organization admins</span>
                    <span className="font-bold text-emerald-600">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Log Table */}
            <div
              className={`rounded-xl border overflow-hidden ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className={`p-4 border-b flex items-center justify-between ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-500" />
                  <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    Immutable Security & Access Audit Trail
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Exporting audit log CSV...')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={isLight ? 'bg-slate-50 text-slate-600 border-b border-slate-200' : 'bg-slate-950/60 text-slate-400 border-b border-slate-800/80'}>
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                      <th className="py-2.5 px-3 font-semibold">Actor / Principal</th>
                      <th className="py-2.5 px-3 font-semibold">Action</th>
                      <th className="py-2.5 px-3 font-semibold">Resource</th>
                      <th className="py-2.5 px-3 font-semibold">IP Address</th>
                      <th className="py-2.5 px-3 font-semibold">Result</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/40'}`}>
                    {[
                      { time: '10 mins ago', actor: 'admin@cyverax.internal', action: 'iam.key.rotate', res: 'prod-deployer-key', ip: '198.51.100.4', result: 'Success' },
                      { time: '35 mins ago', actor: 'ci-cd-runner-01', action: 'deploy.workload', res: 'worker-jobfinder-ai', ip: '10.244.0.12', result: 'Success' },
                      { time: '2 hours ago', actor: 'security-bot', action: 'vuln.remediate', res: 'sec-rule-waf-04', ip: 'internal', result: 'Success' },
                      { time: '5 hours ago', actor: 'sarah.c@cyverax.internal', action: 'db.backup.manual', res: 'postgres-primary-db', ip: '198.51.100.22', result: 'Success' },
                      { time: '1 day ago', actor: 'external-probe', action: 'auth.login.attempt', res: 'console-gateway', ip: '203.0.113.88', result: 'Blocked' },
                    ].map((row, idx) => (
                      <tr key={idx} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-850/50'}>
                        <td className={`py-3 px-4 font-mono text-slate-400`}>{row.time}</td>
                        <td className={`py-3 px-3 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{row.actor}</td>
                        <td className="py-3 px-3 font-mono text-cyan-600">{row.action}</td>
                        <td className="py-3 px-3 font-mono">{row.res}</td>
                        <td className="py-3 px-3 font-mono text-slate-400">{row.ip}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            row.result === 'Success'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-red-500/15 text-red-400'
                          }`}>
                            {row.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
