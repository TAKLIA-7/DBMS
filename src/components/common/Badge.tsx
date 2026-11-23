import React from 'react';
import { SeverityLevel, IncidentStatus, ComplianceStatus, CloudProvider, EnvironmentType } from '../../types/database';

export const SeverityBadge: React.FC<{ severity: SeverityLevel | string }> = ({ severity }) => {
  const sev = (severity || '').toUpperCase();
  switch (sev) {
    case 'CRITICAL':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-500/30">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-400 animate-pulse"></span>
          CRITICAL
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-950/70 text-orange-300 border border-orange-500/30">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-orange-400"></span>
          HIGH
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-400"></span>
          MEDIUM
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-950/70 text-sky-300 border border-sky-500/30">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-sky-400"></span>
          LOW
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: IncidentStatus | string }> = ({ status }) => {
  const st = (status || '').toUpperCase();
  switch (st) {
    case 'OPEN':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/40 text-red-300 border border-red-700/50">
          OPEN
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-700/50">
          IN PROGRESS
        </span>
      );
    case 'RESOLVED':
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-300 border border-emerald-700/50">
          {st}
        </span>
      );
    case 'INACTIVE':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
          INACTIVE
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          {status}
        </span>
      );
  }
};

export const ComplianceBadge: React.FC<{ status: ComplianceStatus | string }> = ({ status }) => {
  const st = (status || '').toUpperCase();
  switch (st) {
    case 'COMPLIANT':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
          COMPLIANT
        </span>
      );
    case 'NON_COMPLIANT':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-500/30">
          NON-COMPLIANT
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/30">
          PENDING
        </span>
      );
  }
};

export const ProviderBadge: React.FC<{ provider: CloudProvider | string }> = ({ provider }) => {
  const p = (provider || '').toUpperCase();
  let color = 'bg-slate-800 text-slate-300 border-slate-700';
  if (p === 'AWS') color = 'bg-amber-950/80 text-amber-300 border-amber-600/40';
  else if (p === 'AZURE') color = 'bg-blue-950/80 text-blue-300 border-blue-600/40';
  else if (p === 'GCP') color = 'bg-red-950/80 text-red-300 border-red-600/40';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${color}`}>
      {p}
    </span>
  );
};

export const EnvironmentBadge: React.FC<{ env: EnvironmentType | string }> = ({ env }) => {
  const e = (env || '').toUpperCase();
  let color = 'bg-slate-800 text-slate-300 border-slate-700';
  if (e === 'PRODUCTION') color = 'bg-purple-950/80 text-purple-300 border-purple-600/40';
  else if (e === 'DEVELOPMENT') color = 'bg-sky-950/80 text-sky-300 border-sky-600/40';
  else if (e === 'TESTING') color = 'bg-teal-950/80 text-teal-300 border-teal-600/40';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${color}`}>
      {e}
    </span>
  );
};
