import { useEffect, useMemo, useState } from 'react';
import '../styles/liveMode.css';
import { liveModeMock } from '../mock/devConsoleMockData.js';
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

function computeSignalStatus({ transportDown, runtimeStatusFlag, summary }) {
  if (transportDown) return 'error';
  if (runtimeStatusFlag === 'error') return 'error';
  if (!summary) return 'waiting';
  if (summary.status === 'error') return 'error';
  if (summary.status === 'degraded') return 'degraded';
  return 'ok';
}

function buildControllerCard({ transportDown, runtimeStatusFlag, summary }) {
  const status = computeSignalStatus({ transportDown, runtimeStatusFlag, summary });
  let metric = 'Unknown';
  let helper = 'Waiting for controller heartbeat.';

  if (!summary) {
    metric = 'No status yet';
    helper = transportDown
      ? 'Controller not reachable – check dev server.'
      : 'Start the controller dev server.';
  } else if (summary?.status === 'ok') {
    metric = 'Healthy';
    helper = 'DB and controller heartbeat look OK.';
  } else if (summary?.status === 'degraded') {
    metric = 'Degraded';
    helper = summary?.helper || 'Some checks are failing.';
  } else if (summary?.status === 'error') {
    metric = 'Error';
    helper = summary?.helper || 'Runtime reported an error.';
  }

  return {
    id: 'controllerHeartbeat',
    label: 'Controller heartbeat',
    status,
    metric,
    helper,
  };
}

function buildJetsonCard({ transportDown, runtimeStatusFlag, jetsonSummary }) {
  const status = computeSignalStatus({
    transportDown,
    runtimeStatusFlag,
    summary: jetsonSummary,
  });

  let metric = 'Unknown';
  let helper = 'Waiting for Jetson runtime.';

  if (!jetsonSummary) {
    metric = 'No signals yet';
    helper = 'Start the Jetson dev runner.';
  } else if (jetsonSummary?.status === 'ok') {
    metric = 'Connected';
    helper = 'Jetson runtime is sending events.';
  } else if (jetsonSummary?.status === 'degraded') {
    metric = 'Degraded';
    helper = jetsonSummary?.helper || 'Some runtime checks are failing.';
  } else if (jetsonSummary?.status === 'error') {
    metric = 'Error';
    helper = jetsonSummary?.helper || 'Runtime reported an error.';
  }

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

  let metric = 'Unknown';
  let helper = 'Waiting for MQTT bridge.';

  if (!bridgeSummary) {
    metric = 'No signals yet';
    helper = 'Start the MQTT bridge / ws endpoint.';
  } else if (bridgeSummary?.status === 'ok') {
    metric = 'Connected';
    helper = 'Bridge is connected and listening.';
  } else if (bridgeSummary?.status === 'degraded') {
    metric = 'Degraded';
    helper = bridgeSummary?.helper || 'Bridge is connected but something is off.';
  } else if (bridgeSummary?.status === 'error') {
    metric = 'Error';
    helper = bridgeSummary?.helper || 'Bridge reported an error.';
  }

  return {
    id: 'mqttBridge',
    label: 'MQTT bridge',
    status,
    metric,
    helper,
  };
}

function computePipelineStatusForItem(item) {
  const hasDecision = Boolean(item?.sorting_decision);
  const pickStatus = item?.plc_feedback?.pick_status || null;

  if (!hasDecision) return 'SEEN';
  if (!pickStatus) return 'DECIDED';

  const normalized = String(pickStatus).toUpperCase();
  if (normalized === 'FIRED' || normalized === 'SUCCESS') return 'ROUTED';
  if (normalized === 'MISSED' || normalized === 'FAILED' || normalized === 'ERROR') {
    return 'DROPPED';
  }

  return 'DECIDED';
}

function getItemId(item) {
  return item?.item_id || item?.id || '—';
}

function getItemSeenAt(item) {
  return (
    item?.capture?.timestamp ||
    item?.meta?.created_at ||
    item?.timestamp ||
    null
  );
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

function formatWeightKg(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const abs = Math.abs(value);
  const decimals = abs < 1 ? 3 : 2;
  return `${value.toFixed(decimals)} kg`;
}

export default function RuntimeStatusPage() {
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
      setRecentItemsLoading(true);
      try {
        const result = await getRecentRuntimeItems({ limit: 20 });
        if (cancelled) return;

        if (result?.ok === false) {
          setRecentItemsError(result.error || 'Failed to load recent runtime items.');
          setRecentItems([]);
        } else {
          const payload = Array.isArray(result)
            ? result
            : Array.isArray(result?.items)
            ? result.items
            : [];
          setRecentItems(payload);
          setRecentItemsError('');
        }
      } catch (loadError) {
        if (!cancelled) {
          setRecentItemsError(
            loadError?.message
              ? `Failed to load recent runtime items: ${loadError.message}`
              : 'Failed to load recent runtime items.',
          );
          setRecentItems([]);
        }
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

  const streamStatus = useMemo(() => {
    if (!runtimeStatus) {
      return liveModeMock.streamStatus;
    }

    const ageSeconds = runtimeStatus?.meta?.age_seconds;
    const ageLabel = formatAgeSeconds(
      typeof ageSeconds === 'number' ? ageSeconds : NaN,
    );

    if (runtimeFlag === 'error') {
      return {
        pill: 'Runtime error',
        helper: 'Runtime reported an error – check logs.',
        detail: `Last heartbeat ${ageLabel} ago.`,
      };
    }

    if (transportDown) {
      return {
        pill: 'Runtime not reachable',
        helper: 'Controller could not reach runtime status endpoint.',
        detail: 'Check dev docker / port forwarding.',
      };
    }

    return {
      pill: 'Runtime connected',
      helper: 'Runtime status endpoint is responding.',
      detail: `Last heartbeat ${ageLabel} ago.`,
    };
  }, [runtimeStatus, runtimeFlag, transportDown]);

  const dbStatusHelper = useMemo(() => {
    if (!runtimeStatus || runtimeFlag !== 'error') return null;
    if (runtimeStatus?.db?.ok === false) {
      return 'Degraded: database not configured.';
    }
    return null;
  }, [runtimeStatus, runtimeFlag]);

  const signalCards = useMemo(() => {
    if (!runtimeStatus) return liveModeMock.signalCards;

    const jetsonSummary = runtimeStatus?.jetson_metrics_summary || null;
    const bridgeSummary = runtimeStatus?.bridge_stats_summary || null;
    const controllerSummary = runtimeStatus?.controller_summary || null;

    return [
      buildControllerCard({
        transportDown,
        runtimeStatusFlag: runtimeFlag,
        summary: controllerSummary,
      }),
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

  const lanes =
    Array.isArray(runtimeStatus?.lanes) && runtimeStatus.lanes.length > 0
      ? runtimeStatus.lanes
      : liveModeMock.lanes;
  const logEvents = liveModeMock.logEvents;

  return (
    <div className="live-mode-page">
      <section className="dev-card live-mode-hero">
        <div className="live-mode-hero-copy">
          <p className="dev-card-eyebrow">Phase 0 · Live mode preview</p>
          <h2 className="dev-card-title">Live mode</h2>
          <p className="dev-card-subtitle">
            High-level view of the runtime loop: status tiles, recent items, and a mock log while we
            bring hardware online.
          </p>
        </div>
        <div className="live-mode-hero-status">
          <div className="live-mode-stream-pill">
            {streamStatus.pill}
          </div>
          <p className="live-mode-stream-helper">{streamStatus.helper}</p>
          <p className="live-mode-stream-detail">{streamStatus.detail}</p>
          {dbStatusHelper && (
            <p className="live-mode-stream-warning">{dbStatusHelper}</p>
          )}
        </div>
      </section>

      <section className="dev-card live-mode-signals-card">
        <header className="live-mode-section-header">
          <div>
            <p className="dev-card-eyebrow">Runtime signals</p>
            <h3>Health &amp; connectivity</h3>
          </div>
        </header>
        <div className="live-mode-signals-grid">
          {signalCards.map((card) => (
            <div
              key={card.id}
              className={`live-mode-signal-pill status-${card.status}`}
            >
              <div className="live-mode-signal-label">{card.label}</div>
              <div className="live-mode-signal-metric">{card.metric}</div>
              <p className="live-mode-signal-helper">{card.helper}</p>
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
          {lanes.map((lane) => (
            <PlcCard key={lane.id} plc={lane} error={fetchError} />
          ))}
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
          <div className="live-mode-runtime-items-table-wrapper">
            <table className="live-mode-runtime-items-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Item ID</th>
                        <th>Category</th>
                        <th>Chute</th>
                        <th>Status</th>
                        <th>Weight (Fake HW)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentItems.map((item) => {
                        const weight = getEstimatedItemWeight(item);
                        const formattedWeight = formatWeightKg(weight);
                        return (
                          <tr key={getItemId(item)}>
                            <td>{formatShortTime(getItemSeenAt(item))}</td>
                            <td>{getItemId(item)}</td>
                            <td>{getCategory(item)}</td>
                            <td>{getChuteId(item) || '—'}</td>
                            <td>{computePipelineStatusForItem(item)}</td>
                            <td>{formattedWeight ? `~${formattedWeight}` : '—'}</td>
                          </tr>
                        );
                      })}
                      {!recentItemsLoading &&
                        !recentItemsError &&
                        recentItems.length === 0 && (
                          <tr>
                            <td colSpan={6}>
                              <div className="live-mode-runtime-items-empty">
                                No runtime items in the last few minutes.
                              </div>
                            </td>
                          </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="dev-card live-mode-log-card">
        <header className="live-mode-section-header">
          <div>
            <p className="dev-card-eyebrow">Mock activity log</p>
            <h3>Recent events</h3>
          </div>
          <p className="live-mode-section-sub">
            Mock log only – real events will be wired later.
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
