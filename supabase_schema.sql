-- ==============================================================================
-- Cloud Security & Incident Management System (CSIMS)
-- Supabase / PostgreSQL Complete Relational Database Schema
-- College RDBMS Project
-- ==============================================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ROLES
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- 3. PERMISSIONS
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    permission_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- 4. USER_ROLES (Composite PK: user_id, role_id)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 5. ROLE_PERMISSIONS (Composite PK: role_id, permission_id)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 6. CLOUD_ACCOUNTS
CREATE TABLE IF NOT EXISTS cloud_accounts (
    id SERIAL PRIMARY KEY,
    account_name VARCHAR(100) NOT NULL,
    provider VARCHAR(20) CHECK (provider IN ('AWS', 'AZURE', 'GCP', 'OTHER')),
    region VARCHAR(50),
    owner_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CLOUD_RESOURCES
CREATE TABLE IF NOT EXISTS cloud_resources (
    id SERIAL PRIMARY KEY,
    resource_name VARCHAR(100) NOT NULL,
    account_id INT NOT NULL REFERENCES cloud_accounts(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    environment VARCHAR(20) CHECK (environment IN ('PRODUCTION', 'DEVELOPMENT', 'TESTING')),
    status VARCHAR(20) CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. VULNERABILITIES
CREATE TABLE IF NOT EXISTS vulnerabilities (
    id SERIAL PRIMARY KEY,
    cve_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    cvss_score NUMERIC(3,1) CHECK (cvss_score >= 0.0 AND cvss_score <= 10.0),
    description TEXT
);

-- 9. RESOURCE_VULNERABILITIES (Composite PK: resource_id, vulnerability_id)
CREATE TABLE IF NOT EXISTS resource_vulnerabilities (
    resource_id INT NOT NULL REFERENCES cloud_resources(id) ON DELETE CASCADE,
    vulnerability_id INT NOT NULL REFERENCES vulnerabilities(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')) DEFAULT 'OPEN',
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (resource_id, vulnerability_id)
);

-- 10. SECURITY_POLICIES
CREATE TABLE IF NOT EXISTS security_policies (
    id SERIAL PRIMARY KEY,
    policy_name VARCHAR(150) NOT NULL,
    policy_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. POLICY_VIOLATIONS
CREATE TABLE IF NOT EXISTS policy_violations (
    id SERIAL PRIMARY KEY,
    policy_id INT NOT NULL REFERENCES security_policies(id) ON DELETE CASCADE,
    resource_id INT NOT NULL REFERENCES cloud_resources(id) ON DELETE CASCADE,
    violation_description TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')) DEFAULT 'OPEN',
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SECURITY_FINDINGS
CREATE TABLE IF NOT EXISTS security_findings (
    id SERIAL PRIMARY KEY,
    resource_id INT NOT NULL REFERENCES cloud_resources(id) ON DELETE CASCADE,
    finding_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')) DEFAULT 'OPEN',
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. INCIDENTS (finding_id is unique: 1 finding -> 1 incident)
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    finding_id INT UNIQUE REFERENCES security_findings(id) ON DELETE SET NULL,
    assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
    priority VARCHAR(20) CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')) DEFAULT 'OPEN',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 14. INCIDENT_ACTIONS
CREATE TABLE IF NOT EXISTS incident_actions (
    id SERIAL PRIMARY KEY,
    incident_id INT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    performed_by INT REFERENCES users(id) ON DELETE SET NULL,
    action_description TEXT NOT NULL,
    action_date TIMESTAMPTZ DEFAULT NOW()
);

-- 15. COMPLIANCE_FRAMEWORKS
CREATE TABLE IF NOT EXISTS compliance_frameworks (
    id SERIAL PRIMARY KEY,
    framework_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- 16. COMPLIANCE_REQUIREMENTS
CREATE TABLE IF NOT EXISTS compliance_requirements (
    id SERIAL PRIMARY KEY,
    framework_id INT NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    requirement_name VARCHAR(150) NOT NULL,
    description TEXT
);

-- 17. RESOURCE_COMPLIANCE (Composite PK: resource_id, requirement_id)
CREATE TABLE IF NOT EXISTS resource_compliance (
    resource_id INT NOT NULL REFERENCES cloud_resources(id) ON DELETE CASCADE,
    requirement_id INT NOT NULL REFERENCES compliance_requirements(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('COMPLIANT', 'NON_COMPLIANT', 'PENDING')) DEFAULT 'PENDING',
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (resource_id, requirement_id)
);

-- 18. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(50),
    action_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- DATABASE TRIGGERS
-- ==============================================================================

-- Trigger 1: Auto-create Incident when a CRITICAL Security Finding is inserted
CREATE OR REPLACE FUNCTION trg_critical_finding_auto_incident()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.severity = 'CRITICAL' THEN
        INSERT INTO incidents (title, finding_id, priority, status, description, created_at)
        VALUES (
            'AUTO-INC: ' || LEFT(NEW.description, 80),
            NEW.id,
            'CRITICAL',
            'OPEN',
            'Automated critical incident generated from finding #' || NEW.id || ': ' || NEW.description,
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_finding_critical_insert ON security_findings;
CREATE TRIGGER trg_finding_critical_insert
AFTER INSERT ON security_findings
FOR EACH ROW
EXECUTE FUNCTION trg_critical_finding_auto_incident();

-- Trigger 2: Log Incident Status Changes to Audit Logs automatically
CREATE OR REPLACE FUNCTION trg_incident_audit_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, action_timestamp)
        VALUES (
            NEW.assigned_to,
            'INCIDENT_STATUS_' || NEW.status,
            'incidents',
            NEW.id::text,
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_incident_status_update ON incidents;
CREATE TRIGGER trg_incident_status_update
AFTER UPDATE ON incidents
FOR EACH ROW
EXECUTE FUNCTION trg_incident_audit_status();

-- ==============================================================================
-- SAMPLE INITIAL SEED DATA
-- ==============================================================================

INSERT INTO users (id, username, email, full_name) VALUES
(1, 'alex.chen', 'alex.chen@secops.io', 'Alex Chen'),
(2, 'sarah.connor', 'sarah.c@secops.io', 'Sarah Connor'),
(3, 'marcus.vance', 'marcus.v@secops.io', 'Marcus Vance')
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (id, role_name, description) VALUES
(1, 'Security Admin', 'Full access to all security configurations and audits'),
(2, 'Incident Responder', 'Can investigate, triage, and remediate security findings'),
(3, 'Cloud Engineer', 'Manages cloud infrastructure resources and patches')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1), (2, 2), (3, 3)
ON CONFLICT DO NOTHING;

INSERT INTO cloud_accounts (id, account_name, provider, region, owner_id) VALUES
(1, 'prod-aws-core', 'AWS', 'us-east-1', 1),
(2, 'analytics-gcp-prod', 'GCP', 'us-central1', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO cloud_resources (id, resource_name, account_id, resource_type, environment, status) VALUES
(1, 'prod-api-gateway-vm', 1, 'VIRTUAL_MACHINE', 'PRODUCTION', 'ACTIVE'),
(2, 'customer-data-rds', 1, 'DATABASE', 'PRODUCTION', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vulnerabilities (id, cve_id, title, severity, cvss_score, description) VALUES
(1, 'CVE-2026-3190', 'Remote Code Execution in OpenSSL Handshake', 'CRITICAL', 9.8, 'Improper buffer check permits unauthenticated RCE via crafted TLS ClientHello.'),
(2, 'CVE-2026-2489', 'PostgreSQL Privilege Escalation via Procedure', 'HIGH', 8.4, 'Low-privilege users can execute commands with superuser privileges.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO resource_vulnerabilities (resource_id, vulnerability_id, status) VALUES
(1, 1, 'OPEN'),
(2, 2, 'IN_PROGRESS')
ON CONFLICT DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
SELECT setval('cloud_accounts_id_seq', (SELECT MAX(id) FROM cloud_accounts));
SELECT setval('cloud_resources_id_seq', (SELECT MAX(id) FROM cloud_resources));
SELECT setval('vulnerabilities_id_seq', (SELECT MAX(id) FROM vulnerabilities));
