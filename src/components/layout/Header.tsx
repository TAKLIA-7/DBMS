import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Search,
  Database,
  Radio,
  UserCircle,
  ExternalLink,
  ShieldAlert,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavigationTab } from '../../types/database';

export const Header: React.FC<{ onMenuToggle: () => void }> = ({ onMenuToggle }) => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    setCurrentUser,
    availableUsers,
    isDemoMode,
    toggleDemoMode,
    supabaseConnected,
    supabaseUrl,
    searchQuery,
    setSearchQuery,
    toasts,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getPageTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Security Dashboard', desc: 'Real-time overview of cloud assets, posture & incidents' };
      case 'users':
        return { title: 'User Management', desc: 'Security personnel and account credentials' };
      case 'roles-permissions':
        return { title: 'Roles & Access Control', desc: 'RBAC mapping with composite key assignments' };
      case 'cloud-accounts':
        return { title: 'Cloud Accounts', desc: 'Registered AWS, GCP, Azure, and custom cloud tenants' };
      case 'cloud-resources':
        return { title: 'Cloud Resources', desc: 'Virtual machines, storage buckets, databases, and networks' };
      case 'vulnerabilities':
        return { title: 'Vulnerabilities (CVE)', desc: 'CVE catalog, CVSS scores, and resource associations' };
      case 'security-policies':
        return { title: 'Security Policies', desc: 'Baseline security and governance compliance rules' };
      case 'policy-violations':
        return { title: 'Policy Violations', desc: 'Active non-compliance detections across cloud infrastructure' };
      case 'security-findings':
        return { title: 'Security Findings', desc: 'Correlated telemetry with critical incident auto-trigger' };
      case 'incidents':
        return { title: 'Incident Response & Case Management', desc: 'Triaging, assignments, and resolution action logs' };
      case 'compliance':
        return { title: 'Compliance & Audits', desc: 'ISO 27001, SOC 2, and GDPR requirements assessment' };
      case 'audit-logs':
        return { title: 'System Audit Logs', desc: 'Immutable timeline of data changes and security operations' };
      case 'reports':
        return { title: 'Analytics & Reporting', desc: 'Vulnerability distributions, status metrics, and CSV exports' };
      case 'settings':
        return { title: 'System Settings', desc: 'Supabase PostgreSQL connection, credentials, and mode' };
      default:
        return { title: 'Cloud Security', desc: 'Management System' };
    }
  };

  const { title, desc } = getPageTitle(activeTab);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-5 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Menu + Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {title}
            </h2>
            <p className="hidden sm:block text-xs text-slate-400 mt-0.5">{desc}</p>
          </div>
        </div>

        {/* Right: Search + Connection Status + User Switcher */}
        <div className="flex items-center space-x-3">
          {/* Supabase Status Pill */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition ${
              supabaseConnected
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
            }`}
            title="Configure Supabase Connection"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{supabaseConnected ? 'Supabase: Connected' : 'Demo Mode'}</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition relative"
              aria-label="Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">Recent Alerts</span>
                  <button
                    onClick={() => setActiveTab('incidents')}
                    className="text-[11px] text-sky-400 hover:underline"
                  >
                    View Incidents
                  </button>
                </div>
                <div className="mt-2 space-y-2 text-xs">
                  <div className="p-2 rounded bg-rose-950/40 border border-rose-800/40 flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-rose-200 font-medium">Critical TLS RCE Detected</p>
                      <p className="text-slate-400 text-[11px]">CVE-2026-3190 on prod-api-gateway-vm</p>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-amber-950/40 border border-amber-800/40 flex items-start space-x-2">
                    <Radio className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-200 font-medium">Policy Violation: SSH Ingress</p>
                      <p className="text-slate-400 text-[11px]">Port 22 open 0.0.0.0/0 on gateway VM</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Switcher Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1.5 pl-2.5 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 transition text-xs font-medium text-slate-200"
            >
              <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-white text-[11px] font-bold">
                {currentUser ? currentUser.full_name.charAt(0) : 'U'}
              </div>
              <span className="hidden sm:inline-block max-w-[100px] truncate">
                {currentUser?.full_name || 'Sign In'}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs font-semibold text-white">{currentUser?.full_name}</p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{currentUser?.email}</p>
                </div>
                <div className="pt-2">
                  <p className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                    Switch Active User
                  </p>
                  {availableUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <span className="truncate">{u.full_name}</span>
                      {currentUser?.id === u.id && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
