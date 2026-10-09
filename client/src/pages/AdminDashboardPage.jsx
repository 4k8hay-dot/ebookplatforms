import { useState } from 'react';
import { Container, Typography, Paper, Tabs, Tab, Box } from '@mui/material';
import AdminOverviewTab from '../components/admin/AdminOverviewTab';
import AdminApprovalsTab from '../components/admin/AdminApprovalsTab';
import AdminUsersTab from '../components/admin/AdminUsersTab';
import AdminCategoriesTab from '../components/admin/AdminCategoriesTab';
import AdminReportsTab from '../components/admin/AdminReportsTab';

const TABS = [
  { value: 'overview', label: 'Overview', Component: AdminOverviewTab },
  { value: 'approvals', label: 'Book Approvals', Component: AdminApprovalsTab },
  { value: 'users', label: 'Users', Component: AdminUsersTab },
  { value: 'categories', label: 'Categories', Component: AdminCategoriesTab },
  { value: 'reports', label: 'Reports', Component: AdminReportsTab },
];

/**
 * The full Administration module (FR-ADMIN-*, FR-REPORT-*). The book
 * approval tab is the same functionality that stood alone as
 * /admin/approvals since Phase 3 — it's simply absorbed into this
 * broader dashboard now that the rest of Administration exists.
 */
export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const ActiveComponent = TABS.find((t) => t.value === activeTab).Component;

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Admin dashboard
      </Typography>

      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
          {TABS.map((t) => (
            <Tab key={t.value} value={t.value} label={t.label} />
          ))}
        </Tabs>
      </Paper>

      <Box>
        <ActiveComponent />
      </Box>
    </Container>
  );
}
