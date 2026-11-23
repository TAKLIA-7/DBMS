import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Server, AlertTriangle, ShieldCheck, Bug, Radio } from 'lucide-react';
import { Table, Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { StatusBadge, EnvironmentBadge, SeverityBadge, ComplianceBadge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import {
  getCloudResources,
  createCloudResource,
  updateCloudResource,
  deleteCloudResource,
  getCloudAccounts,
  getResourceVulnerabilities,
  getPolicyViolations,
  getSecurityFindings,
  getResourceCompliance,
} from '../services/api';
import {
  CloudResource,
  CloudAccount,
  EnvironmentType,
  ResourceStatus,
  ResourceVulnerability,
  PolicyViolation,
  SecurityFinding,
  ResourceCompliance,
} from '../types/database';

export const CloudResourcesPage: React.FC = () => {
  const { addToast, refreshKey, triggerRefresh } = useApp();
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);

  // Modals
  const [isOpen, setIsOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<CloudResource | null>(null);
  const [deleteResource, setDeleteResource] = useState<CloudResource | null>(null);

  // Detail Drawer
  const [detailResource, setDetailResource] = useState<CloudResource | null>(null);
  const [resourceVulns, setResourceVulns] = useState<ResourceVulnerability[]>([]);
  const [resourceViolations, setResourceViolations] = useState<PolicyViolation[]>([]);
  const [resourceFindings, setResourceFindings] = useState<SecurityFinding[]>([]);
  const [resourceComplianceList, setResourceComplianceList] = useState<ResourceCompliance[]>([]);

  const [formData, setFormData] = useState<{
    resource_name: string;
    account_id: number | '';
    resource_type: string;
    environment: EnvironmentType;
    status: ResourceStatus;
  }>({
    resource_name: '',
    account_id: '',
    resource_type: 'VIRTUAL_MACHINE',
    environment: 'PRODUCTION',
    status: 'ACTIVE',
  });

  useEffect(() => {
    async function load() {
      try {
        const [resList, accList] = await Promise.all([getCloudResources(), getCloudAccounts()]);
        setResources(resList);
        setAccounts(accList);
        if (accList.length > 0 && !formData.account_id) {
          setFormData(prev => ({ ...prev, account_id: accList[0].id }));
        }
      } catch (err: any) {
        addToast({ type: 'error', title: 'Load Error', message: err.message });
      }
    }
    load();
  }, [refreshKey]);

  const handleOpenAdd = () => {
    setEditingResource(null);
    setFormData({
      resource_name: '',
      account_id: accounts.length > 0 ? accounts[0].id : '',
      resource_type: 'VIRTUAL_MACHINE',
      environment: 'PRODUCTION',
      status: 'ACTIVE',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (r: CloudResource) => {
    setEditingResource(r);
    setFormData({
      resource_name: r.resource_name,
      account_id: r.account_id,
      resource_type: r.resource_type,
      environment: r.environment,
      status: r.status,
    });
    setIsOpen(true);
  };

  const handleViewDetails = async (r: CloudResource) => {
    setDetailResource(r);
    try {
      const [allVulns, allViolations, allFindings, allComp] = await Promise.all([
        getResourceVulnerabilities(),
        getPolicyViolations(),
        getSecurityFindings(),
        getResourceCompliance(),
      ]);
      setResourceVulns(allVulns.filter(v => v.resource_id === r.id));
      setResourceViolations(allViolations.filter(v => v.resource_id === r.id));
      setResourceFindings(allFindings.filter(f => f.resource_id === r.id));
      setResourceComplianceList(allComp.filter(c => c.resource_id === r.id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resource_name.trim() || !formData.account_id) return;

    try {
      if (editingResource) {
        await updateCloudResource(editingResource.id, {
          ...formData,
          account_id: Number(formData.account_id),
        });
        addToast({ type: 'success', title: 'Resource Updated', message: `Resource '${formData.resource_name}' saved.` });
      } else {
        await createCloudResource({
          ...formData,
          account_id: Number(formData.account_id),
        });
        addToast({ type: 'success', title: 'Resource Created', message: `Resource '${formData.resource_name}' registered.` });
      }
      setIsOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', message: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteResource) return;
    try {
      await deleteCloudResource(deleteResource.id);
      addToast({ type: 'success', title: 'Resource Deleted', message: `Resource '${deleteResource.resource_name}' deleted.` });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setDeleteResource(null);
    }
  };

  const columns: Column<CloudResource>[] = [
    { header: 'ID', accessorKey: 'id', sortable: true, cell: r => <span className="font-mono text-slate-400">#{r.id}</span> },
    {
      header: 'Resource Name',
      accessorKey: 'resource_name',
      sortable: true,
      cell: r => (
        <button
          onClick={() => handleViewDetails(r)}
          className="font-semibold text-white hover:text-sky-400 transition text-left flex items-center gap-1.5"
        >
          <span>{r.resource_name}</span>
          <Eye className="w-3.5 h-3.5 text-slate-500" />
        </button>
      ),
    },
    { header: 'Type', accessorKey: 'resource_type', sortable: true, cell: r => <span className="font-mono text-xs text-sky-400">{r.resource_type}</span> },
    {
      header: 'Cloud Account',
      cell: r => (
        <span className="text-slate-300 text-xs">
          {r.cloud_account?.account_name || `Account #${r.account_id}`}
        </span>
      ),
    },
    { header: 'Environment', accessorKey: 'environment', sortable: true, cell: r => <EnvironmentBadge env={r.environment} /> },
    { header: 'Status', accessorKey: 'status', sortable: true, cell: r => <StatusBadge status={r.status} /> },
    {
      header: 'Actions',
      cell: r => (
        <div className="flex items-center space-x-2">
          <button onClick={() => handleViewDetails(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition" title="Inspect Posture">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => handleOpenEdit(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition" title="Edit Resource">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteResource(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition" title="Delete Resource">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Table
        data={resources}
        columns={columns}
        searchPlaceholder="Search cloud resources..."
        searchFields={['resource_name', 'resource_type', 'environment']}
        headerAction={
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Register Resource
          </button>
        }
      />

      {/* Add / Edit Resource Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingResource ? 'Edit Cloud Resource' : 'Register New Resource'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Resource Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.resource_name}
              onChange={e => setFormData({ ...formData, resource_name: e.target.value })}
              placeholder="e.g. prod-api-gateway-vm"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Cloud Account <span className="text-rose-400">*</span></label>
              <select
                value={formData.account_id}
                onChange={e => setFormData({ ...formData, account_id: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                required
              >
                <option value="">-- Select Account --</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.account_name} ({a.provider})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Resource Type</label>
              <select
                value={formData.resource_type}
                onChange={e => setFormData({ ...formData, resource_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="VIRTUAL_MACHINE">VIRTUAL_MACHINE</option>
                <option value="DATABASE">DATABASE</option>
                <option value="STORAGE">STORAGE</option>
                <option value="NETWORK">NETWORK</option>
                <option value="CONTAINER">CONTAINER</option>
                <option value="SERVERLESS">SERVERLESS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Environment</label>
              <select
                value={formData.environment}
                onChange={e => setFormData({ ...formData, environment: e.target.value as EnvironmentType })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="PRODUCTION">PRODUCTION</option>
                <option value="DEVELOPMENT">DEVELOPMENT</option>
                <option value="TESTING">TESTING</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as ResourceStatus })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500">
              {editingResource ? 'Update' : 'Register'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Resource Detail Drawer Modal */}
      {detailResource && (
        <Modal
          isOpen={Boolean(detailResource)}
          onClose={() => setDetailResource(null)}
          title={`Resource Posture: ${detailResource.resource_name}`}
          subtitle={`Connected vulnerabilities, violations, findings, and compliance audits`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Metadata badges */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <span className="font-mono text-slate-400">Type: <span className="text-white">{detailResource.resource_type}</span></span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Account: <span className="text-white">{detailResource.cloud_account?.account_name}</span></span>
              <span className="text-slate-600">|</span>
              <EnvironmentBadge env={detailResource.environment} />
              <StatusBadge status={detailResource.status} />
            </div>

            {/* Linked CVE Vulnerabilities */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Bug className="w-4 h-4 text-rose-400" />
                Linked Vulnerabilities ({resourceVulns.length})
              </h4>
              {resourceVulns.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-lg">No CVE vulnerabilities linked to this resource.</p>
              ) : (
                <div className="space-y-2">
                  {resourceVulns.map(rv => (
                    <div key={rv.vulnerability_id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-sky-400 mr-2">{rv.vulnerability?.cve_id}</span>
                        <span className="text-slate-300">{rv.vulnerability?.title}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <SeverityBadge severity={rv.vulnerability?.severity || 'LOW'} />
                        <StatusBadge status={rv.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Policy Violations */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Active Policy Violations ({resourceViolations.length})
              </h4>
              {resourceViolations.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-lg">No active violations detected.</p>
              ) : (
                <div className="space-y-2">
                  {resourceViolations.map(viol => (
                    <div key={viol.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-amber-300">{viol.security_policy?.policy_name}</span>
                        <StatusBadge status={viol.status} />
                      </div>
                      <p className="text-slate-400 text-[11px]">{viol.violation_description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compliance Assessments */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Compliance Posture ({resourceComplianceList.length})
              </h4>
              {resourceComplianceList.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-lg">No regulatory controls assessed yet.</p>
              ) : (
                <div className="space-y-2">
                  {resourceComplianceList.map(rc => (
                    <div key={rc.requirement_id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white block">{rc.compliance_requirement?.requirement_name}</span>
                        <span className="text-[11px] text-slate-400">{rc.compliance_requirement?.framework?.framework_name}</span>
                      </div>
                      <ComplianceBadge status={rc.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteResource)}
        onClose={() => setDeleteResource(null)}
        onConfirm={handleDelete}
        title="Delete Cloud Resource"
        message={`Delete resource '${deleteResource?.resource_name}'? Associated telemetry will be unlinked.`}
      />
    </div>
  );
};
