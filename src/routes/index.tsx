import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { ProtectedLayout } from '../components/Layouts/ProtectedLayout';
import Login from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import ObservationsPage from '@/pages/Observations';
import SessionDetailPage from '@/pages/Observations/Detail';
import PdpRulesPage from '@/pages/PdpRules';
import PdpRuleEditor from '@/pages/PdpRules/Editor';
import GridPage from '@/pages/Grid';
import ChecklistPage from '@/pages/Checklist';
import LearningCirclesPage from '@/pages/LearningCircles';
import ExportsPage from '@/pages/Exports';
import SchoolsPage from '@/pages/Schools';
import CoachesPage from '@/pages/Coaches';
import SettingsPage from '@/pages/Settings';
import TeachersPage from '@/pages/Teacher';
import SyncsPage from '@/pages/Sync';

export const Router = () => {
  const { user } = useContext(UserContext);
  const location = useLocation();

  return (
    <Routes location={location}>
      {!user ? (
        <Route path="/admin" element={<Login />} />
      ) : (
        <Route path="/admin" element={<ProtectedLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="sessions" element={<ObservationsPage />} />
          <Route path="sessions/:id" element={<SessionDetailPage />} />
          <Route path="learning-circles" element={<LearningCirclesPage />} />
          <Route path="exports" element={<ExportsPage />} />
          <Route path="grid" element={<GridPage />} />
          <Route path="checklist" element={<ChecklistPage />} />
          <Route path="pdp-rules" element={<PdpRulesPage />} />
          <Route path="pdp-rules/:id" element={<PdpRuleEditor />} />
          <Route path="schools" element={<SchoolsPage />} />
          <Route path="coaches" element={<CoachesPage />} />
          <Route path="teachers" element={<TeachersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="syncs" element={<SyncsPage />} />
        </Route>
      )}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};
