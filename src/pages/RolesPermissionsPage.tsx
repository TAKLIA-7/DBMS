import React, { useState, useEffect } from 'react';
import { Plus, Shield, Key, Trash2 } from 'lucide-react';
import { Table, Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { useApp } from '../context/AppContext';
import {
  getRoles,
  createRole,
  getPermissions,
  createPermission,
  getRolePermissions,
  assignRolePermission,
  removeRolePermission,
} from '../services/api';
import { Role, Permission, RolePermission } from '../types/database';

export const RolesPermissionsPage: React.FC = () => {
  const { addToast, refreshKey, triggerRefresh } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'roles' | 'permissions' | 'mapping'>('roles');

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);

  // Modals
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isAddPermOpen, setIsAddPermOpen] = useState(false);
  const [roleFormData, setRoleFormData] = useState({ role_name: '', description: '' });
  const [permFormData, setPermFormData] = useState({ permission_name: '', description: '' });

  // Mapping
  const [mappingRole, setMappingRole] = useState<number | ''>('');
  const [mappingPerm, setMappingPerm] = useState<number | ''>('');

  useEffect(() => {
    async function loadData() {
      try {
        const [rList, pList, rpList] = await Promise.all([
          getRoles(),
          getPermissions(),
          getRolePermissions(),
        ]);
        setRoles(rList);
        setPermissions(pList);
        setRolePermissions(rpList);
        if (rList.length > 0 && !mappingRole) {
          setMappingRole(rList[0].id);
        }
      } catch (err: any) {
        addToast({ type: 'error', title: 'Data Load Error', message: err.message });
      }
    }
    loadData();
  }, [refreshKey]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormData.role_name.trim()) return;
    try {
      await createRole(roleFormData);
      addToast({ type: 'success', title: 'Role Created', message: `Role '${roleFormData.role_name}' registered.` });
      setIsAddRoleOpen(false);
      setRoleFormData({ role_name: '', description: '' });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to Create Role', message: err.message });
    }
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permFormData.permission_name.trim()) return;
    try {
      await createPermission(permFormData);
      addToast({ type: 'success', title: 'Permission Created', message: `Permission '${permFormData.permission_name}' registered.` });
      setIsAddPermOpen(false);
      setPermFormData({ permission_name: '', description: '' });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to Create Permission', message: err.message });
    }
  };

  const handleAssignPermission = async () => {
    if (!mappingRole || !mappingPerm) return;
    try {
      await assignRolePermission(Number(mappingRole), Number(mappingPerm));
      addToast({ type: 'success', title: 'Permission Granted', message: 'Assigned permission to role.' });
      setMappingPerm('');
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Assignment Failed', message: err.message });
    }
  };

  const handleRevokePermission = async (roleId: number, permId: number) => {
    try {
      await removeRolePermission(roleId, permId);
      addToast({ type: 'success', title: 'Permission Revoked', message: 'Removed permission from role.' });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Revoke Failed', message: err.message });
    }
  };

  const getGrantedPermissionsForRole = (roleId: number) => {
    const permIds = rolePermissions.filter(rp => rp.role_id === roleId).map(rp => rp.permission_id);
    return permissions.filter(p => permIds.includes(p.id));
  };

  const roleColumns: Column<Role>[] = [
    { header: 'Role ID', accessorKey: 'id', sortable: true, cell: r => <span className="font-mono text-slate-400">#{r.id}</span> },
    { header: 'Role Name', accessorKey: 'role_name', sortable: true, cell: r => <span className="font-semibold text-white">{r.role_name}</span> },
    { header: 'Description', accessorKey: 'description', cell: r => <span className="text-slate-300 text-xs">{r.description}</span> },
    {
      header: 'Granted Permissions',
      cell: r => {
        const granted = getGrantedPermissionsForRole(r.id);
        return (
          <span className="font-mono text-xs text-sky-400 bg-sky-950/60 border border-sky-800/40 px-2 py-0.5 rounded">
            {granted.length} permissions
          </span>
        );
      },
    },
  ];

  const permColumns: Column<Permission>[] = [
    { header: 'Permission ID', accessorKey: 'id', sortable: true, cell: p => <span className="font-mono text-slate-400">#{p.id}</span> },
    { header: 'Permission Name', accessorKey: 'permission_name', sortable: true, cell: p => <span className="font-mono font-bold text-cyan-400">{p.permission_name}</span> },
    { header: 'Description', accessorKey: 'description', cell: p => <span className="text-slate-300 text-xs">{p.description}</span> },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveSubTab('roles')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeSubTab === 'roles' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Roles Catalog ({roles.length})
        </button>
        <button
          onClick={() => setActiveSubTab('permissions')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeSubTab === 'permissions' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Permissions Catalog ({permissions.length})
        </button>
        <button
          onClick={() => setActiveSubTab('mapping')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeSubTab === 'mapping' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Role-Permission Mapping (role_permissions)
        </button>
      </div>

      {activeSubTab === 'roles' && (
        <Table
          data={roles}
          columns={roleColumns}
          searchPlaceholder="Search roles..."
          headerAction={
            <button
              onClick={() => setIsAddRoleOpen(true)}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Role
            </button>
          }
        />
      )}

      {activeSubTab === 'permissions' && (
        <Table
          data={permissions}
          columns={permColumns}
          searchPlaceholder="Search permissions..."
          headerAction={
            <button
              onClick={() => setIsAddPermOpen(true)}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Permission
            </button>
          }
        />
      )}

      {activeSubTab === 'mapping' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Role Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-semibold text-white">Select Role</h4>
            <div className="space-y-1">
              {roles.map(r => (
                <button
                  key={r.id}
                  onClick={() => setMappingRole(r.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    mappingRole === r.id ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <p className="font-semibold">{r.role_name}</p>
                  <p className="text-[11px] opacity-80 truncate">{r.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Granted Permissions + Add Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Permissions Granted to {roles.find(r => r.id === mappingRole)?.role_name || 'Selected Role'}
                </h4>
                <p className="text-xs text-slate-400">Composite primary key (role_id, permission_id)</p>
              </div>

              {/* Add Permission Dropdown */}
              <div className="flex gap-2">
                <select
                  value={mappingPerm}
                  onChange={e => setMappingPerm(e.target.value ? Number(e.target.value) : '')}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">-- Add permission --</option>
                  {permissions
                    .filter(p => mappingRole && !getGrantedPermissionsForRole(Number(mappingRole)).some(gp => gp.id === p.id))
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.permission_name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleAssignPermission}
                  disabled={!mappingPerm}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-40"
                >
                  Grant
                </button>
              </div>
            </div>

            {/* List of Granted Permissions */}
            <div className="space-y-2">
              {mappingRole && getGrantedPermissionsForRole(Number(mappingRole)).length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6 text-center">No permissions mapped to this role yet.</p>
              ) : (
                mappingRole &&
                getGrantedPermissionsForRole(Number(mappingRole)).map(perm => (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-cyan-400 block">{perm.permission_name}</span>
                      <span className="text-[11px] text-slate-400">{perm.description}</span>
                    </div>
                    <button
                      onClick={() => handleRevokePermission(Number(mappingRole), perm.id)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded transition"
                      title="Revoke permission"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      <Modal isOpen={isAddRoleOpen} onClose={() => setIsAddRoleOpen(false)} title="Create New Role">
        <form onSubmit={handleCreateRole} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Role Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={roleFormData.role_name}
              onChange={e => setRoleFormData({ ...roleFormData, role_name: e.target.value })}
              placeholder="e.g. SOC Analyst L2"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
            <textarea
              value={roleFormData.description}
              onChange={e => setRoleFormData({ ...roleFormData, description: e.target.value })}
              placeholder="Responsibilities and permission boundaries"
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsAddRoleOpen(false)} className="px-4 py-2 text-sm text-slate-400">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500">
              Save Role
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Permission Modal */}
      <Modal isOpen={isAddPermOpen} onClose={() => setIsAddPermOpen(false)} title="Create New Permission">
        <form onSubmit={handleCreatePermission} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Permission Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={permFormData.permission_name}
              onChange={e => setPermFormData({ ...permFormData, permission_name: e.target.value })}
              placeholder="e.g. telemetry.export"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
            <textarea
              value={permFormData.description}
              onChange={e => setPermFormData({ ...permFormData, description: e.target.value })}
              placeholder="Operation granted by this permission"
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsAddPermOpen(false)} className="px-4 py-2 text-sm text-slate-400">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500">
              Save Permission
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
