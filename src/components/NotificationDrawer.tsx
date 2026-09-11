import React, { useState } from 'react';
import {
  X,
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Trash2,
  Filter,
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onMarkAsRead: (id: string) => void;
  themeMode?: 'dark' | 'light';
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllAsRead,
  onClearAll,
  onMarkAsRead,
  themeMode = 'dark',
}) => {
  const isLight = themeMode === 'light';
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  if (!isOpen) return null;

  const safeNotifications = notifications || [];

  const filtered = safeNotifications.filter((item) => {
    if (filterSeverity === 'all') return true;
    return item.severity === filterSeverity;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 transition-opacity ${
          isLight ? 'bg-slate-900/40 backdrop-blur-xs' : 'bg-slate-950/60 backdrop-blur-xs'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        id="notifications-drawer-panel"
        className={`relative w-full max-w-md border-l shadow-2xl h-full flex flex-col z-50 animate-in slide-in-from-right duration-150 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-2xl'
            : 'bg-slate-900 border-slate-800 text-white shadow-2xl'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'
          }`}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-500" />
            <h3 className={`text-sm font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Notifications & Alerts
            </h3>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                isLight
                  ? 'bg-cyan-100 text-cyan-800'
                  : 'bg-cyan-500/20 text-cyan-300'
              }`}
            >
              {safeNotifications.filter((n) => !n.read).length} Unread
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllAsRead}
              className={`text-[11px] transition-colors cursor-pointer ${
                isLight ? 'text-slate-500 hover:text-cyan-600' : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              Mark read
            </button>
            <button
              onClick={onClose}
              className={`p-1 rounded transition-colors cursor-pointer ${
                isLight
                  ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div
          className={`px-4 py-2 border-b flex items-center gap-1 text-xs ${
            isLight ? 'border-slate-200 bg-slate-50/50' : 'border-slate-800 bg-slate-900/90'
          }`}
        >
          {(['all', 'critical', 'warning', 'info'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded text-xs capitalize transition-colors cursor-pointer ${
                filterSeverity === sev
                  ? isLight
                    ? 'bg-white text-cyan-700 font-semibold border border-slate-200 shadow-xs'
                    : 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700'
                  : isLight
                  ? 'text-slate-500 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className={`p-8 text-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              No notifications matching current filter.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => onMarkAsRead(item.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  !item.read
                    ? isLight
                      ? 'bg-cyan-50/30 border-cyan-200 shadow-xs'
                      : 'bg-slate-850 border-slate-700/80 shadow-xs'
                    : isLight
                    ? 'bg-slate-50 border-slate-200 opacity-80'
                    : 'bg-slate-900/50 border-slate-800/60 opacity-80'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {getSeverityIcon(item.severity)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {item.title}
                      </span>
                      <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        {item.timestamp}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {item.message}
                    </p>
                    <div className={`mt-2 flex items-center justify-between text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="uppercase tracking-wider">{item.category}</span>
                      {!item.read && (
                        <span className={`font-semibold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>NEW</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-3 border-t flex items-center justify-between text-xs ${
            isLight
              ? 'border-slate-200 bg-slate-50 text-slate-500'
              : 'border-slate-800 bg-slate-950 text-slate-400'
          }`}
        >
          <button
            onClick={onClearAll}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-red-500' : 'text-slate-400 hover:text-red-400'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear all</span>
          </button>
          <span className={`text-[11px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            CYVERAX NOTIFICATION BUS
          </span>
        </div>
      </div>
    </div>
  );
};
