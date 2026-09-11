import React, { useState } from 'react';
import {
  Search,
  Terminal,
  Bell,
  HelpCircle,
  Settings,
  ChevronDown,
  Layers,
  Globe,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  User,
  LogOut,
  Building2,
  Key,
} from 'lucide-react';
import { Environment, Region, NotificationItem } from '../types';

interface TopNavProps {
  environment?: Environment | string;
  activeEnvironment?: string;
  setEnvironment?: (env: any) => void;
  onSelectEnvironment?: (env: string) => void;
  region?: Region | string;
  activeRegion?: string;
  setRegion?: (reg: any) => void;
  onSelectRegion?: (reg: string) => void;
  onOpenCommandPalette: () => void;
  onToggleTerminal?: () => void;
  onToggleCloudShell?: () => void;
  isTerminalOpen?: boolean;
  onToggleNotifications: () => void;
  notifications?: NotificationItem[];
  unreadNotifications?: number;
  themeMode: 'dark' | 'light';
  setThemeMode?: (mode: 'dark' | 'light') => void;
  onToggleTheme?: () => void;
  onNavigate?: (view: any) => void;
  onOpenCreateResource?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  environment,
  activeEnvironment,
  setEnvironment,
  onSelectEnvironment,
  region,
  activeRegion,
  setRegion,
  onSelectRegion,
  onOpenCommandPalette,
  onToggleTerminal,
  onToggleCloudShell,
  isTerminalOpen = false,
  onToggleNotifications,
  notifications = [],
  unreadNotifications,
  themeMode,
  setThemeMode,
  onToggleTheme,
  onNavigate,
  onOpenCreateResource,
}) => {
  const [isEnvMenuOpen, setIsEnvMenuOpen] = useState(false);
  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [currentOrg, setCurrentOrg] = useState({
    name: 'Cyverax Enterprise',
    id: 'org-9842',
    fullName: 'Cyverax Enterprise Corp',
    tag: 'org-9842-prd',
  });

  const isLight = themeMode === 'light';

  const currentEnv = (activeEnvironment || environment || 'Production') as Environment;
  const handleSetEnv = (env: Environment) => {
    onSelectEnvironment?.(env);
    setEnvironment?.(env);
  };

  const currentRegion = (activeRegion || region || 'US East — Atlanta') as Region;
  const handleSetRegion = (reg: Region) => {
    onSelectRegion?.(reg);
    setRegion?.(reg);
  };

  const handleToggleTerminal = onToggleCloudShell || onToggleTerminal || (() => {});
  const handleToggleTheme = onToggleTheme || (() => setThemeMode?.(themeMode === 'dark' ? 'light' : 'dark'));
  const safeNavigate = onNavigate || (() => {});

  const unreadCount =
    typeof unreadNotifications === 'number'
      ? unreadNotifications
      : Array.isArray(notifications)
      ? notifications.filter((n) => !n?.read).length
      : 0;

  return (
    <header
      id="cyverax-top-navigation"
      className={`h-13 px-3 sm:px-4 flex items-center justify-between z-30 sticky top-0 select-none transition-colors ${
        isLight
          ? 'bg-white border-b border-slate-200 text-slate-800 shadow-xs'
          : 'bg-slate-950 border-b border-slate-800/80 text-slate-200 shadow-sm'
      }`}
    >
      {/* Left: Brand Identity & Quick Switchers */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          id="cyverax-logo-button"
          onClick={() => safeNavigate('home')}
          className={`flex items-center gap-2.5 px-2 py-1 -ml-1 rounded transition-colors group cursor-pointer ${
            isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-900'
          }`}
          title="Cyverax Nova Console"
        >
          {/* Nova Core Hexagon Logo */}
          <div className="relative w-7 h-7 flex items-center justify-center bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 rounded shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/40">
            <span className="font-mono font-black text-xs text-white tracking-tighter">CX</span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-75"></span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400 rounded-full"></span>
          </div>

          <div className="flex items-baseline tracking-wide">
            <span
              className={`font-bold text-sm tracking-wider ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              CYVERAX
            </span>
            <span className={`mx-1.5 font-light ${isLight ? 'text-slate-300' : 'text-slate-600'}`}>|</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-600 group-hover:text-cyan-500 transition-colors">
              NOVA
            </span>
          </div>
        </button>

        {/* Global Create Resource Launcher Button */}
        {onOpenCreateResource && (
          <button
            id="global-create-resource-btn"
            onClick={onOpenCreateResource}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all rounded shadow-sm hover:shadow-cyan-400/20 active:scale-98 cursor-pointer"
          >
            <span className="text-sm leading-none font-bold">+</span>
            <span>Create Resource</span>
          </button>
        )}

        {/* Organization Selector */}
        <div className="relative hidden lg:block">
          <button
            id="org-selector-btn"
            onClick={() => setIsOrgMenuOpen(!isOrgMenuOpen)}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded border transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-200'
                : 'text-slate-300 hover:text-white bg-transparent hover:bg-slate-900 border-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-500" />
            <span className="max-w-[130px] truncate">{currentOrg.name}</span>
            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              ({currentOrg.id})
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isOrgMenuOpen && (
            <div
              className={`absolute left-0 mt-1.5 w-64 rounded-md shadow-xl py-1 z-50 text-xs border ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
              onMouseLeave={() => setIsOrgMenuOpen(false)}
            >
              <div
                className={`px-3 py-1.5 border-b text-[11px] font-semibold uppercase tracking-wider ${
                  isLight ? 'border-slate-100 text-slate-400' : 'border-slate-800 text-slate-500'
                }`}
              >
                Select Organization
              </div>
              <button
                className={`w-full text-left px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                  currentOrg.id === 'org-9842'
                    ? isLight
                      ? 'bg-cyan-50 text-cyan-900'
                      : 'bg-cyan-500/10 text-white'
                    : isLight
                    ? 'hover:bg-slate-50 text-slate-700'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
                onClick={() => {
                  setCurrentOrg({
                    name: 'Cyverax Enterprise',
                    id: 'org-9842',
                    fullName: 'Cyverax Enterprise Corp',
                    tag: 'org-9842-prd',
                  });
                  setIsOrgMenuOpen(false);
                }}
              >
                <div>
                  <div className="font-semibold">Cyverax Enterprise Corp</div>
                  <div className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    ID: org-9842-prd
                  </div>
                </div>
                {currentOrg.id === 'org-9842' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />}
              </button>
              <button
                className={`w-full text-left px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                  currentOrg.id === 'org-1140'
                    ? isLight
                      ? 'bg-cyan-50 text-cyan-900'
                      : 'bg-cyan-500/10 text-white'
                    : isLight
                    ? 'hover:bg-slate-50 text-slate-700'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
                onClick={() => {
                  setCurrentOrg({
                    name: 'Cyverax Labs Staging',
                    id: 'org-1140',
                    fullName: 'Cyverax Labs Staging Tenant',
                    tag: 'org-1140-stg',
                  });
                  setIsOrgMenuOpen(false);
                }}
              >
                <div>
                  <div className="font-semibold">Cyverax Labs Staging</div>
                  <div className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    ID: org-1140-stg
                  </div>
                </div>
                {currentOrg.id === 'org-1140' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />}
              </button>
            </div>
          )}
        </div>

        {/* Environment Selector */}
        <div className="relative">
          <button
            id="env-selector-btn"
            onClick={() => setIsEnvMenuOpen(!isEnvMenuOpen)}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded border transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-200'
                : 'text-slate-200 hover:text-white bg-transparent hover:bg-slate-900 border-slate-800'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                currentEnv === 'Production'
                  ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                  : currentEnv === 'Development'
                  ? 'bg-amber-500'
                  : 'bg-indigo-500'
              }`}
            />
            <span>{currentEnv}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isEnvMenuOpen && (
            <div
              className={`absolute left-0 mt-1.5 w-40 rounded-md shadow-xl py-1 z-50 text-xs border ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
              onMouseLeave={() => setIsEnvMenuOpen(false)}
            >
              {(['Production', 'Development', 'Testing'] as Environment[]).map((env) => (
                <button
                  key={env}
                  onClick={() => {
                    handleSetEnv(env);
                    setIsEnvMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-colors ${
                    isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800'
                  } ${
                    currentEnv === env
                      ? isLight
                        ? 'text-cyan-700 font-semibold bg-cyan-50/70'
                        : 'text-cyan-400 font-semibold bg-slate-800/50'
                      : isLight
                      ? 'text-slate-700'
                      : 'text-slate-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      env === 'Production'
                        ? 'bg-emerald-500'
                        : env === 'Development'
                        ? 'bg-amber-500'
                        : 'bg-indigo-500'
                    }`}
                  />
                  {env}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Region Selector */}
        <div className="relative hidden sm:block">
          <button
            id="region-selector-btn"
            onClick={() => setIsRegionMenuOpen(!isRegionMenuOpen)}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded border transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-200'
                : 'text-slate-300 hover:text-white bg-transparent hover:bg-slate-900 border-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="max-w-[130px] truncate">{currentRegion}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isRegionMenuOpen && (
            <div
              className={`absolute left-0 mt-1.5 w-56 rounded-md shadow-xl py-1 z-50 text-xs border ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
              onMouseLeave={() => setIsRegionMenuOpen(false)}
            >
              {(
                [
                  'US East — Atlanta',
                  'US West — Oregon',
                  'EU Central — Frankfurt',
                  'AP South — Tokyo',
                ] as Region[]
              ).map((reg) => (
                <button
                  key={reg}
                  onClick={() => {
                    handleSetRegion(reg);
                    setIsRegionMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                    isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800'
                  } ${
                    currentRegion === reg
                      ? isLight
                        ? 'text-cyan-700 font-semibold bg-cyan-50/70'
                        : 'text-cyan-400 font-semibold bg-slate-800/50'
                      : isLight
                      ? 'text-slate-700'
                      : 'text-slate-300'
                  }`}
                >
                  <span>{reg}</span>
                  {currentRegion === reg && (
                    <span className="text-[10px] font-mono font-bold text-cyan-600">ACTIVE</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Global Omnisearch Bar */}
      <div className="flex-1 max-w-xl mx-2 sm:mx-6">
        <button
          id="global-search-bar-trigger"
          onClick={onOpenCommandPalette}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-all group cursor-pointer border ${
            isLight
              ? 'bg-slate-100/80 hover:bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300'
              : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-500 transition-colors shrink-0" />
            <span className="truncate">Search services, resources, docs, commands...</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <kbd
              className={`hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium rounded border ${
                isLight ? 'bg-white text-slate-500 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right: Quick Tools, Terminal, Notifications, Settings, Profile */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Nova Cloud Shell Drawer Button */}
        <button
          id="nova-shell-header-btn"
          onClick={handleToggleTerminal}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded border transition-colors cursor-pointer ${
            isTerminalOpen
              ? 'bg-cyan-500/20 text-cyan-600 border-cyan-500/50 shadow-xs'
              : isLight
              ? 'text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-100 bg-white'
              : 'text-slate-300 hover:text-white border-slate-800 hover:bg-slate-900 bg-transparent'
          }`}
          title="Toggle Nova Cloud Shell (>_)"
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-500" />
          <span className="hidden md:inline font-mono font-semibold">&gt;_ Nova Shell</span>
        </button>

        {/* Notifications Drawer Toggle */}
        <button
          id="notifications-toggle-btn"
          onClick={onToggleNotifications}
          className={`relative p-1.5 rounded border transition-colors cursor-pointer ${
            isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent hover:border-slate-200'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border-transparent hover:border-slate-800'
          }`}
          title="Notifications & Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
          )}
        </button>

        {/* Theme Workspace Toggle */}
        <button
          id="theme-mode-toggle-btn"
          onClick={handleToggleTheme}
          className={`p-1.5 rounded border transition-colors cursor-pointer hidden sm:block ${
            isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent hover:border-slate-200'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border-transparent hover:border-slate-800'
          }`}
          title={themeMode === 'dark' ? 'Switch to Light Workspace' : 'Switch to Full Dark Console'}
        >
          {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-600" />}
        </button>

        {/* Documentation / Help */}
        <button
          id="docs-help-btn"
          onClick={() => safeNavigate('dev-tools')}
          className={`p-1.5 rounded border transition-colors cursor-pointer hidden md:block ${
            isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent hover:border-slate-200'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border-transparent hover:border-slate-800'
          }`}
          title="Documentation & APIs"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          id="top-settings-btn"
          onClick={() => safeNavigate('settings')}
          className={`p-1.5 rounded border transition-colors cursor-pointer ${
            isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent hover:border-slate-200'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border-transparent hover:border-slate-800'
          }`}
          title="Global Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile Menu */}
        <div className="relative ml-1">
          <button
            id="user-profile-menu-btn"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`flex items-center gap-2 pl-1 pr-1.5 py-1 text-xs rounded transition-colors cursor-pointer ${
              isLight ? 'text-slate-800 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-[11px] ring-1 ring-cyan-500/30">
              GA
            </div>
            <span className="hidden xl:inline max-w-[120px] truncate text-[11px] font-medium">
              gustavo.vargas
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isUserMenuOpen && (
            <div
              className={`absolute right-0 mt-1.5 w-64 rounded-md shadow-2xl py-1.5 z-50 text-xs border ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
              onMouseLeave={() => setIsUserMenuOpen(false)}
            >
              <div className={`px-3 py-2 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Gustavo Almanza Vargas
                </div>
                <div className={`text-[11px] font-mono truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  gustavoalmanzavargas@gmail.com
                </div>
                <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 font-medium text-[10px]">
                  <Shield className="w-3 h-3" /> Organization Admin
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    safeNavigate('iam');
                    setIsUserMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-colors ${
                    isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account & IAM Credentials</span>
                </button>
                <button
                  onClick={() => {
                    safeNavigate('dev-tools');
                    setIsUserMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-colors ${
                    isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>API Keys & Tokens</span>
                </button>
                <button
                  onClick={() => {
                    safeNavigate('billing');
                    setIsUserMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-colors ${
                    isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Billing & Subscription</span>
                </button>
                <button
                  onClick={() => {
                    safeNavigate('settings');
                    setIsUserMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-colors ${
                    isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Console Preferences</span>
                </button>
              </div>

              <div className={`border-t pt-1 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                <button
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full text-left px-3 py-1.5 text-red-500 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
