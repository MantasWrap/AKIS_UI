import { useEffect, useMemo, useState } from 'react';
import '../styles/liveMode.css';
import { liveModeMock } from '../mock/devConsoleMockData.js';
import { getRuntimeStatus } from '../api/client.js';
import PlcCard from '../components/runtime/PlcCard.jsx';

const DEFAULT_POLL_MS = 3000;

export default function RuntimeStatusPage() {
  const {
    streamStatus,
    signalCards,
    logEvents,
  } = liveModeMock;

  const [runtimeStatus, setRuntimeStatus] = useState(null);
  const [runtimeError, setRuntimeError] = useState(null);

  const pollMs = useMemo(() => {
    const fromEnv = Number(import.meta.env.VITE_RUNTIME_STATUS_POLL_MS);
    return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_POLL_MS;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getRuntimeStatus();
      if (cancelled) return;

      if (result?.ok === false) {
        setRuntimeError(result.error || 'Request failed');
        return;
      }

      if (result?.status && result.status !== 'ok') {
        setRuntimeError(result?.error || 'Backend error');
        return;
      }

      setRuntimeStatus(result || null);
      setRuntimeError(null);
    }

    load();
    const interval = setInterval(load, pollMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pollMs]);

  const apiConnected = runtimeStatus?.status === 'ok' && !runtimeError;

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
          <span className={`dev-status-chip ${apiConnected ? 'status-ok' : 'status-mock'}`}>
            {apiConnected ? 'Live API' : 'Mock stream'}
          </span>
        </div>
      </section>

      <PlcCard plc={runtimeStatus?.plc} error={runtimeError} />

      <section className="dev-card live-mode-signal-strip">
        <header className="live-mode-section-head">
          <div>
            <p className="dev-card-eyebrow">Signals</p>
            <h3>Controller → Jetson → MQTT</h3>
          </div>
          <p className="live-mode-section-sub">
            This strip mirrors the future realtime heartbeat cards.
          </p>
        </header>
        <div className="live-mode-signal-grid">
          {signalCards.map((card) => (
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
            Once runtime wiring lands this list turns into a streaming console.
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
