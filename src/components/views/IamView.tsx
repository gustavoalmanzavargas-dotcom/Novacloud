import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  UserPlus,
  RefreshCw,
  Lock,
} from 'lucide-react';

interface IamViewProps {
  themeMode?: 'dark' | 'light';
  activeSubTab?: string;
  onTabChange?: (tab: string) => void;
}

export const IamView: React.FC<IamViewProps> = ({
  themeMode = 'dark',
  activeSubTab,
  onTabChange,
}) => {
  const isLight = themeMode === 'light';
  const [activeTab, setActiveTab] = useState<'users' | 'keys' | 'roles'>(
    (activeSubTab as 'users' | 'keys' | 'roles') || 'users'
  );

  useEffect(() => {
    if (activeSubTab && (activeSubTab === 'users' || activeSubTab === 'keys' || activeSubTab === 'roles')) {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabSwitch = (tab: 'users' | 'keys' | 'roles') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Developer');

  const [users, setUsers] = useState([
    { id: 'usr-1', name: 'Gustavo Almanza Vargas', email: 'gustavoalmanzavargas@gmail.com', role: 'Owner / Admin', status: 'Active', mfa: true, created: '2025-01-10' },
    { id: 'usr-2', name: 'DevOps Automated Service', email: 'github-actions-deployer@cyverax.internal', role: 'CI/CD Operator', status: 'Active', mfa: false, created: '2025-02-14' },
    { id: 'usr-3', name: 'Elena Rostova', email: 'elena.rostova@cyverax.io', role: 'Security Engineer', status: 'Active', mfa: true, created: '2025-03-01' },
    { id: 'usr-4', name: 'Marcus Chen', email: 'marcus.chen@cyverax.io', role: 'Platform Developer', status: 'Invited', mfa: false, created: '2025-03-08' },
  ]);

  const [apiKeys, setApiKeys] = useState([
    { id: 'key-prd-9842', name: 'Production Terraform CI', prefix: 'cx_live_98a...', scope: 'Full Admin', lastUsed: '3 minutes ago', created: '2025-01-15' },
    { id: 'key-dev-1140', name: 'Local CLI Workstation', prefix: 'cx_live_33f...', scope: 'Developer', lastUsed: '2 hours ago', created: '2025-02-20' },
    { id: 'key-mon-4412', name: 'Datadog Telemetry Push', prefix: 'cx_live_71c...', scope: 'Metrics Write', lastUsed: 'Just now', created: '2025-02-28' },
  ]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    const newUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: newEmail.split('@')[0],
      email: newEmail.trim(),
      role: newRole,
      status: 'Invited',
      mfa: false,
      created: new Date().toISOString().split('T')[0],
    };
    setUsers([newUser, ...users]);
    setNewEmail('');
    setShowInviteModal(false);
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                SECURITY & IDENTITY
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-mono text-emerald-500 font-semibold">RBAC ENFORCED</span>
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Identity & Access Management (IAM)
            </h1>
            <p className={`text-sm mt-1 max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Manage users, service principals, access policies, and programmatic API keys across organization org-9842.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className={`inline-flex p-1 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <button
            onClick={() => handleTabSwitch('users')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'bg-slate-800 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({users.length})</span>
          </button>
          <button
            onClick={() => handleTabSwitch('keys')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'keys'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'bg-slate-800 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys ({apiKeys.length})</span>
          </button>
          <button
            onClick={() => handleTabSwitch('roles')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'roles'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'bg-slate-800 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Roles & Policies</span>
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 rounded-md text-xs border focus:outline-hidden ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
                  : 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500'
              }`}
            />
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <div
          className={`rounded-xl border overflow-hidden ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={isLight ? 'bg-slate-50 text-slate-600 border-b border-slate-200' : 'bg-slate-950/60 text-slate-400 border-b border-slate-800/80'}>
                <tr>
                  <th className="py-2.5 px-4 font-semibold">User</th>
                  <th className="py-2.5 px-3 font-semibold">Role</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">MFA</th>
                  <th className="py-2.5 px-3 font-semibold">Created</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/40'}`}>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className={isLight ? 'hover:bg-slate-50 transition-colors' : 'hover:bg-slate-850/50 transition-colors'}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-cyan-600/20 text-cyan-600 flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{u.name}</div>
                          <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                        u.role.includes('Admin')
                          ? isLight ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                          : isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono ${
                        u.status === 'Active'
                          ? isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isLight ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {u.mfa ? (
                        <span className="text-[11px] font-mono text-emerald-600 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Enabled
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400">Disabled</span>
                      )}
                    </td>
                    <td className={`py-3 px-3 font-mono text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {u.created}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.id !== 'usr-1' && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                          title="Remove user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'keys' && (
        <div
          className={`rounded-xl border overflow-hidden ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className={`p-4 border-b flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${isLight ? 'text-slate-800' : 'text-white'}`}>
                Programmatic Access Tokens
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Active tokens authenticate CLI tools, SDKs, and automated workflows.
              </p>
            </div>
            <button
              onClick={() => {
                const newKey = {
                  id: `key-${Date.now().toString().slice(-4)}`,
                  name: `Automation Token #${apiKeys.length + 1}`,
                  prefix: `cx_live_${Math.random().toString(36).substring(2, 6)}...`,
                  scope: 'Developer',
                  lastUsed: 'Never',
                  created: new Date().toISOString().split('T')[0],
                };
                setApiKeys([newKey, ...apiKeys]);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Generate API Key</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={isLight ? 'bg-slate-50 text-slate-600 border-b border-slate-200' : 'bg-slate-950/60 text-slate-400 border-b border-slate-800/80'}>
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Key Identifier</th>
                  <th className="py-2.5 px-3 font-semibold">Prefix</th>
                  <th className="py-2.5 px-3 font-semibold">Scope</th>
                  <th className="py-2.5 px-3 font-semibold">Last Used</th>
                  <th className="py-2.5 px-3 font-semibold">Created</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/40'}`}>
                {apiKeys.map((k) => (
                  <tr key={k.id} className={isLight ? 'hover:bg-slate-50 transition-colors' : 'hover:bg-slate-850/50 transition-colors'}>
                    <td className="py-3 px-4 font-semibold">
                      <div className={isLight ? 'text-slate-900' : 'text-white'}>{k.name}</div>
                      <div className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{k.id}</div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded border ${isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                          {k.prefix}
                        </span>
                        <button
                          onClick={() => handleCopy(k.prefix, k.id)}
                          className="p-1 text-slate-400 hover:text-cyan-500 cursor-pointer"
                          title="Copy key prefix"
                        >
                          {copiedId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                        k.scope === 'Full Admin'
                          ? isLight ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                          : isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {k.scope}
                      </span>
                    </td>
                    <td className={`py-3 px-3 font-mono text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {k.lastUsed}
                    </td>
                    <td className={`py-3 px-3 font-mono text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {k.created}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                        title="Revoke API key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: 'Organization Admin',
              description: 'Full unconstrained access to billing, infrastructure, security policies, and IAM delegations.',
              members: 1,
              badge: 'ADMIN',
            },
            {
              name: 'DevOps & CI/CD Operator',
              description: 'Permitted to deploy applications, provision VMs, configure VPCs, and manage containers.',
              members: 2,
              badge: 'OPERATOR',
            },
            {
              name: 'Auditor & Read-Only',
              description: 'Inspection privileges for metrics, activity audit trails, cost charts, and compliance exports.',
              members: 1,
              badge: 'VIEWER',
            },
          ].map((role) => (
            <div
              key={role.name}
              className={`p-5 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Shield className="w-4 h-4 text-cyan-500" />
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isLight ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {role.badge}
                  </span>
                </div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{role.name}</h3>
                <p className={`text-xs mt-2 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {role.description}
                </p>
              </div>

              <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <span className={`font-mono text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {role.members} assigned member(s)
                </span>
                <span className="text-cyan-600 font-semibold cursor-pointer hover:underline">Edit Policy</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-xl border shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <h2 className="text-base font-bold mb-1">Invite Organization Member</h2>
            <p className={`text-xs mb-4 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Send an email invitation with scoped role assignments to tenant org-9842.
            </p>

            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="engineer@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-md border focus:outline-hidden ${
                    isLight ? 'bg-slate-50 border-slate-300 focus:border-cyan-500' : 'bg-slate-950 border-slate-800 focus:border-cyan-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Role Assignment</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-md border focus:outline-hidden ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                >
                  <option value="Platform Developer">Platform Developer</option>
                  <option value="CI/CD Operator">CI/CD Operator</option>
                  <option value="Security Engineer">Security Engineer</option>
                  <option value="Auditor">Auditor (Read-Only)</option>
                  <option value="Owner / Admin">Owner / Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className={`px-3 py-1.5 text-xs rounded-md font-medium cursor-pointer ${
                    isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-md cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
