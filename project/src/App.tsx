import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import HomePage from './components/Home/HomePage';
import LoginPage from './components/Login/LoginPage';
import ApplyProcess from './components/Apply/ApplyProcess';
import TrackApplication from './components/Track/TrackApplication';
import OfficerDashboard from './components/Dashboard/OfficerDashboard';
import AuditWall from './components/Audit/AuditWall';
import './i18n';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        {isAuthenticated && <Navbar />}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/apply" element={
            <ProtectedRoute requiredRole="user">
              <ApplyProcess />
            </ProtectedRoute>
          } />
          <Route path="/track" element={
            <ProtectedRoute requiredRole="user">
              <TrackApplication />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="officer">
              <OfficerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/audit" element={
            <ProtectedRoute requiredRole="officer">
              <AuditWall />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;