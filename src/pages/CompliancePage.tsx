import React, { useState, useEffect } from 'react';
import { Plus, ShieldCheck, FileCheck, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { Table, Column } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { ComplianceBadge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import {
  getComplianceFrameworks,
  createComplianceFramework,
  getComplianceRequirements,
  createComplianceRequirement,
  getResourceCompliance,
  assessResourceCompliance,
  getCloudResources,
} from '../services/api';
import {
  ComplianceFramework,
  ComplianceRequirement,
  ResourceCompliance,
  CloudResource,
  ComplianceStatus,
} from '../types/database';

export const CompliancePage: React.FC = () => {
  const { addToast, refreshKey, triggerRefresh } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'assessments' | 'frameworks' | 'requirements'>('assessments');

  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [assessments, setAssessments] = useState<ResourceCompliance[]>([]);
  const [resources, setResources] = useState<CloudResource[]>([]);

  // Modals
  const [isFwOpen, setIsFwOpen] = useState(false);
  const [isReqOpen, setIsReqOpen] = useState(false);
  const [isAssessOpen, setIsAssessOpen] = useState(false);

  // Forms
  const [fwData, setFwData] = useState({ framework_name: '', description: '' });
  const [reqData, setReqData] = useState<{ framework_id: number | ''; requirement_name: string; description: string }>({
    framework_id: '',
    requirement_name: '',
    description: '',
  });
  const [assessData, setAssessData] = useState<{
    resource_id: number | '';
    requirement_id: number | '';
    status: ComplianceStatus;
  }>({
    resource_id: '',
    requirement_id: '',
    status: 'COMPLIANT',
  });

  useEffect(() => {
    async function load() {
      try {
        const [fList, rList, aList, resList] = await Promise.all([
          getComplianceFrameworks(),
          getComplianceRequirements(),
          getResourceCompliance(),
          getCloudResources(),
        ]);
        setFrameworks(fList);
        setRequirements(rList);
        setAssessments(aList);
        setResources(resList);
        if (fList.length > 0 && !reqData.framework_id) {
          setReqData(prev => ({ ...prev, framework_id: fList[0].id }));
        }
      } catch (err: any) {
        addToast({ type: 'error', title: 'Load Error', message: err.message });
      }
    }
    load();
  }, [refreshKey]);

  const handleCreateFramework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fwData.framework_name.trim()) return;
    try {
      await createComplianceFramework(fwData);
      addToast({ type: 'success', title: 'Framework Created', message: fwData.framework_name });
      setIsFwOpen(false);
      setFwData({ framework_name: '', description: '' });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqData.framework_id || !reqData.requirement_name.trim()) return;
    try {
      await createComplianceRequirement({
        ...reqData,
        framework_id: Number(reqData.framework_id),
      });
      addToast({ type: 'success', title: 'Requirement Created', message: reqData.requirement_name });
      setIsReqOpen(false);
      setReqData({ framework_id: frameworks.length > 0 ? frameworks[0].id : '', requirement_name: '', description: '' });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleAssessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessData.resource_id || !assessData.requirement_id) return;
    try {
      await assessResourceCompliance(
        Number(assessData.resource_id),
        Number(assessData.requirement_id),
        assessData.status
      );
      addToast({ type: 'success', title: 'Compliance Evaluated', message: `Assessment marked as ${assessData.status}.` });
      setIsAssessOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Assessment Failed', message: err.message });
    }
  };

  const assessColumns: Column<ResourceCompliance>[] = [
    {
      header: 'Cloud Resource',
      cell: r => (
        <div>
          <span className="font-semibold text-white block">{r.cloud_resource?.resource_name || `Res #${r.resource_id}`}</span>
          <span className="text-xs text-slate-400 font-mono">{r.cloud_resource?.environment}</span>
        </div>
      ),
    },
    {
      header: 'Framework',
      cell: r => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/40">
          {r.compliance_requirement?.framework?.framework_name || '—'}
        </span>
      ),
    },
    {
      header: 'Compliance Requirement',
      cell: r => (
        <div>
          <span className="font-semibold text-white block">{r.compliance_requirement?.requirement_name}</span>
          <span className="text-xs text-slate-400 line-clamp-1">{r.compliance_requirement?.description}</span>
        </div>
      ),
    },
    {
      header: 'Compliance Status',
      accessorKey: 'status',
      sortable: true,
      cell: r => <ComplianceBadge status={r.status} />,
    },
    {
      header: 'Last Checked',
      accessorKey: 'last_checked',
      sortable: true,
      cell: r => <span className="font-mono text-xs text-slate-400">{new Date(r.last_checked).toLocaleDateString()}</span>,
    },
  ];

  const fwColumns: Column<ComplianceFramework>[] = [
    { header: 'ID', accessorKey: 'id', sortable: true, cell: f => <span className="font-mono text-slate-400">#{f.id}</span> },
    { header: 'Framework Name', accessorKey: 'framework_name', sortable: true, cell: f => <span className="font-semibold text-white">{f.framework_name}</span> },
    { header: 'Description', accessorKey: 'description', cell: f => <span className="text-slate-300 text-xs">{f.description}</span> },
  ];

  const reqColumns: Column<ComplianceRequirement>[] = [
    { header: 'ID', accessorKey: 'id', sortable: true, cell: r => <span className="font-mono text-slate-400">#{r.id}</span> },
    { header: 'Framework', cell: r => <span className="font-mono text-xs text-cyan-400">{r.framework?.framework_name}</span> },
    { header: 'Requirement Name', accessorKey: 'requirement_name', sortable: true, cell: r => <span className="font-semibold text-white">{r.requirement_name}</span> },
    { header: 'Control Description', accessorKey: 'description', cell: r => <span className="text-slate-300 text-xs">{r.description}</span> },
  ];

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveSubTab('assessments')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeSubTab === 'assessments' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Resource Compliance (resource_compliance: {assessments.length})
        </button>
        <button
          onClick={() => setActiveSubTab('frameworks')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeSubTab === 'frameworks' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Regulatory Frameworks ({frameworks.length})
        </button>
        <button
          onClick={() => setActiveSubTab('requirements')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
            activeSubTab === 'requirements' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Control Requirements ({requirements.length})
        </button>
      </div>

      {activeSubTab === 'assessments' && (
        <Table
          data={assessments}
          columns={assessColumns}
          searchPlaceholder="Search compliance assessments..."
          headerAction={
            <button
              onClick={() => {
                setAssessData({
                  resource_id: resources.length > 0 ? resources[0].id : '',
                  requirement_id: requirements.length > 0 ? requirements[0].id : '',
                  status: 'COMPLIANT',
                });
                setIsAssessOpen(true);
              }}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Assess Resource
            </button>
          }
        />
      )}

      {activeSubTab === 'frameworks' && (
        <Table
          data={frameworks}
          columns={fwColumns}
          searchPlaceholder="Search frameworks..."
          headerAction={
            <button
              onClick={() => setIsFwOpen(true)}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Framework
            </button>
          }
        />
      )}

      {activeSubTab === 'requirements' && (
        <Table
          data={requirements}
          columns={reqColumns}
          searchPlaceholder="Search requirements..."
          headerAction={
            <button
              onClick={() => setIsReqOpen(true)}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Requirement
            </button>
          }
        />
      )}

      {/* Assess Resource Modal */}
      <Modal isOpen={isAssessOpen} onClose={() => setIsAssessOpen(false)} title="Assess Resource Compliance" subtitle="Composite Primary Key (resource_id, requirement_id)">
        <form onSubmit={handleAssessSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Cloud Resource <span className="text-rose-400">*</span></label>
            <select
              value={assessData.resource_id}
              onChange={e => setAssessData({ ...assessData, resource_id: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            >
              <option value="">-- Select Resource --</option>
              {resources.map(r => (
                <option key={r.id} value={r.id}>
                  {r.resource_name} ({r.environment})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Compliance Requirement <span className="text-rose-400">*</span></label>
            <select
              value={assessData.requirement_id}
              onChange={e => setAssessData({ ...assessData, requirement_id: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            >
              <option value="">-- Select Requirement --</option>
              {requirements.map(req => (
                <option key={req.id} value={req.id}>
                  {req.framework?.framework_name}: {req.requirement_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Assessment Status</label>
            <select
              value={assessData.status}
              onChange={e => setAssessData({ ...assessData, status: e.target.value as ComplianceStatus })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="COMPLIANT">COMPLIANT</option>
              <option value="NON_COMPLIANT">NON_COMPLIANT</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsAssessOpen(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500">
              Save Assessment
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Framework Modal */}
      <Modal isOpen={isFwOpen} onClose={() => setIsFwOpen(false)} title="Register Compliance Framework">
        <form onSubmit={handleCreateFramework} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Framework Title <span className="text-rose-400">*</span></label>
            <input
              type="text"
              value={fwData.framework_name}
              onChange={e => setFwData({ ...fwData, framework_name: e.target.value })}
              placeholder="e.g. ISO/IEC 27001:2022, GDPR, HIPAA"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
            <textarea
              value={fwData.description}
              onChange={e => setFwData({ ...fwData, description: e.target.value })}
              placeholder="Regulatory authority, target security criteria"
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsFwOpen(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500">
              Save Framework
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Requirement Modal */}
      <Modal isOpen={isReqOpen} onClose={() => setIsReqOpen(false)} title="Add Framework Requirement">
        <form onSubmit={handleCreateRequirement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Regulatory Framework <span className="text-rose-400">*</span></label>
            <select
              value={reqData.framework_id}
              onChange={e => setReqData({ ...reqData, framework_id: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            >
              <option value="">-- Select Framework --</option>
              {frameworks.map(f => (
                <option key={f.id} value={f.id}>
                  {f.framework_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Requirement Name <span className="text-rose-400">*</span></label>
            <input
              type="text"
              value={reqData.requirement_name}
              onChange={e => setReqData({ ...reqData, requirement_name: e.target.value })}
              placeholder="e.g. A.8.20 Network Security"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Control Objective Description</label>
            <textarea
              value={reqData.description}
              onChange={e => setReqData({ ...reqData, description: e.target.value })}
              placeholder="Detailed criteria required for compliance"
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsReqOpen(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500">
              Save Requirement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
