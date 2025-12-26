import React, { useEffect, useState } from 'react';
import { API_BASE } from '../../../api/client.js';
import { useCurrentSiteLine } from '../hooks/useCurrentSiteLine.js';
import { RUNTIME_POLL_INTERVAL_MS } from '../hooks/useRuntimePollingConfig.js';

function getDebugHeaders() {
  const token =
    import.meta.env.VITE_AKIS_DEBUG_TOKEN ||
    import.meta.env.VITE_DEBUG_TOKEN ||
    '';
  if (!token) return {};
  return { 'x-debug-token': token };
}

async function fetchLineSummary(siteId, lineId) {
  const params = new URLSearchParams();
  if (siteId) params.set('site_id', siteId);
  if (lineId) params.set('line_id', lineId);
  const url = `${API_BASE}/api/runtime/line/summary?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...getDebugHeaders(),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `Failed to load line summary: ${res.status}`);
    err.code = body.error;
    throw err;
  }
  return body.summary || null;
}

export function RuntimeLineSummaryPanel() {
  const { siteId, lineId } = useCurrentSiteLine();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isDev =
    typeof process !== 'undefined' &&
    process.env &&
    process.env.NODE_ENV !== 'production';

  useEffect(() => {
    if (!isDev) return undefined;

    let cancelled = false;
    let timer = null;

    const load = async () => {
      if (cancelled) return;
      try {
        setLoading(true);
        setError('');
        const data = await fetchLineSummary(siteId, lineId);
        if (cancelled) return;
        setSummary(data);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError(err.message || 'Failed to load line summary');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    timer = setInterval(load, RUNTIME_POLL_INTERVAL_MS * 2);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [siteId, lineId, isDev]);

  if (!isDev) {
    return null;
  }

  const lineState = summary?.line_state || null;
  const plcHealth = summary?.plc_health || null;
  const alerts = summary?.alerts || null;
  const incidents = alerts?.incidents || null;

  const plcStatus = plcHealth?.status || plcHealth?.health?.status || 'UNKNOWN';

  return (
    <section className="dev-card runtime-line-summary">
      <header className="dev-card-header">
        <div>
          <p className="dev-card-eyebrow">Runtime snapshot</p>
          <h3>Line &amp; PLC summary</h3>
        </div>
        <div className="runtime-line-summary-badges">
          <span className="runtime-alerts-pill-small">
            {loading ? 'Loading…' : 'Refreshed'}
          </span>
        </div>
      </header>

      {error && (
        <p className="runtime-alerts-error">
          {error}
        </p>
      )}

      {!error && (
        <div className="runtime-line-summary-body">
          <div className="runtime-line-summary-section">
            <h4>Line state</h4>
            {lineState ? (
              <ul className="runtime-line-summary-list">
                <li>
                  <span className="runtime-alerts-label">State</span>
                  <span className="runtime-alerts-pill is-unknown">
                    {lineState.line_state || lineState.state || 'UNKNOWN'}
                  </span>
                </li>
                <li>
                  <span className="runtime-alerts-label">E-stop active</span>
                  <span className="runtime-alerts-pill is-unknown">
                    {lineState.e_stop_active ? 'YES' : 'NO'}
                  </span>
                </li>
                <li>
                  <span className="runtime-alerts-label">PLC fault active</span>
                  <span className="runtime-alerts-pill is-unknown">
                    {lineState.fault_active ? 'YES' : 'NO'}
                  </span>
                </li>
              </ul>
            ) : (
              <p className="runtime-line-summary-note">
                No line_state snapshot.
              </p>
            )}
          </div>

          <div className="runtime-line-summary-section">
            <h4>PLC health</h4>
            {plcHealth ? (
              <ul className="runtime-line-summary-list">
                <li>
                  <span className="runtime-alerts-label">Status</span>
                  <span
                    className={[
                      'runtime-alerts-pill',
                      plcStatus === 'REAL'
                        ? 'is-ok'
                        : plcStatus === 'SIMULATION'
                        ? 'is-unknown'
                        : plcStatus === 'OFFLINE' ||
                          plcStatus === 'MISCONFIGURED' ||
                          plcStatus === 'ERROR'
                        ? 'is-alert'
                        : 'is-unknown',
                    ].join(' ')}
                  >
                    {plcStatus}
                  </span>
                </li>
                <li>
                  <span className="runtime-alerts-label">Connector</span>
                  <span className="runtime-alerts-pill is-unknown">
                    {plcHealth.connector || 'UNKNOWN'}
                  </span>
                </li>
                <li>
                  <span className="runtime-alerts-label">HW mode</span>
                  <span className="runtime-alerts-pill is-unknown">
                    {plcHealth.hardware_mode || 'UNKNOWN'}
                  </span>
                </li>
                <li>
                  <span className="runtime-alerts-label">Real IO mode</span>
                  <span className="runtime-alerts-pill is-unknown">
                    {plcHealth.real_io_mode || 'UNKNOWN'}
                  </span>
                </li>
              </ul>
            ) : (
              <p className="runtime-line-summary-note">
                No PLC health info.
              </p>
            )}
          </div>

          <div className="runtime-line-summary-section">
            <h4>Alerts (last {Math.round((alerts?.window_ms || 0) / 60000) || 0} min)</h4>
            {alerts ? (
              <>
                <ul className="runtime-line-summary-list">
                  <li>
                    <span className="runtime-alerts-label">Safety events</span>
                    <span className="runtime-alerts-pill is-unknown">
                      {alerts.safety_events_count ?? 0}
                    </span>
                  </li>
                  <li>
                    <span className="runtime-alerts-label">Fault events</span>
                    <span className="runtime-alerts-pill is-unknown">
                      {alerts.fault_events_count ?? 0}
                    </span>
                  </li>
                  <li>
                    <span className="runtime-alerts-label">PLC device events</span>
                    <span className="runtime-alerts-pill is-unknown">
                      {alerts.plc_device_events_count ?? 0}
                    </span>
                  </li>
                  <li>
                    <span className="runtime-alerts-label">PLC_CONN events</span>
                    <span className="runtime-alerts-pill is-unknown">
                      {alerts.plc_conn_events_count ?? 0}
                    </span>
                  </li>
                </ul>
                {alerts.severity_counts && (
                  <div className="runtime-line-summary-subsection">
                    <p className="runtime-line-summary-subtitle">Severity counts</p>
                    <ul className="runtime-line-summary-list">
                      <li>
                        <span className="runtime-alerts-label">INFO</span>
                        <span className="runtime-alerts-pill is-unknown">
                          {alerts.severity_counts.INFO ?? 0}
                        </span>
                      </li>
                      <li>
                        <span className="runtime-alerts-label">WARN</span>
                        <span className="runtime-alerts-pill is-unknown">
                          {alerts.severity_counts.WARN ?? 0}
                        </span>
                      </li>
                      <li>
                        <span className="runtime-alerts-label">ALERT</span>
                        <span className="runtime-alerts-pill is-unknown">
                          {alerts.severity_counts.ALERT ?? 0}
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
                {alerts.last_plc_conn_event && (
                  <div className="runtime-line-summary-subsection">
                    <p className="runtime-line-summary-subtitle">Last PLC_CONN</p>
                    <p className="runtime-line-summary-note">
                      {alerts.last_plc_conn_event.created_at
                        ? new Date(
                            alerts.last_plc_conn_event.created_at,
                          ).toLocaleTimeString()
                        : 'time n/a'}
                      {' · '}
                      {alerts.last_plc_conn_event.prev_status || 'none'} ->{' '}
                      {alerts.last_plc_conn_event.status || 'UNKNOWN'} (
                      {alerts.last_plc_conn_event.severity || 'n/a'})
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="runtime-line-summary-note">
                No alerts summary.
              </p>
            )}
          </div>

          <div className="runtime-line-summary-section">
            <h4>Incident windows</h4>
            {incidents && incidents.windows && incidents.windows.length > 0 ? (
              <ul className="runtime-line-summary-incidents">
                {incidents.windows.map((w, idx) => (
                  <li key={`${w.start}-${w.end}-${idx}`}>
                    <span className="runtime-line-summary-incidents-main">
                      {w.max_severity} · {w.event_count} events
                    </span>
                    <span className="runtime-line-summary-incidents-time">
                      {w.start} -> {w.end}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="runtime-line-summary-note">
                No incident windows in this period.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
