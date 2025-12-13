function formatRelativeAgeFromIso(isoString) {
  if (!isoString) return null;
  const ts = Date.parse(isoString);
  if (!Number.isFinite(ts)) return null;

  const diffS = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (diffS < 60) return `${diffS}s ago`;

  const diffM = Math.round(diffS / 60);
  if (diffM < 60) return `${diffM}m ago`;

  const diffH = Math.round(diffM / 60);
  if (diffH < 24) return `${diffH}h ago`;

  const diffD = Math.round(diffH / 24);
  return `${diffD}d ago`;
}

function safeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export default function PlcCard({ plc, error }) {
  const mode = plc?.mode ? String(plc.mode).toUpperCase() : '—';
  const notes = plc?.notes || '';
  const summary = plc?.metrics_summary || null;

  const hasData = summary?.has_data === true;
  const healthy = summary?.healthy === true;
  const lastHeartbeatAt = summary?.last_heartbeat_at || null;

  const badgeText = healthy ? 'Healthy' : hasData ? 'Stale' : 'No data';
  const badgeClass = healthy ? 'status-ok' : hasData ? 'status-waiting' : 'status-waiting';

  const relative = formatRelativeAgeFromIso(lastHeartbeatAt);
  const rawStats = summary?.raw?.stats || {};

  const statRows = [
    { label: 'Picks seen', value: safeNumber(rawStats.picks_seen) },
    { label: 'Posts sent', value: safeNumber(rawStats.posts) },
    { label: 'Gated lines', value: safeNumber(rawStats.gated_lines) },
    { label: 'Skips (no chute)', value: safeNumber(rawStats.skips_no_chute) },
  ];

  return (
    <section className="dev-card live-mode-plc-card" aria-label="PLC status">
      <header className="plc-header">
        <div className="plc-head-left">
          <h3 className="dev-card-title plc-title">PLC</h3>
          <span className="dev-badge dev-badge--muted" aria-label="PLC mode">
            {mode}
          </span>
          <span className={`dev-status-chip ${badgeClass}`} aria-label="PLC health">
            {badgeText}
          </span>
        </div>
      </header>

      {notes ? <p className="plc-notes">{notes}</p> : null}

      {error ? (
        <div className="plc-empty">
          PLC status unavailable (backend error).
        </div>
      ) : !hasData ? (
        <div className="plc-empty">
          <p className="plc-empty-title">No PLC metrics received yet.</p>
          <p className="plc-empty-sub">
            Try running the PLC stub or scenario runner.
          </p>
        </div>
      ) : (
        <div className="plc-body">
          <div className="plc-heartbeat">
            <span className="plc-heartbeat-label">Last heartbeat:</span>
            <span className="plc-heartbeat-value">
              {relative || '—'}
            </span>
            {lastHeartbeatAt ? (
              <time
                className="plc-heartbeat-ts"
                dateTime={lastHeartbeatAt}
                title={lastHeartbeatAt}
              >
                {lastHeartbeatAt}
              </time>
            ) : (
              <span className="plc-heartbeat-ts">—</span>
            )}
          </div>

          <div className="plc-stats-grid" role="list" aria-label="PLC key stats">
            {statRows.map((row) => (
              <div key={row.label} className="plc-stat" role="listitem">
                <dt>{row.label}</dt>
                <dd className={row.value === null ? 'is-placeholder' : ''}>
                  {row.value === null ? '—' : row.value}
                </dd>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
