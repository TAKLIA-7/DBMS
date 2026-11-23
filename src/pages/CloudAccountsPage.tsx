import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Cloud, Globe, User } from 'lucide-react';
import { Table, Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ProviderBadge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import { getCloudAccounts, createCloudAccount, updateCloudAccount, deleteCloudAccount, getUsers } from '../services/api';
import { CloudAccount, CloudProvider, User as DBUser } from '../types/database';

export const CloudAccountsPage: React.FC = () => {
  const { addToast, refreshKey, triggerRefresh } = useApp();
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [users, setUsers] = useState<DBUser[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CloudAccount | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<CloudAccount | null>(null);

  const [formData, setFormData] = useState<{
    account_name: string;
    provider: CloudProvider;
    region: string;
    owner_id: number | null;
  }>({
    account_name: '',
    provider: 'AWS',
    region: 'us-east-1',
    owner_id: null,
  });

  useEffect(() => {
    async function load() {
      try {
        const [accs, uList] = await Promise.all([getCloudAccounts(), getUsers()]);
        setAccounts(accs);
        setUsers(uList);
        if (uList.length > 0 && !formData.owner_id) {
          setFormData(prev => ({ ...prev, owner_id: uList[0].id }));
        }
      } catch (err: any) {
        addToast({ type: 'error', title: 'Load Error', message: err.message });
      }
    }
    load();
  }, [refreshKey]);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormData({
      account_name: '',
      provider: 'AWS',
      region: 'us-east-1',
      owner_id: users.length > 0 ? users[0].id : null,
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (acc: CloudAccount) => {
    setEditingAccount(acc);
    setFormData({
      account_name: acc.account_name,
      provider: acc.provider,
      region: acc.region,
      owner_id: acc.owner_id,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_name.trim()) return;

    try {
      if (editingAccount) {
        await updateCloudAccount(editingAccount.id, formData);
        addToast({ type: 'success', title: 'Account Updated', message: `Cloud account '${formData.account_name}' saved.` });
      } else {
        await createCloudAccount(formData);
        addToast({ type: 'success', title: 'Account Registered', message: `Cloud account '${formData.account_name}' registered.` });
      }
      setIsOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', message: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteAccount) return;
    try {
      await deleteCloudAccount(deleteAccount.id);
      addToast({ type: 'success', title: 'Account Removed', message: `Cloud account '${deleteAccount.account_name}' deleted.` });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setDeleteAccount(null);
    }
  };

  const columns: Column<CloudAccount>[] = [
    {
      header: 'Account ID',
      accessorKey: 'id',
      sortable: true,
      cell: r => <span className="font-mono text-slate-400">#{r.id}</span>,
    },
    {
      header: 'Account Name',
      accessorKey: 'account_name',
      sortable: true,
      cell: r => <span className="font-semibold text-white">{r.account_name}</span>,
    },
    {
      header: 'Provider',
      accessorKey: 'provider',
      sortable: true,
      cell: r => <ProviderBadge provider={r.provider} />,
    },
    {
      header: 'Primary Region',
      accessorKey: 'region',
      sortable: true,
      cell: r => (
        <span className="font-mono text-xs text-slate-300 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          {r.region}
        </span>
      ),
    },
    {
      header: 'Owner',
      cell: r => (
        <span className="text-slate-300 text-xs flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-500" />
          {r.owner?.full_name || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Created Date',
      accessorKey: 'created_at',
      sortable: true,
      cell: r => <span className="font-mono text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>,
    },
    {
      header: 'Actions',
      cell: r => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenEdit(r)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteAccount(r)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Table
        data={accounts}
        columns={columns}
        searchPlaceholder="Search cloud accounts..."
        searchFields={['account_name', 'provider', 'region']}
        headerAction={
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Connect Account
          </button>
        }
      />

      {/* Add / Edit Account Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingAccount ? 'Edit Cloud Account' : 'Connect New Cloud Account'}
        subtitle="Manage cloud tenant credentials and geographic region"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Account Identifier <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.account_name}
              onChange={e => setFormData({ ...formData, account_name: e.target.value })}
              placeholder="e.g. prod-aws-core or corp-gcp-secops"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Cloud Provider</label>
              <select
                value={formData.provider}
                onChange={e => setFormData({ ...formData, provider: e.target.value as CloudProvider })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="AWS">Amazon Web Services (AWS)</option>
                <option value="AZURE">Microsoft Azure</option>
                <option value="GCP">Google Cloud Platform (GCP)</option>
                <option value="OTHER">Other / Private Cloud</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Region</label>
              <input
                type="text"
                value={formData.region}
                onChange={e => setFormData({ ...formData, region: e.target.value })}
                placeholder="e.g. us-east-1, eu-central-1"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Account Owner (User)</label>
            <select
              value={formData.owner_id || ''}
              onChange={e => setFormData({ ...formData, owner_id: e.target.value ? Number(e.target.value) : null })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="">-- Select Owner --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-slate-400">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500">
              {editingAccount ? 'Update Account' : 'Register Account'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteAccount)}
        onClose={() => setDeleteAccount(null)}
        onConfirm={handleDelete}
        title="Delete Cloud Account"
        message={`Delete cloud account '${deleteAccount?.account_name}'? Associated resources will be orphaned or deleted.`}
      />
    </div>
  );
};
