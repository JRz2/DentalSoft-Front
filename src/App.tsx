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
        <Route path="/clinical-history/:id" element={<ClinicalHistoryPage />} />
        <Route path="/treatment-sessions/:treatmentId/patient/:patientId" element={<TreatmentSessionsPage />} />
        <Route path="/users" element={<UsersPage />} />
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
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;