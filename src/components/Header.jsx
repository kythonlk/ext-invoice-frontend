import React, { useState, useEffect } from 'react';
import { Bell, Search, CheckCircle2, ShieldCheck, FileText, Menu, ChevronRight, Download, Settings, FileSignature, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { triggerPwaInstall } from './PwaInstallPrompt';

function Header({ user, title = "Approval workspace", onMenuClick, onOpenSettings }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(localStorage.getItem('selectedCompanyCode') || '0D0');

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/companies');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setCompanies(res.data);
        const saved = localStorage.getItem('selectedCompanyCode');
        if (!saved || !res.data.some(c => c.CompanyCode === saved)) {
          const def = res.data.find(c => c.IsDefault) || res.data[0];
          setSelectedCompany(def.CompanyCode);
          localStorage.setItem('selectedCompanyCode', def.CompanyCode);
        }
      }
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleCompanyChange = (code) => {
    setSelectedCompany(code);
    localStorage.setItem('selectedCompanyCode', code);
    window.dispatchEvent(new CustomEvent('focusx:company-changed', {
      detail: { companyCode: code }
    }));
  };

  const handleOpenNotification = async (notification) => {
    if (!notification.IsRead) {
      try {
        await api.put(`/notifications/${notification.ID}/read`);
      } catch (err) {
        console.error(err);
      }
    }

    setShowNotifs(false);
    sessionStorage.setItem('openVoucherId', String(notification.VoucherID));
    sessionStorage.setItem('openVoucherTab', 'document');
    navigate('/');
    window.dispatchEvent(new CustomEvent('focusx:open-voucher', {
      detail: { voucherId: notification.VoucherID, tab: 'document' }
    }));
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 erp-header-glass min-h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
      {/* Left Title & Status */}
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden icon-button shrink-0" aria-label="Open navigation">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-950 tracking-tight truncate">{title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Focus ERP Connected
            </span>
            <span className="hidden sm:inline text-xs text-slate-400">•</span>

            {/* Active Company Display Badge */}
            <div className="flex items-center gap-1.5 bg-indigo-50/90 border border-indigo-200/80 rounded-lg px-2.5 py-0.5 shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-xs font-extrabold text-indigo-950 truncate max-w-[180px] sm:max-w-xs">
                {companies.find(c => c.CompanyCode === (user.CompanyCode || user.company_code || selectedCompany))?.Name || user.company_name || 'ERP Company'} ({user.CompanyCode || user.company_code || selectedCompany})
              </span>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("To switch company, please log in with your credentials for that company. Continue to sign in?")) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                  }
                }}
                className="ml-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                title="Switch ERP company"
              >
                Switch
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Bar */}
        <div className="relative hidden xl:block w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vouchers or ID..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100/80 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 transition-all"
          />
        </div>

        {/* Download App Button */}
        <button
          type="button"
          onClick={triggerPwaInstall}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
          title="Download FocusFlow App"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download App</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="icon-button relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notif Dropdown Panel */}
          {showNotifs && (
            <div className="notification-panel absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 bg-white border border-slate-200/80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.ID}
                      type="button"
                      onClick={() => handleOpenNotification(n)}
                      className={`w-full p-3 text-left text-xs transition-colors flex items-start justify-between gap-3 ${
                        !n.IsRead ? 'bg-indigo-50/60 font-medium hover:bg-indigo-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex gap-2.5">
                        <div className={`p-1.5 rounded-lg shrink-0 ${!n.IsRead ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{n.Title}</p>
                          <p className="text-slate-500 mt-0.5 text-[11px] leading-relaxed">{n.Message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="mt-2 w-4 h-4 text-slate-300 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* E-Sign / User Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
          title="Configure E-Signature & Settings"
        >
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Settings</span>
        </button>

        {/* Profile Card (Clickable to open settings) */}
        <button 
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 sm:pl-3 sm:border-l border-slate-200 hover:opacity-80 transition-opacity text-left"
          title="Click to manage personal profile & e-signature"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {(user.Username || user.LoginName || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
              {user.Username || user.LoginName}
              {(user.Role === 'superuser' || user.role === 'superuser' || user.LoginName === 'su') && (
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 inline-block" />
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-medium capitalize">
              {user.Role || user.role || 'User'}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}

export default Header;
