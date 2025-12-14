import { useEffect, useMemo, useState } from 'react';
import '../styles/liveMode.css';
import { liveModeMock } from '../mock/devConsoleMockData.js';
import { getRuntimeStatus } from '../api/client.js';
import PlcCard from '../components/runtime/PlcCard.jsx';

const DEFAULT_POLL_MS = 3000;

function formatAgeSeconds(ageS) {
  if (typeof ageS !== 'number' || !Number.isFinite(ageS) || ageS < 0) return '—';
  const rounded = Math.round(ageS);
  if (rounded < 60) return `${rounded}s`;
  const m = Math.round(rounded / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}

function computeSignalStatus({ transportDown, runtimeStatusFlag, summary }) {
  if (transportDown) return 'down';

  // DB-less / soft-fail mode: status:"error" but payload present.
  // Treat non-healthy summaries as "Waiting" (not "Offline") so operators can see the page is alive.
  if (runtimeStatusFlag === 'error') {
    if (summary?.healthy === true) return 'ok';
    return 'waiting';
  }

  if (summary?.healthy === true) return 'ok';
  if (summary?.has_data === false) return 'waiting';

  // has_data=true but not healthy => treat as offline/stale for the signals strip
  return 'down';
}

function buildJetsonCard({ transportDown, runtimeStatusFlag, jetsonSummary }) {
  const status = computeSignalStatus({
    transportDown,
    runtimeStatusFlag,
    summary: jetsonSummary,
  });

  const hasData = jetsonSummary?.has_data === true;
  const ageLabel = formatAgeSeconds(jetsonSummary?.age_s);

  const metric =
    status === 'ok'
      ? 'Heartbeat received'
      : status === 'waiting'
        ? 'Waiting'
        : 'Heartbeat stale';

  const helper =
    status === 'waiting'
      ? (runtimeStatusFlag === 'error'
        ? 'Degraded mode · waiting for first heartbeat'
        : 'Waiting for first heartbeat')
      : !hasData
        ? 'Waiting for first heartbeat'
        : `Last update ${ageLabel} ago`;

  return {
    id: 'jetsonRuntime',
    label: 'Jetson runtime',
    status,
    metric,
    helper,
  };
}

function buildMqttCard({ transportDown, runtimeStatusFlag, bridgeSummary }) {
  const status = computeSignalStatus({
    transportDown,
    runtimeStatusFlag,
    summary: bridgeSummary,
  });

  const hasData = bridgeSummary?.has_data === true;
  const ageLabel = formatAgeSeconds(bridgeSummary?.age_s);
  const mqttConnected = bridgeSummary?.mqtt_connected === true;

  const metric =
    status === 'ok'
      ? 'MQTT connected'
      : status === 'waiting'
        ? 'Waiting'
        : mqttConnected
          ? 'Stale stats'
          : 'MQTT disconnected';

  const helper =
    status === 'waiting'
      ? (runtimeStatusFlag === 'error'
        ? 'Degraded mode · waiting for first heartbeat'
        : 'Waiting for first heartbeat')
      : !hasData
        ? 'Waiting for first heartbeat'
        : `Last update ${ageLabel} ago`;

  return {
    id: 'mqttBridge',
    label: 'MQTT bridge',
    status,
    metric,
    helper,
  };
}

export default function RuntimeStatusPage() {
  const { streamStatus, logEvents } = liveModeMock;

  const [runtimeStatus, setRuntimeStatus] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const pollMs = useMemo(() => {
    const fromEnv = Number(import.meta.env.VITE_RUNTIME_STATUS_POLL_MS);
    return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_POLL_MS;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getRuntimeStatus();
      if (cancelled) return;

      // Transport / auth error (non-200, network, invalid token)
      if (result?.ok === false) {
        setFetchError(result.error || 'Request failed');
        setRuntimeStatus(null);
        return;
      }

      // Valid JSON payload from backend (can be status:"ok" or status:"error")
      if (result && typeof result === 'object') {
        setRuntimeStatus(result);
        setFetchError(null);
        return;
      }

      // Parsing failed or unexpected response
      setFetchError('Backend error');
      setRuntimeStatus(null);
    }

    load();
    const interval = setInterval(load, pollMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pollMs]);

  const runtimeFlag = runtimeStatus?.status || null;
  const transportDown = Boolean(fetchError) || !runtimeStatus;

  // Hero chip: Live / Degraded / Backend error / Mock
  const heroChip = useMemo(() => {
    if (fetchError) return { text: 'Backend error', cls: 'status-down' };
    if (!runtimeStatus) return { text: 'Mock stream', cls: 'status-mock' };
    if (runtimeFlag === 'ok') return { text: 'Live API', cls: 'status-ok' };
    if (runtimeFlag === 'error') return { text: 'Live API (degraded)', cls: 'status-waiting' };
    return { text: 'Live API (degraded)', cls: 'status-waiting' };
  }, [fetchError, runtimeFlag, runtimeStatus]);

  // Optional extra cue for DB-less MAC_DEV
  const degradedHint = useMemo(() => {
    if (!runtimeStatus || runtimeFlag !== 'error') return null;
    if (runtimeStatus?.db?.ok === false) return 'Degraded: database not configured.';
    return 'Degraded: some services unavailable.';
  }, [runtimeStatus, runtimeFlag]);

  const derivedSignalCards = useMemo(() => {
    const jetsonSummary = runtimeStatus?.jetson_metrics_summary || null;
    const bridgeSummary = runtimeStatus?.bridge_stats_summary || null;

    return [
      buildJetsonCard({
        transportDown,
        runtimeStatusFlag: runtimeFlag,
        jetsonSummary,
      }),
      buildMqttCard({
        transportDown,
        runtimeStatusFlag: runtimeFlag,
        bridgeSummary,
      }),
    ];
  }, [runtimeStatus, transportDown, runtimeFlag]);

  return (
    <div className="live-mode-page">
      <section className="dev-card live-mode-hero">
        <div>
          <p className="dev-card-eyebrow">Live mode shell</p>
          <h2 className="dev-card-title">{streamStatus.pill}</h2>
          <p className="dev-card-subtitle">{streamStatus.helper}</p>
        </div>
        <div className="live-mode-hero-copy">
          <p>{streamStatus.detail}</p>
          <span className={`dev-status-chip ${heroChip.cls}`}>
            {heroChip.text}
          </span>
          {degradedHint ? (
            <p className="live-mode-hero-hint">{degradedHint}</p>
          ) : null}
        </div>
      </section>

      {/* PLC card: error only on transport/auth failures (DB-less status:"error" should still show “No data” / “Stale” etc.) */}
      <PlcCard plc={runtimeStatus?.plc} error={fetchError} />

      <section className="dev-card live-mode-signal-strip">
        <header className="live-mode-section-head">
          <div>
            <p className="dev-card-eyebrow">Signals</p>
            <h3>Jetson + MQTT (from /api/debug/runtime-status)</h3>
          </div>
          <p className="live-mode-section-sub">
            Polled snapshot · no realtime stream yet.
          </p>
        </header>
        <div className="live-mode-signal-grid">
          {derivedSignalCards.map((card) => (
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
            <p className="dev-card-eyebrow">Mock activity log</p>
            <h3>Recent events</h3>
          </div>
          <p className="live-mode-section-sub">
            Mock activity log (real events wiring will land in a later task).
          </p>
        </header>
        <ul className="live-mode-log-list">
          {logEvents.map((event) => (
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
