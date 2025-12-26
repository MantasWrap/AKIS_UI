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

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...getDebugHeaders(),
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status}`);
  }
  return res.json();
}

async function fetchLineState(siteId, lineId) {
  const params = new URLSearchParams();
  if (siteId) params.set('site_id', siteId);
  if (lineId) params.set('line_id', lineId);
  const url = `${API_BASE}/api/runtime/line/state?${params.toString()}`;
  const body = await fetchJson(url);
  return body || null;
}

async function fetchRuntimeEvents(siteId, lineId) {
  const params = new URLSearchParams();
  if (siteId) params.set('site_id', siteId);
  if (lineId) params.set('line_id', lineId);
  // Last 5 minutes by default.
  params.set('since_ms_ago', '300000');
  const url = `${API_BASE}/api/runtime/events?${params.toString()}`;
  const body = await fetchJson(url);
  return body || null;
}

async function fetchPlcHealth(siteId, lineId) {
  const params = new URLSearchParams();
  if (siteId) params.set('site_id', siteId);
  if (lineId) params.set('line_id', lineId);
  const url = `${API_BASE}/api/runtime/plc/health?${params.toString()}`;
  const body = await fetchJson(url);
  return body || null;
}

function computeOverallHealth({ lineState, plcHealth, recentEvents }) {
  const alerts = [];

  const state = lineState?.line_state || lineState?.state || null;
  const eStopActive = !!(lineState && lineState.e_stop_active);
  const faultActive = !!(lineState && lineState.fault_active);

  // PLC health
  const plcStatus = plcHealth?.health?.status || null;

  if (plcStatus === 'MISCONFIGURED') {
    alerts.push('PLC misconfigured');
  }
  if (plcStatus === 'OFFLINE') {
    alerts.push('PLC connection offline');
  }
  if (plcStatus === 'ERROR') {
    alerts.push('PLC driver error');
  }

  // E-stop / fault always win.
  if (eStopActive) {
    alerts.push('E-stop active');
  }
  if (faultActive) {
    alerts.push('PLC fault active');
  }

  // Recent SAFETY/FAULT/PLC_DEVICE events.
  const events = Array.isArray(recentEvents?.events)
    ? recentEvents.events
    : [];
  const safetyEvents = events.filter((e) => e.kind === 'SAFETY');
  const faultEvents = events.filter((e) => e.kind === 'FAULT');
  const plcDeviceEvents = events.filter((e) => e.kind === 'PLC_DEVICE');

  const hasSeriousEvents =
    safetyEvents.length > 0 || faultEvents.length > 0 || plcDeviceEvents.length > 0;

  // Decide health level.
  let level = 'OK';

  if (
    eStopActive ||
    faultActive ||
    plcStatus === 'MISCONFIGURED' ||
    plcStatus === 'OFFLINE' ||
    plcStatus === 'ERROR'
  ) {
    level = 'ALERT';
  } else if (state === 'PAUSED' || hasSeriousEvents) {
    level = 'WARN';
  } else {
    level = 'OK';
  }

  return {
    level,
    alerts,
    safetyEvents,
    faultEvents,
    plcDeviceEvents,
  };
}

function healthBanner(level, plcHealth) {
  const plcStatus = plcHealth?.health?.status || null;

  if (level === 'ALERT') {
    if (plcStatus === 'MISCONFIGURED') {
      return {
        title: 'System in fault – PLC config needs attention',
        subtitle:
          'PLC is configured for real mode but the Siemens driver is disabled or misconfigured.',
        className: 'runtime-alerts-banner is-alert',
      };
    }
    if (plcStatus === 'OFFLINE') {
      return {
        title: 'System in fault – PLC connection offline',
        subtitle:
          'AKIS cannot reach the PLC in real mode. Check network, PLC power and IP address.',
        className: 'runtime-alerts-banner is-alert',
      };
    }
    if (plcStatus === 'ERROR') {
      return {
        title: 'System in fault – PLC driver error',
        subtitle:
          'The PLC driver reported an internal error. Check logs, restart runtime and verify Siemens config.',
        className: 'runtime-alerts-banner is-alert',
      };
    }
    return {
      title: 'System in fault / E-stop',
      subtitle:
        'Emergency stop or PLC fault is active. Resolve physical safety and PLC issues before restarting.',
      className: 'runtime-alerts-banner is-alert',
    };
  }

  if (level === 'WARN') {
    return {
      title: 'System needs attention',
      subtitle:
        'Line is paused or recent safety/fault events were recorded. Check alerts and clear issues.',
      className: 'runtime-alerts-banner is-warn',
    };
  }

  // Level OK
  if (plcStatus === 'SIMULATION') {
    return {
      title: 'System OK (simulation mode)',
      subtitle:
        'Runtime is connected in simulation mode. No real PLC IO writes will be sent.',
      className: 'runtime-alerts-banner is-ok',
    };
  }

  return {
    title: 'System OK',
    subtitle: 'No active safety or PLC faults detected.',
    className: 'runtime-alerts-banner is-ok',
  };
}

function renderPlcStatusRow(plcHealth) {
  if (!plcHealth || !plcHealth.health) {
    return (
      <div className="runtime-alerts-plc-row">
        <span className="runtime-alerts-label">PLC connection</span>
        <span className="runtime-alerts-pill is-unknown">Unknown</span>
      </div>
    );
  }

  const health = plcHealth.health;
  const driver = plcHealth.driver_health || null;

  const status = health.status || 'UNKNOWN';
  const connector = health.connector || 'FAKE';
  const hw = health.hardware_mode || 'FAKE';
  const realIoMode = health.real_io_mode || 'DISABLED';

  if (status === 'MISCONFIGURED') {
    const reasons =
      driver && Array.isArray(driver.reasons) && driver.reasons.length > 0
        ? driver.reasons.join(', ')
        : 'See PLC config / environment';
    return (
      <div className="runtime-alerts-plc-row">
        <span className="runtime-alerts-label">PLC connection</span>
        <div className="runtime-alerts-plc-detail">
          <span className="runtime-alerts-pill is-alert">PLC MISCONFIGURED</span>
          <span className="runtime-alerts-plc-note">
            Connector: {connector}, HW mode: {hw}, IO mode: {realIoMode}. Reason: {reasons}
          </span>
        </div>
      </div>
    );
  }

  if (status === 'OFFLINE') {
    return (
      <div className="runtime-alerts-plc-row">
        <span className="runtime-alerts-label">PLC connection</span>
        <div className="runtime-alerts-plc-detail">
          <span className="runtime-alerts-pill is-alert">PLC OFFLINE</span>
          <span className="runtime-alerts-plc-note">
            AKIS cannot reach the PLC in real mode. Check network, IP and PLC power.
          </span>
        </div>
      </div>
    );
  }

  if (status === 'ERROR') {
    const lastError = driver && driver.lastError ? String(driver.lastError) : 'Unknown error';
    return (
      <div className="runtime-alerts-plc-row">
        <span className="runtime-alerts-label">PLC connection</span>
        <div className="runtime-alerts-plc-detail">
          <span className="runtime-alerts-pill is-alert">PLC DRIVER ERROR</span>
          <span className="runtime-alerts-plc-note">
            An internal PLC driver error occurred. Last error: {lastError}
          </span>
        </div>
      </div>
    );
  }

  if (status === 'SIMULATION') {
    return (
      <div className="runtime-alerts-plc-row">
        <span className="runtime-alerts-label">PLC connection</span>
        <div className="runtime-alerts-plc-detail">
          <span className="runtime-alerts-pill is-simulation">Simulation mode</span>
          <span className="runtime-alerts-plc-note">
            Connector: {connector}, HW mode: {hw}, IO mode: {realIoMode}. Real IO is not used.
          </span>
        </div>
      </div>
    );
  }

  if (status === 'REAL') {
    const ready =
      driver && driver.readOnlyEnabled && driver.driverStatus === 'READY';
    return (
      <div className="runtime-alerts-plc-row">
        <span className="runtime-alerts-label">PLC connection</span>
        <div className="runtime-alerts-plc-detail">
          <span className="runtime-alerts-pill is-ok">
            {ready ? 'Real PLC (read-only ready)' : 'Real PLC (driver disabled)'}
          </span>
          <span className="runtime-alerts-plc-note">
            Connector: {connector}, HW mode: {hw}, IO mode: {realIoMode}.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="runtime-alerts-plc-row">
      <span className="runtime-alerts-label">PLC connection</span>
      <div className="runtime-alerts-plc-detail">
        <span className="runtime-alerts-pill is-unknown">Unknown</span>
        <span className="runtime-alerts-plc-note">
          Connector: {connector}, HW mode: {hw}, IO mode: {realIoMode}.
        </span>
      </div>
    </div>
  );
}

export function RuntimeAlertsCard({ siteId, lineId }) {
  const [lineState, setLineState] = useState(null);
  const [plcHealth, setPlcHealth] = useState(null);
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let timerId = null;

    const load = async () => {
      if (cancelled) return;
      try {
        setLoading(true);
        setError(null);

        const [statePayload, healthPayload, eventsPayload] = await Promise.all([
          fetchLineState(siteId, lineId).catch((err) => {
            console.error(err);
            return null;
          }),
          fetchPlcHealth(siteId, lineId).catch((err) => {
            console.error(err);
            return null;
          }),
          fetchRuntimeEvents(siteId, lineId).catch((err) => {
            console.error(err);
            return null;
          }),
        ]);

        if (cancelled) return;

        setLineState(statePayload);
        setPlcHealth(healthPayload);
        setEvents(eventsPayload);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError(err.message || 'Failed to load runtime alerts');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    timerId = setInterval(load, RUNTIME_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
    };
  }, [siteId, lineId]);

  const { level, alerts, safetyEvents, faultEvents, plcDeviceEvents } =
    computeOverallHealth({
      lineState,
      plcHealth,
      recentEvents: events,
    });

  const banner = healthBanner(level, plcHealth);

  const allEvents = [
    ...safetyEvents.map((e) => ({ ...e, group: 'SAFETY' })),
    ...faultEvents.map((e) => ({ ...e, group: 'FAULT' })),
    ...plcDeviceEvents.map((e) => ({ ...e, group: 'PLC_DEVICE' })),
  ].slice(0, 5);

  return (
    <section className="dev-card runtime-alerts-card">
      <header className={banner.className}>
        <div>
          <p className="dev-card-eyebrow">Runtime health</p>
          <h2>{banner.title}</h2>
          <p className="runtime-alerts-subtitle">{banner.subtitle}</p>
        </div>
        <div className="runtime-alerts-badge-group">
          <span
            className={[
              'runtime-alerts-health-pill',
              level === 'ALERT'
                ? 'is-alert'
                : level === 'WARN'
                ? 'is-warn'
                : 'is-ok',
            ].join(' ')}
          >
            {level}
          </span>
        </div>
      </header>

      <div className="runtime-alerts-body">
        {error && (
          <p className="runtime-alerts-error">
            {error}
          </p>
        )}

        {renderPlcStatusRow(plcHealth)}

        <div className="runtime-alerts-events">
          <div className="runtime-alerts-events-header">
            <span className="runtime-alerts-label">Recent alerts</span>
            <span className="runtime-alerts-events-count">
              {loading ? 'Loading…' : `${allEvents.length} in last 5 min`}
            </span>
          </div>

          {allEvents.length === 0 && !loading && (
            <p className="runtime-alerts-events-empty">
              No recent safety or PLC events.
            </p>
          )}

          <ul className="runtime-alerts-events-list">
            {allEvents.map((evt) => (
              <li key={evt.id || `${evt.group}-${evt.created_at || Math.random()}`}>
                <span className={`runtime-alerts-tag runtime-alerts-tag-${evt.group}`}>
                  {evt.group}
                </span>
                <span className="runtime-alerts-event-message">
                  {evt.message || evt.summary || 'Event'}
                </span>
              </li>
            ))}
          </ul>

          {alerts.length > 0 && (
            <div className="runtime-alerts-extra">
              <span className="runtime-alerts-label">Summary</span>
              <ul className="runtime-alerts-summary-list">
                {alerts.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
