import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PatientsList } from './pages/Patients/PatientsList';
import { ClinicalHistoryPage } from './pages/ClinicalHistory/ClinicalHistoryPage';
import { TreatmentSessionsPage } from './pages/ClinicalHistory/TreatmentSessionsPage';
import { useScrollToTop } from './hooks/useScrollToTop';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { UsersPage } from './pages/Users/UsersPage';
import { ClinicsPage } from './pages/Clinics/ClinicsPage';
import { TreatmentsPage } from './pages/Treatments/TreatmentsPage';
import { AppointmentsPage } from './pages/Appointments/AppointmentsPage';
import { PageHeaderProvider } from '@/contexts/PageHeaderContext';
import { PaymentsPage } from './pages/Payments/PaymentsPage';
import { ReportsPage } from './pages/Reports/ReportsPage';

function AppRoutes() {
  useScrollToTop();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/patients" element={<PatientsList />} />
        <Route path="/treatments" element={<TreatmentsPage />} />
        <Route path="/clinical-history/:id" element={<ClinicalHistoryPage />} />
        <Route path="/treatment-sessions/:treatmentId/patient/:patientId" element={<TreatmentSessionsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/clinics" element={<ClinicsPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}
function App() {
  if (typeof window !== 'undefined') {
    window.history.scrollRestoration = 'manual';
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <PageHeaderProvider>
          <AppRoutes />
        </PageHeaderProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;