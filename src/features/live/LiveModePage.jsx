import React from 'react';
import { PlcDeviceListPanel } from './PlcDeviceListPanel.jsx';
import { RuntimeAlertsCard } from '../runtime/components/RuntimeAlertsCard.jsx';
import { useCurrentSiteLine } from '../runtime/hooks/useCurrentSiteLine.js';
import { SiteLineSelectorDebug } from '../runtime/components/SiteLineSelectorDebug.jsx';
import { LinePermissionsDebugBanner } from '../runtime/components/LinePermissionsDebugBanner.jsx';
import { PlcSiemensDebugPanel } from '../runtime/components/PlcSiemensDebugPanel.jsx';
import { PlcSiemensTagProbePanel } from '../runtime/components/PlcSiemensTagProbePanel.jsx';
import { RuntimeLineSummaryPanel } from '../runtime/components/RuntimeLineSummaryPanel.jsx';

export function LiveModePage() {
  const { siteId, lineId } = useCurrentSiteLine();

  return (
    <div className="live-mode-page">
      <div className="live-mode-header">
        <div>
          <p className="dev-card-eyebrow">Live runtime</p>
          <h1>Conveyor line – Live mode</h1>
        </div>
      </div>

      <SiteLineSelectorDebug />
      <LinePermissionsDebugBanner />

      <div className="live-mode-layout">
        <div className="live-mode-left">
          <RuntimeAlertsCard siteId={siteId} lineId={lineId} />
          <PlcSiemensDebugPanel siteId={siteId} lineId={lineId} />
          <PlcSiemensTagProbePanel />
          <RuntimeLineSummaryPanel />
        </div>
        <div className="live-mode-right">
          <PlcDeviceListPanel siteId={siteId} lineId={lineId} />
        </div>
      </div>
    </div>
  );
}
