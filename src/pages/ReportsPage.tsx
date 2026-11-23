import React, { useState, useEffect } from 'react';
import { BarChart3, Download, PieChart, Shield, Flame, Server, AlertTriangle, FileCheck } from 'lucide-react';
import { Card } from '../components/common/Card';
import { SeverityBadge, StatusBadge, ProviderBadge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import {
  getVulnerabilities,
  getIncidents,
  getPolicyViolations,
  getCloudResources,
  getResourceCompliance,
  getUsers,
  getSecurityPolicies,
} from '../services/api';
import {
  Vulnerability,
  Incident,
  PolicyViolation,
  CloudResource,
  ResourceCompliance,
  User,
  SecurityPolicy,
} from '../types/database';

export const ReportsPage: React.FC = () => {
  const { addToast, refreshKey } = useApp();
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [compliance, setCompliance] = useState<ResourceCompliance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [v, i, viol, r, c, u, p] = await Promise.all([
          getVulnerabilities(),
          getIncidents(),
          getPolicyViolations(),
          getCloudResources(),
          getResourceCompliance(),
          getUsers(),
          getSecurityPolicies(),
        ]);
        setVulns(v);
        setIncidents(i);
        setViolations(viol);
        setResources(r);
        setCompliance(c);
        setUsers(u);
        setPolicies(p);
      } catch (err: any) {
        addToast({ type: 'error', title: 'Error Loading Reports', message: err.message });
      }
    }
    load();
  }, [refreshKey]);

  // Export any array to CSV
  const exportArrayToCsv = (filename: string, rows: Record<string, any>[]) => {
    if (rows.length === 0) {
      addToast({ type: 'info', title: 'No Data', message: 'No records available to export.' });
      return;
    }
    const headers = Object.keys(rows[0]).join(',');
    const csvRows = rows.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...csvRows].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Vulns by Severity
  const vulnsBySeverity = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => {
    const count = vulns.filter(v => v.severity === sev).length;
    return { severity: sev, count, percentage: Math.round((count / (vulns.length || 1)) * 100) };
  });

  // 2. Incidents by Status & Priority
  const incidentsByStatus = ['OPEN', 'IN_PROGRESS', 'RESOLVED'].map(st => {
    const count = incidents.filter(i => i.status === st).length;
    return { status: st, count, percentage: Math.round((count / (incidents.length || 1)) * 100) };
  });

  const incidentsByPriority = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => {
    const count = incidents.filter(i => i.priority === p).length;
    return { priority: p, count, percentage: Math.round((count / (incidents.length || 1)) * 100) };
  });

  // 3. Incidents Assigned to Users
  const userIncidentWorkload = users.map(u => {
    const assigned = incidents.filter(i => i.assigned_to === u.id);
    const openCount = assigned.filter(i => i.status !== 'RESOLVED').length;
    const resolvedCount = assigned.filter(i => i.status === 'RESOLVED').length;
    return {
      userId: u.id,
      name: u.full_name,
      email: u.email,
      total: assigned.length,
      open: openCount,
      resolved: resolvedCount,
    };
  });

  // 4. Policy Violations by Policy
  const violationsByPolicy = policies.map(p => {
    const count = violations.filter(v => v.policy_id === p.id).length;
    return {
      policyId: p.id,
      name: p.policy_name,
      category: p.policy_type,
      violations: count,
    };
  });

  // 5. Non-compliant resources
  const nonCompliantRecords = compliance
    .filter(c => c.status === 'NON_COMPLIANT')
    .map(c => ({
      resource: c.cloud_resource?.resource_name || `Res #${c.resource_id}`,
      environment: c.cloud_resource?.environment || '—',
      requirement: c.compliance_requirement?.requirement_name || `Req #${c.requirement_id}`,
      framework: c.compliance_requirement?.framework?.framework_name || '—',
      lastChecked: new Date(c.last_checked).toLocaleDateString(),
    }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            Security Analytics & Compliance Audit Reports
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Aggregate reports for college RDBMS presentation with one-click CSV data export.
          </p>
        </div>
        <button
          onClick={() => {
            const summary = [
              { metric: 'Total Cloud Resources', value: resources.length },
              { metric: 'Total Vulnerabilities', value: vulns.length },
              { metric: 'Total Incidents', value: incidents.length },
              { metric: 'Policy Violations', value: violations.length },
              { metric: 'Non-Compliant Findings', value: nonCompliantRecords.length },
            ];
            exportArrayToCsv('security_executive_summary', summary);
          }}
          className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-sm transition"
        >
          <Download className="w-4 h-4 mr-1.5" />
          Export Executive Summary
        </button>
      </div>

      {/* Row 1: Vulnerabilities by Severity & Incidents by Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vulnerabilities by Severity */}
        <Card
          title="Vulnerabilities by Severity"
          subtitle="CVE risk distribution"
          action={
            <button
              onClick={() => exportArrayToCsv('vulnerabilities_by_severity', vulnsBySeverity)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          }
        >
          <div className="space-y-4">
            {vulnsBySeverity.map(row => (
              <div key={row.severity} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <SeverityBadge severity={row.severity} />
                  </div>
                  <span className="font-mono text-slate-300 font-semibold">{row.count} ({row.percentage}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${
                      row.severity === 'CRITICAL'
                        ? 'bg-rose-500'
                        : row.severity === 'HIGH'
                        ? 'bg-orange-500'
                        : row.severity === 'MEDIUM'
                        ? 'bg-amber-500'
                        : 'bg-sky-500'
                    }`}
                    style={{ width: `${row.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Incidents by Priority & Status */}
        <Card
          title="Incident Resolution Pipeline"
          subtitle="Priority and workflow status"
          action={
            <button
              onClick={() => exportArrayToCsv('incidents_pipeline', incidentsByStatus)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          }
        >
          <div className="space-y-4">
            {incidentsByStatus.map(row => (
              <div key={row.status} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <StatusBadge status={row.status} />
                  <span className="font-mono text-slate-300 font-semibold">{row.count} ({row.percentage}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${
                      row.status === 'OPEN'
                        ? 'bg-rose-500'
                        : row.status === 'IN_PROGRESS'
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${row.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 2: Responder Workload & Violations by Policy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operator Workload */}
        <Card
          title="Incident Workload by Responder"
          subtitle="Assigned cases per security engineer"
          action={
            <button
              onClick={() => exportArrayToCsv('responder_workload', userIncidentWorkload)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Personnel</th>
                  <th className="py-2.5 px-3 text-center">Active Cases</th>
                  <th className="py-2.5 px-3 text-center">Resolved</th>
                  <th className="py-2.5 px-3 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {userIncidentWorkload.map(u => (
                  <tr key={u.userId} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-semibold text-white">{u.name}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-rose-400 font-bold">{u.open}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-400 font-bold">{u.resolved}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-300">{u.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Violations by Policy */}
        <Card
          title="Policy Violations by Policy"
          subtitle="Non-compliance triggers by rule category"
          action={
            <button
              onClick={() => exportArrayToCsv('violations_by_policy', violationsByPolicy)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Policy Rule</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-center">Violations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {violationsByPolicy.map(p => (
                  <tr key={p.policyId} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-semibold text-white max-w-xs truncate">{p.name}</td>
                    <td className="py-2.5 px-3 font-mono text-sky-400">{p.category}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-400">{p.violations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Row 3: Non-Compliant Cloud Resources Detail */}
      <Card
        title="Non-Compliant Resources Audit Report"
        subtitle="Active non-compliance records failing regulatory controls"
        action={
          <button
            onClick={() => exportArrayToCsv('non_compliant_resources_report', nonCompliantRecords)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Resource Name</th>
                <th className="py-2.5 px-3">Environment</th>
                <th className="py-2.5 px-3">Framework</th>
                <th className="py-2.5 px-3">Failing Requirement</th>
                <th className="py-2.5 px-3">Last Checked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {nonCompliantRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 italic">
                    All audited cloud resources are currently compliant!
                  </td>
                </tr>
              ) : (
                nonCompliantRecords.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-semibold text-white">{r.resource}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{r.environment}</td>
                    <td className="py-2.5 px-3 font-mono text-sky-400">{r.framework}</td>
                    <td className="py-2.5 px-3 text-rose-300 font-medium">{r.requirement}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{r.lastChecked}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
