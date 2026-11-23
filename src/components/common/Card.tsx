import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info';
  trend?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  onClick,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'danger':
        return {
          bg: 'bg-slate-900 border-rose-500/20 hover:border-rose-500/40',
          iconBg: 'bg-rose-500/10 text-rose-400',
          valueColor: 'text-rose-400',
        };
      case 'warning':
        return {
          bg: 'bg-slate-900 border-amber-500/20 hover:border-amber-500/40',
          iconBg: 'bg-amber-500/10 text-amber-400',
          valueColor: 'text-amber-400',
        };
      case 'success':
        return {
          bg: 'bg-slate-900 border-emerald-500/20 hover:border-emerald-500/40',
          iconBg: 'bg-emerald-500/10 text-emerald-400',
          valueColor: 'text-emerald-400',
        };
      case 'info':
        return {
          bg: 'bg-slate-900 border-sky-500/20 hover:border-sky-500/40',
          iconBg: 'bg-sky-500/10 text-sky-400',
          valueColor: 'text-sky-400',
        };
      default:
        return {
          bg: 'bg-slate-900 border-slate-800 hover:border-slate-700',
          iconBg: 'bg-slate-800 text-slate-300',
          valueColor: 'text-white',
        };
    }
  };

  const style = getColors();

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-5 transition-all duration-200 shadow-sm ${style.bg} ${
        onClick ? 'cursor-pointer transform hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{title}</span>
        <div className={`p-2 rounded-lg ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className={`text-3xl font-bold tracking-tight ${style.valueColor}`}>{value}</span>
        {trend && (
          <span className="text-xs font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};

export const Card: React.FC<{
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, children, className = '' }) => {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-semibold text-white">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
