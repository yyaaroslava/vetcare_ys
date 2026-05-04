import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ToastProvider } from '../ui';

export default function AppLayout({ role }) {
  return (
    <ToastProvider>
      <div className="app-layout">
        <Sidebar role={role} />
        <main className="main-content">
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
