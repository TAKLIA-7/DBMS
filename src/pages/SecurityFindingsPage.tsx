import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, SearchCheck, Zap, Flame } from 'lucide-react';
import { Table, Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import {
  getSecurityFindings,
  createSecurityFinding,
  updateSecurityFinding,
  deleteSecurityFinding,
  getCloudResources,
} from '../services/api';
import {
  SecurityFinding,
  CloudResource,
  SeverityLevel,
  FindingStatus,
} from '../types/database';

export const SecurityFindingsPage: React.FC = () => {
  const { addToast, refreshKey, triggerRefresh, setActiveTab } = useApp();
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [resources, setResources] = useState<CloudResource[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [editingFinding, setEditingFinding] = useState<SecurityFinding | null>(null);
  const [deleteFinding, setDeleteFinding] = useState<SecurityFinding | null>(null);

  const [formData, setFormData] = useState<{
    resource_id: number | '';
    finding_type: string;
    severity: SeverityLevel;
    description: string;
    status: FindingStatus;
  }>({
    resource_id: '',
    finding_type: 'Vulnerability',
    severity: 'MEDIUM',
    description: '',
    status: 'OPEN',
  });

  useEffect(() => {
    async function load() {
      try {
        const [fList, rList] = await Promise.all([getSecurityFindings(), getCloudResources()]);
        setFindings(fList);
        setResources(rList);
        if (rList.length > 0 && !formData.resource_id) {
          setFormData(prev => ({ ...prev, resource_id: rList[0].id }));
        }
      } catch (err: any) {
        addToast({ type: 'error', title: 'Load Error', message: err.message });
      }
    }
    load();
  }, [refreshKey]);

  const handleOpenAdd = () => {
    setEditingFinding(null);
    setFormData({
      resource_id: resources.length > 0 ? resources[0].id : '',
      finding_type: 'Vulnerability',
      severity: 'HIGH',
      description: '',
      status: 'OPEN',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (f: SecurityFinding) => {
    setEditingFinding(f);
    setFormData({
      resource_id: f.resource_id,
      finding_type: f.finding_type,
      severity: f.severity,
      description: f.description,
      status: f.status,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resource_id || !formData.description.trim()) return;

    try {
      if (editingFinding) {
        await updateSecurityFinding(editingFinding.id, {
          ...formData,
          resource_id: Number(formData.resource_id),
        });
        addToast({ type: 'success', title: 'Finding Updated', message: 'Security finding updated.' });
      } else {
        const res = await createSecurityFinding({
          ...formData,
          resource_id: Number(formData.resource_id),
        });

        if (res.autoIncidentCreated) {
          addToast({
            type: 'warning',
            title: 'Critical Trigger Fired: Incident Auto-Created',
            message: 'Database trigger created an incident for this critical finding.',
          });
        } else {
          addToast({ type: 'success', title: 'Finding Registered', message: 'Finding logged into telemetry.' });
        }
      }
      setIsOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to Save', message: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteFinding) return;
    try {
      await deleteSecurityFinding(deleteFinding.id);
      addToast({ type: 'success', title: 'Finding Deleted', message: 'Telemetry finding removed.' });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setDeleteFinding(null);
    }
  };

  const columns: Column<SecurityFinding>[] = [
    { header: 'ID', accessorKey: 'id', sortable: true, cell: f => <span className="font-mono text-slate-400">#{f.id}</span> },
    {
      header: 'Target Resource',
      cell: f => (
        <div>
          <span className="font-semibold text-white block">{f.cloud_resource?.resource_name || `Res #${f.resource_id}`}</span>
          <span className="text-xs text-slate-400 font-mono">{f.cloud_resource?.resource_type}</span>
        </div>
      ),
    },
    {
      header: 'Finding Type',
      accessorKey: 'finding_type',
      sortable: true,
      cell: f => <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">{f.finding_type}</span>,
    },
    {
      header: 'Severity',
      accessorKey: 'severity',
      sortable: true,
      cell: f => <SeverityBadge severity={f.severity} />,
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: f => <span className="text-slate-300 text-xs max-w-sm line-clamp-2">{f.description}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: f => <StatusBadge status={f.status} />,
    },
    {
      header: 'Detected At',
      accessorKey: 'detected_at',
      sortable: true,
      cell: f => <span className="font-mono text-xs text-slate-400">{new Date(f.detected_at).toLocaleDateString()}</span>,
    },
    {
      header: 'Actions',
      cell: f => (
        <div className="flex items-center space-x-2">
          <button onClick={() => handleOpenEdit(f)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteFinding(f)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Trigger info note */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong className="text-white">PostgreSQL Trigger Note:</strong> Inserting a finding with severity <strong className="text-rose-400">CRITICAL</strong> automatically fires the database trigger to generate a new incident.
          </span>
        </div>
        <button
          onClick={() => setActiveTab('incidents')}
          className="text-sky-400 hover:underline flex items-center space-x-1 whitespace-nowrap"
        >
          <span>View Incidents</span>
          <Flame className="w-3.5 h-3.5" />
        </button>
      </div>

      <Table
        data={findings}
        columns={columns}
        searchPlaceholder="Search security findings..."
        searchFields={['description', 'finding_type']}
        headerAction={
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Log Finding
          </button>
        }
      />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingFinding ? 'Edit Security Finding' : 'Log Security Finding'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Affected Cloud Resource <span className="text-rose-400">*</span></label>
            <select
              value={formData.resource_id}
              onChange={e => setFormData({ ...formData, resource_id: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            >
              <option value="">-- Select Resource --</option>
              {resources.map(r => (
                <option key={r.id} value={r.id}>
                  {r.resource_name} ({r.resource_type} - {r.environment})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Finding Type</label>
              <select
                value={formData.finding_type}
                onChange={e => setFormData({ ...formData, finding_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Vulnerability">Vulnerability</option>
                <option value="Misconfiguration">Misconfiguration</option>
                <option value="Policy Violation">Policy Violation</option>
                <option value="Privilege Escalation">Privilege Escalation</option>
                <option value="Anomalous Ingress">Anomalous Ingress</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Severity Rating</label>
              <select
                value={formData.severity}
                onChange={e => setFormData({ ...formData, severity: e.target.value as SeverityLevel })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL (Triggers Incident)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Finding Description <span className="text-rose-400">*</span></label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Observation telemetry, indicators of compromise or flaw details"
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as FindingStatus })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500">
              {editingFinding ? 'Update' : 'Record'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteFinding)}
        onClose={() => setDeleteFinding(null)}
        onConfirm={handleDelete}
        title="Delete Finding"
        message="Permanently remove this security finding?"
      />
    </div>
  );
};
