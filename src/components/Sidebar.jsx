import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, FileSignature, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import clsx from 'clsx';

function Sidebar({ user, onLogout }) {
  const isSuperUser = 
    user.role === 'superuser' ||
    user.Role === 'superuser' ||
    user.role === 'admin' ||
    user.Role === 'admin' ||
    user.login_name === 'su' ||
    user.LoginName === 'su' ||
    user.FocusUserID === 1;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen shrink-0 shadow-xs select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                Focus ERP
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 uppercase">
                  Suite
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Invoice Approval Engine</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="px-4 py-6 space-y-6">
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Main Menu
            </p>

            {/* Approvals */}
            <NavLink
              to="/"
              className={({ isActive }) => clsx(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium",
                isActive 
                  ? "bg-indigo-50/80 text-indigo-700 font-bold border border-indigo-100 shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Approvals</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            </NavLink>
          </div>

          {/* Superuser Admin Controls */}
          {isSuperUser && (
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Control Center
              </p>

              <NavLink
                to="/admin"
                className={({ isActive }) => clsx(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium",
                  isActive 
                    ? "bg-indigo-50/80 text-indigo-700 font-bold border border-indigo-100 shadow-xs" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
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

      {/* User Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="p-3 bg-white border border-slate-200/80 rounded-xl mb-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate">
                {user.Username || user.LoginName || user.username}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                Focus User ID: {user.FocusUserID || user.FocusUserID || 1}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 capitalize border border-indigo-100 shrink-0">
              {user.Role || user.role || 'normal'}
            </span>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-100 rounded-xl transition-colors shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
