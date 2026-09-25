import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LogOut, FileSignature, ShieldCheck, X, FilePlus2, Download, Settings, FileCheck2 } from 'lucide-react';
import clsx from 'clsx';
import { triggerPwaInstall } from './PwaInstallPrompt';

function Sidebar({ user, onLogout, isOpen, onClose, onOpenSettings }) {
  const isSuperUser = 
    user.role === 'superuser' ||
    user.Role === 'superuser' ||
    user.role === 'admin' ||
    user.Role === 'admin' ||
    user.login_name === 'su' ||
    user.LoginName === 'su' ||
    user.FocusUserID === 1;

  const [showManualVoucherCreation, setShowManualVoucherCreation] = useState(
    () => localStorage.getItem('showManualVoucherCreation') === 'true'
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setShowManualVoucherCreation(localStorage.getItem('showManualVoucherCreation') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settingsUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsUpdated', handleStorageChange);
    };
  }, []);

  return (
    <>
      <button
        aria-label="Close navigation"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <aside className={`sidebar fixed lg:relative inset-y-0 left-0 z-50 w-[min(18rem,86vw)] lg:w-72 flex flex-col justify-between h-screen shrink-0 select-none transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div>
        {/* Brand Header */}
        <div className="p-5 sm:p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-indigo-700 flex items-center justify-center shadow-xl shadow-black/10">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                FocusFlow
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-white/12 text-indigo-100 uppercase">
                  ERP
                </span>
              </h1>
              <p className="text-[11px] text-indigo-200/80 font-medium">Intelligent approvals</p>
            </div>
            <button onClick={onClose} className="lg:hidden ml-auto p-2 text-indigo-100 hover:bg-white/10 rounded-xl" aria-label="Close navigation"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="px-4 py-6 space-y-6">
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-indigo-300/70 uppercase tracking-[0.16em] mb-3">
              Workspace
            </p>

            {/* Approvals */}
            <NavLink
              to="/"
              onClick={onClose}
              className={({ isActive }) => clsx(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium",
                isActive 
                  ? "bg-white text-indigo-950 font-bold shadow-xl shadow-indigo-950/20" 
                  : "text-indigo-100/75 hover:text-white hover:bg-white/10"
              )}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Approvals Queue</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            </NavLink>

            {/* Approved History */}
            <NavLink
              to="/approved"
              onClick={onClose}
              className={({ isActive }) => clsx(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium",
                isActive 
                  ? "bg-white text-indigo-950 font-bold shadow-xl shadow-indigo-950/20" 
                  : "text-indigo-100/75 hover:text-white hover:bg-white/10"
              )}
            >
              <div className="flex items-center gap-3">
                <FileCheck2 className="w-4 h-4" />
                <span>Approved History</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/25 text-emerald-200">
                Audited
              </span>
            </NavLink>

            {/* Quote / LPO Upload */}
            <NavLink
              to="/quote"
              onClick={onClose}
              className={({ isActive }) => clsx(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium",
                isActive 
                  ? "bg-white text-indigo-950 font-bold shadow-xl shadow-indigo-950/20" 
                  : "text-indigo-100/75 hover:text-white hover:bg-white/10"
              )}
            >
              <div className="flex items-center gap-3">
                <FilePlus2 className="w-4 h-4" />
                <span>Supplier Quote</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/25 text-amber-100">
                LPO
              </span>
            </NavLink>

            {/* Create Voucher - Only for Superuser when enabled */}
            {isSuperUser && showManualVoucherCreation && (
              <NavLink
                to="/create-voucher"
                onClick={onClose}
                className={({ isActive }) => clsx(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium",
                  isActive 
                    ? "bg-white text-indigo-950 font-bold shadow-xl shadow-indigo-950/20" 
                    : "text-indigo-100/75 hover:text-white hover:bg-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <FilePlus2 className="w-4 h-4" />
                  <span>New Voucher</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/25 text-indigo-100">
                  ERP
                </span>
              </NavLink>
            )}

            {/* My E-Signature Setup for Each User */}
            <button
              type="button"
              onClick={() => {
                if (onOpenSettings) onOpenSettings();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium text-indigo-100/75 hover:text-white hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <FileSignature className="w-4 h-4" />
                <span>My E-Signature</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                user.ESignURL || user.e_sign_url
                  ? 'bg-emerald-400/20 text-emerald-300' 
                  : 'bg-amber-400/20 text-amber-300'
              }`}>
                {user.ESignURL || user.e_sign_url ? 'Active' : 'Setup'}
              </span>
            </button>
          </div>

          {/* Superuser Admin Controls */}
          {isSuperUser && (
            <div>
            <p className="px-3 text-[10px] font-bold text-indigo-300/70 uppercase tracking-[0.16em] mb-3">
                Control Center
              </p>

              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) => clsx(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium",
                  isActive 
                    ? "bg-white text-indigo-950 font-bold shadow-xl shadow-indigo-950/20" 
                    : "text-indigo-100/75 hover:text-white hover:bg-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Superuser Admin</span>
                </div>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-700 border border-amber-200">
                  SU
                </span>
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* PWA Download Banner */}
      <div className="mx-4 mb-2 p-3.5 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-white shadow-inner">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-200">
            <Download className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <p className="text-xs font-bold text-white">FocusFlow App</p>
            <p className="text-[10px] text-indigo-200/70">Desktop & Mobile PWA</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            triggerPwaInstall();
            onClose();
          }}
          className="w-full py-1.5 px-3 text-[11px] font-bold rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <Download className="w-3 h-3" />
          Install / Download
        </button>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="p-3 bg-white/8 border border-white/10 rounded-2xl mb-3 flex items-center justify-between gap-2">
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">
              {user.Username || user.LoginName || user.username}
            </p>
            <p className="text-[10px] text-indigo-200/70 truncate">
              Focus User ID: {user.FocusUserID || 1}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-100 hover:text-white transition-colors"
            title="User Settings & E-Signature"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-indigo-100 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
      </aside>
    </>
  );
}

export default Sidebar;
