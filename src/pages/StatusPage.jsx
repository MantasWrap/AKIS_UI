import { useEffect, useState } from 'react';
import { API_BASE, getHealth, getHealthReady } from '../api/client';

const KEY_ENDPOINTS = [
  { label: 'Health (live)', path: '/api/health' },
  { label: 'Health (ready)', path: '/api/health/ready' },
  { label: 'Debug runtime', path: '/api/debug/runtime-status' },
];

export default function StatusPage() {
  const [healthLive, setHealthLive] = useState(null);
  const [healthReady, setHealthReady] = useState(null);
  const [liveError, setLiveError] = useState(null);
  const [readyError, setReadyError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadHealth() {
    setLoading(true);
    try {
      const [liveResult, readyResult] = await Promise.all([getHealth(), getHealthReady()]);

      if (liveResult && liveResult.ok === false) {
        setLiveError(humanizeNetworkError(liveResult.error));
        setHealthLive(null);
      } else {
        setHealthLive(liveResult);
        setLiveError(null);
      }

      if (readyResult?.data) {
        setHealthReady(readyResult.data);
      } else {
        setHealthReady(null);
      }
      setReadyError(readyResult?.error ? humanizeNetworkError(readyResult.error) : null);
    } catch (err) {
      setLiveError(humanizeNetworkError(err.message));
      setReadyError(humanizeNetworkError(err.message));
      setHealthLive(null);
      setHealthReady(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHealth();
  }, []);

  const overviewCards = buildSystemOverview(healthReady, readyError);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="dev-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="dev-card-title">System overview</h2>
            <p className="dev-card-subtitle">Controller, database, Jetson runtime, and MQTT bridge readiness</p>
          </div>
          <button className={`dev-pill-button ${loading ? '' : 'active'}`} onClick={loadHealth} disabled={loading}>
            {loading ? 'Checking…' : 'Refresh'}
          </button>
        </div>
        <div className="dev-grid" style={{ marginTop: '1rem' }}>
          {overviewCards.map((card) => (
            <OverviewCard key={card.key} {...card} />
          ))}
        </div>
        {readyError && !healthReady && (
          <div style={{ marginTop: '0.75rem', color: 'var(--dev-text-muted)' }}>{readyError}</div>
        )}
      </div>

      <div className="dev-grid">
        <div className="dev-card">
          <h2 className="dev-card-title">Controller & database</h2>
          <p className="dev-card-subtitle">Live data from /api/health</p>
          {liveError && <div style={{ color: 'var(--dev-error)' }}>{liveError}</div>}
          {!liveError && healthLive && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem' }}>
              <HealthStat label="Controller" value={healthLive.status || 'unknown'} badge />
              <HealthStat label="DB status" value={healthLive.db?.status || 'n/a'} error={healthLive.db?.error} />
              <HealthStat label="DB host" value={healthLive.env?.dbHost || 'n/a'} />
              <HealthStat label="DB name" value={healthLive.env?.dbName || 'n/a'} />
              <HealthStat label="Uptime" value={healthLive.uptime_s ? formatSeconds(healthLive.uptime_s) : 'n/a'} />
              <HealthStat label="requestId" value={healthLive.requestId || 'n/a'} muted />
            </div>
          )}
          {!liveError && !healthLive && !loading && <div>No data yet. Click “Refresh”.</div>}
        </div>

        <div className="dev-card">
          <h2 className="dev-card-title">Endpoints & tools</h2>
          <p className="dev-card-subtitle">Quick links for Phase 0 troubleshooting</p>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--dev-text-muted)', marginBottom: '0.35rem' }}>API Base</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace' }}>{API_BASE}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {KEY_ENDPOINTS.map((endpoint) => (
              <div
                key={endpoint.path}
                style={{
                  border: `1px solid var(--dev-border-subtle)`,
                  borderRadius: 'var(--dev-radius-sm)',
                  padding: '0.75rem',
                  background: 'var(--dev-bg-soft)',
                }}
              >
                <div style={{ fontWeight: 600 }}>{endpoint.label}</div>
                <a
                  href={`${API_BASE}${endpoint.path}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}
                >
                  {API_BASE}
                  {endpoint.path}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewCard({ title, state, message }) {
  const badgeClass = {
    ok: 'dev-badge dev-badge--ok',
    waiting: 'dev-badge dev-badge--muted',
    degraded: 'dev-badge dev-badge--warn',
    down: 'dev-badge dev-badge--error',
    unknown: 'dev-badge dev-badge--muted',
  }[state];

  return (
    <div className="dev-card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{title}</div>
        <div className={badgeClass}>{state.toUpperCase()}</div>
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--dev-text-muted)' }}>{message}</div>
    </div>
  );
}

function HealthStat({ label, value, error, badge, muted }) {
  return (
    <div>
      <div style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--dev-text-muted)', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 600, color: muted ? 'var(--dev-text-muted)' : 'var(--dev-text-primary)' }}>
        {badge ? <span className="dev-badge dev-badge--muted">{value}</span> : value}{' '}
        {error && (
          <span style={{ color: 'var(--dev-error)', fontSize: '0.85rem', fontWeight: 400 }}>
            – {error}
          </span>
        )}
      </div>
    </div>
  );
}

function buildSystemOverview(healthReady, errorMessage) {
  if (!healthReady) {
    return [
      {
        key: 'controller',
        title: 'Controller & DB',
        state: 'unknown',
        message: errorMessage || `Cannot reach controller at ${API_BASE}.`,
      },
      {
        key: 'jetson',
        title: 'Jetson runtime',
        state: 'unknown',
        message: errorMessage || 'Waiting for controller health data before checking Jetson runtime.',
      },
      {
        key: 'mqtt',
        title: 'MQTT bridge',
        state: 'unknown',
        message: errorMessage || 'Waiting for controller health data before checking MQTT bridge.',
      },
    ];
  }

  const controllerState = healthReady.db?.ok === false || healthReady.ok === false ? 'degraded' : 'ok';
  const controllerMessage =
    healthReady.db?.ok === false
      ? healthReady.db?.error || 'Database connection needs attention.'
      : 'Controller is healthy and connected to the database.';

  const jetsonMetrics = healthReady.jetson_metrics;
  let jetsonState = 'waiting';
  let jetsonMessage = 'Jetson runtime has not sent any metrics yet — start the dev runner.';
  if (jetsonMetrics?.has_data) {
    if (jetsonMetrics.healthy) {
      jetsonState = 'ok';
      jetsonMessage = `Heartbeat ${formatSecondsShort(jetsonMetrics.age_s)} ago.`;
    } else {
      jetsonState = 'degraded';
      jetsonMessage = `Last heartbeat ${formatSecondsShort(jetsonMetrics.age_s)} ago — Jetson runtime may have stopped.`;
    }
  }

  const bridgeStats = healthReady.bridge_stats;
  let bridgeState = 'waiting';
  let bridgeMessage = 'MQTT bridge has not reported any stats yet.';
  if (bridgeStats?.has_data) {
    if (bridgeStats.mqtt_connected && bridgeStats.healthy) {
      bridgeState = 'ok';
      bridgeMessage = `Connected to broker · age ${formatSecondsShort(bridgeStats.age_s)}.`;
    } else if (!bridgeStats.mqtt_connected) {
      bridgeState = 'degraded';
      bridgeMessage = 'Bridge running but not connected to Mosquitto.';
    } else {
      bridgeState = 'degraded';
      bridgeMessage = `Metrics stale (age ${formatSecondsShort(bridgeStats.age_s)}) — bridge or broker may be stopped.`;
    }
  }

  return [
    { key: 'controller', title: 'Controller & DB', state: controllerState, message: controllerMessage },
    { key: 'jetson', title: 'Jetson runtime', state: jetsonState, message: jetsonMessage },
    { key: 'mqtt', title: 'MQTT bridge', state: bridgeState, message: bridgeMessage },
  ];
}

function humanizeNetworkError(message) {
  if (!message) return 'Unknown error.';
  if (message.toLowerCase().includes('failed to fetch')) {
    return `Cannot reach controller at ${API_BASE}. Is npm run dev running?`;
  }
  return message;
}

function formatSeconds(seconds) {
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) {
    return `${hrs}h ${mins % 60}m`;
  }
  if (mins > 0) {
    return `${mins}m ${Math.floor(seconds % 60)}s`;
  }
  return `${Math.floor(seconds)}s`;
}

function formatSecondsShort(seconds) {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return 'n/a';
  if (seconds < 60) return `${Math.max(0, seconds.toFixed(0))}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h`;
}
