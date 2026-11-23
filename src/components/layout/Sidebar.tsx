import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Cloud,
  Server,
  Bug,
  ScrollText,
  AlertOctagon,
  SearchCheck,
  Flame,
  FileCheck,
  History,
  BarChart3,
  Settings,
  Shield,
  Database,
  Radio,
} from 'lucide-react';
import { NavigationTab } from '../../types/database';
import { useApp } from '../../context/AppContext';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, isDemoMode, supabaseConnected } = useApp();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'roles-permissions', label: 'Roles & Permissions', icon: ShieldCheck },
    { id: 'cloud-accounts', label: 'Cloud Accounts', icon: Cloud },
    { id: 'cloud-resources', label: 'Cloud Resources', icon: Server },
    { id: 'vulnerabilities', label: 'Vulnerabilities', icon: Bug },
    { id: 'security-policies', label: 'Security Policies', icon: ScrollText },
    { id: 'policy-violations', label: 'Policy Violations', icon: AlertOctagon },
    { id: 'security-findings', label: 'Security Findings', icon: SearchCheck },
    { id: 'incidents', label: 'Incidents', icon: Flame },
    { id: 'compliance', label: 'Compliance', icon: FileCheck },
    { id: 'audit-logs', label: 'Audit Logs', icon: History },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelect = (tab: NavigationTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-navy-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white leading-tight">CLOUD SEC-OPS</h1>
              <span className="text-[10px] text-cyan-400 font-mono tracking-wider">RDBMS SIMS v1.0</span>
            </div>
          </div>
        </div>

        {/* System status pill */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/60">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Radio className={`w-3.5 h-3.5 ${supabaseConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              <span className="text-slate-300 font-mono text-[11px]">
                {supabaseConnected ? 'Supabase Connected' : 'Demo Mode Active'}
              </span>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              supabaseConnected ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
            }`}>
              {supabaseConnected ? 'LIVE' : 'DEMO'}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-1">
            Security Modules
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition duration-150 group ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon
                    className={`w-4 h-4 transition duration-150 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>RDBMS College Project</span>
            <span className="font-mono text-cyan-500">PostgreSQL</span>
          </div>
        </div>
      </aside>
    </>
  );
};
