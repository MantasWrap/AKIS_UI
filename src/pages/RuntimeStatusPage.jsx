import { useEffect, useMemo, useState } from 'react';
import '../styles/liveMode.css';
import { liveModeMock } from '../mock/devConsoleMockData.js';
import { getRuntimeStatus } from '../api/client.js';

export default function RuntimeStatusPage() {
  const {
    streamStatus,
    signalCards,
    logEvents,
  } = liveModeMock;
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('live');

  useEffect(() => {
    let active = true;
    async function hydrate() {
      setLoading(true);
      try {
        const data = await getRuntimeStatus();
        if (!active) return;
        if (data?.status === 'ok') {
          setSnapshot(data);
          setError(null);
        } else if (data?.error) {
          throw new Error(data.error);
        } else {
          throw new Error('Runtime status unavailable');
        }
      } catch (err) {
        if (!active) return;
        setSnapshot(null);
        setError(err.message || 'Runtime status unavailable');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    hydrate();
    return () => {
      active = false;
    };
  }, []);

  const shouldUseLive = Boolean(snapshot && view === 'live');

  const heroContent = useMemo(() => {
    if (shouldUseLive && snapshot) {
      return buildHeroContent(snapshot);
    }
    return {
      pill: streamStatus.pill,
      helper: streamStatus.helper,
      detail: streamStatus.detail,
      chipStatus: 'mock',
      chipLabel: 'Mock stream',
    };
  }, [shouldUseLive, snapshot, streamStatus]);

  const heroChipStatus = loading ? 'waiting' : heroContent.chipStatus;
  const heroChipLabel = loading ? 'Checking runtime' : heroContent.chipLabel;

  const heroNotice = (() => {
    if (loading) return 'Fetching runtime snapshot…';
    if (error) return `${error} – showing mock shell.`;
    if (view === 'live' && !snapshot) return 'No live snapshot yet.';
    return null;
  })();

  const signalCardsToRender = shouldUseLive
    ? buildSignalCards(snapshot)
    : signalCards;

  const logEventsToRender = shouldUseLive
    ? buildLogEvents(snapshot)
    : logEvents;

  return (
    <div className="live-mode-page">
      <section className="dev-card live-mode-hero">
        <div>
          <p className="dev-card-eyebrow">Live mode shell</p>
          <h2 className="dev-card-title">{heroContent.pill}</h2>
          <p className="dev-card-subtitle">{heroContent.helper}</p>
          {heroNotice && (
            <p className="live-mode-inline-hint">{heroNotice}</p>
          )}
        </div>
        <div className="live-mode-hero-copy">
          <div className="live-mode-view-toggle">
            <span className="live-mode-view-label">View</span>
            <div className="live-mode-view-buttons">
              <button
                type="button"
                className={`dev-pill-button ${view === 'live' ? 'active' : ''}`}
                onClick={() => snapshot && setView('live')}
                disabled={!snapshot || loading}
              >
                Live snapshot
              </button>
              <button
                type="button"
                className={`dev-pill-button ${view === 'mock' ? 'active' : ''}`}
                onClick={() => setView('mock')}
              >
                Mock sample
              </button>
            </div>
          </div>
          <p>{heroContent.detail}</p>
          <span className={`dev-status-chip status-${heroChipStatus}`}>{heroChipLabel}</span>
        </div>
      </section>

      <section className="dev-card live-mode-signal-strip">
        <header className="live-mode-section-head">
          <div>
            <p className="dev-card-eyebrow">Signals</p>
            <h3>Controller → Jetson → MQTT</h3>
          </div>
          <p className="live-mode-section-sub">
            {shouldUseLive
              ? 'Snapshot of controller doctor heartbeat data.'
              : 'This strip mirrors the future realtime heartbeat cards.'}
          </p>
        </header>
        <div className="live-mode-signal-grid">
          {signalCardsToRender.map((card) => (
            <article key={card.id} className="live-mode-signal-card">
              <div className="live-mode-signal-top">
                <span>{card.label}</span>
                <span className={`dev-status-chip status-${card.status}`}>
                  {card.status === 'ok' && 'Healthy'}
                  {card.status === 'waiting' && 'Waiting'}
                  {card.status === 'down' && 'Offline'}
                </span>
              </div>
              <p className="live-mode-signal-metric">{card.metric}</p>
              <p className="live-mode-signal-helper">{card.helper}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dev-card live-mode-log-card">
        <header className="live-mode-section-head">
          <div>
            <p className="dev-card-eyebrow">{shouldUseLive ? 'Runtime activity log' : 'Mock activity log'}</p>
            <h3>Recent events</h3>
          </div>
          <p className="live-mode-section-sub">
            {shouldUseLive
              ? 'Latest ingest items from /api/debug/runtime-status.'
              : 'Once runtime wiring lands this list turns into a streaming console.'}
          </p>
        </header>
        <ul className="live-mode-log-list">
          {logEventsToRender.map((event) => (
            <li key={event.id} className="live-mode-log-row">
              <span className={`live-mode-log-pill level-${event.level}`}>
                {event.level}
              </span>
              <div>
                <p className="live-mode-log-meta">
                  {event.time} · {event.source}
                </p>
                <p className="live-mode-log-message">{event.message}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function buildHeroContent(snapshot) {
  const lineCount = Array.isArray(snapshot?.lines) ? snapshot.lines.length : 0;
  const pill = lineCount
    ? `Runtime online · ${lineCount} line${lineCount === 1 ? '' : 's'}`
    : 'Runtime online · no line data yet';
  const dbStatus = snapshot?.db?.ok ? 'DB ok' : 'DB waiting';
  const plcMode = snapshot?.plc?.mode ? snapshot.plc.mode : 'stub';
  return {
    pill,
    helper: `${dbStatus}, PLC ${plcMode} mode.`,
    detail: snapshot?.plc?.notes || 'Controller doctor snapshot ready.',
    chipStatus: 'ok',
    chipLabel: 'Live snapshot',
  };
}

function buildSignalCards(snapshot) {
  const cards = [];
  const db = snapshot?.db;
  cards.push({
    id: 'dbHealth',
    label: 'Database',
    status: db?.ok ? 'ok' : db ? 'down' : 'waiting',
    metric: db?.ok ? 'Healthy' : db?.error || 'No DB configured',
    helper: db?.ok ? 'DB handshake OK' : 'Configure DB env for live ingest.',
  });

  const jetson = snapshot?.jetson_metrics_summary;
  cards.push({
    id: 'jetsonRuntime',
    label: 'Jetson runtime',
    status: jetson?.healthy ? 'ok' : jetson ? 'down' : 'waiting',
    metric: jetson?.last_heartbeat_at
      ? `Last beat ${formatShortRelative(jetson.last_heartbeat_at)}`
      : 'No heartbeat yet',
    helper: jetson?.healthy
      ? 'Runner broadcasting metrics.'
      : 'Start dev runner to stream Jetson metrics.',
  });

  const bridge = snapshot?.bridge_stats_summary;
  cards.push({
    id: 'mqttBridge',
    label: 'MQTT bridge',
    status: bridge?.healthy ? 'ok' : bridge ? 'down' : 'waiting',
    metric: bridge?.healthy
      ? 'Bridge connected'
      : bridge?.mqtt_connected === false
        ? 'MQTT offline'
        : 'Awaiting stats',
    helper: bridge?.last_update_at
      ? `Updated ${formatShortRelative(bridge.last_update_at)}`
      : 'Connect MQTT bridge to stream events.',
  });

  const items = snapshot?.items;
  cards.push({
    id: 'itemsIngest',
    label: 'Items ingest',
    status: items && items.total > 0 ? 'ok' : 'waiting',
    metric: items
      ? `${items.total} total · ${items.pending || 0} pending`
      : 'No counters yet',
    helper: items
      ? 'Latest ingest from controller doctor.'
      : 'Awaiting runtime ingest.',
  });

  return cards;
}

function buildLogEvents(snapshot) {
  const latest = snapshot?.items?.latest_items || [];
  return latest.slice(0, 20).map((item, index) => {
    const id = item.item_id || `live-${index}`;
    const level = pickLogLevel(item.pick_status);
    const time = formatTime(item.last_event_at);
    const sourceParts = [];
    if (item.line_id) sourceParts.push(`Line ${item.line_id}`);
    if (item.chute_id) sourceParts.push(`Chute ${item.chute_id}`);
    const source = sourceParts.length ? sourceParts.join(' · ') : 'runtime';
    return {
      id,
      level,
      time: time || '—',
      source,
      message: buildLogMessage(item),
    };
  });
}

function pickLogLevel(status) {
  if (!status) return 'info';
  const normalized = status.toLowerCase();
  if (normalized === 'error') return 'error';
  if (normalized === 'missed' || normalized.startsWith('cancelled')) return 'warn';
  return 'info';
}

function buildLogMessage(item) {
  const status = (item.pick_status || 'pending').toLowerCase();
  const line = item.line_id || 'unknown lane';
  return `Item ${item.item_id || 'n/a'} ${status} on lane ${line}`;
}

function formatTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatShortRelative(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  return `${diffHours}h ago`;
}
