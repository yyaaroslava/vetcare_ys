import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import AppLayout from './components/layout/AppLayout';

import ClientPets from './pages/client/Pets';
import ClientMedCard from './pages/client/MedCard';

import VetPatients from './pages/vet/Patients';

import './index.css';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'doctor') return <Navigate to="/vet" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/client" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* Client */}
          <Route path="/client" element={
            <PrivateRoute roles={['client']}>
              <AppLayout role="client" />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="pets" replace />} />
            <Route path="pets" element={<ClientPets />} />
            <Route path="pets/:id" element={<ClientMedCard />} />
          </Route>

          {/* Vet */}
          <Route path="/vet" element={
            <PrivateRoute roles={['doctor']}>
              <AppLayout role="doctor" />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="patients" replace />} />
            <Route path="patients" element={<VetPatients />} />
            <Route path="patients/:id" element={<ClientMedCard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
