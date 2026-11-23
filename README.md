# Cloud Security and Incident Management System (CSIMS)

A modern, responsive, database-driven frontend for a college RDBMS project: **Cloud Security and Incident Management System**.

Designed and built to model a real-world Cloud Security Operations Center (SecOps) & Incident Management platform with live connection to **Supabase PostgreSQL** and an interactive offline **Demo Mode**.

---

## 🌟 Key Features

1. **Dashboard Overview**:
   - 9 interactive statistic cards (Total Users, Cloud Accounts, Cloud Resources, Total CVEs, Critical CVEs, Open Incidents, High Priority Incidents, Policy Violations, Non-Compliant Resources).
   - Real-time visual risk distributions (Severity breakdown, Incident pipeline, Provider share, Compliance posture).
   - Recent activity feeds for Incidents, Vulnerabilities, Policy Violations, and System Audit Logs.

2. **14 Dedicated Security Modules**:
   - **Users**: User credentials, identity management, and role associations.
   - **Roles & Permissions**: Role-based access control (RBAC) mapping with composite keys (`user_roles`, `role_permissions`).
   - **Cloud Accounts**: Multi-cloud accounts (AWS, Azure, GCP, Other) with regional placement and owner tracking.
   - **Cloud Resources**: Assets inventory (VMs, Databases, Storage, Networks) with posture inspection drawer.
   - **Vulnerabilities**: CVE catalog, CVSS scoring (0-10), and resource linking (`resource_vulnerabilities`).
   - **Security Policies**: Governance and security baseline rules (Access control, Encryption at rest).
   - **Policy Violations**: Real-time non-compliance detection.
   - **Security Findings**: Telemetry correlation with **Critical Incident Auto-Trigger** logic.
   - **Incidents**: Incident response ticketing with priority, owner assignment, resolution timestamps, and action history.
   - **Incident Actions**: Sequential forensic and remediation action log (`incident_actions`).
   - **Compliance**: Regulatory frameworks (ISO 27001, SOC 2, GDPR) and control requirement assessments (`resource_compliance`).
   - **Audit Logs**: Immutable sequential timeline of all system and database mutations with multi-field filtering.
   - **Reports**: Analytical distribution summaries with instant CSV exports.
   - **Settings**: Live Supabase connection configuration, connection health tester, demo mode toggle, and schema viewer.

---

## 🗄️ Relational Database Schema (18 Tables)

| # | Table Name | Purpose | Keys / Constraints |
|---|---|---|---|
| 1 | `users` | Security personnel & operators | `id` (PK) |
| 2 | `roles` | Access roles | `id` (PK) |
| 3 | `permissions` | Granular permission capabilities | `id` (PK) |
| 4 | `user_roles` | User to role assignments | `(user_id, role_id)` Composite PK |
| 5 | `role_permissions` | Role to permission assignments | `(role_id, permission_id)` Composite PK |
| 6 | `cloud_accounts` | Connected cloud tenants | `id` (PK), `owner_id` (FK) |
| 7 | `cloud_resources` | Infrastructure assets | `id` (PK), `account_id` (FK) |
| 8 | `vulnerabilities` | CVE database & CVSS scores | `id` (PK), `cve_id` (Unique) |
| 9 | `resource_vulnerabilities` | Linked flaws on resources | `(resource_id, vulnerability_id)` Composite PK |
| 10 | `security_policies` | Baseline security rules | `id` (PK) |
| 11 | `policy_violations` | Detected policy drifts | `id` (PK), `policy_id`, `resource_id` (FKs) |
| 12 | `security_findings` | Findings & threat telemetry | `id` (PK), `resource_id` (FK) |
| 13 | `incidents` | Security incident cases | `id` (PK), `finding_id` (Unique FK), `assigned_to` (FK) |
| 14 | `incident_actions` | Remediation action history | `id` (PK), `incident_id` (FK) |
| 15 | `compliance_frameworks` | Compliance standards | `id` (PK) |
| 16 | `compliance_requirements` | Framework control requirements | `id` (PK), `framework_id` (FK) |
| 17 | `resource_compliance` | Resource control evaluations | `(resource_id, requirement_id)` Composite PK |
| 18 | `audit_logs` | Immutable operational audit logs | `id` (PK), `user_id` (FK) |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm**

### 2. Installation
```bash
npm install
```

### 3. Supabase Setup (Optional for Live Mode)
If you want to connect to a live Supabase project:
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard and run the included `supabase_schema.sql` file.
3. Copy your **Project URL** and **Anon Key** from `Project Settings -> API`.
4. Create a `.env` file or configure via the in-app **Settings** page:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

*Note: If no Supabase credentials are provided, the application runs automatically in **Interactive Demo Mode** with complete mock records and full persistence.*

### 4. Running Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 5. Production Build
```bash
npm run build
```
Generates production-optimized assets in the `dist` folder.

---

## 🛡️ Security Highlights
- **Zero Secret Exposure**: Frontend utilizes exclusively the public `anon` API key. No `service-role` keys or password hashes are ever handled in browser storage or queries.
- **Relational Integrity**: Prevents duplicate composite keys (`user_roles`, `role_permissions`, `resource_vulnerabilities`, `resource_compliance`).
- **Audit Logging**: Sensitive mutations automatically record immutable entries to the `audit_logs` table.
