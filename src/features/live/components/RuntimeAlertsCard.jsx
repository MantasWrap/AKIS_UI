export function RuntimeAlertsCard({ health, events, isLoading, isError }) {
  const topEvents = Array.isArray(events) ? events.slice(0, 5) : [];
  const healthLabel =
    health === 'ALERT'
      ? 'System in fault / E-stop'
      : health === 'WARN'
      ? 'System needs attention'
      : 'System OK';
  const bannerClass =
    health === 'ALERT'
      ? 'runtime-alerts-banner is-alert'
      : health === 'WARN'
      ? 'runtime-alerts-banner is-warn'
      : 'runtime-alerts-banner is-ok';

  return (
    <section className="dev-card runtime-alerts-card">
      <header className="runtime-alerts-header">
        <div>
          <p className="dev-card-eyebrow">Runtime alerts</p>
          <h3>System health</h3>
        </div>
        {isLoading && <span className="runtime-alerts-meta">Loading…</span>}
      </header>
      <div className={bannerClass}>
        <div className="runtime-alerts-title">{healthLabel}</div>
        {health === 'ALERT' && (
          <div>Check E-stop, PLC faults, and device status in the panels below.</div>
        )}
        {health === 'WARN' && (
          <div>Some parts of the system are paused or stopped. Confirm it is intentional.</div>
        )}
        {health === 'OK' && <div>No active safety/fault conditions detected.</div>}
      </div>
      <div className="runtime-alerts-subhead">
        <span>Recent alerts</span>
      </div>
      {isError && (
        <p className="runtime-alerts-error">Could not load recent alerts.</p>
      )}
      {!isError && !isLoading && topEvents.length === 0 && (
        <p className="runtime-alerts-empty">
          No safety or fault alerts in the last 10 minutes.
        </p>
      )}
      <div className="runtime-alerts-list">
        {topEvents.map((event, index) => {
          const ts = event.created_at || event.ts || '';
          return (
            <div key={event.id || index} className="runtime-alerts-item">
              <div className="runtime-alerts-item-header">
                <span className="runtime-alerts-item-kind">{event.kind}</span>
                <span className="runtime-alerts-item-time">{ts}</span>
              </div>
              <div>{event.summary}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
