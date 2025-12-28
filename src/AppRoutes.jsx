import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DevDashboardLayout } from './features/layout/DevDashboardLayout.jsx';
import { LiveModePage } from './features/live/LiveModePage.jsx';
import { OperatorLineControlView } from './features/runtime/components/OperatorLineControlView.jsx';
import StatusPage from './pages/StatusPage.jsx';
import { TrainingStudioLayout } from './features/trainingStudio/TrainingStudioLayout.jsx';
import { TrainingStudioHomePage } from './features/trainingStudio/TrainingStudioHomePage.jsx';
import { TrainingStudioDatasetsPage } from './features/trainingStudio/TrainingStudioDatasetsPage.jsx';
import TrainingStudioItemsPage from './features/trainingStudio/TrainingStudioItemsPage.jsx';
import { TrainingStudioModelsPage } from './features/trainingStudio/TrainingStudioModelsPage.jsx';
import { TrainingStudioLiveCameraPage } from './features/trainingStudio/TrainingStudioLiveCameraPage.jsx';

/**
 * AppRoutes
 *
 * Dev dashboard + Operator view.
 *
 * Routes:
 *   - /               -> dev status/dashboard
 *   - /live           -> Live mode (dev)
 *   - /operator/line  -> Operator line control view (tenant mode v0)
 *   - /training-studio -> Training Studio shell (Phase A)
 */
export function AppRoutes() {
  return (
    <BrowserRouter>
      <DevDashboardLayout>
        <Routes>
          <Route path="/" element={<StatusPage />} />
          <Route path="/live" element={<LiveModePage />} />
          <Route path="/operator/line" element={<OperatorLineControlView />} />
          <Route path="/training-studio" element={<TrainingStudioLayout />}>
            <Route index element={<TrainingStudioHomePage />} />
            <Route path="items" element={<TrainingStudioItemsPage />} />
            <Route path="datasets" element={<TrainingStudioDatasetsPage />} />
            <Route path="models" element={<TrainingStudioModelsPage />} />
            <Route path="live-camera" element={<TrainingStudioLiveCameraPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DevDashboardLayout>
    </BrowserRouter>
  );
}
