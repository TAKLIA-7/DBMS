import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertOctagon, CheckCircle } from 'lucide-react';
import { Table, Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { StatusBadge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import {
  getPolicyViolations,
  createPolicyViolation,
  updatePolicyViolation,
  deletePolicyViolation,
  getSecurityPolicies,
  getCloudResources,
} from '../services/api';
import {
  PolicyViolation,
  SecurityPolicy,
  CloudResource,
  ViolationStatus,
} from '../types/database';

export const PolicyViolationsPage: React.FC = () => {
  const { addToast, refreshKey, triggerRefresh } = useApp();
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [resources, setResources] = useState<CloudResource[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [editingViolation, setEditingViolation] = useState<PolicyViolation | null>(null);
  const [deleteViolation, setDeleteViolation] = useState<PolicyViolation | null>(null);

  const [formData, setFormData] = useState<{
    policy_id: number | '';
    resource_id: number | '';
    violation_description: string;
    status: ViolationStatus;
  }>({
    policy_id: '',
    resource_id: '',
    violation_description: '',
    status: 'OPEN',
  });

  useEffect(() => {
    async function load() {
      try {
        const [vList, pList, rList] = await Promise.all([
          getPolicyViolations(),
          getSecurityPolicies(),
          getCloudResources(),
        ]);
        setViolations(vList);
        setPolicies(pList);
        setResources(rList);
        if (pList.length > 0 && !formData.policy_id) {
          setFormData(prev => ({
            ...prev,
            policy_id: pList[0].id,
            resource_id: rList.length > 0 ? rList[0].id : '',
          }));
        }
      } catch (err: any) {
        addToast({ type: 'error', title: 'Load Error', message: err.message });
      }
    }
    load();
  }, [refreshKey]);

  const handleOpenAdd = () => {
    setEditingViolation(null);
    setFormData({
      policy_id: policies.length > 0 ? policies[0].id : '',
      resource_id: resources.length > 0 ? resources[0].id : '',
      violation_description: '',
      status: 'OPEN',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (v: PolicyViolation) => {
    setEditingViolation(v);
    setFormData({
      policy_id: v.policy_id,
      resource_id: v.resource_id,
      violation_description: v.violation_description,
      status: v.status,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.policy_id || !formData.resource_id || !formData.violation_description.trim()) return;

    try {
      if (editingViolation) {
        await updatePolicyViolation(editingViolation.id, {
          ...formData,
          policy_id: Number(formData.policy_id),
          resource_id: Number(formData.resource_id),
        });
        addToast({ type: 'success', title: 'Violation Updated', message: 'Violation state recorded.' });
      } else {
        await createPolicyViolation({
          ...formData,
          policy_id: Number(formData.policy_id),
          resource_id: Number(formData.resource_id),
        });
        addToast({ type: 'success', title: 'Violation Logged', message: 'Non-compliance incident registered.' });
      }
      setIsOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Operation Failed', message: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteViolation) return;
    try {
      await deletePolicyViolation(deleteViolation.id);
      addToast({ type: 'success', title: 'Violation Removed', message: 'Record deleted.' });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setDeleteViolation(null);
    }
  };

  const columns: Column<PolicyViolation>[] = [
    { header: 'ID', accessorKey: 'id', sortable: true, cell: v => <span className="font-mono text-slate-400">#{v.id}</span> },
    {
      header: 'Violated Policy',
      cell: v => (
        <div>
          <span className="font-semibold text-white block">{v.security_policy?.policy_name || `Policy #${v.policy_id}`}</span>
          <span className="text-xs text-sky-400 font-mono">{v.security_policy?.policy_type}</span>
        </div>
      ),
    },
    {
      header: 'Cloud Resource',
      cell: v => (
        <div>
          <span className="font-semibold text-white block">{v.cloud_resource?.resource_name || `Res #${v.resource_id}`}</span>
          <span className="text-xs text-slate-400 font-mono">{v.cloud_resource?.environment}</span>
        </div>
      ),
    },
    {
      header: 'Violation Details',
      accessorKey: 'violation_description',
      cell: v => <span className="text-slate-300 text-xs max-w-sm line-clamp-2">{v.violation_description}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: v => <StatusBadge status={v.status} />,
    },
    {
      header: 'Detected Date',
      accessorKey: 'detected_at',
      sortable: true,
      cell: v => <span className="font-mono text-xs text-slate-400">{new Date(v.detected_at).toLocaleDateString()}</span>,
    },
    {
      header: 'Actions',
      cell: v => (
        <div className="flex items-center space-x-2">
          <button onClick={() => handleOpenEdit(v)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteViolation(v)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Table
        data={violations}
        columns={columns}
        searchPlaceholder="Search policy violations..."
        searchFields={['violation_description', 'status']}
        headerAction={
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Report Violation
          </button>
        }
      />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingViolation ? 'Edit Policy Violation' : 'Log Policy Violation'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Security Policy <span className="text-rose-400">*</span></label>
            <select
              value={formData.policy_id}
              onChange={e => setFormData({ ...formData, policy_id: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            >
              <option value="">-- Select Policy --</option>
              {policies.map(p => (
                <option key={p.id} value={p.id}>
                  {p.policy_name} ({p.policy_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Non-Compliant Cloud Resource <span className="text-rose-400">*</span></label>
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Violation Description <span className="text-rose-400">*</span></label>
            <textarea
              value={formData.violation_description}
              onChange={e => setFormData({ ...formData, violation_description: e.target.value })}
              placeholder="e.g. Ingress port 22 open to 0.0.0.0/0 without VPN gateway"
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as ViolationStatus })}
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
              {editingViolation ? 'Update' : 'Record'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteViolation)}
        onClose={() => setDeleteViolation(null)}
        onConfirm={handleDelete}
        title="Delete Violation"
        message="Remove this policy violation record?"
      />
    </div>
  );
};
