import { getSupabase } from './supabase';
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
import {
  INITIAL_USERS,
  INITIAL_ROLES,
  INITIAL_PERMISSIONS,
  INITIAL_USER_ROLES,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_CLOUD_ACCOUNTS,
  INITIAL_CLOUD_RESOURCES,
  INITIAL_VULNERABILITIES,
  INITIAL_RESOURCE_VULNERABILITIES,
  INITIAL_SECURITY_POLICIES,
  INITIAL_POLICY_VIOLATIONS,
  INITIAL_SECURITY_FINDINGS,
  INITIAL_INCIDENTS,
  INITIAL_INCIDENT_ACTIONS,
  INITIAL_COMPLIANCE_FRAMEWORKS,
  INITIAL_COMPLIANCE_REQUIREMENTS,
  INITIAL_RESOURCE_COMPLIANCE,
  INITIAL_AUDIT_LOGS,
} from './mockData';

// Local storage keys for Demo persistence
const LS_PREFIX = 'csec_db_';
function getLocal<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) : initial;
  } catch {
    return initial;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

export function resetDemoDatabase() {
  const keys = [
    'users', 'roles', 'permissions', 'user_roles', 'role_permissions',
    'cloud_accounts', 'cloud_resources', 'vulnerabilities', 'resource_vulnerabilities',
    'security_policies', 'policy_violations', 'security_findings', 'incidents',
    'incident_actions', 'compliance_frameworks', 'compliance_requirements',
    'resource_compliance', 'audit_logs'
  ];
  keys.forEach(k => localStorage.removeItem(LS_PREFIX + k));
}

// Helper to log audit activity
async function logAudit(user_id: number | null, action: string, table_name: string, record_id: any) {
  const client = getSupabase();
  const newLog: AuditLog = {
    id: Date.now(),
    user_id,
    action,
    table_name,
    record_id: String(record_id),
    action_timestamp: new Date().toISOString(),
  };

  if (client) {
    try {
      await client.from('audit_logs').insert([{
        user_id,
        action,
        table_name,
        record_id: String(record_id),
        action_timestamp: newLog.action_timestamp,
      }]);
      return;
    } catch {
      // fallback
    }
  }

  const logs = getLocal<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
  setLocal('audit_logs', [newLog, ...logs]);
}

// ----------------- USERS -----------------
export async function getUsers(): Promise<User[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('users').select('*').order('id');
    if (!error && data) return data as User[];
  }
  return getLocal<User[]>('users', INITIAL_USERS);
}

export async function createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('users').insert([{
      username: user.username,
      email: user.email,
      full_name: user.full_name,
    }]).select().single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'CREATE_USER', 'users', data.id);
    return data as User;
  }

  const users = getLocal<User[]>('users', INITIAL_USERS);
  if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) {
    throw new Error(`Username '${user.username}' already exists.`);
  }
  if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
    throw new Error(`Email '${user.email}' already exists.`);
  }

  const newUser: User = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    ...user,
    created_at: new Date().toISOString(),
  };
  setLocal('users', [...users, newUser]);
  await logAudit(1, 'CREATE_USER', 'users', newUser.id);
  return newUser;
}

export async function updateUser(id: number, updates: Partial<User>): Promise<User> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('users').update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'UPDATE_USER', 'users', id);
    return data as User;
  }

  const users = getLocal<User[]>('users', INITIAL_USERS);
  const index = users.findIndex(u => u.id === id);
  if (index === -1) throw new Error('User not found');
  const updated = { ...users[index], ...updates };
  users[index] = updated;
  setLocal('users', [...users]);
  await logAudit(1, 'UPDATE_USER', 'users', id);
  return updated;
}

export async function deleteUser(id: number): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('users').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await logAudit(1, 'DELETE_USER', 'users', id);
    return;
  }

  const users = getLocal<User[]>('users', INITIAL_USERS);
  setLocal('users', users.filter(u => u.id !== id));
  await logAudit(1, 'DELETE_USER', 'users', id);
}

// ----------------- ROLES & PERMISSIONS -----------------
export async function getRoles(): Promise<Role[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('roles').select('*').order('id');
    if (!error && data) return data as Role[];
  }
  return getLocal<Role[]>('roles', INITIAL_ROLES);
}

export async function createRole(role: Omit<Role, 'id'>): Promise<Role> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('roles').insert([role]).select().single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'CREATE_ROLE', 'roles', data.id);
    return data as Role;
  }
  const roles = getLocal<Role[]>('roles', INITIAL_ROLES);
  const newRole: Role = {
    id: roles.length > 0 ? Math.max(...roles.map(r => r.id)) + 1 : 1,
    ...role,
  };
  setLocal('roles', [...roles, newRole]);
  await logAudit(1, 'CREATE_ROLE', 'roles', newRole.id);
  return newRole;
}

export async function getPermissions(): Promise<Permission[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('permissions').select('*').order('id');
    if (!error && data) return data as Permission[];
  }
  return getLocal<Permission[]>('permissions', INITIAL_PERMISSIONS);
}

export async function createPermission(perm: Omit<Permission, 'id'>): Promise<Permission> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('permissions').insert([perm]).select().single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'CREATE_PERMISSION', 'permissions', data.id);
    return data as Permission;
  }
  const perms = getLocal<Permission[]>('permissions', INITIAL_PERMISSIONS);
  const newPerm: Permission = {
    id: perms.length > 0 ? Math.max(...perms.map(p => p.id)) + 1 : 1,
    ...perm,
  };
  setLocal('permissions', [...perms, newPerm]);
  await logAudit(1, 'CREATE_PERMISSION', 'permissions', newPerm.id);
  return newPerm;
}

export async function getUserRoles(): Promise<UserRole[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('user_roles').select('*');
    if (!error && data) return data as UserRole[];
  }
  return getLocal<UserRole[]>('user_roles', INITIAL_USER_ROLES);
}

export async function assignUserRole(user_id: number, role_id: number): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('user_roles').insert([{ user_id, role_id }]);
    if (error) {
      if (error.code === '23505') throw new Error('Role is already assigned to this user.');
      throw new Error(error.message);
    }
    await logAudit(1, 'ASSIGN_ROLE', 'user_roles', `${user_id}-${role_id}`);
    return;
  }
  const userRoles = getLocal<UserRole[]>('user_roles', INITIAL_USER_ROLES);
  if (userRoles.some(ur => ur.user_id === user_id && ur.role_id === role_id)) {
    throw new Error('This user already has this role assigned.');
  }
  setLocal('user_roles', [...userRoles, { user_id, role_id }]);
  await logAudit(1, 'ASSIGN_ROLE', 'user_roles', `${user_id}-${role_id}`);
}

export async function removeUserRole(user_id: number, role_id: number): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('user_roles').delete().match({ user_id, role_id });
    if (error) throw new Error(error.message);
    await logAudit(1, 'REMOVE_ROLE', 'user_roles', `${user_id}-${role_id}`);
    return;
  }
  const userRoles = getLocal<UserRole[]>('user_roles', INITIAL_USER_ROLES);
  setLocal('user_roles', userRoles.filter(ur => !(ur.user_id === user_id && ur.role_id === role_id)));
  await logAudit(1, 'REMOVE_ROLE', 'user_roles', `${user_id}-${role_id}`);
}

export async function getRolePermissions(): Promise<RolePermission[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('role_permissions').select('*');
    if (!error && data) return data as RolePermission[];
  }
  return getLocal<RolePermission[]>('role_permissions', INITIAL_ROLE_PERMISSIONS);
}

export async function assignRolePermission(role_id: number, permission_id: number): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('role_permissions').insert([{ role_id, permission_id }]);
    if (error) {
      if (error.code === '23505') throw new Error('Permission already assigned to this role.');
      throw new Error(error.message);
    }
    await logAudit(1, 'ASSIGN_PERMISSION', 'role_permissions', `${role_id}-${permission_id}`);
    return;
  }
  const list = getLocal<RolePermission[]>('role_permissions', INITIAL_ROLE_PERMISSIONS);
  if (list.some(rp => rp.role_id === role_id && rp.permission_id === permission_id)) {
    throw new Error('Permission already assigned to this role.');
  }
  setLocal('role_permissions', [...list, { role_id, permission_id }]);
  await logAudit(1, 'ASSIGN_PERMISSION', 'role_permissions', `${role_id}-${permission_id}`);
}

export async function removeRolePermission(role_id: number, permission_id: number): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('role_permissions').delete().match({ role_id, permission_id });
    if (error) throw new Error(error.message);
    await logAudit(1, 'REMOVE_PERMISSION', 'role_permissions', `${role_id}-${permission_id}`);
    return;
  }
  const list = getLocal<RolePermission[]>('role_permissions', INITIAL_ROLE_PERMISSIONS);
  setLocal('role_permissions', list.filter(rp => !(rp.role_id === role_id && rp.permission_id === permission_id)));
  await logAudit(1, 'REMOVE_PERMISSION', 'role_permissions', `${role_id}-${permission_id}`);
}

// ----------------- CLOUD ACCOUNTS -----------------
export async function getCloudAccounts(): Promise<CloudAccount[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('cloud_accounts').select('*, owner:users!owner_id(*)').order('id');
    if (!error && data) return data as CloudAccount[];
  }
  const accounts = getLocal<CloudAccount[]>('cloud_accounts', INITIAL_CLOUD_ACCOUNTS);
  const users = getLocal<User[]>('users', INITIAL_USERS);
  return accounts.map(a => ({
    ...a,
    owner: users.find(u => u.id === a.owner_id),
  }));
}

export async function createCloudAccount(account: Omit<CloudAccount, 'id' | 'created_at'>): Promise<CloudAccount> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('cloud_accounts').insert([account]).select('*, owner:users!owner_id(*)').single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'CREATE_ACCOUNT', 'cloud_accounts', data.id);
    return data as CloudAccount;
  }
  const accounts = getLocal<CloudAccount[]>('cloud_accounts', INITIAL_CLOUD_ACCOUNTS);
  const newAccount: CloudAccount = {
    id: accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1,
    ...account,
    created_at: new Date().toISOString(),
  };
  setLocal('cloud_accounts', [...accounts, newAccount]);
  await logAudit(1, 'CREATE_ACCOUNT', 'cloud_accounts', newAccount.id);
  const users = getLocal<User[]>('users', INITIAL_USERS);
  return { ...newAccount, owner: users.find(u => u.id === newAccount.owner_id) };
}

export async function updateCloudAccount(id: number, updates: Partial<CloudAccount>): Promise<CloudAccount> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('cloud_accounts').update(updates).eq('id', id).select('*, owner:users!owner_id(*)').single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'UPDATE_ACCOUNT', 'cloud_accounts', id);
    return data as CloudAccount;
  }
  const accounts = getLocal<CloudAccount[]>('cloud_accounts', INITIAL_CLOUD_ACCOUNTS);
  const idx = accounts.findIndex(a => a.id === id);
  if (idx === -1) throw new Error('Account not found');
  accounts[idx] = { ...accounts[idx], ...updates };
  setLocal('cloud_accounts', [...accounts]);
  await logAudit(1, 'UPDATE_ACCOUNT', 'cloud_accounts', id);
  const users = getLocal<User[]>('users', INITIAL_USERS);
  return { ...accounts[idx], owner: users.find(u => u.id === accounts[idx].owner_id) };
}

export async function deleteCloudAccount(id: number): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('cloud_accounts').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await logAudit(1, 'DELETE_ACCOUNT', 'cloud_accounts', id);
    return;
  }
  const accounts = getLocal<CloudAccount[]>('cloud_accounts', INITIAL_CLOUD_ACCOUNTS);
  setLocal('cloud_accounts', accounts.filter(a => a.id !== id));
  await logAudit(1, 'DELETE_ACCOUNT', 'cloud_accounts', id);
}

// ----------------- CLOUD RESOURCES -----------------
export async function getCloudResources(): Promise<CloudResource[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('cloud_resources').select('*, cloud_account:cloud_accounts!account_id(*)').order('id');
    if (!error && data) return data as CloudResource[];
  }
  const resources = getLocal<CloudResource[]>('cloud_resources', INITIAL_CLOUD_RESOURCES);
  const accounts = getLocal<CloudAccount[]>('cloud_accounts', INITIAL_CLOUD_ACCOUNTS);
  return resources.map(r => ({
    ...r,
    cloud_account: accounts.find(a => a.id === r.account_id),
  }));
}

export async function createCloudResource(res: Omit<CloudResource, 'id' | 'created_at'>): Promise<CloudResource> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('cloud_resources').insert([res]).select('*, cloud_account:cloud_accounts!account_id(*)').single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'CREATE_RESOURCE', 'cloud_resources', data.id);
    return data as CloudResource;
  }
  const resources = getLocal<CloudResource[]>('cloud_resources', INITIAL_CLOUD_RESOURCES);
  const newRes: CloudResource = {
    id: resources.length > 0 ? Math.max(...resources.map(r => r.id)) + 1 : 1,
    ...res,
    created_at: new Date().toISOString(),
  };
  setLocal('cloud_resources', [...resources, newRes]);
  await logAudit(1, 'CREATE_RESOURCE', 'cloud_resources', newRes.id);
  const accounts = getLocal<CloudAccount[]>('cloud_accounts', INITIAL_CLOUD_ACCOUNTS);
  return { ...newRes, cloud_account: accounts.find(a => a.id === newRes.account_id) };
}

export async function updateCloudResource(id: number, updates: Partial<CloudResource>): Promise<CloudResource> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('cloud_resources').update(updates).eq('id', id).select('*, cloud_account:cloud_accounts!account_id(*)').single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'UPDATE_RESOURCE', 'cloud_resources', id);
    return data as CloudResource;
  }
  const resources = getLocal<CloudResource[]>('cloud_resources', INITIAL_CLOUD_RESOURCES);
  const idx = resources.findIndex(r => r.id === id);
  if (idx === -1) throw new Error('Resource not found');
  resources[idx] = { ...resources[idx], ...updates };
  setLocal('cloud_resources', [...resources]);
  await logAudit(1, 'UPDATE_RESOURCE', 'cloud_resources', id);
  const accounts = getLocal<CloudAccount[]>('cloud_accounts', INITIAL_CLOUD_ACCOUNTS);
  return { ...resources[idx], cloud_account: accounts.find(a => a.id === resources[idx].account_id) };
}

export async function deleteCloudResource(id: number): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('cloud_resources').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await logAudit(1, 'DELETE_RESOURCE', 'cloud_resources', id);
    return;
  }
  const resources = getLocal<CloudResource[]>('cloud_resources', INITIAL_CLOUD_RESOURCES);
  setLocal('cloud_resources', resources.filter(r => r.id !== id));
  await logAudit(1, 'DELETE_RESOURCE', 'cloud_resources', id);
}

// ----------------- VULNERABILITIES -----------------
export async function getVulnerabilities(): Promise<Vulnerability[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('vulnerabilities').select('*').order('id');
    if (!error && data) return data as Vulnerability[];
  }
  return getLocal<Vulnerability[]>('vulnerabilities', INITIAL_VULNERABILITIES);
}

export async function createVulnerability(vuln: Omit<Vulnerability, 'id'>): Promise<Vulnerability> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('vulnerabilities').insert([vuln]).select().single();
    if (error) {
      if (error.code === '23505') throw new Error(`CVE ID '${vuln.cve_id}' already exists.`);
      throw new Error(error.message);
    }
    await logAudit(1, 'CREATE_VULNERABILITY', 'vulnerabilities', data.id);
    return data as Vulnerability;
  }
  const list = getLocal<Vulnerability[]>('vulnerabilities', INITIAL_VULNERABILITIES);
  if (list.some(v => v.cve_id.trim().toUpperCase() === vuln.cve_id.trim().toUpperCase())) {
    throw new Error(`CVE ID '${vuln.cve_id}' already exists.`);
  }
  const newV: Vulnerability = {
    id: list.length > 0 ? Math.max(...list.map(v => v.id)) + 1 : 1,
    ...vuln,
    cve_id: vuln.cve_id.trim().toUpperCase(),
  };
  setLocal('vulnerabilities', [...list, newV]);
  await logAudit(1, 'CREATE_VULNERABILITY', 'vulnerabilities', newV.id);
  return newV;
}

export async function updateVulnerability(id: number, updates: Partial<Vulnerability>): Promise<Vulnerability> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('vulnerabilities').update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'UPDATE_VULNERABILITY', 'vulnerabilities', id);
    return data as Vulnerability;
  }
  const list = getLocal<Vulnerability[]>('vulnerabilities', INITIAL_VULNERABILITIES);
  const idx = list.findIndex(v => v.id === id);
  if (idx === -1) throw new Error('Vulnerability not found');
  list[idx] = { ...list[idx], ...updates };
  setLocal('vulnerabilities', [...list]);
  await logAudit(1, 'UPDATE_VULNERABILITY', 'vulnerabilities', id);
  return list[idx];
}

export async function deleteVulnerability(id: number): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('vulnerabilities').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await logAudit(1, 'DELETE_VULNERABILITY', 'vulnerabilities', id);
    return;
  }
  const list = getLocal<Vulnerability[]>('vulnerabilities', INITIAL_VULNERABILITIES);
  setLocal('vulnerabilities', list.filter(v => v.id !== id));
  await logAudit(1, 'DELETE_VULNERABILITY', 'vulnerabilities', id);
}

// ----------------- RESOURCE VULNERABILITIES -----------------
export async function getResourceVulnerabilities(): Promise<ResourceVulnerability[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from('resource_vulnerabilities')
      .select('*, cloud_resource:cloud_resources!resource_id(*), vulnerability:vulnerabilities!vulnerability_id(*)');
    if (!error && data) return data as ResourceVulnerability[];
  }
  const list = getLocal<ResourceVulnerability[]>('resource_vulnerabilities', INITIAL_RESOURCE_VULNERABILITIES);
  const resources = getLocal<CloudResource[]>('cloud_resources', INITIAL_CLOUD_RESOURCES);
  const vulns = getLocal<Vulnerability[]>('vulnerabilities', INITIAL_VULNERABILITIES);
  return list.map(item => ({
    ...item,
    cloud_resource: resources.find(r => r.id === item.resource_id),
    vulnerability: vulns.find(v => v.id === item.vulnerability_id),
  }));
}

export async function associateResourceVulnerability(
  resource_id: number,
  vulnerability_id: number,
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' = 'OPEN'
): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('resource_vulnerabilities').insert([{
      resource_id,
      vulnerability_id,
      status,
      detected_at: new Date().toISOString(),
    }]);
    if (error) {
      if (error.code === '23505') throw new Error('This vulnerability is already linked to this cloud resource.');
      throw new Error(error.message);
    }
    await logAudit(1, 'LINK_VULNERABILITY', 'resource_vulnerabilities', `${resource_id}-${vulnerability_id}`);
    return;
  }
  const list = getLocal<ResourceVulnerability[]>('resource_vulnerabilities', INITIAL_RESOURCE_VULNERABILITIES);
  if (list.some(i => i.resource_id === resource_id && i.vulnerability_id === vulnerability_id)) {
    throw new Error('This vulnerability is already linked to this cloud resource.');
  }
  setLocal('resource_vulnerabilities', [
    ...list,
    {
      resource_id,
      vulnerability_id,
      status,
      detected_at: new Date().toISOString(),
    },
  ]);
  await logAudit(1, 'LINK_VULNERABILITY', 'resource_vulnerabilities', `${resource_id}-${vulnerability_id}`);
}

export async function updateResourceVulnerabilityStatus(
  resource_id: number,
  vulnerability_id: number,
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client
      .from('resource_vulnerabilities')
      .update({ status })
      .match({ resource_id, vulnerability_id });
    if (error) throw new Error(error.message);
    await logAudit(1, 'UPDATE_LINKED_VULN_STATUS', 'resource_vulnerabilities', `${resource_id}-${vulnerability_id}`);
    return;
  }
  const list = getLocal<ResourceVulnerability[]>('resource_vulnerabilities', INITIAL_RESOURCE_VULNERABILITIES);
  const idx = list.findIndex(i => i.resource_id === resource_id && i.vulnerability_id === vulnerability_id);
  if (idx !== -1) {
    list[idx].status = status;
    setLocal('resource_vulnerabilities', [...list]);
    await logAudit(1, 'UPDATE_LINKED_VULN_STATUS', 'resource_vulnerabilities', `${resource_id}-${vulnerability_id}`);
  }
}

export async function dissociateResourceVulnerability(resource_id: number, vulnerability_id: number): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client
      .from('resource_vulnerabilities')
      .delete()
      .match({ resource_id, vulnerability_id });
    if (error) throw new Error(error.message);
    await logAudit(1, 'UNLINK_VULNERABILITY', 'resource_vulnerabilities', `${resource_id}-${vulnerability_id}`);
    return;
  }
  const list = getLocal<ResourceVulnerability[]>('resource_vulnerabilities', INITIAL_RESOURCE_VULNERABILITIES);
  setLocal('resource_vulnerabilities', list.filter(i => !(i.resource_id === resource_id && i.vulnerability_id === vulnerability_id)));
  await logAudit(1, 'UNLINK_VULNERABILITY', 'resource_vulnerabilities', `${resource_id}-${vulnerability_id}`);
}

// ----------------- SECURITY POLICIES -----------------
export async function getSecurityPolicies(): Promise<SecurityPolicy[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('security_policies').select('*').order('id');
    if (!error && data) return data as SecurityPolicy[];
  }
  return getLocal<SecurityPolicy[]>('security_policies', INITIAL_SECURITY_POLICIES);
}

export async function createSecurityPolicy(p: Omit<SecurityPolicy, 'id' | 'created_at'>): Promise<SecurityPolicy> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('security_policies').insert([p]).select().single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'CREATE_POLICY', 'security_policies', data.id);
    return data as SecurityPolicy;
  }
  const list = getLocal<SecurityPolicy[]>('security_policies', INITIAL_SECURITY_POLICIES);
  const newP: SecurityPolicy = {
    id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
    ...p,
    created_at: new Date().toISOString(),
  };
  setLocal('security_policies', [...list, newP]);
  await logAudit(1, 'CREATE_POLICY', 'security_policies', newP.id);
  return newP;
}

export async function updateSecurityPolicy(id: number, updates: Partial<SecurityPolicy>): Promise<SecurityPolicy> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('security_policies').update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'UPDATE_POLICY', 'security_policies', id);
    return data as SecurityPolicy;
  }
  const list = getLocal<SecurityPolicy[]>('security_policies', INITIAL_SECURITY_POLICIES);
  const idx = list.findIndex(x => x.id === id);
  if (idx === -1) throw new Error('Policy not found');
  list[idx] = { ...list[idx], ...updates };
  setLocal('security_policies', [...list]);
  await logAudit(1, 'UPDATE_POLICY', 'security_policies', id);
  return list[idx];
}

export async function deleteSecurityPolicy(id: number): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('security_policies').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await logAudit(1, 'DELETE_POLICY', 'security_policies', id);
    return;
  }
  const list = getLocal<SecurityPolicy[]>('security_policies', INITIAL_SECURITY_POLICIES);
  setLocal('security_policies', list.filter(x => x.id !== id));
  await logAudit(1, 'DELETE_POLICY', 'security_policies', id);
}

// ----------------- POLICY VIOLATIONS -----------------
export async function getPolicyViolations(): Promise<PolicyViolation[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from('policy_violations')
      .select('*, security_policy:security_policies!policy_id(*), cloud_resource:cloud_resources!resource_id(*)')
      .order('id');
    if (!error && data) return data as PolicyViolation[];
  }
  const list = getLocal<PolicyViolation[]>('policy_violations', INITIAL_POLICY_VIOLATIONS);
  const policies = getLocal<SecurityPolicy[]>('security_policies', INITIAL_SECURITY_POLICIES);
  const resources = getLocal<CloudResource[]>('cloud_resources', INITIAL_CLOUD_RESOURCES);
  return list.map(item => ({
    ...item,
    security_policy: policies.find(p => p.id === item.policy_id),
    cloud_resource: resources.find(r => r.id === item.resource_id),
  }));
}

export async function createPolicyViolation(v: Omit<PolicyViolation, 'id' | 'detected_at'>): Promise<PolicyViolation> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from('policy_violations')
      .insert([v])
      .select('*, security_policy:security_policies!policy_id(*), cloud_resource:cloud_resources!resource_id(*)')
      .single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'CREATE_POLICY_VIOLATION', 'policy_violations', data.id);
    return data as PolicyViolation;
  }
  const list = getLocal<PolicyViolation[]>('policy_violations', INITIAL_POLICY_VIOLATIONS);
  const newV: PolicyViolation = {
    id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
    ...v,
    detected_at: new Date().toISOString(),
  };
  setLocal('policy_violations', [...list, newV]);
  await logAudit(1, 'CREATE_POLICY_VIOLATION', 'policy_violations', newV.id);
  const policies = getLocal<SecurityPolicy[]>('security_policies', INITIAL_SECURITY_POLICIES);
  const resources = getLocal<CloudResource[]>('cloud_resources', INITIAL_CLOUD_RESOURCES);
  return {
    ...newV,
    security_policy: policies.find(p => p.id === newV.policy_id),
    cloud_resource: resources.find(r => r.id === newV.resource_id),
  };
}

export async function updatePolicyViolation(id: number, updates: Partial<PolicyViolation>): Promise<PolicyViolation> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from('policy_violations')
      .update(updates)
      .eq('id', id)
      .select('*, security_policy:security_policies!policy_id(*), cloud_resource:cloud_resources!resource_id(*)')
      .single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'UPDATE_POLICY_VIOLATION', 'policy_violations', id);
    return data as PolicyViolation;
  }
  const list = getLocal<PolicyViolation[]>('policy_violations', INITIAL_POLICY_VIOLATIONS);
  const idx = list.findIndex(x => x.id === id);
  if (idx === -1) throw new Error('Violation not found');
  list[idx] = { ...list[idx], ...updates };
  setLocal('policy_violations', [...list]);
  await logAudit(1, 'UPDATE_POLICY_VIOLATION', 'policy_violations', id);
  const policies = getLocal<SecurityPolicy[]>('security_policies', INITIAL_SECURITY_POLICIES);
  const resources = getLocal<CloudResource[]>('cloud_resources', INITIAL_CLOUD_RESOURCES);
  return {
    ...list[idx],
    security_policy: policies.find(p => p.id === list[idx].policy_id),
    cloud_resource: resources.find(r => r.id === list[idx].resource_id),
  };
}

export async function deletePolicyViolation(id: number): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('policy_violations').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await logAudit(1, 'DELETE_POLICY_VIOLATION', 'policy_violations', id);
    return;
  }
  const list = getLocal<PolicyViolation[]>('policy_violations', INITIAL_POLICY_VIOLATIONS);
  setLocal('policy_violations', list.filter(x => x.id !== id));
  await logAudit(1, 'DELETE_POLICY_VIOLATION', 'policy_violations', id);
}

// ----------------- SECURITY FINDINGS -----------------
export async function getSecurityFindings(): Promise<SecurityFinding[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from('security_findings')
      .select('*, cloud_resource:cloud_resources!resource_id(*)')
      .order('id');
    if (!error && data) return data as SecurityFinding[];
  }
  const list = getLocal<SecurityFinding[]>('security_findings', INITIAL_SECURITY_FINDINGS);
  const resources = getLocal<CloudResource[]>('cloud_resources', INITIAL_CLOUD_RESOURCES);
  return list.map(item => ({
    ...item,
    cloud_resource: resources.find(r => r.id === item.resource_id),
  }));
}

export async function createSecurityFinding(f: Omit<SecurityFinding, 'id' | 'detected_at'>): Promise<{ finding: SecurityFinding; autoIncidentCreated: boolean }> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from('security_findings')
      .insert([f])
      .select('*, cloud_resource:cloud_resources!resource_id(*)')
      .single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'CREATE_SECURITY_FINDING', 'security_findings', data.id);

    // Check if Supabase trigger automatically created an incident
    const { data: incidentData } = await client.from('incidents').select('id').eq('finding_id', data.id).maybeSingle();
    const autoCreated = Boolean(incidentData);

    return { finding: data as SecurityFinding, autoIncidentCreated: autoCreated };
  }

  const list = getLocal<SecurityFinding[]>('security_findings', INITIAL_SECURITY_FINDINGS);
  const newF: SecurityFinding = {
    id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
    ...f,
    detected_at: new Date().toISOString(),
  };
  setLocal('security_findings', [...list, newF]);
  await logAudit(1, 'CREATE_SECURITY_FINDING', 'security_findings', newF.id);

  let autoIncident = false;
  // Trigger simulation: If CRITICAL finding, auto-create an Incident if none exists
  if (newF.severity === 'CRITICAL') {
    const incidents = getLocal<Incident[]>('incidents', INITIAL_INCIDENTS);
    const newInc: Incident = {
      id: incidents.length > 0 ? Math.max(...incidents.map(x => x.id)) + 1 : 1,
      title: `AUTO-INC: Critical Finding on Resource #${newF.resource_id}`,
      finding_id: newF.id,
      assigned_to: null,
      priority: 'CRITICAL',
      status: 'OPEN',
      description: `Automated Incident dispatched from Critical Finding #${newF.id}: ${newF.description}`,
      created_at: new Date().toISOString(),
      resolved_at: null,
    };
    setLocal('incidents', [newInc, ...incidents]);
    await logAudit(1, 'TRIGGER_AUTO_INCIDENT', 'incidents', newInc.id);
    autoIncident = true;
  }

  const resources = getLocal<CloudResource[]>('cloud_resources', INITIAL_CLOUD_RESOURCES);
  return {
    finding: { ...newF, cloud_resource: resources.find(r => r.id === newF.resource_id) },
    autoIncidentCreated: autoIncident,
  };
}

export async function updateSecurityFinding(id: number, updates: Partial<SecurityFinding>): Promise<SecurityFinding> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from('security_findings')
      .update(updates)
      .eq('id', id)
      .select('*, cloud_resource:cloud_resources!resource_id(*)')
      .single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'UPDATE_SECURITY_FINDING', 'security_findings', id);
    return data as SecurityFinding;
  }
  const list = getLocal<SecurityFinding[]>('security_findings', INITIAL_SECURITY_FINDINGS);
  const idx = list.findIndex(x => x.id === id);
  if (idx === -1) throw new Error('Finding not found');
  list[idx] = { ...list[idx], ...updates };
  setLocal('security_findings', [...list]);
  await logAudit(1, 'UPDATE_SECURITY_FINDING', 'security_findings', id);
  const resources = getLocal<CloudResource[]>('cloud_resources', INITIAL_CLOUD_RESOURCES);
  return { ...list[idx], cloud_resource: resources.find(r => r.id === list[idx].resource_id) };
}

export async function deleteSecurityFinding(id: number): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('security_findings').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await logAudit(1, 'DELETE_SECURITY_FINDING', 'security_findings', id);
    return;
  }
  const list = getLocal<SecurityFinding[]>('security_findings', INITIAL_SECURITY_FINDINGS);
  setLocal('security_findings', list.filter(x => x.id !== id));
  await logAudit(1, 'DELETE_SECURITY_FINDING', 'security_findings', id);
}

// ----------------- INCIDENTS -----------------
export async function getIncidents(): Promise<Incident[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from('incidents')
      .select('*, security_finding:security_findings!finding_id(*), assigned_user:users!assigned_to(*)')
      .order('id', { ascending: false });
    if (!error && data) return data as Incident[];
  }
  const list = getLocal<Incident[]>('incidents', INITIAL_INCIDENTS);
  const findings = getLocal<SecurityFinding[]>('security_findings', INITIAL_SECURITY_FINDINGS);
  const users = getLocal<User[]>('users', INITIAL_USERS);
  return list.map(item => ({
    ...item,
    security_finding: findings.find(f => f.id === item.finding_id),
    assigned_user: users.find(u => u.id === item.assigned_to),
  }));
}

export async function createIncident(inc: Omit<Incident, 'id' | 'created_at' | 'resolved_at'>): Promise<Incident> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from('incidents')
      .insert([{
        ...inc,
        created_at: new Date().toISOString(),
        resolved_at: inc.status === 'RESOLVED' ? new Date().toISOString() : null,
      }])
      .select('*, security_finding:security_findings!finding_id(*), assigned_user:users!assigned_to(*)')
      .single();
    if (error) {
      if (error.code === '23505') throw new Error('An incident is already linked to this security finding.');
      throw new Error(error.message);
    }
    await logAudit(1, 'CREATE_INCIDENT', 'incidents', data.id);
    return data as Incident;
  }

  const list = getLocal<Incident[]>('incidents', INITIAL_INCIDENTS);
  if (inc.finding_id && list.some(x => x.finding_id === inc.finding_id)) {
    throw new Error('An incident is already linked to this security finding.');
  }

  const newInc: Incident = {
    id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
    ...inc,
    created_at: new Date().toISOString(),
    resolved_at: inc.status === 'RESOLVED' ? new Date().toISOString() : null,
  };
  setLocal('incidents', [newInc, ...list]);
  await logAudit(1, 'CREATE_INCIDENT', 'incidents', newInc.id);

  const findings = getLocal<SecurityFinding[]>('security_findings', INITIAL_SECURITY_FINDINGS);
  const users = getLocal<User[]>('users', INITIAL_USERS);
  return {
    ...newInc,
    security_finding: findings.find(f => f.id === newInc.finding_id),
    assigned_user: users.find(u => u.id === newInc.assigned_to),
  };
}

export async function updateIncident(id: number, updates: Partial<Incident>): Promise<Incident> {
  const resolved_at = updates.status === 'RESOLVED'
    ? new Date().toISOString()
    : updates.status
      ? null
      : undefined;

  const payload: any = { ...updates };
  if (resolved_at !== undefined) payload.resolved_at = resolved_at;

  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from('incidents')
      .update(payload)
      .eq('id', id)
      .select('*, security_finding:security_findings!finding_id(*), assigned_user:users!assigned_to(*)')
      .single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'UPDATE_INCIDENT', 'incidents', id);
    return data as Incident;
  }

  const list = getLocal<Incident[]>('incidents', INITIAL_INCIDENTS);
  const idx = list.findIndex(x => x.id === id);
  if (idx === -1) throw new Error('Incident not found');

  list[idx] = { ...list[idx], ...payload };
  setLocal('incidents', [...list]);
  await logAudit(1, 'UPDATE_INCIDENT', 'incidents', id);

  const findings = getLocal<SecurityFinding[]>('security_findings', INITIAL_SECURITY_FINDINGS);
  const users = getLocal<User[]>('users', INITIAL_USERS);
  return {
    ...list[idx],
    security_finding: findings.find(f => f.id === list[idx].finding_id),
    assigned_user: users.find(u => u.id === list[idx].assigned_to),
  };
}

export async function deleteIncident(id: number): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('incidents').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await logAudit(1, 'DELETE_INCIDENT', 'incidents', id);
    return;
  }
  const list = getLocal<Incident[]>('incidents', INITIAL_INCIDENTS);
  setLocal('incidents', list.filter(x => x.id !== id));
  await logAudit(1, 'DELETE_INCIDENT', 'incidents', id);
}

// ----------------- INCIDENT ACTIONS -----------------
export async function getIncidentActions(incident_id: number): Promise<IncidentAction[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from('incident_actions')
      .select('*, performer:users!performed_by(*)')
      .eq('incident_id', incident_id)
      .order('action_date', { ascending: false });
    if (!error && data) return data as IncidentAction[];
  }
  const list = getLocal<IncidentAction[]>('incident_actions', INITIAL_INCIDENT_ACTIONS);
  const users = getLocal<User[]>('users', INITIAL_USERS);
  return list
    .filter(a => a.incident_id === incident_id)
    .sort((a, b) => new Date(b.action_date).getTime() - new Date(a.action_date).getTime())
    .map(a => ({
      ...a,
      performer: users.find(u => u.id === a.performed_by),
    }));
}

export async function addIncidentAction(action: Omit<IncidentAction, 'id' | 'action_date'>): Promise<IncidentAction> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from('incident_actions')
      .insert([{
        ...action,
        action_date: new Date().toISOString(),
      }])
      .select('*, performer:users!performed_by(*)')
      .single();
    if (error) throw new Error(error.message);
    await logAudit(action.performed_by, 'INSERT_ACTION', 'incident_actions', data.id);
    return data as IncidentAction;
  }
  const list = getLocal<IncidentAction[]>('incident_actions', INITIAL_INCIDENT_ACTIONS);
  const newAction: IncidentAction = {
    id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
    ...action,
    action_date: new Date().toISOString(),
  };
  setLocal('incident_actions', [newAction, ...list]);
  await logAudit(action.performed_by, 'INSERT_ACTION', 'incident_actions', newAction.id);
  const users = getLocal<User[]>('users', INITIAL_USERS);
  return { ...newAction, performer: users.find(u => u.id === newAction.performed_by) };
}

// ----------------- COMPLIANCE -----------------
export async function getComplianceFrameworks(): Promise<ComplianceFramework[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('compliance_frameworks').select('*').order('id');
    if (!error && data) return data as ComplianceFramework[];
  }
  return getLocal<ComplianceFramework[]>('compliance_frameworks', INITIAL_COMPLIANCE_FRAMEWORKS);
}

export async function createComplianceFramework(f: Omit<ComplianceFramework, 'id'>): Promise<ComplianceFramework> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('compliance_frameworks').insert([f]).select().single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'CREATE_FRAMEWORK', 'compliance_frameworks', data.id);
    return data as ComplianceFramework;
  }
  const list = getLocal<ComplianceFramework[]>('compliance_frameworks', INITIAL_COMPLIANCE_FRAMEWORKS);
  const newF: ComplianceFramework = {
    id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
    ...f,
  };
  setLocal('compliance_frameworks', [...list, newF]);
  await logAudit(1, 'CREATE_FRAMEWORK', 'compliance_frameworks', newF.id);
  return newF;
}

export async function getComplianceRequirements(): Promise<ComplianceRequirement[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('compliance_requirements').select('*, framework:compliance_frameworks!framework_id(*)').order('id');
    if (!error && data) return data as ComplianceRequirement[];
  }
  const list = getLocal<ComplianceRequirement[]>('compliance_requirements', INITIAL_COMPLIANCE_REQUIREMENTS);
  const frameworks = getLocal<ComplianceFramework[]>('compliance_frameworks', INITIAL_COMPLIANCE_FRAMEWORKS);
  return list.map(r => ({
    ...r,
    framework: frameworks.find(f => f.id === r.framework_id),
  }));
}

export async function createComplianceRequirement(r: Omit<ComplianceRequirement, 'id'>): Promise<ComplianceRequirement> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('compliance_requirements').insert([r]).select('*, framework:compliance_frameworks!framework_id(*)').single();
    if (error) throw new Error(error.message);
    await logAudit(1, 'CREATE_REQUIREMENT', 'compliance_requirements', data.id);
    return data as ComplianceRequirement;
  }
  const list = getLocal<ComplianceRequirement[]>('compliance_requirements', INITIAL_COMPLIANCE_REQUIREMENTS);
  const newR: ComplianceRequirement = {
    id: list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1,
    ...r,
  };
  setLocal('compliance_requirements', [...list, newR]);
  await logAudit(1, 'CREATE_REQUIREMENT', 'compliance_requirements', newR.id);
  const frameworks = getLocal<ComplianceFramework[]>('compliance_frameworks', INITIAL_COMPLIANCE_FRAMEWORKS);
  return { ...newR, framework: frameworks.find(f => f.id === newR.framework_id) };
}

export async function getResourceCompliance(): Promise<ResourceCompliance[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from('resource_compliance')
      .select('*, cloud_resource:cloud_resources!resource_id(*), compliance_requirement:compliance_requirements!requirement_id(*, framework:compliance_frameworks!framework_id(*))');
    if (!error && data) return data as ResourceCompliance[];
  }
  const list = getLocal<ResourceCompliance[]>('resource_compliance', INITIAL_RESOURCE_COMPLIANCE);
  const resources = getLocal<CloudResource[]>('cloud_resources', INITIAL_CLOUD_RESOURCES);
  const reqs = getLocal<ComplianceRequirement[]>('compliance_requirements', INITIAL_COMPLIANCE_REQUIREMENTS);
  const frameworks = getLocal<ComplianceFramework[]>('compliance_frameworks', INITIAL_COMPLIANCE_FRAMEWORKS);
  return list.map(rc => {
    const req = reqs.find(r => r.id === rc.requirement_id);
    const fw = req ? frameworks.find(f => f.id === req.framework_id) : undefined;
    return {
      ...rc,
      cloud_resource: resources.find(r => r.id === rc.resource_id),
      compliance_requirement: req ? { ...req, framework: fw } : undefined,
    };
  });
}

export async function assessResourceCompliance(
  resource_id: number,
  requirement_id: number,
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING'
): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('resource_compliance').upsert([{
      resource_id,
      requirement_id,
      status,
      last_checked: new Date().toISOString(),
    }]);
    if (error) throw new Error(error.message);
    await logAudit(1, 'ASSESS_COMPLIANCE', 'resource_compliance', `${resource_id}-${requirement_id}`);
    return;
  }
  const list = getLocal<ResourceCompliance[]>('resource_compliance', INITIAL_RESOURCE_COMPLIANCE);
  const idx = list.findIndex(rc => rc.resource_id === resource_id && rc.requirement_id === requirement_id);
  const record: ResourceCompliance = {
    resource_id,
    requirement_id,
    status,
    last_checked: new Date().toISOString(),
  };
  if (idx !== -1) {
    list[idx] = record;
  } else {
    list.push(record);
  }
  setLocal('resource_compliance', [...list]);
  await logAudit(1, 'ASSESS_COMPLIANCE', 'resource_compliance', `${resource_id}-${requirement_id}`);
}

// ----------------- AUDIT LOGS -----------------
export async function getAuditLogs(): Promise<AuditLog[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('audit_logs').select('*, user:users!user_id(*)').order('action_timestamp', { ascending: false });
    if (!error && data) return data as AuditLog[];
  }
  const list = getLocal<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
  const users = getLocal<User[]>('users', INITIAL_USERS);
  return list.map(log => ({
    ...log,
    user: users.find(u => u.id === log.user_id),
  }));
}
