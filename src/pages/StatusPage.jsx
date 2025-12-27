import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/devDashboard.css';
import { getRuntimeLinkMetrics, getRuntimeStatus } from '../api/client';
import { emitNavigation } from '../modules/navigationBus.js';
import { RUNTIME_POLL_INTERVAL_MS } from '../features/runtime/hooks/useRuntimePollingConfig.js';
import { PlcDeviceListReadOnlyPanel } from '../features/live/components/PlcDeviceListPanel.jsx';
import { RuntimeAlertsCard } from '../features/live/components/RuntimeAlertsCard.jsx';
import { useRuntimeAlerts } from '../features/runtime/hooks/useRuntimeAlerts.js';
import { usePlcDevices } from '../features/runtime/hooks/usePlcDevices.js';
import { PlcSiemensDebugPanel } from '../features/runtime/components/PlcSiemensDebugPanel.jsx';
import { PlcSiemensTagProbePanel } from '../features/runtime/components/PlcSiemensTagProbePanel.jsx';
import { SiteLineSelectorDebug } from '../features/runtime/components/SiteLineSelectorDebug.jsx';
import { LinePermissionsDebugBanner } from '../features/runtime/components/LinePermissionsDebugBanner.jsx';

const DEFAULT_PHASE_LABEL = 'Phase 0 · Training mode · Fake hardware';

function getMetricValue(...values) {
  return values.find((value) => typeof value === 'number' && Number.isFinite(value));
}

function getPickCount(counters) {
  if (!counters || typeof counters !== 'object') return null;
  const picksOk = getMetricValue(counters.picks_success, counters.picks_ok);
  const picksMissed = getMetricValue(counters.picks_missed, counters.picks_reject);
  const picksTimeout = getMetricValue(counters.picks_timeout);
  const picksErrors = [counters.picks_error, counters.picks_cancelled].reduce(
    (sum, value) =>
      typeof value === 'number' && Number.isFinite(value) ? sum + value : sum,
    0,
  );

  const hasAny =
    typeof picksOk === 'number' ||
    typeof picksMissed === 'number' ||
    typeof picksTimeout === 'number' ||
    picksErrors > 0;

  if (!hasAny) return null;
  return (picksOk || 0) + (picksMissed || 0) + (picksTimeout || 0) + picksErrors;
}

export default function StatusPage() {
  const [runtimeStatus, setRuntimeStatus] = useState(null);
  const [runtimeStatusLoading, setRuntimeStatusLoading] = useState(true);
  const [runtimeStatusError, setRuntimeStatusError] = useState('');

  const [runtimeCounters, setRuntimeCounters] = useState(null);
  const [runtimeMetricsLoading, setRuntimeMetricsLoading] = useState(true);
  const [runtimeMetricsError, setRuntimeMetricsError] = useState('');

  const mountedRef = useRef(true);

  const { alerts } = useRuntimeAlerts();
  const { devices } = usePlcDevices();

  const siteId = useMemo(() => runtimeStatus?.site_id || 'SITE_LT_01', [runtimeStatus]);
  const lineId = useMemo(() => runtimeStatus?.line_id || 'LINE_01', [runtimeStatus]);

  const pickCount = useMemo(() => getPickCount(runtimeCounters), [runtimeCounters]);
  const itemsIngested = useMemo(
    () =>
      getMetricValue(runtimeCounters?.items_seen, runtimeCounters?.items_ingested),
    [runtimeCounters],
  );
  const itemsHandled = useMemo(
    () =>
      getMetricValue(runtimeCounters?.items_routed, runtimeCounters?.items_decided),
    [runtimeCounters],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let pollTimer = null;

    async function pollRuntimeStatus() {
      try {
        setRuntimeStatusLoading(true);
        setRuntimeStatusError('');
        const body = await getRuntimeStatus();
        if (!mountedRef.current) return;
        setRuntimeStatus(body);
      } catch (e) {
        if (!mountedRef.current) return;
        setRuntimeStatusError(e.message || 'Failed to load runtime status');
      } finally {
        if (!mountedRef.current) return;
        setRuntimeStatusLoading(false);
        pollTimer = setTimeout(pollRuntimeStatus, RUNTIME_POLL_INTERVAL_MS);
      }
    }

    pollRuntimeStatus();
    return () => {
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, []);

  useEffect(() => {
    let pollTimer = null;

    async function pollMetrics() {
      try {
        setRuntimeMetricsLoading(true);
        setRuntimeMetricsError('');
        const body = await getRuntimeLinkMetrics();
        if (!mountedRef.current) return;
        setRuntimeCounters(body?.counters || null);
      } catch (e) {
        if (!mountedRef.current) return;
        setRuntimeMetricsError(e.message || 'Failed to load runtime metrics');
      } finally {
        if (!mountedRef.current) return;
        setRuntimeMetricsLoading(false);
        pollTimer = setTimeout(pollMetrics, RUNTIME_POLL_INTERVAL_MS);
      }
    }

    pollMetrics();
    return () => {
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, []);

  const runtimeStatusText = useMemo(() => {
    if (runtimeStatusLoading) return 'Loading…';
    if (runtimeStatusError) return 'Error';
    if (!runtimeStatus) return 'Unknown';
    return runtimeStatus.phase_label || DEFAULT_PHASE_LABEL;
  }, [runtimeStatus, runtimeStatusLoading, runtimeStatusError]);

  const alertCount = Array.isArray(alerts) ? alerts.length : 0;
  const deviceCount = Array.isArray(devices) ? devices.length : 0;

  return (
    <div className="dev-page">
      <section className="dev-hero">
        <div className="dev-hero-copy">
          <h1>AKIS Dev Console</h1>
          <p className="dev-hero-subtitle">{runtimeStatusText}</p>
          <div className="dev-hero-stats">
            <span className="dev-hero-pill">Site: {siteId}</span>
            <span className="dev-hero-pill">Line: {lineId}</span>
            <span className="dev-hero-pill">Alerts: {alertCount}</span>
            <span className="dev-hero-pill">Devices: {deviceCount}</span>
            <span className="dev-hero-pill">
              Ingested: {itemsIngested ?? '—'}
            </span>
            <span className="dev-hero-pill">
              Handled: {itemsHandled ?? '—'}
            </span>
            {pickCount !== null && (
              <span className="dev-hero-pill">Picks total: {pickCount}</span>
            )}
          </div>
        </div>

        <div className="dev-hero-actions">
          <button
            className="dev-btn"
            type="button"
            onClick={() => emitNavigation({ moduleKey: 'runtime' })}
          >
            Open Runtime
          </button>
        </div>
      </section>

      {/* 🔽 NEW: Site & line selection visible on the main page */}
      <section className="dev-dashboard-grid">
        <section className="dev-card">
          <header className="dev-card-header">
            <div>
              <p className="dev-card-eyebrow">Debug</p>
              <h3>Site &amp; line selection</h3>
            </div>
          </header>
          <div className="dev-card-body">
            <SiteLineSelectorDebug />
            <LinePermissionsDebugBanner />
          </div>
        </section>

        <RuntimeAlertsCard siteId={siteId} lineId={lineId} />

        {/* PLC / Siemens panels */}
        <PlcSiemensDebugPanel siteId={siteId} lineId={lineId} />
        <PlcSiemensTagProbePanel />

        <PlcDeviceListReadOnlyPanel siteId={siteId} lineId={lineId} />

        <section className="dev-card">
          <header className="dev-card-header">
            <div>
              <p className="dev-card-eyebrow">Runtime</p>
              <h3>Link metrics</h3>
            </div>
          </header>

          <div className="dev-card-body">
            {runtimeMetricsLoading && (
              <p className="dev-runtime-link-helper">Loading metrics…</p>
            )}
            {runtimeMetricsError && (
              <p className="runtime-alerts-error">{runtimeMetricsError}</p>
            )}
            {!runtimeMetricsError && !runtimeMetricsLoading && runtimeCounters && (
              <dl className="dev-runtime-link-grid">
                <div className="dev-runtime-link-group">
                  <dt>Items seen</dt>
                  <dd>{runtimeCounters.items_seen ?? '—'}</dd>
                </div>
                <div className="dev-runtime-link-group">
                  <dt>Items decided</dt>
                  <dd>{runtimeCounters.items_decided ?? '—'}</dd>
                </div>
                <div className="dev-runtime-link-group">
                  <dt>Items routed</dt>
                  <dd>{runtimeCounters.items_routed ?? '—'}</dd>
                </div>
                <div className="dev-runtime-link-group">
                  <dt>Picks OK</dt>
                  <dd>{runtimeCounters.picks_success ?? runtimeCounters.picks_ok ?? '—'}</dd>
                </div>
                <div className="dev-runtime-link-group">
                  <dt>Picks missed</dt>
                  <dd>{runtimeCounters.picks_missed ?? runtimeCounters.picks_reject ?? '—'}</dd>
                </div>
                <div className="dev-runtime-link-group">
                  <dt>Picks timeout</dt>
                  <dd>{runtimeCounters.picks_timeout ?? '—'}</dd>
                </div>
                <div className="dev-runtime-link-group">
                  <dt>Picks errors</dt>
                  <dd>
                    {runtimeCounters.picks_error != null ||
                    runtimeCounters.picks_cancelled != null
                      ? (runtimeCounters.picks_error || 0) +
                        (runtimeCounters.picks_cancelled || 0)
                      : '—'}
                  </dd>
                </div>
              </dl>
            )}
            {!runtimeMetricsError && !runtimeMetricsLoading && !runtimeCounters && (
              <p className="dev-runtime-link-helper">
                Could not load metrics right now.
              </p>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
