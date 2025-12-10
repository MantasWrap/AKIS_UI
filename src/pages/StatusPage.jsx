import { useEffect, useMemo, useState } from 'react';
import '../styles/devDashboard.css';
import { devDashboardMock } from '../mock/devConsoleMockData.js';
import { API_BASE, getHealth, getHealthReady } from '../api/client.js';

export default function StatusPage() {
  const { hero, systemOverview, controllerHealth, endpoints: mockEndpoints } = devDashboardMock;
  const [copiedId, setCopiedId] = useState(null);
  const [health, setHealth] = useState(null);
  const [healthReady, setHealthReady] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchHealth() {
      setLoading(true);
      try {
        const [healthRes, readyRes] = await Promise.all([getHealth(), getHealthReady()]);
        if (!isMounted) return;

        if (healthRes?.ok === false) {
          setHealth(null);
          setError((prev) => prev || healthRes.error || 'Health endpoint unavailable');
        } else if (healthRes) {
          setHealth(healthRes);
        }

        if (readyRes?.data) {
          setHealthReady(readyRes.data);
          if (readyRes.error) {
            setError((prev) => prev || readyRes.error);
          }
        } else if (readyRes?.error) {
          setHealthReady(null);
          setError((prev) => prev || readyRes.error);
        }
      } catch (err) {
        if (!isMounted) return;
        setError((prev) => prev || err.message || 'Failed to load health data');
      } finally {
        if (isMounted) {
          setLoading(false);
          setAttempted(true);
        }
      }
    }

    fetchHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasLiveData = Boolean((health && health.ok !== false) || healthReady);
  const showNoLiveHint = attempted && !loading && !hasLiveData;

  const systemOverviewTiles = useMemo(() => {
    return systemOverview.map((tile) => {
      if (tile.id === 'controller') {
        const status = deriveStatus({
          ok: health?.ok,
          hasData: Boolean(health),
          loading,
        });
        const uptimeMeta = formatDuration(health?.uptime_s);
        return {
          ...tile,
          status,
          statusLabel: STATUS_LABELS[status],
          description: health?.ok
            ? 'Controller heartbeat responding.'
            : tile.description,
          meta: health?.timestamp
            ? `Last ping ${formatTimestamp(health.timestamp)}`
            : uptimeMeta
              ? `Uptime ${uptimeMeta}`
              : tile.meta,
        };
      }

      if (tile.id === 'jetson') {
        const jetson = healthReady?.jetson_metrics;
        const status = deriveStatus({
          ok: jetson?.healthy,
          hasData: Boolean(jetson?.has_data),
          loading,
        });
        return {
          ...tile,
          status,
          statusLabel: STATUS_LABELS[status],
          description: jetson?.has_data
            ? jetson.healthy
              ? 'Jetson heartbeat healthy.'
              : 'Heartbeat stale – waiting on runner.'
            : tile.description,
          meta: jetson?.last_heartbeat_at
            ? `Last beat ${formatTimestamp(jetson.last_heartbeat_at)}`
            : tile.meta,
        };
      }

      if (tile.id === 'mqtt') {
        const bridge = healthReady?.bridge_stats;
        const status = deriveStatus({
          ok: bridge?.healthy,
          hasData: Boolean(bridge?.has_data || bridge?.mqtt_connected !== undefined),
          loading,
        });
        return {
          ...tile,
          status,
          statusLabel: STATUS_LABELS[status],
          description: bridge?.has_data
            ? bridge.healthy
              ? 'MQTT bridge connected.'
              : 'Bridge connected, waiting for events.'
            : tile.description,
          meta: bridge?.last_update_at
            ? `Updated ${formatTimestamp(bridge.last_update_at)}`
            : tile.meta,
        };
      }

      if (tile.id === 'db') {
        const db = healthReady?.db;
        const status = deriveDbStatus(db, loading);
        return {
          ...tile,
          status,
          statusLabel: STATUS_LABELS[status],
          description: db?.ok
            ? 'Database connection healthy.'
            : db?.error
              ? db.error
              : tile.description,
          meta: db?.ok
            ? 'Ready for live queries'
            : db?.error
              ? 'Using mock copy until configured'
              : tile.meta,
        };
      }

      return tile;
    });
  }, [systemOverview, health, healthReady, loading]);

  const controllerCard = useMemo(() => {
    const uptimeValue = formatDuration(healthReady?.uptime_s ?? health?.uptime_s);
    const versionValue = healthReady?.version || health?.version || null;

    const fields = [];
    controllerHealth.fields.forEach((field) => {
      if (field.id === 'uptime') {
        fields.push({
          ...field,
          placeholder: !uptimeValue,
          value: uptimeValue || field.value,
        });
        return;
      }
      fields.push(field);
      if (field.id === 'lastDeploy' && versionValue) {
        fields.push({
          id: 'controllerVersion',
          label: 'Controller version',
          value: versionValue,
        });
      }
    });

    return {
      summary: healthReady
        ? healthReady.ok
          ? 'Live controller + DB wiring responding.'
          : 'Ready check incomplete – falling back to mock copy.'
        : controllerHealth.summary,
      fields,
      emptyState: healthReady && healthReady.ok
        ? `Ready check request ${healthReady.requestId || 'n/a'}.`
        : healthReady && healthReady.db?.error
          ? `Ready endpoint returned: ${healthReady.db.error}`
          : controllerHealth.emptyState,
      status: healthReady
        ? healthReady.ok
          ? 'ok'
          : 'waiting'
        : 'waiting',
    };
  }, [controllerHealth, health, healthReady]);

  const endpointList = useMemo(() => ([
    {
      id: 'healthLive',
      label: 'Health (live)',
      path: '/api/health',
      description: 'Controller heartbeat + DB handshake.',
    },
    {
      id: 'healthReady',
      label: 'Health (ready)',
      path: '/api/health/ready',
      description: 'Jetson + MQTT readiness summary.',
    },
    {
      id: 'runtimeStatus',
      label: 'Debug runtime status',
      path: '/api/debug/runtime-status',
      description: 'Controller → Jetson pipeline snapshot.',
    },
    {
      id: 'items',
      label: 'Runtime items',
      path: '/api/items',
      description: 'Paged event log.',
    },
    {
      id: 'progressSummary',
      label: 'Progress summary',
      path: '/api/progress/summary',
      description: 'Phase tracker API already wired.',
    },
  ]), []);

  const endpoints = {
    apiBase: API_BASE,
    list: endpointList,
    docs: mockEndpoints.docs,
  };

  const handleCopy = async (value, id) => {
    if (!navigator?.clipboard || !value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch (error) {
      console.warn('Copy failed', error);
    }
  };

  return (
    <div className="dev-dashboard-page">
      <section className="dev-card dev-dashboard-card">
        <header className="dev-dashboard-card-header">
          <div>
            <p className="dev-card-eyebrow">{hero.eyebrow}</p>
            <h2 className="dev-card-title">System overview</h2>
            <p className="dev-card-subtitle">
              {hero.body}
              {showNoLiveHint && (
                <span> · No live data yet</span>
              )}
            </p>
            {error && (
              <p className="dev-card-subtitle" style={{ color: 'var(--dev-text-muted)', marginTop: '0.25rem' }}>
                {error}
              </p>
            )}
          </div>
          <span className={`dev-status-chip status-${hasLiveData ? 'ok' : (loading ? 'waiting' : 'mock')}`}>
            {hasLiveData ? 'Live data' : loading ? 'Checking' : 'Mock only'}
          </span>
        </header>
        <div className="dev-dashboard-pill-row">
          {systemOverviewTiles.map((tile) => (
            <article key={tile.id} className="dev-dashboard-pill">
              <div className="pill-top">
                <span className="pill-label">{tile.label}</span>
                <span className={`dev-status-chip status-${tile.status}`}>
                  {tile.statusLabel}
                </span>
              </div>
              <p className="pill-description">{tile.description}</p>
              <span className="pill-meta">{tile.meta}</span>
            </article>
          ))}
        </div>
      </section>

      <div className="dev-dashboard-grid">
        <section className="dev-card dev-controller-card">
          <header className="dev-dashboard-card-header">
            <div>
              <h3 className="dev-card-title">Controller & database</h3>
              <p className="dev-card-subtitle">Structured fields ready for live health data.</p>
            </div>
            <span className={`dev-status-chip status-${controllerCard.status}`}>
              {STATUS_LABELS[controllerCard.status] || 'Awaiting runtime'}
            </span>
          </header>
          <p className="dev-controller-summary">{controllerCard.summary}</p>
          <dl className="dev-controller-grid">
            {controllerCard.fields.map((field) => (
              <div key={field.id} className="dev-controller-field">
                <dt>{field.label}</dt>
                <dd className={field.placeholder ? 'is-placeholder' : ''}>
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="dev-controller-footnote">{controllerCard.emptyState}</div>
        </section>

        <section className="dev-card dev-endpoints-card">
          <header className="dev-dashboard-card-header">
            <div>
              <h3 className="dev-card-title">Endpoints & tools</h3>
              <p className="dev-card-subtitle">
                Calm list of URLs we keep handy while everything is mock-only.
              </p>
            </div>
          </header>
          <div className="dev-endpoint-base">
            <span className="dev-endpoint-label">API base</span>
            <code>{endpoints.apiBase}</code>
          </div>
          <ul className="dev-endpoint-list">
            {endpoints.list.map((endpoint) => {
              const fullUrl = `${endpoints.apiBase}${endpoint.path}`;
              const isCopied = copiedId === endpoint.id;
              return (
                <li key={endpoint.id} className="dev-endpoint-item">
                  <div className="dev-endpoint-main">
                    <div>
                      <p className="dev-endpoint-title">{endpoint.label}</p>
                      <p className="dev-endpoint-description">{endpoint.description}</p>
                    </div>
                    <button
                      type="button"
                      className="dev-pill-button active"
                      onClick={() => handleCopy(fullUrl, endpoint.id)}
                    >
                      {isCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <a
                    className="dev-endpoint-path"
                    href={fullUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <code>{fullUrl}</code>
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="dev-endpoint-docs">
            <p className="dev-endpoint-label">Docs</p>
            <ul>
              {endpoints.docs.map((doc) => (
                <li key={doc.id}>
                  <p className="dev-endpoint-title">{doc.label}</p>
                  <p className="dev-endpoint-description">{doc.description}</p>
                  <code>{doc.path}</code>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

const STATUS_LABELS = {
  ok: 'Healthy',
  waiting: 'Waiting',
  down: 'Offline',
  mock: 'Mock',
};

function deriveStatus({ ok, hasData, loading }) {
  if (ok === true) return 'ok';
  if (ok === false && hasData) return 'down';
  if (loading && !hasData) return 'waiting';
  return hasData ? 'waiting' : 'mock';
}

function deriveDbStatus(db, loading) {
  if (!db) {
    return loading ? 'waiting' : 'mock';
  }
  if (db.ok === true) return 'ok';
  if (db.error && typeof db.error === 'string' && db.error.toLowerCase().includes('not configured')) {
    return 'mock';
  }
  if (db.ok === false) return 'down';
  return loading ? 'waiting' : 'mock';
}

function formatTimestamp(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDuration(seconds) {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return null;
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (minutes < 60) return `${minutes}m${secs ? ` ${secs}s` : ''}`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h${remMinutes ? ` ${remMinutes}m` : ''}`;
}
