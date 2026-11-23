import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ScrollText, Shield } from 'lucide-react';
import { Table, Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useApp } from '../context/AppContext';
import {
  getSecurityPolicies,
  createSecurityPolicy,
  updateSecurityPolicy,
  deleteSecurityPolicy,
} from '../services/api';
import { SecurityPolicy } from '../types/database';

export const SecurityPoliciesPage: React.FC = () => {
  const { addToast, refreshKey, triggerRefresh } = useApp();
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SecurityPolicy | null>(null);
  const [deletePolicy, setDeletePolicy] = useState<SecurityPolicy | null>(null);

  const [formData, setFormData] = useState({
    policy_name: '',
    policy_type: 'DATA_SECURITY',
    description: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const list = await getSecurityPolicies();
        setPolicies(list);
      } catch (err: any) {
        addToast({ type: 'error', title: 'Load Error', message: err.message });
      }
    }
    load();
  }, [refreshKey]);

  const handleOpenAdd = () => {
    setEditingPolicy(null);
    setFormData({
      policy_name: '',
      policy_type: 'DATA_SECURITY',
      description: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (p: SecurityPolicy) => {
    setEditingPolicy(p);
    setFormData({
      policy_name: p.policy_name,
      policy_type: p.policy_type,
      description: p.description,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.policy_name.trim()) return;

    try {
      if (editingPolicy) {
        await updateSecurityPolicy(editingPolicy.id, formData);
        addToast({ type: 'success', title: 'Policy Updated', message: `${formData.policy_name} saved.` });
      } else {
        await createSecurityPolicy(formData);
        addToast({ type: 'success', title: 'Policy Defined', message: `${formData.policy_name} created.` });
      }
      setIsOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to Save', message: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deletePolicy) return;
    try {
      await deleteSecurityPolicy(deletePolicy.id);
      addToast({ type: 'success', title: 'Policy Deleted', message: 'Policy removed.' });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setDeletePolicy(null);
    }
  };

  const columns: Column<SecurityPolicy>[] = [
    { header: 'ID', accessorKey: 'id', sortable: true, cell: p => <span className="font-mono text-slate-400">#{p.id}</span> },
    {
      header: 'Policy Name',
      accessorKey: 'policy_name',
      sortable: true,
      cell: p => <span className="font-semibold text-white">{p.policy_name}</span>,
    },
    {
      header: 'Policy Type',
      accessorKey: 'policy_type',
      sortable: true,
      cell: p => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/40">
          {p.policy_type}
        </span>
      ),
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: p => <span className="text-slate-300 text-xs line-clamp-2">{p.description}</span>,
    },
    {
      header: 'Created Date',
      accessorKey: 'created_at',
      sortable: true,
      cell: p => <span className="font-mono text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString()}</span>,
    },
    {
      header: 'Actions',
      cell: p => (
        <div className="flex items-center space-x-2">
          <button onClick={() => handleOpenEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setDeletePolicy(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Table
        data={policies}
        columns={columns}
        searchPlaceholder="Search policies..."
        searchFields={['policy_name', 'policy_type', 'description']}
        headerAction={
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Define Policy
          </button>
        }
      />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingPolicy ? 'Edit Policy' : 'Define Security Policy'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Policy Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.policy_name}
              onChange={e => setFormData({ ...formData, policy_name: e.target.value })}
              placeholder="e.g. POL-NET-02: Disallow Public SSH/RDP Ingress"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Policy Category</label>
            <select
              value={formData.policy_type}
              onChange={e => setFormData({ ...formData, policy_type: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="DATA_SECURITY">DATA_SECURITY</option>
              <option value="ACCESS_CONTROL">ACCESS_CONTROL</option>
              <option value="DATA_PROTECTION">DATA_PROTECTION</option>
              <option value="NETWORK_SECURITY">NETWORK_SECURITY</option>
              <option value="IAM_GOVERNANCE">IAM_GOVERNANCE</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Rule Specification</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Rule criteria, evaluation conditions, and enforcement action"
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500">
              {editingPolicy ? 'Update Policy' : 'Save Policy'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletePolicy)}
        onClose={() => setDeletePolicy(null)}
        onConfirm={handleDelete}
        title="Delete Security Policy"
        message={`Delete policy '${deletePolicy?.policy_name}'? Associated violation records will also be unlinked.`}
      />
    </div>
  );
};
