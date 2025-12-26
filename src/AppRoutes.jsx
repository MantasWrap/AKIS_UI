import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DevDashboardLayout } from './features/layout/DevDashboardLayout.jsx';
import { LiveModePage } from './features/live/LiveModePage.jsx';
import { OperatorLineControlView } from './features/runtime/components/OperatorLineControlView.jsx';
import { StatusPage } from './features/status/StatusPage.jsx';

/**
 * AppRoutes
 *
 * Dev dashboard + Operator view.
 *
 * Routes:
 *   - /               -> dev status/dashboard
 *   - /live           -> Live mode (dev)
 *   - /operator/line  -> Operator line control view (tenant mode v0)
 */
export function AppRoutes() {
  return (
    <BrowserRouter>
      <DevDashboardLayout>
        <Routes>
          <Route path="/" element={<StatusPage />} />
          <Route path="/live" element={<LiveModePage />} />
          <Route path="/operator/line" element={<OperatorLineControlView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DevDashboardLayout>
    </BrowserRouter>
  );
}
