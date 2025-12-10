import '../styles/liveMode.css';
import { liveModeMock } from '../mock/devConsoleMockData.js';

export default function RuntimeStatusPage() {
  const {
    streamStatus,
    signalCards,
    logEvents,
  } = liveModeMock;

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
          <span className="dev-status-chip status-mock">Mock stream</span>
        </div>
      </section>

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
