import {
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  CloudAccount,
  CloudResource,
  Vulnerability,
  ResourceVulnerability,
  SecurityPolicy,
  PolicyViolation,
  SecurityFinding,
  Incident,
  IncidentAction,
  ComplianceFramework,
  ComplianceRequirement,
  ResourceCompliance,
  AuditLog,
} from '../types/database';

export const INITIAL_USERS: User[] = [
  { id: 1, username: 'alex.chen', full_name: 'Alex Chen', email: 'alex.chen@secops.io', created_at: '2026-01-15T09:30:00Z' },
  { id: 2, username: 'sarah.connor', full_name: 'Sarah Connor', email: 'sarah.c@secops.io', created_at: '2026-01-16T11:20:00Z' },
  { id: 3, username: 'marcus.vance', full_name: 'Marcus Vance', email: 'marcus.v@secops.io', created_at: '2026-02-01T14:15:00Z' },
  { id: 4, username: 'elena.rostova', full_name: 'Elena Rostova', email: 'elena.r@secops.io', created_at: '2026-02-10T16:45:00Z' },
  { id: 5, username: 'david.kim', full_name: 'David Kim', email: 'david.kim@secops.io', created_at: '2026-03-05T08:00:00Z' },
];

export const INITIAL_ROLES: Role[] = [
  { id: 1, role_name: 'Security Admin', description: 'Full access to all security configurations, policies, and audits' },
  { id: 2, role_name: 'Incident Responder', description: 'Can investigate, triage, and remediate security findings and incidents' },
  { id: 3, role_name: 'Compliance Auditor', description: 'Read-only access to policies, findings, and compliance frameworks' },
  { id: 4, role_name: 'Cloud Engineer', description: 'Manages cloud resources and remediates resource-level misconfigurations' },
];

export const INITIAL_PERMISSIONS: Permission[] = [
  { id: 1, permission_name: 'users.manage', description: 'Create, update, and deactivate user accounts' },
  { id: 2, permission_name: 'roles.manage', description: 'Assign roles and configure permissions' },
  { id: 3, permission_name: 'accounts.manage', description: 'Connect and manage cloud provider accounts' },
  { id: 4, permission_name: 'resources.manage', description: 'Register and update cloud infrastructure resources' },
  { id: 5, permission_name: 'vulnerabilities.manage', description: 'Add, update, and link CVEs and CVSS scores' },
  { id: 6, permission_name: 'policies.manage', description: 'Create and update baseline security policies' },
  { id: 7, permission_name: 'incidents.respond', description: 'Update status, assign, and take incident actions' },
  { id: 8, permission_name: 'compliance.audit', description: 'View and assess compliance status and generate reports' },
  { id: 9, permission_name: 'audit.view', description: 'Inspect system-wide audit activity logs' },
];

export const INITIAL_USER_ROLES: UserRole[] = [
  { user_id: 1, role_id: 1 }, // Alex: Admin
  { user_id: 2, role_id: 2 }, // Sarah: Incident Responder
  { user_id: 3, role_id: 4 }, // Marcus: Cloud Engineer
  { user_id: 4, role_id: 3 }, // Elena: Compliance Auditor
  { user_id: 5, role_id: 2 }, // David: Incident Responder
];

export const INITIAL_ROLE_PERMISSIONS: RolePermission[] = [
  { role_id: 1, permission_id: 1 },
  { role_id: 1, permission_id: 2 },
  { role_id: 1, permission_id: 3 },
  { role_id: 1, permission_id: 4 },
  { role_id: 1, permission_id: 5 },
  { role_id: 1, permission_id: 6 },
  { role_id: 1, permission_id: 7 },
  { role_id: 1, permission_id: 8 },
  { role_id: 1, permission_id: 9 },
  { role_id: 2, permission_id: 5 },
  { role_id: 2, permission_id: 7 },
  { role_id: 2, permission_id: 9 },
  { role_id: 3, permission_id: 8 },
  { role_id: 3, permission_id: 9 },
  { role_id: 4, permission_id: 4 },
  { role_id: 4, permission_id: 5 },
];

export const INITIAL_CLOUD_ACCOUNTS: CloudAccount[] = [
  { id: 1, account_name: 'prod-aws-core', provider: 'AWS', region: 'us-east-1', owner_id: 1, created_at: '2026-01-20T10:00:00Z' },
  { id: 2, account_name: 'analytics-gcp-prod', provider: 'GCP', region: 'us-central1', owner_id: 3, created_at: '2026-02-05T12:30:00Z' },
  { id: 3, account_name: 'corp-azure-ad', provider: 'AZURE', region: 'eastus2', owner_id: 1, created_at: '2026-02-12T09:15:00Z' },
  { id: 4, account_name: 'dev-aws-sandbox', provider: 'AWS', region: 'us-west-2', owner_id: 3, created_at: '2026-03-01T15:00:00Z' },
];

export const INITIAL_CLOUD_RESOURCES: CloudResource[] = [
  { id: 1, resource_name: 'prod-api-gateway-vm', account_id: 1, resource_type: 'VIRTUAL_MACHINE', environment: 'PRODUCTION', status: 'ACTIVE', created_at: '2026-01-22T08:00:00Z' },
  { id: 2, resource_name: 'customer-data-rds', account_id: 1, resource_type: 'DATABASE', environment: 'PRODUCTION', status: 'ACTIVE', created_at: '2026-01-22T09:30:00Z' },
  { id: 3, resource_name: 'public-assets-s3', account_id: 1, resource_type: 'STORAGE', environment: 'PRODUCTION', status: 'ACTIVE', created_at: '2026-01-23T14:20:00Z' },
  { id: 4, resource_name: 'bigquery-warehouse', account_id: 2, resource_type: 'DATABASE', environment: 'PRODUCTION', status: 'ACTIVE', created_at: '2026-02-08T11:00:00Z' },
  { id: 5, resource_name: 'gke-compute-cluster', account_id: 2, resource_type: 'VIRTUAL_MACHINE', environment: 'PRODUCTION', status: 'ACTIVE', created_at: '2026-02-10T16:00:00Z' },
  { id: 6, resource_name: 'azure-keyvault-core', account_id: 3, resource_type: 'STORAGE', environment: 'PRODUCTION', status: 'ACTIVE', created_at: '2026-02-15T13:45:00Z' },
  { id: 7, resource_name: 'dev-test-node-01', account_id: 4, resource_type: 'VIRTUAL_MACHINE', environment: 'DEVELOPMENT', status: 'ACTIVE', created_at: '2026-03-02T10:10:00Z' },
  { id: 8, resource_name: 'staging-vpc-network', account_id: 4, resource_type: 'NETWORK', environment: 'TESTING', status: 'INACTIVE', created_at: '2026-03-03T11:45:00Z' },
];

export const INITIAL_VULNERABILITIES: Vulnerability[] = [
  { id: 1, cve_id: 'CVE-2026-3190', title: 'Remote Code Execution in OpenSSL Handshake', severity: 'CRITICAL', cvss_score: 9.8, description: 'Improper buffer boundary check permits unauthenticated arbitrary code execution via crafted TLS ClientHello.' },
  { id: 2, cve_id: 'CVE-2026-2489', title: 'PostgreSQL Privilege Escalation via Function Overloading', severity: 'HIGH', cvss_score: 8.4, description: 'Authenticated low-privilege users can execute commands with superuser privileges via malformed procedure calls.' },
  { id: 3, cve_id: 'CVE-2025-5021', title: 'Kubernetes API Server Request Smuggling', severity: 'HIGH', cvss_score: 7.9, description: 'Inconsistent HTTP header parsing allows reverse proxy bypass and access to internal clusters.' },
  { id: 4, cve_id: 'CVE-2026-1184', title: 'Nginx Denial of Service via HTTP/2 Rapid Reset', severity: 'MEDIUM', cvss_score: 6.5, description: 'Stream cancellation floods result in thread starvation and unresponsiveness under peak loads.' },
  { id: 5, cve_id: 'CVE-2025-9832', title: 'Weak SSL/TLS Cipher Suites Enabled', severity: 'LOW', cvss_score: 3.7, description: 'Server supports legacy CBC cipher suites susceptible to plaintext recovery attacks.' },
];

export const INITIAL_RESOURCE_VULNERABILITIES: ResourceVulnerability[] = [
  { resource_id: 1, vulnerability_id: 1, status: 'OPEN', detected_at: '2026-11-20T10:15:00Z' },
  { resource_id: 2, vulnerability_id: 2, status: 'IN_PROGRESS', detected_at: '2026-11-19T14:40:00Z' },
  { resource_id: 5, vulnerability_id: 3, status: 'OPEN', detected_at: '2026-11-21T08:20:00Z' },
  { resource_id: 1, vulnerability_id: 4, status: 'RESOLVED', detected_at: '2026-11-15T12:00:00Z' },
  { resource_id: 7, vulnerability_id: 5, status: 'OPEN', detected_at: '2026-11-22T09:00:00Z' },
];

export const INITIAL_SECURITY_POLICIES: SecurityPolicy[] = [
  { id: 1, policy_name: 'POL-ENC-01: Storage Encryption at Rest', policy_type: 'DATA_SECURITY', description: 'All cloud storage buckets and database volumes must use AES-256 encryption managed by KMS.', created_at: '2026-01-20T10:00:00Z' },
  { id: 2, policy_name: 'POL-NET-02: Disallow Public SSH/RDP Ingress', policy_type: 'ACCESS_CONTROL', description: 'Network security groups must not permit 0.0.0.0/0 inbound on TCP ports 22 or 3389.', created_at: '2026-01-20T10:30:00Z' },
  { id: 3, policy_name: 'POL-BAK-03: Production Automated Snapshots', policy_type: 'DATA_PROTECTION', description: 'All databases in PRODUCTION environment must maintain automated daily backups with 30-day retention.', created_at: '2026-02-01T11:00:00Z' },
  { id: 4, policy_name: 'POL-LOG-04: Centralized CloudTrail Ingestion', policy_type: 'DATA_SECURITY', description: 'All cloud accounts must route management and data events to a tamper-proof audit S3 bucket.', created_at: '2026-02-15T15:00:00Z' },
];

export const INITIAL_POLICY_VIOLATIONS: PolicyViolation[] = [
  { id: 1, policy_id: 2, resource_id: 1, violation_description: 'TCP port 22 (SSH) open to world 0.0.0.0/0 on prod-api-gateway-vm security group sg-0a91f', status: 'OPEN', detected_at: '2026-11-22T14:30:00Z' },
  { id: 2, policy_id: 1, resource_id: 3, violation_description: 'S3 bucket public-assets-s3 lacks default server-side encryption (SSE-S3/KMS)', status: 'IN_PROGRESS', detected_at: '2026-11-21T09:15:00Z' },
  { id: 3, policy_id: 3, resource_id: 2, violation_description: 'RDS automated backup window disabled during recent maintenance window', status: 'RESOLVED', detected_at: '2026-11-18T16:00:00Z' },
];

export const INITIAL_SECURITY_FINDINGS: SecurityFinding[] = [
  { id: 1, resource_id: 1, finding_type: 'Vulnerability', severity: 'CRITICAL', description: 'OpenSSL critical RCE (CVE-2026-3190) detected on internet-facing gateway host.', status: 'OPEN', detected_at: '2026-11-22T08:30:00Z' },
  { id: 2, resource_id: 1, finding_type: 'Misconfiguration', severity: 'HIGH', description: 'Public SSH management port 22 open without bastion proxy or VPN requirement.', status: 'OPEN', detected_at: '2026-11-22T14:35:00Z' },
  { id: 3, resource_id: 2, finding_type: 'Vulnerability', severity: 'HIGH', description: 'PostgreSQL privilege escalation flaw (CVE-2026-2489) on production customer DB.', status: 'IN_PROGRESS', detected_at: '2026-11-20T11:00:00Z' },
  { id: 4, resource_id: 3, finding_type: 'Policy Violation', severity: 'MEDIUM', description: 'Unencrypted storage volume violates enterprise data at rest security standard.', status: 'IN_PROGRESS', detected_at: '2026-11-21T09:20:00Z' },
  { id: 5, resource_id: 7, finding_type: 'Misconfiguration', severity: 'LOW', description: 'Development instance running deprecated OS kernel patch version.', status: 'RESOLVED', detected_at: '2026-11-17T13:10:00Z' },
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 1,
    title: 'INC-2026-001: Critical TLS RCE on Core API Gateway',
    finding_id: 1,
    assigned_to: 2, // Sarah Connor
    priority: 'CRITICAL',
    status: 'OPEN',
    description: 'Automated detection triggered by CVE-2026-3190. Internet-facing VM prod-api-gateway-vm exposed to active exploitation attempts.',
    created_at: '2026-11-22T08:35:00Z',
    resolved_at: null,
  },
  {
    id: 2,
    title: 'INC-2026-002: Customer RDS Vulnerability Remediation',
    finding_id: 3,
    assigned_to: 5, // David Kim
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    description: 'PostgreSQL database patch scheduled for off-peak maintenance window to remediate privilege escalation.',
    created_at: '2026-11-20T11:15:00Z',
    resolved_at: null,
  },
  {
    id: 3,
    title: 'INC-2026-003: Public S3 Bucket Unencrypted Storage Alert',
    finding_id: 4,
    assigned_to: 3, // Marcus Vance
    priority: 'MEDIUM',
    status: 'RESOLVED',
    description: 'Bucket encryption enabled using KMS key alias/secops-storage-key. Verified compliant with SOC2.',
    created_at: '2026-11-18T10:00:00Z',
    resolved_at: '2026-11-19T16:20:00Z',
  },
];

export const INITIAL_INCIDENT_ACTIONS: IncidentAction[] = [
  { id: 1, incident_id: 1, performed_by: 2, action_description: 'Incident triaged and elevated to P1 Critical. Contacted Cloud Ops on-call.', action_date: '2026-11-22T08:45:00Z' },
  { id: 2, incident_id: 1, performed_by: 1, action_description: 'Applied WAF virtual patch rule #8921 to drop malformed TLS ClientHello handshakes.', action_date: '2026-11-22T09:10:00Z' },
  { id: 3, incident_id: 2, performed_by: 5, action_description: 'Scheduled maintenance snapshot for DB cluster before applying minor engine patch.', action_date: '2026-11-20T14:00:00Z' },
  { id: 4, incident_id: 3, performed_by: 3, action_description: 'Ran AWS CLI command to enforce SSE-KMS on bucket public-assets-s3.', action_date: '2026-11-19T15:30:00Z' },
  { id: 5, incident_id: 3, performed_by: 2, action_description: 'Verified bucket objects encrypted; incident closed successfully.', action_date: '2026-11-19T16:20:00Z' },
];

export const INITIAL_COMPLIANCE_FRAMEWORKS: ComplianceFramework[] = [
  { id: 1, framework_name: 'ISO/IEC 27001:2022', description: 'International standard for information security management systems (ISMS).' },
  { id: 2, framework_name: 'SOC 2 Type II', description: 'Trust Services Criteria for Security, Availability, and Confidentiality.' },
  { id: 3, framework_name: 'GDPR (EU 2016/679)', description: 'General Data Protection Regulation for processing personal EU resident data.' },
  { id: 4, framework_name: 'CIS AWS Foundations 2.0', description: 'Center for Internet Security prescriptive guidelines for Amazon Web Services.' },
];

export const INITIAL_COMPLIANCE_REQUIREMENTS: ComplianceRequirement[] = [
  { id: 1, framework_id: 1, requirement_name: 'A.8.20 Network Security', description: 'Networks and network devices shall be secured, managed, and controlled to protect information.' },
  { id: 2, framework_id: 1, requirement_name: 'A.8.24 Cryptography Usage', description: 'Rules for the effective use of cryptography, including cryptographic key management, shall be defined.' },
  { id: 3, framework_id: 2, requirement_name: 'CC6.1 Logical Access Controls', description: 'The entity implements logical access security software, infrastructure, and architectures.' },
  { id: 4, framework_id: 3, requirement_name: 'Article 32 Security of Processing', description: 'Pseudonymisation and encryption of personal data to ensure ongoing confidentiality and integrity.' },
  { id: 5, framework_id: 4, requirement_name: 'CIS-AWS-1.16 Ensure S3 Buckets Disallow Public Access', description: 'Enable S3 Block Public Access at the account and bucket level.' },
];

export const INITIAL_RESOURCE_COMPLIANCE: ResourceCompliance[] = [
  { resource_id: 1, requirement_id: 1, status: 'NON_COMPLIANT', last_checked: '2026-11-22T14:30:00Z' },
  { resource_id: 2, requirement_id: 4, status: 'COMPLIANT', last_checked: '2026-11-21T00:00:00Z' },
  { resource_id: 3, requirement_id: 5, status: 'NON_COMPLIANT', last_checked: '2026-11-21T09:15:00Z' },
  { resource_id: 4, requirement_id: 4, status: 'COMPLIANT', last_checked: '2026-11-20T03:00:00Z' },
  { resource_id: 6, requirement_id: 2, status: 'COMPLIANT', last_checked: '2026-11-22T06:00:00Z' },
  { resource_id: 7, requirement_id: 3, status: 'PENDING', last_checked: '2026-11-22T10:00:00Z' },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 1, user_id: 1, action: 'UPDATE_STATUS', table_name: 'incidents', record_id: 3, action_timestamp: '2026-11-19T16:20:00Z' },
  { id: 2, user_id: 2, action: 'INSERT_ACTION', table_name: 'incident_actions', record_id: 2, action_timestamp: '2026-11-22T09:10:00Z' },
  { id: 3, user_id: 1, action: 'CREATE_POLICY', table_name: 'security_policies', record_id: 4, action_timestamp: '2026-02-15T15:00:00Z' },
  { id: 4, user_id: 3, action: 'ATTACH_VULNERABILITY', table_name: 'resource_vulnerabilities', record_id: '1-1', action_timestamp: '2026-11-20T10:15:00Z' },
  { id: 5, user_id: 1, action: 'TRIGGER_AUTO_INCIDENT', table_name: 'incidents', record_id: 1, action_timestamp: '2026-11-22T08:35:00Z' },
];
