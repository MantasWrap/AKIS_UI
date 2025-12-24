import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/devDashboard.css';
import { getRuntimeLinkMetrics } from '../api/client';
import { emitNavigation } from '../modules/navigationBus.js';
import { RUNTIME_POLL_INTERVAL_MS } from '../features/runtime/hooks/useRuntimePollingConfig.js';

const DEFAULT_PHASE_LABEL = 'Phase 0 · Training mode · Fake hardware';

function getPickCount(counters) {
  if (!counters || typeof counters !== 'object') return null;
  const values = [
    counters.picks_success,
    counters.picks_missed,
    counters.picks_error,
    counters.picks_cancelled,
    counters.picks_timeout,
  ];
  const total = values.reduce((sum, value) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return sum;
    return sum + value;
  }, 0);
  return Number.isFinite(total) ? total : null;
}

function deriveLineStatus({ counters, hasError }) {
  if (hasError || !counters) return '⛔ Line is not receiving data.';
  const itemsSeen = Number(counters.items_seen || 0);
  const picksTotal = getPickCount(counters) ?? 0;
  if (itemsSeen <= 0) return '⛔ Line is not receiving data.';
  if (picksTotal <= 0) return '⚠️ Line is running but needs attention.';
  return '✅ Line is running normally.';
}

function deriveStatusAttentionFlag({ counters, hasError }) {
  if (hasError) return true;
  if (!counters) return false;
  const itemsSeen = Number(counters.items_seen || 0);
  const picksTotal = getPickCount(counters) ?? 0;
  return itemsSeen > 0 && picksTotal <= 0;
}

function hasMetricsData(counters) {
  if (!counters || typeof counters !== 'object') return false;
  return Object.values(counters).some(
    (value) => typeof value === 'number' && Number.isFinite(value) && value > 0,
  );
}

export default function StatusPage() {
  const [runtimeMetrics, setRuntimeMetrics] = useState(null);
  const [runtimeMetricsError, setRuntimeMetricsError] = useState('');
  const [runtimeMetricsLoading, setRuntimeMetricsLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timerId;

    async function loadRuntimeMetrics() {
      if (!hasLoadedOnce.current) {
        setRuntimeMetricsLoading(true);
      }
      try {
        const result = await getRuntimeLinkMetrics({});
        if (cancelled) return;

        if (!result || result.ok === false) {
          const message = 'Could not load metrics right now.';
          setRuntimeMetrics(null);
          setRuntimeMetricsError(message);
          return;
        }

        const payload =
          result.data && typeof result.data === 'object'
            ? result.data
            : result;

        setRuntimeMetrics(payload);
        setRuntimeMetricsError('');
        setLastUpdatedAt(new Date());
      } catch (error) {
        console.warn('Runtime link metrics load failed', error);
        if (!cancelled) {
          setRuntimeMetrics(null);
          setRuntimeMetricsError('Could not load metrics right now.');
        }
      } finally {
        if (!cancelled) {
          setRuntimeMetricsLoading(false);
          hasLoadedOnce.current = true;
        }
      }
    }

    loadRuntimeMetrics();
    timerId = setInterval(loadRuntimeMetrics, RUNTIME_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
    };
  }, []);

  const handleNavigate = (targetKey) => {
    emitNavigation(targetKey);
  };

  const runtimeCounters = runtimeMetrics?.counters || null;
  const picksTotal = useMemo(() => getPickCount(runtimeCounters), [runtimeCounters]);
  const lineStatus = useMemo(
    () =>
      deriveLineStatus({
        counters: runtimeCounters,
        hasError: Boolean(runtimeMetricsError),
      }),
    [runtimeCounters, runtimeMetricsError],
  );
  const needsAttention = useMemo(
    () =>
      deriveStatusAttentionFlag({
        counters: runtimeCounters,
        hasError: Boolean(runtimeMetricsError),
      }),
    [runtimeCounters, runtimeMetricsError],
  );
  const phaseLabel =
    runtimeMetrics?.hardware_mode === 'REAL'
      ? 'Production mode · Real PLC'
      : DEFAULT_PHASE_LABEL;
  const isPhase0Fake = Boolean(runtimeMetrics) && runtimeMetrics?.hardware_mode !== 'REAL';
  const itemsSeen = runtimeCounters?.items_seen;
  const itemsSeenLabel =
    typeof itemsSeen === 'number' && Number.isFinite(itemsSeen) ? itemsSeen : '—';
  const picksLabel =
    typeof picksTotal === 'number' && Number.isFinite(picksTotal) ? picksTotal : '—';
  const phase0StatusHelper = useMemo(() => {
    if (!isPhase0Fake) return null;
    if (lineStatus.includes('needs attention')) {
      return 'Training mode with fake hardware. Check Live Mode for simulated issues.';
    }
    if (lineStatus.includes('not receiving data')) {
      return 'Training mode with fake hardware. In production this will reflect real conveyor data.';
    }
    return 'Training mode with fake hardware – no real PLC or motors yet.';
  }, [isPhase0Fake, lineStatus]);
  const attentionHint = needsAttention
    ? 'System needs attention – open Live Mode for details.'
    : 'Open Live Mode to see live stream and components.';
  const runtimeMetricsEmpty =
    !runtimeMetricsError && runtimeCounters && !hasMetricsData(runtimeCounters);
  const lastUpdatedLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <div className="dev-dashboard-page">
      <section className="dev-card system-overview-card">
        <header className="system-overview-header">
          <div>
            <p className="dev-card-eyebrow">Dev dashboard</p>
            <h2 className="dev-card-title">System overview</h2>
          </div>
          <div className="system-overview-actions">
            <button
              type="button"
              className="dev-dashboard-quick-link"
              onClick={() => handleNavigate('runtimeStatus')}
            >
              Open Live Mode
            </button>
            <button
              type="button"
              className="dev-dashboard-quick-link"
              onClick={() => handleNavigate('items')}
            >
              Open Simulation items
            </button>
          </div>
        </header>
        <p className="system-overview-status">{lineStatus}</p>
        {phase0StatusHelper && (
          <p className="system-overview-helper">{phase0StatusHelper}</p>
        )}
        <p className="system-overview-meta">{phaseLabel}</p>
        <p className="system-overview-meta">
          Items in last 5 minutes: {itemsSeenLabel} · Picks in last 5 minutes: {picksLabel}
        </p>
        <p className="system-overview-hint">{attentionHint}</p>
      </section>

      {needsAttention && (
        <section className="system-attention-banner">
          <p className="system-attention-text">
            ⚠️ System needs attention. Check Live Mode and Simulation views for details.
          </p>
          <div className="system-overview-actions">
            <button
              type="button"
              className="dev-dashboard-quick-link"
              onClick={() => handleNavigate('runtimeStatus')}
            >
              Open Live Mode
            </button>
            <button
              type="button"
              className="dev-dashboard-quick-link"
              onClick={() => handleNavigate('items')}
            >
              Open Simulation items
            </button>
          </div>
        </section>
      )}

      <section className="dev-dashboard-grid">
        <section className="dev-card dev-runtime-link-card">
          <header className="dev-dashboard-card-header">
            <div>
              <p className="dev-card-eyebrow">Runtime metrics</p>
              <h3 className="dev-card-title">Items &amp; picks – last 5 minutes</h3>
              <p className="dev-card-subtitle">
                Items that reached the camera and AI, plus picks sent to PLC (real or Fake).
              </p>
            </div>
            {lastUpdatedLabel && (
              <p className="dev-card-subtitle">Last updated {lastUpdatedLabel}</p>
            )}
          </header>
          <div className="dev-runtime-link-body">
            {runtimeMetricsError && (
              <p className="dev-runtime-link-helper">
                {runtimeMetricsError}
              </p>
            )}
            {!runtimeMetricsError && runtimeMetricsLoading && (
              <p className="dev-runtime-link-helper">Loading metrics…</p>
            )}
            {!runtimeMetricsError && !runtimeMetricsLoading && runtimeCounters && runtimeMetricsEmpty && (
              <p className="dev-runtime-link-helper">
                No data in this window yet.
              </p>
            )}
            {!runtimeMetricsError &&
              !runtimeMetricsLoading &&
              runtimeCounters &&
              !runtimeMetricsEmpty && (
                <dl className="dev-runtime-link-grid">
                  <div className="dev-runtime-link-group">
                    <dt>Items seen</dt>
                    <dd>{runtimeCounters.items_seen ?? '—'}</dd>
                  </div>
                  <div className="dev-runtime-link-group">
                    <dt>Items decided</dt>
                    <dd>{runtimeCounters.items_decided ?? '—'}</dd>
                  </div>
                  <div className="dev-runtime-link-group">
                    <dt>Items routed</dt>
                    <dd>{runtimeCounters.items_routed ?? '—'}</dd>
                  </div>
                  <div className="dev-runtime-link-group">
                    <dt>Picks OK</dt>
                    <dd>{runtimeCounters.picks_success ?? '—'}</dd>
                  </div>
                  <div className="dev-runtime-link-group">
                    <dt>Missed</dt>
                    <dd>{runtimeCounters.picks_missed ?? '—'}</dd>
                  </div>
                  <div className="dev-runtime-link-group">
                    <dt>Errors</dt>
                    <dd>
                      {((runtimeCounters.picks_error || 0) +
                        (runtimeCounters.picks_cancelled || 0)) ||
                        '0'}
                    </dd>
                  </div>
                  <div className="dev-runtime-link-group">
                    <dt>Timeout</dt>
                    <dd>{runtimeCounters.picks_timeout ?? '—'}</dd>
                  </div>
                </dl>
              )}
            {!runtimeMetricsError && !runtimeMetricsLoading && !runtimeCounters && (
              <p className="dev-runtime-link-helper">
                Could not load metrics right now.
              </p>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
