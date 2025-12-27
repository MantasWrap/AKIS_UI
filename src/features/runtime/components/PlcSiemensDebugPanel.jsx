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

async function fetchSiemensHealth({ siteId, lineId }) {
  const params = new URLSearchParams();
  if (siteId) params.set('site_id', siteId);
  if (lineId) params.set('line_id', lineId);

  const url = `${API_BASE}/api/debug/plc/siemens/health?${params.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json', ...getDebugHeaders() },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || body.error || `Health failed (${res.status})`);
    err.code = body.error;
    throw err;
  }
  return body;
}

async function fetchSiemensMetrics({ siteId, lineId }) {
  const params = new URLSearchParams();
  if (siteId) params.set('site_id', siteId);
  if (lineId) params.set('line_id', lineId);

  const url = `${API_BASE}/api/debug/plc/siemens/metrics?${params.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json', ...getDebugHeaders() },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || body.error || `Metrics failed (${res.status})`);
    err.code = body.error;
    throw err;
  }
  return body;
}

function getStatusPillClass(level) {
  switch (level) {
    case 'GREEN':
      return 'runtime-alerts-pill is-ok';
    case 'AMBER':
      return 'runtime-alerts-pill is-warn';
    case 'RED':
      return 'runtime-alerts-pill is-alert';
    default:
      return 'runtime-alerts-pill is-unknown';
  }
}

export function PlcSiemensDebugPanel({ siteId, lineId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [metricsSummary, setMetricsSummary] = useState(null);

  useEffect(() => {
    let mounted = true;
    let t = null;

    async function poll() {
      try {
        setLoading(true);
        setError('');
        const body = await fetchSiemensHealth({ siteId, lineId });
        if (!mounted) return;
        setData(body);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Failed to load Siemens health');
      } finally {
        if (!mounted) return;
        setLoading(false);
        t = setTimeout(poll, RUNTIME_POLL_INTERVAL_MS);
      }
    }

    poll();
    return () => {
      mounted = false;
      if (t) clearTimeout(t);
    };
  }, [siteId, lineId]);

  useEffect(() => {
    let mounted = true;
    let t = null;

    async function pollMetrics() {
      try {
        setMetricsLoading(true);
        setMetricsError('');
        const body = await fetchSiemensMetrics({ siteId, lineId });
        if (!mounted) return;
        setMetrics(body.metrics || null);
        setMetricsSummary(body.summary || null);
      } catch (e) {
        if (!mounted) return;
        setMetricsError(e.message || 'Failed to load Siemens metrics');
      } finally {
        if (!mounted) return;
        setMetricsLoading(false);
        t = setTimeout(pollMetrics, RUNTIME_POLL_INTERVAL_MS);
      }
    }

    pollMetrics();
    return () => {
      if (t) clearTimeout(t);
      mounted = false;
    };
  }, [siteId, lineId]);

  const connectorLabel = data?.connector || '—';
  const statusLevel = metricsSummary?.status_level || 'UNKNOWN';

  return (
    <section className="dev-card runtime-line-summary">
      <header className="dev-card-header">
        <div>
          <p className="dev-card-eyebrow">PLC / Siemens</p>
          <h3>Driver health &amp; metrics</h3>
        </div>
        <div className="runtime-line-summary-badges">
          <span className="runtime-alerts-pill is-unknown">
            {loading ? 'Loading…' : connectorLabel}
          </span>
          <span className={getStatusPillClass(statusLevel)}>{statusLevel}</span>
        </div>
      </header>

      {(error || metricsError) && (
        <p className="runtime-alerts-error">{error || metricsError}</p>
      )}

      {!error && !data && (
        <p className="runtime-line-summary-note">No driver health data yet.</p>
      )}

      <div className="runtime-line-summary-body">
        <div className="runtime-line-summary-section">
          <h4>Mode</h4>
          <ul className="runtime-line-summary-list">
            <li>
              <span className="runtime-alerts-label">Connector</span>
              <span className="runtime-alerts-pill is-unknown">
                {data?.connector || '—'}
              </span>
            </li>
            <li>
              <span className="runtime-alerts-label">Hardware</span>
              <span className="runtime-alerts-pill is-unknown">
                {data?.hardware_mode || '—'}
              </span>
            </li>
            <li>
              <span className="runtime-alerts-label">Real IO</span>
              <span className="runtime-alerts-pill is-unknown">
                {data?.real_io_mode || '—'}
              </span>
            </li>
            <li>
              <span className="runtime-alerts-label">Site/Line</span>
              <span className="runtime-alerts-pill is-unknown">
                {data?.site_id || '—'} / {data?.line_id || '—'}
              </span>
            </li>
          </ul>
        </div>

        <div className="runtime-line-summary-section">
          <h4>PLC metrics</h4>
          {metricsLoading && (
            <p className="runtime-line-summary-note">Loading metrics…</p>
          )}
          {!metricsLoading && !metrics && (
            <p className="runtime-line-summary-note">
              No metrics available yet (driver may not have read any tags).
            </p>
          )}

          {metricsSummary && (
            <ul className="runtime-line-summary-list">
              <li>
                <span className="runtime-alerts-label">Total reads</span>
                <span className="runtime-alerts-pill is-unknown">
                  {metricsSummary.total_reads ?? 0}
                </span>
              </li>
              <li>
                <span className="runtime-alerts-label">Read errors</span>
                <span className="runtime-alerts-pill is-unknown">
                  {metricsSummary.read_errors ?? 0}
                </span>
              </li>
              <li>
                <span className="runtime-alerts-label">Timeouts</span>
                <span className="runtime-alerts-pill is-unknown">
                  {metricsSummary.read_timeouts ?? 0}
                </span>
              </li>
              <li>
                <span className="runtime-alerts-label">Socket errors</span>
                <span className="runtime-alerts-pill is-unknown">
                  {metricsSummary.socket_errors ?? 0}
                </span>
              </li>
              <li>
                <span className="runtime-alerts-label">Error rate</span>
                <span className="runtime-alerts-pill is-unknown">
                  {metricsSummary.error_rate == null
                    ? '—'
                    : `${(metricsSummary.error_rate * 100).toFixed(1)} %`}
                </span>
              </li>
            </ul>
          )}
        </div>

        <div className="runtime-line-summary-section">
          <h4>Driver health (raw)</h4>
          {!data?.driver_health && (
            <p className="runtime-line-summary-note">
              Driver health not available (enable Siemens connector + debug token).
            </p>
          )}

          {data?.driver_health && (
            <pre className="dev-codeblock">
              {JSON.stringify(data.driver_health, null, 2)}
            </pre>
          )}
        </div>

        <div className="runtime-line-summary-section">
          <h4>Resolved tags (sample)</h4>
          {!data?.tags && (
            <p className="runtime-line-summary-note">No tags resolved.</p>
          )}
          {data?.tags && (
            <pre className="dev-codeblock">
              {JSON.stringify(data.tags, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </section>
  );
}
