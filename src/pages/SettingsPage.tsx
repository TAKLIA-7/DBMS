import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, Key, ExternalLink, Copy, Check, ShieldCheck } from 'lucide-react';
import { Card } from '../components/common/Card';
import { useApp } from '../context/AppContext';
import { getStoredConfig, saveStoredConfig, testSupabaseConnection } from '../services/supabase';
import { resetDemoDatabase } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { addToast, triggerRefresh, isDemoMode, toggleDemoMode } = useApp();
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    const config = getStoredConfig();
    setUrl(config.supabaseUrl);
    setAnonKey(config.supabaseKey);
  }, []);

  const handleSave = () => {
    saveStoredConfig(url.trim(), anonKey.trim(), isDemoMode);
    addToast({ type: 'success', title: 'Settings Saved', message: 'Supabase configuration stored in browser.' });
    triggerRefresh();
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(url.trim(), anonKey.trim());
      setTestResult(res);
      if (res.success) {
        addToast({ type: 'success', title: 'Connection Successful', message: res.message });
      } else {
        addToast({ type: 'error', title: 'Connection Test Failed', message: res.message });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
      addToast({ type: 'error', title: 'Connection Failed', message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset local demo database back to clean initial records?')) {
      resetDemoDatabase();
      addToast({ type: 'success', title: 'Database Reset', message: 'All demo records restored to initial state.' });
      triggerRefresh();
    }
  };

  const sqlSchemaSnippet = `-- PostgreSQL Schema for Cloud Security & Incident Management System
-- Run this in your Supabase SQL Editor if setting up tables:

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    permission_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS cloud_accounts (
    id SERIAL PRIMARY KEY,
    account_name VARCHAR(100) NOT NULL,
    provider VARCHAR(20) CHECK (provider IN ('AWS', 'AZURE', 'GCP', 'OTHER')),
    region VARCHAR(50),
    owner_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cloud_resources (
    id SERIAL PRIMARY KEY,
    resource_name VARCHAR(100) NOT NULL,
    account_id INT NOT NULL REFERENCES cloud_accounts(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    environment VARCHAR(20) CHECK (environment IN ('PRODUCTION', 'DEVELOPMENT', 'TESTING')),
    status VARCHAR(20) CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vulnerabilities (
    id SERIAL PRIMARY KEY,
    cve_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    cvss_score NUMERIC(3,1) CHECK (cvss_score >= 0.0 AND cvss_score <= 10.0),
    description TEXT
);

CREATE TABLE IF NOT EXISTS resource_vulnerabilities (
    resource_id INT REFERENCES cloud_resources(id) ON DELETE CASCADE,
    vulnerability_id INT REFERENCES vulnerabilities(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')) DEFAULT 'OPEN',
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (resource_id, vulnerability_id)
);

CREATE TABLE IF NOT EXISTS security_policies (
    id SERIAL PRIMARY KEY,
    policy_name VARCHAR(150) NOT NULL,
    policy_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policy_violations (
    id SERIAL PRIMARY KEY,
    policy_id INT NOT NULL REFERENCES security_policies(id) ON DELETE CASCADE,
    resource_id INT NOT NULL REFERENCES cloud_resources(id) ON DELETE CASCADE,
    violation_description TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')) DEFAULT 'OPEN',
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_findings (
    id SERIAL PRIMARY KEY,
    resource_id INT NOT NULL REFERENCES cloud_resources(id) ON DELETE CASCADE,
    finding_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')) DEFAULT 'OPEN',
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS incident_actions (
    id SERIAL PRIMARY KEY,
    incident_id INT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    performed_by INT REFERENCES users(id) ON DELETE SET NULL,
    action_description TEXT NOT NULL,
    action_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_frameworks (
    id SERIAL PRIMARY KEY,
    framework_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS compliance_requirements (
    id SERIAL PRIMARY KEY,
    framework_id INT NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    requirement_name VARCHAR(150) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS resource_compliance (
    resource_id INT REFERENCES cloud_resources(id) ON DELETE CASCADE,
    requirement_id INT REFERENCES compliance_requirements(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('COMPLIANT', 'NON_COMPLIANT', 'PENDING')) DEFAULT 'PENDING',
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (resource_id, requirement_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(50),
    action_timestamp TIMESTAMPTZ DEFAULT NOW()
);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchemaSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Mode & Live Supabase Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Supabase PostgreSQL Connection" subtitle="Connect the frontend to your remote PostgreSQL instance">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Supabase Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Supabase Anon Public API Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="password"
                  value={anonKey}
                  onChange={e => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Never use the secret service-role key. The anon public key is safe for client-side queries.
                </p>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-lg border text-xs flex items-start space-x-2.5 ${
                    testResult.success
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">{testResult.success ? 'Connected Successfully' : 'Connection Error'}</p>
                    <p className="mt-0.5 opacity-90">{testResult.message}</p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
                >
                  Save Supabase Settings
                </button>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || !url}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* System Mode Switcher */}
        <div className="space-y-6">
          <Card title="Operating Mode" subtitle="Switch between Demo and Supabase">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Interactive Demo Mode</span>
                  <input
                    type="checkbox"
                    checked={isDemoMode}
                    onChange={e => toggleDemoMode(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-900 border-slate-700"
                  />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  In Demo Mode, all 18 RDBMS tables are simulated with localStorage persistence and complete mock records. Perfect for offline presentation!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white block">Reset Demo Database</span>
                <p className="text-xs text-slate-400">
                  Restore all tables back to the clean initial college project seeds.
                </p>
                <button
                  onClick={handleResetData}
                  className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-800/40 hover:bg-rose-900/60 transition"
                >
                  Reset Demo Data
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* SQL Schema Reference Card with Copy */}
      <Card
        title="Supabase PostgreSQL Schema (18 Tables)"
        subtitle="Complete database DDL script with foreign keys, check constraints, and composite primary keys"
        action={
          <button
            onClick={copySql}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                <span>Copy SQL DDL</span>
              </>
            )}
          </button>
        }
      >
        <div className="relative">
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto leading-relaxed">
            {sqlSchemaSnippet}
          </pre>
        </div>
      </Card>
    </div>
  );
};
