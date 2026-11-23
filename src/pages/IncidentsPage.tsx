import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Flame, CheckCircle, Clock, Send, UserCheck, ShieldAlert } from 'lucide-react';
import { Table, Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import {
  getIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
  getIncidentActions,
  addIncidentAction,
  getSecurityFindings,
  getUsers,
} from '../services/api';
import {
  Incident,
  IncidentAction,
  SecurityFinding,
  User,
  IncidentPriority,
  IncidentStatus,
} from '../types/database';

export const IncidentsPage: React.FC = () => {
  const { addToast, refreshKey, triggerRefresh, currentUser, selectedIncidentId, setSelectedIncidentId } = useApp();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Modals
  const [isOpen, setIsOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [deleteIncidentItem, setDeleteIncidentItem] = useState<Incident | null>(null);

  // Detail Modal & Action History
  const [detailIncident, setDetailIncident] = useState<Incident | null>(null);
  const [actions, setActions] = useState<IncidentAction[]>([]);
  const [newActionText, setNewActionText] = useState('');
  const [actionPerformerId, setActionPerformerId] = useState<number | ''>('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    finding_id: number | null;
    assigned_to: number | null;
    priority: IncidentPriority;
    status: IncidentStatus;
    description: string;
  }>({
    title: '',
    finding_id: null,
    assigned_to: null,
    priority: 'HIGH',
    status: 'OPEN',
    description: '',
  });

  const loadData = async () => {
    try {
      const [iList, fList, uList] = await Promise.all([
        getIncidents(),
        getSecurityFindings(),
        getUsers(),
      ]);
      setIncidents(iList);
      setFindings(fList);
      setUsers(uList);

      // Check if selected from Dashboard
      if (selectedIncidentId) {
        const found = iList.find(i => i.id === selectedIncidentId);
        if (found) {
          handleOpenDetail(found);
        }
        setSelectedIncidentId(null);
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Load Error', message: err.message });
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const handleOpenDetail = async (inc: Incident) => {
    setDetailIncident(inc);
    try {
      const acts = await getIncidentActions(inc.id);
      setActions(acts);
      setActionPerformerId(currentUser?.id || (users.length > 0 ? users[0].id : ''));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setEditingIncident(null);
    setFormData({
      title: '',
      finding_id: null,
      assigned_to: users.length > 0 ? users[0].id : null,
      priority: 'HIGH',
      status: 'OPEN',
      description: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (inc: Incident) => {
    setEditingIncident(inc);
    setFormData({
      title: inc.title,
      finding_id: inc.finding_id,
      assigned_to: inc.assigned_to,
      priority: inc.priority,
      status: inc.status,
      description: inc.description || '',
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingIncident) {
        await updateIncident(editingIncident.id, formData);
        addToast({ type: 'success', title: 'Incident Updated', message: `${formData.title} saved.` });
      } else {
        await createIncident(formData);
        addToast({ type: 'success', title: 'Incident Created', message: `${formData.title} dispatched.` });
      }
      setIsOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Operation Failed', message: err.message });
    }
  };

  const handleStatusChangeInDetail = async (newStatus: IncidentStatus) => {
    if (!detailIncident) return;
    try {
      const updated = await updateIncident(detailIncident.id, { status: newStatus });
      setDetailIncident(updated);

      // Auto-log status change action in timeline
      await addIncidentAction({
        incident_id: detailIncident.id,
        performed_by: currentUser?.id || null,
        action_description: `Incident status transitioned to ${newStatus}.`,
      });

      const acts = await getIncidentActions(detailIncident.id);
      setActions(acts);

      addToast({ type: 'success', title: 'Status Updated', message: `Incident is now ${newStatus}.` });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Status Change Failed', message: err.message });
    }
  };

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailIncident || !newActionText.trim()) return;

    try {
      setSubmittingAction(true);
      await addIncidentAction({
        incident_id: detailIncident.id,
        performed_by: actionPerformerId ? Number(actionPerformerId) : null,
        action_description: newActionText.trim(),
      });
      setNewActionText('');
      const acts = await getIncidentActions(detailIncident.id);
      setActions(acts);
      addToast({ type: 'success', title: 'Action Appended', message: 'Remediation note logged to incident timeline.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to Append Action', message: err.message });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteIncidentItem) return;
    try {
      await deleteIncident(deleteIncidentItem.id);
      addToast({ type: 'success', title: 'Incident Deleted', message: 'Record removed.' });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setDeleteIncidentItem(null);
    }
  };

  const columns: Column<Incident>[] = [
    { header: 'ID', accessorKey: 'id', sortable: true, cell: i => <span className="font-mono text-slate-400">#{i.id}</span> },
    {
      header: 'Incident Title',
      accessorKey: 'title',
      sortable: true,
      cell: i => (
        <button
          onClick={() => handleOpenDetail(i)}
          className="font-semibold text-white hover:text-sky-400 text-left transition flex items-center gap-1.5"
        >
          <span className="max-w-md truncate">{i.title}</span>
          <Eye className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        </button>
      ),
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      sortable: true,
      cell: i => <SeverityBadge severity={i.priority} />,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: i => <StatusBadge status={i.status} />,
    },
    {
      header: 'Assigned Responder',
      cell: i => (
        <span className="text-slate-300 text-xs flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
          {i.assigned_user?.full_name || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Created Date',
      accessorKey: 'created_at',
      sortable: true,
      cell: i => <span className="font-mono text-xs text-slate-400">{new Date(i.created_at).toLocaleDateString()}</span>,
    },
    {
      header: 'Resolved Date',
      cell: i => (
        <span className="font-mono text-xs text-slate-400">
          {i.resolved_at ? new Date(i.resolved_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: i => (
        <div className="flex items-center space-x-2">
          <button onClick={() => handleOpenDetail(i)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition" title="View Detail & Timeline">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => handleOpenEdit(i)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition" title="Edit Incident">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteIncidentItem(i)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Table
        data={incidents}
        columns={columns}
        searchPlaceholder="Search incidents..."
        searchFields={['title', 'description', 'priority', 'status']}
        headerAction={
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Incident
          </button>
        }
      />

      {/* Add / Edit Incident Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingIncident ? 'Edit Incident' : 'Open Security Incident'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Incident Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. INC-2026-004: Unauthorized Root Escalation on Auth API"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as IncidentPriority })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as IncidentStatus })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Assigned Responder (User)</label>
            <select
              value={formData.assigned_to || ''}
              onChange={e => setFormData({ ...formData, assigned_to: e.target.value ? Number(e.target.value) : null })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="">-- Unassigned --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Related Security Finding (Optional / Unique)</label>
            <select
              value={formData.finding_id || ''}
              onChange={e => setFormData({ ...formData, finding_id: e.target.value ? Number(e.target.value) : null })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="">-- No Direct Finding Link --</option>
              {findings
                .filter(f => !incidents.some(i => i.finding_id === f.id && i.id !== editingIncident?.id))
                .map(f => (
                  <option key={f.id} value={f.id}>
                    Finding #{f.id}: {f.description.slice(0, 60)}... [{f.severity}]
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Incident Summary & Initial Findings</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Context, blast radius, initial containment steps"
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500">
              {editingIncident ? 'Update Incident' : 'Dispatch Incident'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Incident Detail & Action Timeline Modal */}
      {detailIncident && (
        <Modal
          isOpen={Boolean(detailIncident)}
          onClose={() => setDetailIncident(null)}
          title={`Incident #${detailIncident.id}: ${detailIncident.title}`}
          subtitle="Detailed case file, investigation timeline, and response actions"
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Status & Priority Control Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center space-x-3">
                <SeverityBadge severity={detailIncident.priority} />
                <StatusBadge status={detailIncident.status} />
                <span className="text-xs text-slate-400 font-mono">
                  Owner: <span className="text-white font-semibold">{detailIncident.assigned_user?.full_name || 'Unassigned'}</span>
                </span>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center space-x-2">
                {detailIncident.status !== 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleStatusChangeInDetail('IN_PROGRESS')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-300 bg-blue-950 border border-blue-800/60 hover:bg-blue-900 transition"
                  >
                    Start Triage
                  </button>
                )}
                {detailIncident.status !== 'RESOLVED' ? (
                  <button
                    onClick={() => handleStatusChangeInDetail('RESOLVED')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-950 border border-emerald-800/60 hover:bg-emerald-900 transition"
                  >
                    Mark Resolved
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChangeInDetail('OPEN')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-950 border border-amber-800/60 hover:bg-amber-900 transition"
                  >
                    Reopen Case
                  </button>
                )}
              </div>
            </div>

            {/* Case Details & Linked Finding */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-400 uppercase tracking-wider block">Timestamps</span>
                <p className="text-slate-300">Created: <span className="font-mono text-white">{new Date(detailIncident.created_at).toLocaleString()}</span></p>
                <p className="text-slate-300">Resolved: <span className="font-mono text-white">{detailIncident.resolved_at ? new Date(detailIncident.resolved_at).toLocaleString() : 'Pending'}</span></p>
                {detailIncident.description && (
                  <p className="mt-2 text-slate-300 border-t border-slate-800 pt-2">{detailIncident.description}</p>
                )}
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-400 uppercase tracking-wider block">Associated Finding</span>
                {detailIncident.security_finding ? (
                  <>
                    <p className="text-white font-semibold">Finding #{detailIncident.security_finding.id} ({detailIncident.security_finding.finding_type})</p>
                    <p className="text-slate-400">{detailIncident.security_finding.description}</p>
                    <div className="mt-2"><SeverityBadge severity={detailIncident.security_finding.severity} /></div>
                  </>
                ) : (
                  <p className="text-slate-500 italic">No direct linked security finding.</p>
                )}
              </div>
            </div>

            {/* Action History Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-400" />
                Remediation Actions & Timeline (incident_actions: {actions.length})
              </h4>

              {/* Add Action Input */}
              <form onSubmit={handleAddAction} className="flex gap-2">
                <select
                  value={actionPerformerId}
                  onChange={e => setActionPerformerId(e.target.value ? Number(e.target.value) : '')}
                  className="w-44 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">-- Operator --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newActionText}
                  onChange={e => setNewActionText(e.target.value)}
                  placeholder="Record an investigation action, forensic note, or firewall update..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={submittingAction || !newActionText.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-40 flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Log</span>
                </button>
              </form>

              {/* Timeline list */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {actions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No action entries recorded yet.</p>
                ) : (
                  actions.map(act => (
                    <div key={act.id} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start justify-between text-xs">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-sky-400">{act.performer?.full_name || 'System / Auto'}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(act.action_date).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-200">{act.action_description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteIncidentItem)}
        onClose={() => setDeleteIncidentItem(null)}
        onConfirm={handleDelete}
        title="Delete Incident"
        message={`Delete '${deleteIncidentItem?.title}'? Linked actions will also be deleted.`}
      />
    </div>
  );
};
