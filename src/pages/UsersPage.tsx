import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, UserCheck, Mail, Calendar } from 'lucide-react';
import { Table, Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useApp } from '../context/AppContext';
import { getUsers, createUser, updateUser, deleteUser, getUserRoles, getRoles, assignUserRole, removeUserRole } from '../services/api';
import { User, Role, UserRole } from '../types/database';

export const UsersPage: React.FC = () => {
  const { addToast, refreshKey, triggerRefresh } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [roleAssignUser, setRoleAssignUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Role Assignment state
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [uList, rList, urList] = await Promise.all([
        getUsers(),
        getRoles(),
        getUserRoles(),
      ]);
      setUsers(uList);
      setRoles(rList);
      setUserRoles(urList);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error Loading Users', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.username.trim()) errors.username = 'Username is required.';
    if (!formData.email.trim()) errors.email = 'Email address is required.';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = 'Valid email is required.';
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ username: '', email: '', full_name: '' });
    setFormErrors({});
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
    });
    setFormErrors({});
    setIsAddEditOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      if (editingUser) {
        await updateUser(editingUser.id, formData);
        addToast({ type: 'success', title: 'User Updated', message: `User '${formData.username}' saved.` });
      } else {
        await createUser(formData);
        addToast({ type: 'success', title: 'User Created', message: `User '${formData.username}' added.` });
      }
      setIsAddEditOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Operation Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmUser) return;
    try {
      await deleteUser(deleteConfirmUser.id);
      addToast({ type: 'success', title: 'User Deleted', message: `User '${deleteConfirmUser.username}' removed.` });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Deletion Failed', message: err.message });
    } finally {
      setDeleteConfirmUser(null);
    }
  };

  const handleAssignRole = async () => {
    if (!roleAssignUser || !selectedRoleId) return;
    try {
      await assignUserRole(roleAssignUser.id, Number(selectedRoleId));
      addToast({ type: 'success', title: 'Role Assigned', message: 'User role updated successfully.' });
      setSelectedRoleId('');
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Assignment Failed', message: err.message });
    }
  };

  const handleRemoveRole = async (userId: number, roleId: number) => {
    try {
      await removeUserRole(userId, roleId);
      addToast({ type: 'success', title: 'Role Removed', message: 'Role revoked from user.' });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Action Failed', message: err.message });
    }
  };

  const getUserAssignedRoles = (userId: number) => {
    const assignedRoleIds = userRoles.filter(ur => ur.user_id === userId).map(ur => ur.role_id);
    return roles.filter(r => assignedRoleIds.includes(r.id));
  };

  const columns: Column<User>[] = [
    {
      header: 'ID',
      accessorKey: 'id',
      sortable: true,
      cell: row => <span className="font-mono text-slate-400">#{row.id}</span>,
    },
    {
      header: 'Full Name',
      accessorKey: 'full_name',
      sortable: true,
      cell: row => (
        <div>
          <span className="font-semibold text-white block">{row.full_name}</span>
          <span className="text-xs text-slate-400 font-mono">@{row.username}</span>
        </div>
      ),
    },
    {
      header: 'Email',
      accessorKey: 'email',
      sortable: true,
      cell: row => (
        <span className="text-slate-300 font-mono text-xs flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-slate-500" />
          {row.email}
        </span>
      ),
    },
    {
      header: 'Assigned Roles',
      cell: row => {
        const assigned = getUserAssignedRoles(row.id);
        if (assigned.length === 0) return <span className="text-xs text-slate-500 italic">No roles</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {assigned.map(r => (
              <span key={r.id} className="px-2 py-0.5 rounded text-[11px] font-medium bg-sky-950 text-sky-300 border border-sky-800/40">
                {r.role_name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Created At',
      accessorKey: 'created_at',
      sortable: true,
      cell: row => (
        <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: row => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setRoleAssignUser(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
            title="Manage Roles"
          >
            <Shield className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Edit User"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirmUser(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            title="Delete User"
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
        data={users}
        columns={columns}
        searchPlaceholder="Search users by name, username or email..."
        searchFields={['username', 'full_name', 'email']}
        headerAction={
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-sm transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add User
          </button>
        }
      />

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingUser ? 'Edit User Details' : 'Register New User'}
        subtitle="Manage user identity and contact email"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Username <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              placeholder="e.g. j.doe"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            {formErrors.username && <p className="text-xs text-rose-400 mt-1">{formErrors.username}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. j.doe@company.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            {formErrors.email && <p className="text-xs text-rose-400 mt-1">{formErrors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            {formErrors.full_name && <p className="text-xs text-rose-400 mt-1">{formErrors.full_name}</p>}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Role Assignment Modal */}
      {roleAssignUser && (
        <Modal
          isOpen={Boolean(roleAssignUser)}
          onClose={() => setRoleAssignUser(null)}
          title={`Role Assignments for ${roleAssignUser.full_name}`}
          subtitle={`Assign or revoke security roles (user_roles table)`}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Currently Assigned Roles
              </label>
              <div className="space-y-2">
                {getUserAssignedRoles(roleAssignUser.id).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No roles assigned currently.</p>
                ) : (
                  getUserAssignedRoles(roleAssignUser.id).map(r => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">{r.role_name}</p>
                        <p className="text-[11px] text-slate-400">{r.description}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveRole(roleAssignUser.id, r.id)}
                        className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition"
                        title="Revoke Role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Assign Another Role
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedRoleId}
                  onChange={e => setSelectedRoleId(e.target.value ? Number(e.target.value) : '')}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">-- Select a role to grant --</option>
                  {roles
                    .filter(r => !getUserAssignedRoles(roleAssignUser.id).some(ar => ar.id === r.id))
                    .map(r => (
                      <option key={r.id} value={r.id}>
                        {r.role_name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAssignRole}
                  disabled={!selectedRoleId}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-40 transition"
                >
                  Assign Role
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete User Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmUser)}
        onClose={() => setDeleteConfirmUser(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to permanently delete user '${deleteConfirmUser?.username}'? This may affect associated cloud accounts or incident assignments.`}
        confirmText="Delete User"
      />
    </div>
  );
};
