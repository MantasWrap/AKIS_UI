import { useEffect, useState } from 'react';
import { getRuntimeStatus, getHealthReady } from '../api/client';
import ItemHistoryPanel from '../components/ItemHistoryPanel';

const REFRESH_INTERVAL_MS = 10000;

export default function RuntimeStatusPage() {
  const [runtimeSnapshot, setRuntimeSnapshot] = useState(null);
  const [healthReady, setHealthReady] = useState(null);
  const [runtimeError, setRuntimeError] = useState(null);
  const [healthError, setHealthError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyItemId, setHistoryItemId] = useState(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const [healthRes, runtimeRes] = await Promise.all([getHealthReady(), getRuntimeStatus()]);

      if (healthRes?.data) {
        setHealthReady(healthRes.data);
      } else {
        setHealthReady(null);
      }
      setHealthError(healthRes?.error || null);

      if (runtimeRes && runtimeRes.ok === false) {
        setRuntimeError(humanizeRuntimeError(runtimeRes));
        setRuntimeSnapshot(null);
      } else {
        setRuntimeSnapshot(runtimeRes);
        setRuntimeError(null);
      }
      setLastUpdated(new Date());
    } catch (err) {
      setHealthReady(null);
      setRuntimeSnapshot(null);
      setHealthError(humanizeNetworkError(err.message));
      setRuntimeError(humanizeNetworkError(err.message));
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const pipelineOverview = buildPipelineOverview(healthReady, runtimeSnapshot, healthError);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="dev-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="dev-card-title">Pipeline overview</h2>
            <p className="dev-card-subtitle">Live status for Jetson runtime, MQTT bridge, and recent items</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {lastUpdated && (
              <span style={{ color: 'var(--dev-text-muted)', fontSize: '0.85rem' }}>
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button className={`dev-pill-button ${loading ? '' : 'active'}`} onClick={loadStatus} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
        <div className="dev-grid" style={{ marginTop: '1rem' }}>
          {pipelineOverview.map((card) => (
            <OverviewCard key={card.key} {...card} />
          ))}
        </div>
        {runtimeError && (
          <div style={{ marginTop: '0.75rem', color: 'var(--dev-error)' }}>{runtimeError}</div>
        )}
      </div>

      <div className="dev-grid">
        <StatusCard label="Total items" value={runtimeSnapshot?.items?.total_items ?? '—'} />
        <StatusCard label="Pending items" value={runtimeSnapshot?.items?.pending_items ?? '—'} />
        <StatusCard label="Fired items" value={runtimeSnapshot?.items?.fired_items ?? '—'} />
        <StatusCard
          label="Jetson queue depth"
          value={runtimeSnapshot?.jetson_metrics?.raw?.jetson_pick_queue_depth ?? '—'}
        />
      </div>

      <div className="dev-grid">
        <PipelineHealthCard
          label="Database"
          state={runtimeSnapshot?.db?.ok ? 'ok' : 'error'}
          message={runtimeSnapshot?.db?.ok ? 'Connected' : runtimeSnapshot?.db?.error || 'Unavailable'}
        />
        <PipelineHealthCard
          label="Jetson heartbeat"
          {...mapJetsonCard(runtimeSnapshot?.jetson_metrics)}
        />
        <PipelineHealthCard
          label="MQTT bridge"
          {...mapBridgeCard(runtimeSnapshot?.bridge_stats)}
        />
      </div>

      <div className="dev-card">
        <h2 className="dev-card-title">Latest items</h2>
        <p className="dev-card-subtitle">Click an item id to open its ingest history</p>
        {runtimeSnapshot?.items?.latest_items && runtimeSnapshot.items.latest_items.length > 0 ? (
          <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
            <table className="dev-table">
              <thead>
                <tr>
                  <th>item_id</th>
                  <th>chute_id</th>
                  <th>pick_status</th>
                  <th>last_event_at</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {runtimeSnapshot.items.latest_items.map((item) => (
                  <tr key={item.item_id}>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      <button className="dev-table-link" onClick={() => setHistoryItemId(item.item_id)}>
                        {item.item_id}
                      </button>
                    </td>
                    <td>{item.chute_id || '—'}</td>
                    <td>{item.pick_status || '—'}</td>
                    <td>{item.last_event_at || '—'}</td>
                    <td>
                      <button className="dev-table-link" onClick={() => setHistoryItemId(item.item_id)}>
                        View history
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--dev-text-muted)' }}>
            No items yet — start Jetson runtime or ingest sample events.
          </div>
        )}
      </div>

      <div className="dev-grid">
        <div className="dev-card">
          <h2 className="dev-card-title">Jetson metrics</h2>
          {runtimeSnapshot?.jetson_metrics ? (
            <>
              <div style={{ marginBottom: '0.5rem', color: 'var(--dev-text-muted)' }}>
                Last heartbeat: {runtimeSnapshot.jetson_metrics.last_heartbeat_at || 'n/a'}{' '}
                {typeof runtimeSnapshot.jetson_metrics.age_s === 'number' && (
                  <span>(age {formatAge(runtimeSnapshot.jetson_metrics.age_s)})</span>
                )}
              </div>
              <pre className="dev-json-viewer">
                {JSON.stringify(runtimeSnapshot.jetson_metrics.raw, null, 2)}
              </pre>
            </>
          ) : (
            <div style={{ color: 'var(--dev-text-muted)' }}>No metrics yet — Jetson runtime not publishing.</div>
          )}
        </div>

        <div className="dev-card">
          <h2 className="dev-card-title">MQTT bridge stats</h2>
          {runtimeSnapshot?.bridge_stats ? (
            <BridgeStatsTable stats={runtimeSnapshot.bridge_stats} />
          ) : (
            <div style={{ color: 'var(--dev-text-muted)' }}>
              Bridge stats not available yet. Start `npm run mqtt:bridge` to populate this section.
            </div>
          )}
        </div>
      </div>

      <ItemHistoryPanel itemId={historyItemId} onClose={() => setHistoryItemId(null)} />
    </div>
  );
}

function OverviewCard({ title, state, message }) {
  const badgeClass = {
    ok: 'dev-badge dev-badge--ok',
    waiting: 'dev-badge dev-badge--muted',
    degraded: 'dev-badge dev-badge--warn',
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

function StatusCard({ label, value }) {
  return (
    <div className="dev-card" style={{ padding: '1rem' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--dev-text-muted)' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '0.35rem' }}>{value ?? '—'}</div>
    </div>
  );
}

function PipelineHealthCard({ label, state, message }) {
  const badgeClass = {
    ok: 'dev-badge dev-badge--ok',
    warn: 'dev-badge dev-badge--warn',
    error: 'dev-badge dev-badge--error',
  }[state || 'ok'];
  return (
    <div className="dev-card" style={{ flex: '1 1 220px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--dev-text-muted)' }}>{label}</div>
        <div className={badgeClass}>{state === 'warn' ? 'WARN' : state === 'error' ? 'ERROR' : 'OK'}</div>
      </div>
      <div style={{ fontSize: '0.88rem', color: 'var(--dev-text-muted)' }}>{message}</div>
    </div>
  );
}

function BridgeStatsTable({ stats }) {
  const rows = [
    ['MQTT connected', stats.mqtt_connected ? 'yes' : 'no'],
    ['Started at', stats.started_at || '—'],
    ['Last message forwarded', stats.last_message_forwarded_at || '—'],
    ['Total messages seen', stats.total_messages_seen ?? '—'],
    ['Total items forwarded', stats.total_items_forwarded ?? '—'],
    ['Total metrics forwarded', stats.total_metrics_forwarded ?? '—'],
    ['Total errors', stats.total_errors ?? '—'],
    ['Last error at', stats.last_error_at || '—'],
    ['Updated at', stats.updated_at || '—'],
  ];

  return (
    <table className="dev-table">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td style={{ fontWeight: 600 }}>{label}</td>
            <td>{String(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function buildPipelineOverview(healthReady, runtimeSnapshot, errorMessage) {
  const overview = [];
  const jetsonSummary = mapJetsonOverview(healthReady?.jetson_metrics, errorMessage);
  const bridgeSummary = mapBridgeOverview(healthReady?.bridge_stats, errorMessage);
  const itemsTotal = runtimeSnapshot?.items?.total_items;
  const itemsMessage =
    typeof itemsTotal === 'number'
      ? `${itemsTotal} items recorded · Pending ${runtimeSnapshot.items.pending_items ?? 0}`
      : 'No runtime data yet — waiting for Jetson events.';

  overview.push({
    key: 'jetson',
    title: 'Jetson runtime',
    state: jetsonSummary.state,
    message: jetsonSummary.message,
  });
  overview.push({
    key: 'mqtt',
    title: 'MQTT bridge',
    state: bridgeSummary.state,
    message: bridgeSummary.message,
  });
  overview.push({
    key: 'items',
    title: 'Runtime items',
    state: itemsTotal ? 'ok' : 'waiting',
    message: itemsMessage,
  });
  return overview;
}

function mapJetsonOverview(metrics, errorMessage) {
  if (!metrics) {
    return {
      state: errorMessage ? 'unknown' : 'waiting',
      message: errorMessage || 'Jetson runtime has not published metrics yet — start the dev runner.',
    };
  }
  if (!metrics.has_data) {
    return {
      state: 'waiting',
      message: 'Jetson runtime has not sent any metrics yet.',
    };
  }
  if (metrics.healthy) {
    return {
      state: 'ok',
      message: `Heartbeat ${formatAge(metrics.age_s)} ago.`,
    };
  }
  return {
    state: 'degraded',
    message: `Last heartbeat ${formatAge(metrics.age_s)} ago — Jetson runtime may have stopped.`,
  };
}

function mapBridgeOverview(stats, errorMessage) {
  if (!stats) {
    return {
      state: errorMessage ? 'unknown' : 'waiting',
      message: errorMessage || 'MQTT bridge has not reported stats yet.',
    };
  }
  if (!stats.has_data) {
    return {
      state: 'waiting',
      message: 'MQTT bridge metrics pending — start `npm run mqtt:bridge`.',
    };
  }
  if (!stats.mqtt_connected) {
    return {
      state: 'degraded',
      message: 'Bridge running but not connected to Mosquitto.',
    };
  }
  if (!stats.healthy) {
    return {
      state: 'degraded',
      message: `Metrics stale (age ${formatAge(stats.age_s)}) — bridge or broker may be stopped.`,
    };
  }
  return {
    state: 'ok',
    message: `Connected · age ${formatAge(stats.age_s)}.`,
  };
}

function mapJetsonCard(metrics) {
  if (!metrics) {
    return { state: 'warn', message: 'Awaiting Jetson runtime metrics.' };
  }
  if (!metrics.has_data) {
    return { state: 'warn', message: 'No metrics yet — start the Jetson dev runtime.' };
  }
  if (metrics.healthy) {
    return { state: 'ok', message: `Heartbeat ${formatAge(metrics.age_s)} ago.` };
  }
  return { state: 'warn', message: `Heartbeat stale (${formatAge(metrics.age_s)}) — runtime may have stopped.` };
}

function mapBridgeCard(stats) {
  if (!stats) {
    return { state: 'warn', message: 'Awaiting MQTT bridge stats.' };
  }
  if (!stats.has_data) {
    return { state: 'warn', message: 'Bridge not reporting yet — start npm run mqtt:bridge.' };
  }
  if (!stats.mqtt_connected) {
    return { state: 'warn', message: 'Bridge running but not connected to Mosquitto.' };
  }
  if (!stats.healthy) {
    return { state: 'warn', message: `Metrics stale (${formatAge(stats.age_s)}) — check bridge logs.` };
  }
  return { state: 'ok', message: `Connected · age ${formatAge(stats.age_s)}.` };
}

function formatAge(ageSeconds) {
  if (typeof ageSeconds !== 'number' || Number.isNaN(ageSeconds)) return 'n/a';
  if (ageSeconds < 60) return `${Math.max(0, ageSeconds.toFixed(0))}s`;
  const mins = Math.floor(ageSeconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h`;
}

function humanizeRuntimeError(result) {
  if (!result) return 'Unknown error.';
  if (result.status === 503) {
    return 'Controller not ready to produce runtime telemetry yet.';
  }
  return humanizeNetworkError(result.error);
}

function humanizeNetworkError(message) {
  if (!message) return 'Unknown error.';
  if (message.toLowerCase().includes('failed to fetch')) {
    return 'Cannot reach controller — is npm run dev (server) running?';
  }
  return message;
}
