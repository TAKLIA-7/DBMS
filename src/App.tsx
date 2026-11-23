import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/layout/Layout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { RolesPermissionsPage } from './pages/RolesPermissionsPage';
import { CloudAccountsPage } from './pages/CloudAccountsPage';
import { CloudResourcesPage } from './pages/CloudResourcesPage';
import { VulnerabilitiesPage } from './pages/VulnerabilitiesPage';
import { SecurityPoliciesPage } from './pages/SecurityPoliciesPage';
import { PolicyViolationsPage } from './pages/PolicyViolationsPage';
import { SecurityFindingsPage } from './pages/SecurityFindingsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { CompliancePage } from './pages/CompliancePage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'users':
        return <UsersPage />;
      case 'roles-permissions':
        return <RolesPermissionsPage />;
      case 'cloud-accounts':
        return <CloudAccountsPage />;
      case 'cloud-resources':
        return <CloudResourcesPage />;
      case 'vulnerabilities':
        return <VulnerabilitiesPage />;
      case 'security-policies':
        return <SecurityPoliciesPage />;
      case 'policy-violations':
        return <PolicyViolationsPage />;
      case 'security-findings':
        return <SecurityFindingsPage />;
      case 'incidents':
        return <IncidentsPage />;
      case 'compliance':
        return <CompliancePage />;
      case 'audit-logs':
        return <AuditLogsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return <Layout>{renderActivePage()}</Layout>;
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
