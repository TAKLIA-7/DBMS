import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Link as LinkIcon, Bug, AlertCircle, ShieldAlert } from 'lucide-react';
import { Table, Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import {
  getVulnerabilities,
  createVulnerability,
  updateVulnerability,
  deleteVulnerability,
  getCloudResources,
  getResourceVulnerabilities,
  associateResourceVulnerability,
  dissociateResourceVulnerability,
  updateResourceVulnerabilityStatus,
} from '../services/api';
import {
  Vulnerability,
  SeverityLevel,
  CloudResource,
  ResourceVulnerability,
  VulnerabilityStatus,
} from '../types/database';

export const VulnerabilitiesPage: React.FC = () => {
  const { addToast, refreshKey, triggerRefresh } = useApp();
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [resourceVulns, setResourceVulns] = useState<ResourceVulnerability[]>([]);

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<'catalog' | 'associations'>('catalog');

  // Modals
  const [isOpen, setIsOpen] = useState(false);
  const [editingVuln, setEditingVuln] = useState<Vulnerability | null>(null);
  const [deleteVuln, setDeleteVuln] = useState<Vulnerability | null>(null);

  // Link Association Modal
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkData, setLinkData] = useState<{
    resource_id: number | '';
    vulnerability_id: number | '';
    status: VulnerabilityStatus;
  }>({
    resource_id: '',
    vulnerability_id: '',
    status: 'OPEN',
  });

  const [formData, setFormData] = useState<{
    cve_id: string;
    title: string;
    severity: SeverityLevel;
    cvss_score: number;
    description: string;
  }>({
    cve_id: '',
    title: '',
    severity: 'MEDIUM',
    cvss_score: 5.0,
    description: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const [vList, rList, rvList] = await Promise.all([
          getVulnerabilities(),
          getCloudResources(),
          getResourceVulnerabilities(),
        ]);
        setVulns(vList);
        setResources(rList);
        setResourceVulns(rvList);
      } catch (err: any) {
        addToast({ type: 'error', title: 'Load Error', message: err.message });
      }
    }
    load();
  }, [refreshKey]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.cve_id.trim()) errs.cve_id = 'CVE ID is required.';
    else if (!/^CVE-\d{4}-\d{4,}$/i.test(formData.cve_id.trim())) {
      errs.cve_id = 'Format should be CVE-YYYY-NNNN (e.g. CVE-2026-3190)';
    }
    if (!formData.title.trim()) errs.title = 'Title is required.';
    if (isNaN(formData.cvss_score) || formData.cvss_score < 0 || formData.cvss_score > 10) {
      errs.cvss_score = 'CVSS score must be between 0.0 and 10.0';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenAdd = () => {
    setEditingVuln(null);
    setFormData({
      cve_id: '',
      title: '',
      severity: 'MEDIUM',
      cvss_score: 5.0,
      description: '',
    });
    setFormErrors({});
    setIsOpen(true);
  };

  const handleOpenEdit = (v: Vulnerability) => {
    setEditingVuln(v);
    setFormData({
      cve_id: v.cve_id,
      title: v.title,
      severity: v.severity,
      cvss_score: v.cvss_score,
      description: v.description,
    });
    setFormErrors({});
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (editingVuln) {
        await updateVulnerability(editingVuln.id, formData);
        addToast({ type: 'success', title: 'Vulnerability Updated', message: `${formData.cve_id} updated.` });
      } else {
        await createVulnerability(formData);
        addToast({ type: 'success', title: 'Vulnerability Cataloged', message: `${formData.cve_id} registered.` });
      }
      setIsOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Operation Failed', message: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteVuln) return;
    try {
      await deleteVulnerability(deleteVuln.id);
      addToast({ type: 'success', title: 'Deleted', message: `${deleteVuln.cve_id} deleted.` });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setDeleteVuln(null);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkData.resource_id || !linkData.vulnerability_id) return;

    try {
      await associateResourceVulnerability(
        Number(linkData.resource_id),
        Number(linkData.vulnerability_id),
        linkData.status
      );
      addToast({ type: 'success', title: 'Linked', message: 'Vulnerability associated to cloud resource.' });
      setIsLinkOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Association Failed', message: err.message });
    }
  };

  const handleUnlink = async (resId: number, vulnId: number) => {
    try {
      await dissociateResourceVulnerability(resId, vulnId);
      addToast({ type: 'success', title: 'Unlinked', message: 'Vulnerability removed from resource.' });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to Unlink', message: err.message });
    }
  };

  const handleUpdateStatus = async (resId: number, vulnId: number, newStatus: VulnerabilityStatus) => {
    try {
      await updateResourceVulnerabilityStatus(resId, vulnId, newStatus);
      addToast({ type: 'success', title: 'Status Updated', message: `Marked as ${newStatus}.` });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update Failed', message: err.message });
    }
  };

  const vulnColumns: Column<Vulnerability>[] = [
    { header: 'ID', accessorKey: 'id', sortable: true, cell: v => <span className="font-mono text-slate-400">#{v.id}</span> },
    {
      header: 'CVE Identifier',
      accessorKey: 'cve_id',
      sortable: true,
      cell: v => <span className="font-mono font-bold text-sky-400">{v.cve_id}</span>,
    },
    {
      header: 'Title & Summary',
      accessorKey: 'title',
      sortable: true,
      cell: v => (
        <div>
          <span className="font-semibold text-white block max-w-sm truncate">{v.title}</span>
          <span className="text-xs text-slate-400 line-clamp-1">{v.description}</span>
        </div>
      ),
    },
    {
      header: 'CVSS Score',
      accessorKey: 'cvss_score',
      sortable: true,
      cell: v => {
        let color = 'text-sky-400';
        if (v.cvss_score >= 9.0) color = 'text-rose-400 font-bold';
        else if (v.cvss_score >= 7.0) color = 'text-orange-400 font-bold';
        else if (v.cvss_score >= 4.0) color = 'text-amber-400';
        return <span className={`font-mono ${color}`}>{v.cvss_score.toFixed(1)}</span>;
      },
    },
    {
      header: 'Severity',
      accessorKey: 'severity',
      sortable: true,
      cell: v => <SeverityBadge severity={v.severity} />,
    },
    {
      header: 'Actions',
      cell: v => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenEdit(v)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteVuln(v)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const associationColumns: Column<ResourceVulnerability>[] = [
    {
      header: 'Cloud Resource',
      cell: r => (
        <div>
          <span className="font-semibold text-white block">{r.cloud_resource?.resource_name || `Res #${r.resource_id}`}</span>
          <span className="text-xs text-slate-400 font-mono">{r.cloud_resource?.resource_type}</span>
        </div>
      ),
    },
    {
      header: 'Vulnerability',
      cell: r => (
        <div>
          <span className="font-mono font-bold text-sky-400 block">{r.vulnerability?.cve_id || `CVE #${r.vulnerability_id}`}</span>
          <span className="text-xs text-slate-300 max-w-xs truncate block">{r.vulnerability?.title}</span>
        </div>
      ),
    },
    {
      header: 'Severity',
      cell: r => <SeverityBadge severity={r.vulnerability?.severity || 'LOW'} />,
    },
    {
      header: 'Status',
      cell: r => (
        <select
          value={r.status}
          onChange={e => handleUpdateStatus(r.resource_id, r.vulnerability_id, e.target.value as VulnerabilityStatus)}
          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
        >
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>
      ),
    },
    {
      header: 'Detected At',
      accessorKey: 'detected_at',
      sortable: true,
      cell: r => <span className="font-mono text-xs text-slate-400">{new Date(r.detected_at).toLocaleDateString()}</span>,
    },
    {
      header: 'Actions',
      cell: r => (
        <button
          onClick={() => handleUnlink(r.resource_id, r.vulnerability_id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          title="Unlink"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'catalog' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Vulnerability Catalog ({vulns.length})
        </button>
        <button
          onClick={() => setActiveTab('associations')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'associations' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Resource Associations (resource_vulnerabilities: {resourceVulns.length})
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <Table
          data={vulns}
          columns={vulnColumns}
          searchPlaceholder="Search CVEs by ID or title..."
          searchFields={['cve_id', 'title', 'description']}
          headerAction={
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Catalog CVE
            </button>
          }
        />
      ) : (
        <Table
          data={resourceVulns}
          columns={associationColumns}
          searchPlaceholder="Search linked vulnerabilities..."
          headerAction={
            <button
              onClick={() => {
                setLinkData({
                  resource_id: resources.length > 0 ? resources[0].id : '',
                  vulnerability_id: vulns.length > 0 ? vulns[0].id : '',
                  status: 'OPEN',
                });
                setIsLinkOpen(true);
              }}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
            >
              <LinkIcon className="w-4 h-4 mr-1.5" />
              Link Vulnerability to Resource
            </button>
          }
        />
      )}

      {/* Add / Edit Vulnerability Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingVuln ? 'Edit Vulnerability' : 'Catalog New CVE'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                CVE Identifier <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.cve_id}
                onChange={e => setFormData({ ...formData, cve_id: e.target.value.toUpperCase() })}
                placeholder="CVE-2026-3190"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                required
              />
              {formErrors.cve_id && <p className="text-xs text-rose-400 mt-1">{formErrors.cve_id}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                CVSS Score (0.0 - 10.0) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.cvss_score}
                onChange={e => setFormData({ ...formData, cvss_score: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                required
              />
              {formErrors.cvss_score && <p className="text-xs text-rose-400 mt-1">{formErrors.cvss_score}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Vulnerability Title <span className="text-rose-400">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Remote Code Execution in..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                required
              />
              {formErrors.title && <p className="text-xs text-rose-400 mt-1">{formErrors.title}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description & Impact</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of attack vector, conditions, and remediation advice"
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500">
              {editingVuln ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Link to Resource Modal */}
      <Modal isOpen={isLinkOpen} onClose={() => setIsLinkOpen(false)} title="Link Vulnerability to Resource" subtitle="Composite Primary Key (resource_id, vulnerability_id)">
        <form onSubmit={handleLinkSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Cloud Resource</label>
            <select
              value={linkData.resource_id}
              onChange={e => setLinkData({ ...linkData, resource_id: Number(e.target.value) })}
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
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Detected CVE Vulnerability</label>
            <select
              value={linkData.vulnerability_id}
              onChange={e => setLinkData({ ...linkData, vulnerability_id: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            >
              <option value="">-- Select CVE --</option>
              {vulns.map(v => (
                <option key={v.id} value={v.id}>
                  {v.cve_id} - {v.title} [{v.severity}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Initial Status</label>
            <select
              value={linkData.status}
              onChange={e => setLinkData({ ...linkData, status: e.target.value as VulnerabilityStatus })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsLinkOpen(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500">
              Create Association
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteVuln)}
        onClose={() => setDeleteVuln(null)}
        onConfirm={handleDelete}
        title="Delete Vulnerability"
        message={`Delete ${deleteVuln?.cve_id}? Linked records in resource_vulnerabilities will also be deleted.`}
      />
    </div>
  );
};
