import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  ShieldAlert,
  FileEdit,
  CheckSquare,
  Trophy,
  AlertTriangle,
  Fingerprint,
  ExternalLink,
  Trash2,
  X,
  Clock,
  ChevronRight,
} from 'lucide-react';

const ICON_MAP = {
  ShieldAlert,
  FileEdit,
  CheckSquare,
  Trophy,
  AlertTriangle,
  Fingerprint,
  Bell,
};

export default function NotificationDropdown({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onDeleteNotification,
  onNavigate,
}) {
  const dropdownRef = useRef(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'alerts'

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return notif.unread;
    if (filter === 'alerts') return notif.category === 'alert';
    return true;
  });

  const unreadTotal = notifications.filter((n) => n.unread).length;

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="Notifications Panel"
      data-lenis-prevent="true"
      className="absolute right-0 top-full mt-2 w-[360px] sm:w-[420px] max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#1c1c1c] border border-slate-200/90 dark:border-[#303030] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100"
    >
      {/* ── HEADER ── */}
      <div className="p-4 border-b border-slate-100 dark:border-[#282828] bg-slate-50/70 dark:bg-[#202020]/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                Notifications
              </h3>
              {unreadTotal > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                  {unreadTotal} new
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Live signals from AI compliance &amp; submissions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {unreadTotal > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-[#2a2a2a] transition cursor-pointer text-[11px] font-semibold flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mark all</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#2a2a2a] transition cursor-pointer"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── FILTER CHIPS ── */}
      <div className="px-3.5 py-2 border-b border-slate-100 dark:border-[#282828] bg-white dark:bg-[#1c1c1c] flex items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-[11px] ${
            filter === 'all'
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-600/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#262626]'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-[11px] ${
            filter === 'unread'
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-600/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#262626]'
          }`}
        >
          Unread ({unreadTotal})
        </button>
        <button
          type="button"
          onClick={() => setFilter('alerts')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-[11px] ${
            filter === 'alerts'
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#262626]'
          }`}
        >
          Alerts ({notifications.filter((n) => n.category === 'alert').length})
        </button>
      </div>

      {/* ── NOTIFICATION LIST ── */}
      <div
        data-lenis-prevent="true"
        className="divide-y divide-slate-100 dark:divide-[#282828] max-h-[360px] overflow-y-auto pr-0.5"
      >
        {filteredNotifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-1">
            <Bell className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs font-semibold">No notifications</p>
            <p className="text-[11px]">You're all caught up with current tenders!</p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const IconComponent = ICON_MAP[item.icon] || Bell;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.unread && onMarkAsRead) {
                    onMarkAsRead(item.id);
                  }
                  if (item.target && onNavigate) {
                    onNavigate(item.target, item);
                    onClose();
                  }
                }}
                className={`p-3.5 hover:bg-slate-50/80 dark:hover:bg-[#242424] transition-colors cursor-pointer group flex items-start gap-3 relative ${
                  item.unread
                    ? 'bg-blue-50/30 dark:bg-blue-950/15'
                    : 'bg-white dark:bg-[#1c1c1c]'
                }`}
              >
                {/* Unread Indicator Bar */}
                {item.unread && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-blue-500" />
                )}

                {/* Category Icon */}
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 mt-0.5 flex items-center justify-center ${
                    item.category === 'alert'
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      : item.category === 'submission'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : item.category === 'evaluation'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-1.5">
                    <p
                      className={`text-xs leading-snug break-words ${
                        item.unread
                          ? 'font-bold text-slate-900 dark:text-white'
                          : 'font-semibold text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.title}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap flex items-center gap-0.5 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {item.time}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                    {item.description}
                  </p>

                  {/* Badge + CTA Link */}
                  <div className="flex items-center justify-between pt-1">
                    {item.badge && (
                      <span
                        className={`inline-block px-1.5 py-0.2 text-[9.5px] font-bold rounded-md ${
                          item.badgeColor ||
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline inline-flex items-center gap-0.5 ml-auto">
                      <span>View</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>

                {/* Optional dismiss single item */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeleteNotification) {
                      onDeleteNotification(item.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition cursor-pointer self-start -mr-1"
                  title="Dismiss notification"
                  aria-label="Dismiss notification"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ── FOOTER ── */}
      <div className="p-3 border-t border-slate-100 dark:border-[#282828] bg-slate-50/70 dark:bg-[#202020]/70 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => {
            if (onNavigate) onNavigate('audit');
            onClose();
          }}
          className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
        >
          <span>Open Full Audit Trail</span>
          <ExternalLink className="w-3 h-3" />
        </button>

        <span className="text-[10px] text-slate-400">
          GeM Compliflix v2.4
        </span>
      </div>
    </div>
  );
}
