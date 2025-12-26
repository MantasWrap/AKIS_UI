import React, { useEffect, useState } from 'react';
import { API_BASE } from '../../../api/client.js';
import { RUNTIME_POLL_INTERVAL_MS } from '../hooks/useRuntimePollingConfig.js';

function getDebugHeaders() {
  const token =
    import.meta.env.VITE_AKIS_DEBUG_TOKEN ||
    import.meta.env.VITE_DEBUG_TOKEN ||
    '';
  if (!token) return {};
  return { 'x-debug-token': token };
}

async function fetchSiemensDebug(siteId, lineId) {
  const params = new URLSearchParams();
  if (siteId) params.set('site_id', siteId);
  if (lineId) params.set('line_id', lineId);
  const url = `${API_BASE}/api/debug/plc/siemens/health?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...getDebugHeaders(),
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to load Siemens debug: ${res.status}`);
  }
  return res.json();
}

/**
 * PlcSiemensDebugPanel
 *
 * Dev-only helper showing:
 *  - Current PLC connector type, hardware mode and IO mode.
 *  - SiemensS7Driver health (driverStatus, readOnlyEnabled, nodes7Available,
 *    timeouts/failure thresholds, reasons, lastError).
 *  - Resolved tag addresses for main E-stop, PLC fault and a couple of conveyors.
 *
 * This is meant for commissioning / debugging with PLC Pro and is not
 * shown in production tenant UI.
 */
export function PlcSiemensDebugPanel({ siteId, lineId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const load = async () => {
      if (cancelled) return;
      try {
        setLoading(true);
        setError(null);
        const payload = await fetchSiemensDebug(siteId, lineId);
        if (cancelled) return;
        setData(payload);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError(err.message || 'Failed to load Siemens debug info');
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
  }, [siteId, lineId]);

  const connector = data?.connector || 'UNKNOWN';
  const hardwareMode = data?.hardware_mode || 'UNKNOWN';
  const realIoMode = data?.real_io_mode || 'UNKNOWN';
  const driver = data?.driver_health || null;
  const tags = data?.tags || null;

  const driverStatus = driver?.driverStatus || 'n/a';
  const readOnlyEnabled = !!driver?.readOnlyEnabled;
  const nodes7Available =
    typeof driver?.nodes7Available === 'boolean' ? driver.nodes7Available : null;
  const maxFailuresBeforeOffline =
    typeof driver?.maxFailuresBeforeOffline === 'number'
      ? driver.maxFailuresBeforeOffline
      : null;
  const readTimeoutMs =
    typeof driver?.readTimeoutMs === 'number' ? driver.readTimeoutMs : null;
  const lastError = driver?.lastError || null;

  const reasons =
    driver && Array.isArray(driver.reasons) && driver.reasons.length > 0
      ? driver.reasons
      : [];

  const isSiemens = connector === 'SIEMENS';

  const isDev =
    typeof process !== 'undefined' &&
    process.env &&
    process.env.NODE_ENV !== 'production';

  if (!isDev) {
    return null;
  }

  return (
    <section className="dev-card runtime-plc-siemens-debug">
      <header className="dev-card-header">
        <div>
          <p className="dev-card-eyebrow">PLC / Siemens debug</p>
          <h3>Siemens S7 connectivity</h3>
        </div>
        <div className="runtime-plc-siemens-debug-badges">
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

      <div className="runtime-plc-siemens-debug-body">
        <div className="runtime-plc-siemens-summary">
          <div className="runtime-plc-siemens-row">
            <span className="runtime-alerts-label">Connector</span>
            <span className="runtime-alerts-pill is-unknown">{connector}</span>
          </div>
          <div className="runtime-plc-siemens-row">
            <span className="runtime-alerts-label">Hardware mode</span>
            <span className="runtime-alerts-pill is-unknown">{hardwareMode}</span>
          </div>
          <div className="runtime-plc-siemens-row">
            <span className="runtime-alerts-label">Real IO mode</span>
            <span className="runtime-alerts-pill is-unknown">{realIoMode}</span>
          </div>
        </div>

        {isSiemens && (
          <>
            <div className="runtime-plc-siemens-driver">
              <div className="runtime-plc-siemens-row">
                <span className="runtime-alerts-label">Driver status</span>
                <span
                  className={[
                    'runtime-alerts-pill',
                    driverStatus === 'READY'
                      ? 'is-ok'
                      : driverStatus === 'OFFLINE' || driverStatus === 'ERROR'
                      ? 'is-alert'
                      : 'is-unknown',
                  ].join(' ')}
                >
                  {driverStatus}
                </span>
              </div>
              <div className="runtime-plc-siemens-row">
                <span className="runtime-alerts-label">Read-only enabled</span>
                <span className="runtime-alerts-pill is-unknown">
                  {readOnlyEnabled ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="runtime-plc-siemens-row">
                <span className="runtime-alerts-label">nodes7 module</span>
                <span className="runtime-alerts-pill is-unknown">
                  {nodes7Available === null
                    ? 'unknown'
                    : nodes7Available
                    ? 'AVAILABLE'
                    : 'MISSING'}
                </span>
              </div>
              <div className="runtime-plc-siemens-row">
                <span className="runtime-alerts-label">Read timeout (ms)</span>
                <span className="runtime-alerts-pill is-unknown">
                  {readTimeoutMs != null ? readTimeoutMs : 'default'}
                </span>
              </div>
              <div className="runtime-plc-siemens-row">
                <span className="runtime-alerts-label">
                  Max failures before OFFLINE
                </span>
                <span className="runtime-alerts-pill is-unknown">
                  {maxFailuresBeforeOffline != null
                    ? maxFailuresBeforeOffline
                    : 'default'}
                </span>
              </div>
              {lastError && (
                <div className="runtime-plc-siemens-row">
                  <span className="runtime-alerts-label">Last error</span>
                  <span className="runtime-plc-siemens-last-error">
                    {String(lastError)}
                  </span>
                </div>
              )}
              {reasons.length > 0 && (
                <div className="runtime-plc-siemens-row">
                  <span className="runtime-alerts-label">Reasons</span>
                  <ul className="runtime-plc-siemens-reasons">
                    {reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {tags && (
          <div className="runtime-plc-siemens-tags">
            <div className="runtime-plc-siemens-row">
              <span className="runtime-alerts-label">Key tags</span>
            </div>
            <div className="runtime-plc-siemens-tags-table-wrapper">
              <table className="runtime-plc-siemens-tags-table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Logical</th>
                    <th>PLC address</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(tags).map(([key, value]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{value.logical}</td>
                      <td>{value.address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !error && !isSiemens && (
          <p className="runtime-plc-siemens-note">
            Siemens debug is only relevant when AKIS_PLC_CONNECTOR=SIEMENS.
          </p>
        )}
      </div>
    </section>
  );
}
