import React, { useState, useEffect, useMemo } from 'react';
import { History, Filter, User, Calendar, Table as TableIcon, Activity } from 'lucide-react';
import { Table, Column } from '../components/common/Table';
import { useApp } from '../context/AppContext';
import { getAuditLogs, getUsers } from '../services/api';
import { AuditLog, User as DBUser } from '../types/database';

export const AuditLogsPage: React.FC = () => {
  const { addToast, refreshKey } = useApp();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<DBUser[]>([]);

  // Filter state
  const [userFilter, setUserFilter] = useState<string>('ALL');
  const [tableFilter, setTableFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  useEffect(() => {
    async function load() {
      try {
        const [lList, uList] = await Promise.all([getAuditLogs(), getUsers()]);
        setLogs(lList);
        setUsers(uList);
      } catch (err: any) {
        addToast({ type: 'error', title: 'Load Error', message: err.message });
      }
    }
    load();
  }, [refreshKey]);

  // Derived filter options
  const tableNames = useMemo(() => {
    const set = new Set(logs.map(l => l.table_name));
    return Array.from(set);
  }, [logs]);

  const actionNames = useMemo(() => {
    const set = new Set(logs.map(l => l.action));
    return Array.from(set);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (userFilter !== 'ALL') {
        if (userFilter === 'SYSTEM' && log.user_id !== null) return false;
        if (userFilter !== 'SYSTEM' && String(log.user_id) !== userFilter) return false;
      }
      if (tableFilter !== 'ALL' && log.table_name !== tableFilter) return false;
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      return true;
    });
  }, [logs, userFilter, tableFilter, actionFilter]);

  const columns: Column<AuditLog>[] = [
    {
      header: 'Log ID',
      accessorKey: 'id',
      sortable: true,
      cell: r => <span className="font-mono text-slate-400">#{r.id}</span>,
    },
    {
      header: 'Action Taken',
      accessorKey: 'action',
      sortable: true,
      cell: r => (
        <span className="font-mono font-bold text-xs text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
          {r.action}
        </span>
      ),
    },
    {
      header: 'Target Table',
      accessorKey: 'table_name',
      sortable: true,
      cell: r => (
        <span className="font-mono text-xs text-slate-300 flex items-center gap-1.5">
          <TableIcon className="w-3.5 h-3.5 text-slate-500" />
          {r.table_name}
        </span>
      ),
    },
    {
      header: 'Record Key / ID',
      accessorKey: 'record_id',
      cell: r => <span className="font-mono text-xs text-amber-400">{r.record_id || '—'}</span>,
    },
    {
      header: 'Triggered By (User)',
      cell: r => (
        <span className="text-slate-300 text-xs flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-500" />
          {r.user ? r.user.full_name : <span className="text-slate-500 italic">System / Trigger</span>}
        </span>
      ),
    },
    {
      header: 'Timestamp',
      accessorKey: 'action_timestamp',
      sortable: true,
      cell: r => (
        <span className="font-mono text-xs text-slate-400 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          {new Date(r.action_timestamp).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-sky-400" />
            Append-Only Audit Log Trace
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Security actions and database mutations are logged sequentially. Modification and deletion are disabled.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Table filter */}
          <select
            value={tableFilter}
            onChange={e => setTableFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
          >
            <option value="ALL">All Tables</option>
            {tableNames.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Action filter */}
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
          >
            <option value="ALL">All Actions</option>
            {actionNames.map(a => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* User filter */}
          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
          >
            <option value="ALL">All Users</option>
            <option value="SYSTEM">System / Triggers</option>
            {users.map(u => (
              <option key={u.id} value={String(u.id)}>
                {u.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Table
        data={filteredLogs}
        columns={columns}
        searchPlaceholder="Search audit events by action or table..."
        searchFields={['action', 'table_name', 'record_id']}
        emptyMessage="No audit logs matched the selected filters"
      />
    </div>
  );
};
