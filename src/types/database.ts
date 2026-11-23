// TypeScript Definitions for Cloud Security & Incident Management System

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type FindingStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type ViolationStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type VulnerabilityStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type CloudProvider = 'AWS' | 'AZURE' | 'GCP' | 'OTHER';
export type EnvironmentType = 'PRODUCTION' | 'DEVELOPMENT' | 'TESTING';
export type ResourceStatus = 'ACTIVE' | 'INACTIVE';
export type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING';

// 1. users
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  created_at: string;
}

// 2. roles
export interface Role {
  id: number;
  role_name: string;
  description: string;
}

// 3. permissions
export interface Permission {
  id: number;
  permission_name: string;
  description: string;
}

// 4. user_roles (composite: user_id, role_id)
export interface UserRole {
  user_id: number;
  role_id: number;
}

// 5. role_permissions (composite: role_id, permission_id)
export interface RolePermission {
  role_id: number;
  permission_id: number;
}

// 6. cloud_accounts
export interface CloudAccount {
  id: number;
  account_name: string;
  provider: CloudProvider;
  region: string;
  owner_id: number | null;
  created_at: string;
  // Join helper
  owner?: User;
}

// 7. cloud_resources
export interface CloudResource {
  id: number;
  resource_name: string;
  account_id: number;
  resource_type: string; // e.g. VIRTUAL_MACHINE, DATABASE, STORAGE, NETWORK
  environment: EnvironmentType;
  status: ResourceStatus;
  created_at: string;
  // Join helper
  cloud_account?: CloudAccount;
}

// 8. vulnerabilities
export interface Vulnerability {
  id: number;
  cve_id: string;
  title: string;
  severity: SeverityLevel;
  cvss_score: number;
  description: string;
}

// 9. resource_vulnerabilities (composite: resource_id, vulnerability_id)
export interface ResourceVulnerability {
  resource_id: number;
  vulnerability_id: number;
  status: VulnerabilityStatus;
  detected_at: string;
  // Join helpers
  cloud_resource?: CloudResource;
  vulnerability?: Vulnerability;
}

// 10. security_policies
export interface SecurityPolicy {
  id: number;
  policy_name: string;
  policy_type: string; // e.g. DATA_SECURITY, ACCESS_CONTROL, DATA_PROTECTION
  description: string;
  created_at: string;
}

// 11. policy_violations
export interface PolicyViolation {
  id: number;
  policy_id: number;
  resource_id: number;
  violation_description: string;
  status: ViolationStatus;
  detected_at: string;
  // Join helpers
  security_policy?: SecurityPolicy;
  cloud_resource?: CloudResource;
}

// 12. security_findings
export interface SecurityFinding {
  id: number;
  resource_id: number;
  finding_type: string; // e.g. Vulnerability, Misconfiguration, Policy Violation
  severity: SeverityLevel;
  description: string;
  status: FindingStatus;
  detected_at: string;
  // Join helpers
  cloud_resource?: CloudResource;
}

// 13. incidents
export interface Incident {
  id: number;
  title: string;
  finding_id: number | null; // unique: 1 finding -> 1 incident
  assigned_to: number | null;
  priority: IncidentPriority;
  status: IncidentStatus;
  description?: string;
  created_at: string;
  resolved_at: string | null;
  // Join helpers
  security_finding?: SecurityFinding;
  assigned_user?: User;
}

// 14. incident_actions
export interface IncidentAction {
  id: number;
  incident_id: number;
  performed_by: number | null;
  action_description: string;
  action_date: string;
  // Join helper
  performer?: User;
}

// 15. compliance_frameworks
export interface ComplianceFramework {
  id: number;
  framework_name: string;
  description: string;
}

// 16. compliance_requirements
export interface ComplianceRequirement {
  id: number;
  framework_id: number;
  requirement_name: string;
  description: string;
  // Join helper
  framework?: ComplianceFramework;
}

// 17. resource_compliance (composite: resource_id, requirement_id)
export interface ResourceCompliance {
  resource_id: number;
  requirement_id: number;
  status: ComplianceStatus;
  last_checked: string;
  // Join helpers
  cloud_resource?: CloudResource;
  compliance_requirement?: ComplianceRequirement;
}

// 18. audit_logs
export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  table_name: string;
  record_id: number | string | null;
  action_timestamp: string;
  // Join helper
  user?: User;
}

// UI and Navigation types
export type NavigationTab = 
  | 'dashboard'
  | 'users'
  | 'roles-permissions'
  | 'cloud-accounts'
  | 'cloud-resources'
  | 'vulnerabilities'
  | 'security-policies'
  | 'policy-violations'
  | 'security-findings'
  | 'incidents'
  | 'compliance'
  | 'audit-logs'
  | 'reports'
  | 'settings';
