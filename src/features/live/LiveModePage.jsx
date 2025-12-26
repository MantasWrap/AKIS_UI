import React from 'react';
import { PlcDeviceListPanel } from './PlcDeviceListPanel.jsx';
import { RuntimeAlertsCard } from '../runtime/components/RuntimeAlertsCard.jsx';
import { useCurrentSiteLine } from '../runtime/hooks/useCurrentSiteLine.js';
import { SiteLineSelectorDebug } from '../runtime/components/SiteLineSelectorDebug.jsx';
import { LinePermissionsDebugBanner } from '../runtime/components/LinePermissionsDebugBanner.jsx';

/**
 * LiveModePage
 *
 * Phase-0/1 live runtime view. Now wired to:
 *   - useCurrentSiteLine() for site/line selection.
 *   - SiteLineSelectorDebug to show (and later choose) current line.
 *   - LinePermissionsDebugBanner to show the current role + allowed actions.
 */
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
        </div>
        <div className="live-mode-right">
          <PlcDeviceListPanel siteId={siteId} lineId={lineId} />
        </div>
      </div>
    </div>
  );
}
