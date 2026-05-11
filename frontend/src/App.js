import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminAnimals from './pages/admin/Animals';
import AdminAppointments from './pages/admin/Appointments';

import AppLayout from './components/layout/AppLayout';

import ClientDashboard from './pages/client/Dashboard';
import ClientPets from './pages/client/Pets';
import ClientMedCard from './pages/client/MedCard';
import ClientAppointments from './pages/client/Appointments';

import VetPatients from './pages/vet/Patients';
import VetDashboard from './pages/vet/Dashboard';
import VetSchedule from './pages/vet/Schedule';
import VetVisits from './pages/vet/Visits';
import VetVaccinations from './pages/vet/Vaccinations';

import ClientVisits from './pages/client/Visits';
import ClientVaccinations from './pages/client/Vaccinations';

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

          {/* Admin */}
          <Route path="/admin" element={
            <PrivateRoute roles={['admin']}>
              <AppLayout role="admin" />
            </PrivateRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="animals" element={<AdminAnimals />} />
            <Route path="animals/:id" element={<ClientMedCard />} />
            <Route path="appointments" element={<AdminAppointments />} />
          </Route>

          {/* Client */}
          <Route path="/client" element={
            <PrivateRoute roles={['client']}>
              <AppLayout role="client" />
            </PrivateRoute>
          }>
            <Route index element={<ClientDashboard />} />
            <Route path="pets" element={<ClientPets />} />
            <Route path="pets/:id" element={<ClientMedCard />} />
            <Route path="appointments" element={<ClientAppointments />} />
            <Route path="visits" element={<ClientVisits />} />
            <Route path="vaccinations" element={<ClientVaccinations />} />
          </Route>

          {/* Vet */}
          <Route path="/vet" element={
            <PrivateRoute roles={['doctor']}>
              <AppLayout role="doctor" />
            </PrivateRoute>
          }>
            <Route index element={<VetDashboard />} />
            <Route path="schedule" element={<VetSchedule />} />
            <Route path="patients" element={<VetPatients />} />
            <Route path="patients/:id" element={<ClientMedCard />} />
            <Route path="appointments" element={<ClientAppointments />} />
            <Route path="visits" element={<VetVisits />} />
            <Route path="vaccinations" element={<VetVaccinations />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
