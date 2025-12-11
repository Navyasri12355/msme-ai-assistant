import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Onboarding } from './components/Onboarding';
import { HelpCenter } from './components/HelpCenter';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProfileSetup } from './pages/ProfileSetup';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { FinanceDashboard } from './pages/FinanceDashboard';
import { Marketing } from './pages/Marketing';
import { Chat } from './pages/Chat';

function AppContent() {
  const { showOnboarding, completeOnboarding, skipOnboarding, showHelpCenter, closeHelpCenter } = useOnboarding();

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile/setup"
          element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance"
          element={
            <ProtectedRoute>
              <FinanceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing"
          element={
            <ProtectedRoute>
              <Marketing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <Onboarding onComplete={completeOnboarding} onSkip={skipOnboarding} />
      )}

      {/* Help Center Modal */}
      {showHelpCenter && <HelpCenter onClose={closeHelpCenter} />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <OnboardingProvider>
          <AppContent />
        </OnboardingProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
