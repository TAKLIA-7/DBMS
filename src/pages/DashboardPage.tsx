import React, { useEffect, useState } from 'react';
import {
  Users,
  Cloud,
  Server,
  Bug,
  AlertTriangle,
  Flame,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { StatCard, Card } from '../components/common/Card';
import { SeverityBadge, StatusBadge, ProviderBadge, ComplianceBadge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import {
  getUsers,
  getCloudAccounts,
  getCloudResources,
  getVulnerabilities,
  getIncidents,
  getPolicyViolations,
  getResourceCompliance,
  getAuditLogs,
} from '../services/api';
import {
  Incident,
  Vulnerability,
  PolicyViolation,
  AuditLog,
  CloudResource,
} from '../types/database';

export const DashboardPage: React.FC = () => {
  const { setActiveTab, setSelectedIncidentId, refreshKey } = useApp();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAccounts: 0,
    totalResources: 0,
    totalVulnerabilities: 0,
    criticalVulnerabilities: 0,
    openIncidents: 0,
    highPriorityIncidents: 0,
    policyViolations: 0,
    nonCompliantResources: 0,
  });

  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [recentVulnerabilities, setRecentVulnerabilities] = useState<Vulnerability[]>([]);
  const [recentViolations, setRecentViolations] = useState<PolicyViolation[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditLog[]>([]);

  // Chart data distributions
  const [vulnBySeverity, setVulnBySeverity] = useState<Record<string, number>>({});
  const [incidentsByStatus, setIncidentsByStatus] = useState<Record<string, number>>({});
  const [resourcesByProvider, setResourcesByProvider] = useState<Record<string, number>>({});
  const [complianceDistribution, setComplianceDistribution] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [
          users,
          accounts,
          resources,
          vulns,
          incidents,
          violations,
          compliance,
          audits,
        ] = await Promise.all([
          getUsers(),
          getCloudAccounts(),
          getCloudResources(),
          getVulnerabilities(),
          getIncidents(),
          getPolicyViolations(),
          getResourceCompliance(),
          getAuditLogs(),
        ]);

        const criticalVulns = vulns.filter(v => v.severity === 'CRITICAL').length;
        const openIncs = incidents.filter(i => i.status === 'OPEN').length;
        const highPriorityIncs = incidents.filter(i => i.priority === 'HIGH' || i.priority === 'CRITICAL').length;
        const nonComp = compliance.filter(c => c.status === 'NON_COMPLIANT').length;

        setStats({
          totalUsers: users.length,
          totalAccounts: accounts.length,
          totalResources: resources.length,
          totalVulnerabilities: vulns.length,
          criticalVulnerabilities: criticalVulns,
          openIncidents: openIncs,
          highPriorityIncidents: highPriorityIncs,
          policyViolations: violations.length,
          nonCompliantResources: nonComp,
        });

        setRecentIncidents(incidents.slice(0, 5));
        setRecentVulnerabilities(vulns.slice(0, 5));
        setRecentViolations(violations.slice(0, 5));
        setRecentAudits(audits.slice(0, 5));

        // Grouping
        const sevMap: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
        vulns.forEach(v => {
          sevMap[v.severity] = (sevMap[v.severity] || 0) + 1;
        });
        setVulnBySeverity(sevMap);

        const incMap: Record<string, number> = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };
        incidents.forEach(i => {
          incMap[i.status] = (incMap[i.status] || 0) + 1;
        });
        setIncidentsByStatus(incMap);

        const provMap: Record<string, number> = {};
        accounts.forEach(a => {
          provMap[a.provider] = (provMap[a.provider] || 0) + 1;
        });
        setResourcesByProvider(provMap);

        const compMap: Record<string, number> = { COMPLIANT: 0, NON_COMPLIANT: 0, PENDING: 0 };
        compliance.forEach(c => {
          compMap[c.status] = (compMap[c.status] || 0) + 1;
        });
        setComplianceDistribution(compMap);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [refreshKey]);

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Critical Issues exist */}
      {stats.criticalVulnerabilities > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/80 to-slate-900 border border-rose-500/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                {stats.criticalVulnerabilities} Critical Security Vulnerabilities Require Immediate Action
              </h4>
              <p className="text-xs text-rose-300/80">
                Active CVEs with CVSS &gt;= 9.0 detected across production infrastructure.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('vulnerabilities')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 transition flex items-center space-x-1"
          >
            <span>Review CVEs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grid of 9 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Registered SecOps operators"
          icon={Users}
          onClick={() => setActiveTab('users')}
        />
        <StatCard
          title="Cloud Accounts"
          value={stats.totalAccounts}
          subtitle="Multi-cloud tenants connected"
          icon={Cloud}
          variant="info"
          onClick={() => setActiveTab('cloud-accounts')}
        />
        <StatCard
          title="Cloud Resources"
          value={stats.totalResources}
          subtitle="VMs, databases, storage & VPCs"
          icon={Server}
          onClick={() => setActiveTab('cloud-resources')}
        />
        <StatCard
          title="Total Vulnerabilities"
          value={stats.totalVulnerabilities}
          subtitle="Indexed CVE security flaws"
          icon={Bug}
          onClick={() => setActiveTab('vulnerabilities')}
        />
        <StatCard
          title="Critical Vulnerabilities"
          value={stats.criticalVulnerabilities}
          subtitle="CVSS 9.0 - 10.0 exploit potential"
          icon={ShieldAlert}
          variant={stats.criticalVulnerabilities > 0 ? 'danger' : 'default'}
          onClick={() => setActiveTab('vulnerabilities')}
        />
        <StatCard
          title="Open Incidents"
          value={stats.openIncidents}
          subtitle="Active cases pending mitigation"
          icon={Flame}
          variant={stats.openIncidents > 0 ? 'warning' : 'success'}
          onClick={() => setActiveTab('incidents')}
        />
        <StatCard
          title="High Priority Incidents"
          value={stats.highPriorityIncidents}
          subtitle="Elevated P1 / P2 severity"
          icon={AlertTriangle}
          variant="danger"
          onClick={() => setActiveTab('incidents')}
        />
        <StatCard
          title="Policy Violations"
          value={stats.policyViolations}
          subtitle="Compliance drifts & misconfigurations"
          icon={AlertTriangle}
          variant="warning"
          onClick={() => setActiveTab('policy-violations')}
        />
        <StatCard
          title="Non-Compliant Resources"
          value={stats.nonCompliantResources}
          subtitle="Failing regulatory controls"
          icon={FileCheck}
          variant={stats.nonCompliantResources > 0 ? 'danger' : 'success'}
          onClick={() => setActiveTab('compliance')}
        />
      </div>

      {/* Visual Distributions / Distribution Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vulnerabilities by Severity */}
        <Card title="Vulnerabilities by Severity" subtitle="CVE distribution breakdown">
          <div className="space-y-3 mt-1">
            {Object.entries(vulnBySeverity).map(([sev, count]) => {
              const total = stats.totalVulnerabilities || 1;
              const pct = Math.round((count / total) * 100);
              let barColor = 'bg-sky-500';
              if (sev === 'CRITICAL') barColor = 'bg-rose-500';
              if (sev === 'HIGH') barColor = 'bg-orange-500';
              if (sev === 'MEDIUM') barColor = 'bg-amber-500';

              return (
                <div key={sev} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-mono">{sev}</span>
                    <span className="text-slate-400 font-semibold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Incidents by Status */}
        <Card title="Incidents by Status" subtitle="Active resolution pipeline">
          <div className="space-y-3 mt-1">
            {Object.entries(incidentsByStatus).map(([st, count]) => {
              const total = (incidentsByStatus.OPEN + incidentsByStatus.IN_PROGRESS + incidentsByStatus.RESOLVED) || 1;
              const pct = Math.round((count / total) * 100);
              let barColor = 'bg-slate-500';
              if (st === 'OPEN') barColor = 'bg-rose-500';
              if (st === 'IN_PROGRESS') barColor = 'bg-blue-500';
              if (st === 'RESOLVED') barColor = 'bg-emerald-500';

              return (
                <div key={st} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-mono">{st.replace('_', ' ')}</span>
                    <span className="text-slate-400 font-semibold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Resources by Provider */}
        <Card title="Cloud Resources by Provider" subtitle="Multi-cloud estate share">
          <div className="space-y-3 mt-1">
            {Object.entries(resourcesByProvider).length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No accounts registered</p>
            ) : (
              Object.entries(resourcesByProvider).map(([provider, count]) => {
                const total = stats.totalAccounts || 1;
                const pct = Math.round((count / total) * 100);
                let barColor = 'bg-sky-500';
                if (provider === 'AWS') barColor = 'bg-amber-500';
                if (provider === 'AZURE') barColor = 'bg-blue-500';
                if (provider === 'GCP') barColor = 'bg-red-500';

                return (
                  <div key={provider} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-mono">{provider}</span>
                      <span className="text-slate-400 font-semibold">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Compliance Distribution */}
        <Card title="Compliance Posture" subtitle="ISO 27001 & SOC 2 status">
          <div className="space-y-3 mt-1">
            {Object.entries(complianceDistribution).map(([st, count]) => {
              const total = (complianceDistribution.COMPLIANT + complianceDistribution.NON_COMPLIANT + complianceDistribution.PENDING) || 1;
              const pct = Math.round((count / total) * 100);
              let barColor = 'bg-slate-500';
              if (st === 'COMPLIANT') barColor = 'bg-emerald-500';
              if (st === 'NON_COMPLIANT') barColor = 'bg-rose-500';
              if (st === 'PENDING') barColor = 'bg-amber-500';

              return (
                <div key={st} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-mono">{st.replace('_', ' ')}</span>
                    <span className="text-slate-400 font-semibold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Tables: Recent Incidents & Recent Vulnerabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <Card
          title="Recent Security Incidents"
          subtitle="Latest escalated threats and breaches"
          action={
            <button
              onClick={() => setActiveTab('incidents')}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentIncidents.map(inc => (
                  <tr
                    key={inc.id}
                    onClick={() => {
                      setSelectedIncidentId(inc.id);
                      setActiveTab('incidents');
                    }}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="py-2.5 px-3 font-medium text-white max-w-[200px] truncate">
                      {inc.title}
                    </td>
                    <td className="py-2.5 px-3">
                      <SeverityBadge severity={inc.priority} />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {inc.assigned_user?.full_name || 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recently Detected Vulnerabilities */}
        <Card
          title="Recently Detected Vulnerabilities"
          subtitle="CVE catalog and exploit severity"
          action={
            <button
              onClick={() => setActiveTab('vulnerabilities')}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">CVE ID</th>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">CVSS</th>
                  <th className="py-2.5 px-3">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentVulnerabilities.map(v => (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-400">
                      {v.cve_id}
                    </td>
                    <td className="py-2.5 px-3 max-w-[180px] truncate text-slate-200">
                      {v.title}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold">
                      {v.cvss_score.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3">
                      <SeverityBadge severity={v.severity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Tables: Recent Policy Violations & Audit Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Policy Violations */}
        <Card
          title="Recent Policy Violations"
          subtitle="Non-compliance telemetry"
          action={
            <button
              onClick={() => setActiveTab('policy-violations')}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Policy</th>
                  <th className="py-2.5 px-3">Resource</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentViolations.map(viol => (
                  <tr key={viol.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-medium text-white max-w-[150px] truncate">
                      {viol.security_policy?.policy_name || `Policy #${viol.policy_id}`}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 max-w-[150px] truncate">
                      {viol.cloud_resource?.resource_name || `Res #${viol.resource_id}`}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={viol.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Audit Activities */}
        <Card
          title="Recent System Audit Activities"
          subtitle="Immutable operational trace logs"
          action={
            <button
              onClick={() => setActiveTab('audit-logs')}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target Table</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentAudits.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono text-sky-400 font-medium">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {log.table_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {log.user?.full_name || 'System / Trigger'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">
                      {new Date(log.action_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
