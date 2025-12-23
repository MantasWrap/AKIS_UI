import { useEffect, useMemo, useState } from 'react';
import '../styles/liveMode.css';
import { getRecentRuntimeItems, getRuntimeStatus } from '../api/client.js';
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

function formatWeightKg(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${value.toFixed(3)} kg`;
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatShortTime(value) {
  const d = parseDate(value);
  if (!d) return '—';
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function buildComponentCard({ id, label, node, transportDown, runtimeOffline }) {
  if (runtimeOffline) {
    return {
      id,
      label,
      status: 'offline',
      metric: 'Turned off',
      helper: 'Runtime is turned off on this controller.',
    };
  }

  if (!node) {
    return {
      id,
      label,
      status: 'waiting',
      metric: 'No data yet',
      helper: transportDown
        ? 'Not reachable – check controller or network.'
        : 'Waiting for first heartbeat.',
    };
  }

  const ok = node.ok === true;
  const hasError = node.ok === false;
  const ageSec = typeof node.age_sec === 'number' ? node.age_sec : null;
  const ageLabel = formatAgeSeconds(ageSec);

  let status = 'waiting';
  let metric = 'No data yet';
  let helper = 'Waiting for signals.';

  if (hasError) {
    status = 'error';
    metric = 'Not working';
    helper = 'Reported an error – needs help.';
  } else if (ok) {
    status = 'ok';
    metric = 'Working normally';
    helper = 'No issues reported.';
  } else {
    status = 'degraded';
    metric = 'Working, but unstable';
    helper = 'Signals look unusual – keep an eye on this.';
  }

  if (ageLabel && ageLabel !== '—') {
    helper = `${helper} Last heartbeat ${ageLabel} ago.`;
  }

  return {
    id,
    label,
    status,
    metric,
    helper,
  };
}

function getItemSeenAt(item) {
  return (
    item?.capture?.timestamp ||
    item?.meta?.created_at ||
    item?.timestamp ||
    null
  );
}

function getItemId(item) {
  return (
    item?.meta?.id ||
    item?.id ||
    item?.capture?.id ||
    '—'
  );
}

function getCategory(item) {
  return item?.ai_prediction?.classes?.category || '—';
}

function getChuteId(item) {
  return item?.sorting_decision?.chute_id || null;
}

function getEstimatedItemWeight(item) {
  const value = item?.weights?.estimated_item_weight_kg;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function computePipelineStatusForItem(item) {
  const hasDecision = Boolean(item?.sorting_decision);
  const pickStatus = item?.plc_feedback?.pick_status || null;

  if (!hasDecision) return 'SEEN';
  if (!pickStatus) return 'DECIDED';

  const normalized = String(pickStatus).toUpperCase();
  if (normalized === 'ENQUEUED_PICK') return 'ENQUEUED_PICK';
  if (normalized === 'PICKED_OK') return 'PICKED_OK';
  if (normalized === 'PICKED_LATE') return 'PICKED_LATE';
  if (normalized === 'SKIPPED_NO_ITEM') return 'SKIPPED_NO_ITEM';
  if (normalized === 'SKIPPED_OTHER') return 'SKIPPED_OTHER';

  return 'UNKNOWN';
}

function RuntimeStatusPage() {
  const [runtimeStatus, setRuntimeStatus] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const [isPolling] = useState(true);

  const [recentItems, setRecentItems] = useState([]);
  const [recentItemsError, setRecentItemsError] = useState('');
  const [recentItemsLoading, setRecentItemsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timerId;

    async function load() {
      try {
        const result = await getRuntimeStatus();
        if (cancelled) return;
        if (result?.ok === false) {
          setFetchError(result.error || 'Request failed');
          setRuntimeStatus(null);
          return;
        }

        if (result && typeof result === 'object') {
          setRuntimeStatus(result);
          setFetchError('');
        } else {
          setRuntimeStatus(null);
          setFetchError('Unexpected runtime status payload.');
        }
      } catch (err) {
        if (cancelled) return;
        setRuntimeStatus(null);
        setFetchError(err?.message || 'Could not reach runtime status endpoint.');
      }
    }

    if (isPolling) {
      load();
      timerId = setInterval(load, DEFAULT_POLL_MS);
    }

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
    };
  }, [isPolling]);

  useEffect(() => {
    let cancelled = false;
    let timerId;

    async function loadRecentItems() {
      try {
        if (cancelled) return;
        setRecentItemsLoading(true);
        const result = await getRecentRuntimeItems({ limit: 20 });
        if (cancelled) return;
        if (result?.ok === false) {
          setRecentItems([]);
          setRecentItemsError(result.error || 'Could not load recent items.');
          return;
        }

        const items = Array.isArray(result?.items) ? result.items : [];
        setRecentItems(items);
        setRecentItemsError('');
      } catch (err) {
        if (cancelled) return;
        setRecentItems([]);
        setRecentItemsError(err?.message || 'Could not load recent items.');
      } finally {
        if (!cancelled) {
          setRecentItemsLoading(false);
        }
      }
    }

    loadRecentItems();
    timerId = setInterval(loadRecentItems, DEFAULT_POLL_MS);

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
    };
  }, []);

  const runtimeFlag = runtimeStatus?.status || null;
  const transportDown = Boolean(fetchError) || !runtimeStatus;
  const runtimeOffline = Boolean(fetchError);
  const hardwareMode = runtimeStatus?.hardware_mode === 'REAL' ? 'REAL' : 'FAKE';

  const dbStatusHelper = useMemo(() => {
    if (!runtimeStatus || runtimeFlag !== 'error') return null;
    if (runtimeStatus?.db?.ok === false) {
      return 'Degraded: database not configured.';
    }
    return null;
  }, [runtimeStatus, runtimeFlag]);

  const signalCards = useMemo(() => {
    const components = [
      { id: 'db', label: 'Database', node: runtimeStatus?.db },
      { id: 'jetsonLink', label: 'Camera & AI link', node: runtimeStatus?.jetson_link },
      { id: 'runtimeBridge', label: 'Controller brain', node: runtimeStatus?.runtime_bridge },
      { id: 'plc', label: 'PLC / sorter connection', node: runtimeStatus?.plc },
    ];

    return components.map((component) =>
      buildComponentCard({
        ...component,
        transportDown,
        runtimeOffline,
      }),
    );
  }, [runtimeStatus, transportDown, runtimeOffline]);

  const lineStatus = useMemo(() => {
    if (!runtimeStatus || transportDown) {
      return '⛔ Line is not receiving data.';
    }

    const hasComponentErrors =
      Array.isArray(runtimeStatus?.errors) && runtimeStatus.errors.length > 0;

    const hasUnstableComponent = signalCards.some(
      (card) => card.status === 'error' || card.status === 'degraded',
    );

    if (runtimeFlag === 'error' || hasComponentErrors || hasUnstableComponent) {
      return '⚠️ Line is running but needs attention.';
    }

    return '✅ Line is running normally.';
  }, [runtimeStatus, runtimeFlag, transportDown, signalCards]);

  const streamStatus = useMemo(() => {
    if (!runtimeStatus) {
      return {
        pill: 'Runtime not reachable',
        helper: 'Controller could not reach runtime status endpoint.',
        detail: 'Check dev docker / port forwarding.',
        freshnessLabel: null,
        tone: 'error',
      };
    }

    const ageSeconds = runtimeStatus?.meta?.age_seconds;
    const ageLabel = formatAgeSeconds(
      typeof ageSeconds === 'number' ? ageSeconds : NaN,
    );

    let freshnessLabel = null;
    if (typeof ageSeconds === 'number' && Number.isFinite(ageSeconds) && ageSeconds >= 0) {
      if (ageSeconds < 10) {
        freshnessLabel = 'Fresh';
      } else if (ageSeconds <= 60) {
        freshnessLabel = 'Slight delay';
      } else {
        freshnessLabel = 'Stalled – check camera / Jetson link';
      }
    }

    if (runtimeFlag === 'error') {
      return {
        pill: 'Runtime error',
        helper: 'Runtime reported an error – check logs.',
        detail: `Last heartbeat ${ageLabel} ago.`,
        freshnessLabel,
        tone: 'error',
      };
    }

    if (transportDown) {
      return {
        pill: 'Runtime not reachable',
        helper: 'Controller could not reach runtime status endpoint.',
        detail: 'Check dev docker / port forwarding.',
        freshnessLabel,
        tone: 'error',
      };
    }

    const attentionTone = lineStatus.includes('needs attention') ? 'warning' : 'ok';
    return {
      pill: attentionTone === 'warning' ? 'Runtime warning' : 'Runtime connected',
      helper: 'Runtime status endpoint is responding.',
      detail: `Last heartbeat ${ageLabel} ago.`,
      freshnessLabel,
      tone: attentionTone,
    };
  }, [runtimeStatus, runtimeFlag, transportDown, lineStatus]);

  const lanes =
    Array.isArray(runtimeStatus?.lanes) && runtimeStatus.lanes.length > 0
      ? runtimeStatus.lanes
      : [];

  return (
    <div className="live-mode-page">
      <section className="dev-card live-mode-hero">
        <div className="live-mode-hero-copy">
          <p className="dev-card-eyebrow">Phase 0 · Live mode preview</p>
          <h2 className="dev-card-title">Live mode</h2>
          <div className="live-mode-hero-badges">
            <span className="dev-status-chip status-mock">
              {hardwareMode === 'REAL'
                ? 'Production mode · Real PLC'
                : 'Training mode · Fake hardware (Phase 0)'}
            </span>
          </div>
          <p className="dev-card-subtitle">
            Jetson runtime, blowers and conveyor view for Phase 0 training with Fake hardware.
          </p>
        </div>
        <div className="live-mode-hero-status">
          <div className={`live-mode-runtime-pill live-mode-runtime-pill--${streamStatus.tone}`}>
            {streamStatus.pill}
          </div>
          <p className="live-mode-stream-helper">{streamStatus.helper}</p>
          <p className="live-mode-stream-detail">{streamStatus.detail}</p>
          {streamStatus.freshnessLabel && (
            <p className="live-mode-stream-detail">{streamStatus.freshnessLabel}</p>
          )}
          <p className="live-mode-stream-helper">{lineStatus}</p>
          {dbStatusHelper && (
            <p className="live-mode-stream-warning">{dbStatusHelper}</p>
          )}
        </div>
      </section>

      <section className="dev-card live-mode-signals-card">
        <header className="live-mode-section-header">
          <div>
            <p className="dev-card-eyebrow">Runtime health</p>
            <h3>Links &amp; components</h3>
          </div>
        </header>
        <div className="live-mode-signals-grid">
          {signalCards.map((card) => (
            <div
              key={card.id}
              className={`live-mode-component-card live-mode-component-card--${card.status}`}
            >
              <div className="live-mode-component-card-header">
                <span className="live-mode-component-card-label">{card.label}</span>
                <span
                  className={`live-mode-component-card-pill live-mode-component-card-pill--${card.status}`}
                >
                  {card.metric}
                </span>
              </div>
              <div className="live-mode-component-card-body">
                <p className="live-mode-component-card-helper">{card.helper}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="dev-card live-mode-lanes-card">
        <header className="live-mode-section-header">
          <div>
            <p className="dev-card-eyebrow">Runtime lanes</p>
            <h3>PLC &amp; conveyor</h3>
          </div>
        </header>
        <div className="live-mode-lanes-grid">
          {lanes.length > 0 ? (
            lanes.map((lane) => (
              <PlcCard key={lane.id} plc={lane} error={fetchError} />
            ))
          ) : (
            <div className="plc-empty">
              <p className="plc-empty-title">PLC lane metrics not connected yet.</p>
              <p className="plc-empty-sub">
                PLC lane metrics will appear here once PLC metrics are connected. For now, use Live
                items and Simulation items views.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="dev-card live-mode-runtime-items-card">
        <header className="live-mode-section-header">
          <div>
            <p className="dev-card-eyebrow">Recent runtime items</p>
            <h3>Live item snapshots</h3>
          </div>
          <p className="live-mode-section-sub">
            Last items seen by the runtime. Read-only; routing still follows Phase 0 simulation rules.
          </p>
        </header>
        <div className="live-mode-runtime-items-body">
          <p className="live-mode-runtime-items-meta">
            {recentItemsLoading && 'Loading recent items…'}
            {!recentItemsLoading && recentItemsError && (
              <span className="live-mode-runtime-items-error">{recentItemsError}</span>
            )}
            {!recentItemsLoading && !recentItemsError && recentItems.length > 0 && (
              <>
                Showing latest <strong>{recentItems.length}</strong> items
              </>
            )}
          </p>
          <p className="live-mode-runtime-items-meta">
            These are the last items seen in training mode. Weights are simulated – real scales come later.
          </p>
          <div className="live-mode-runtime-items-table-wrapper">
            <table className="live-mode-runtime-items-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Item ID</th>
                  <th>Category</th>
                  <th>Chute</th>
                  <th>Status</th>
                  <th>Weight (Simulated – Fake HW)</th>
                </tr>
              </thead>
              <tbody>
                {recentItems.map((item) => {
                  const weight = getEstimatedItemWeight(item);
                  const formattedWeight = formatWeightKg(weight);
                  const chuteId = getChuteId(item);
                  const status = computePipelineStatusForItem(item);

                  return (
                    <tr key={getItemId(item)}>
                      <td>{formatShortTime(getItemSeenAt(item))}</td>
                      <td>{getItemId(item)}</td>
                      <td>{getCategory(item)}</td>
                      <td>{chuteId ?? '—'}</td>
                      <td>{status}</td>
                      <td>{formattedWeight}</td>
                    </tr>
                  );
                })}
                {!recentItemsLoading &&
                  !recentItemsError &&
                  recentItems.length === 0 && (
                    <tr>
                      <td colSpan={6}>No items yet.</td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}

export default RuntimeStatusPage;
