import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading security data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-3">
      <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-mono text-slate-400">{message}</span>
    </div>
  );
};
