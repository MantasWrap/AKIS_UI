import { useEffect, useMemo, useState } from 'react';
import '../styles/liveMode.css';
import {
  getPlcLaneMetrics,
  getRecentRuntimeItems,
  getRuntimeStatus,
  postRuntimeLineCommand,
} from '../api/client.js';
import { RUNTIME_POLL_INTERVAL_MS } from '../features/runtime/hooks/useRuntimePollingConfig.js';
import { DebugPlcSimControls } from '../features/live/components/DebugPlcSimControls.jsx';
import { PlcDeviceListPanel } from '../features/live/components/PlcDeviceListPanel.jsx';
import { RuntimeAlertsCard } from '../features/live/components/RuntimeAlertsCard.jsx';
import { useRuntimeAlerts } from '../features/runtime/hooks/useRuntimeAlerts.js';
import { usePlcDevices } from '../features/runtime/hooks/usePlcDevices.js';

function useLineCommand({ siteId, lineId }) {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const send = async (action) => {
    if (!action || isSending) return;
    setIsSending(true);
    setError('');
    try {
      const result = await postRuntimeLineCommand({ siteId, lineId, action });
      if (result?.ok === false) {
        const errorCode = result?.data?.error || result?.error || '';
        if (action === 'RESET_FAULT') {
          if (errorCode === 'estop_active') {
            setError('Cannot reset fault while emergency stop is active. Fix E-stop first.');
          } else if (errorCode === 'no_fault_to_reset') {
            setError('There is no active PLC fault to reset.');
          } else if (errorCode) {
            setError(`Could not reset fault: ${errorCode}`);
          } else {
            setError('Failed to reset PLC fault.');
          }
        } else {
          setError(result.error || 'Failed to send line command.');
        }
      }
    } catch (err) {
      if (action === 'RESET_FAULT') {
        setError(err?.message || 'Failed to reset PLC fault.');
      } else {
        setError(err?.message || 'Failed to send line command.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return { send, isSending, error };
}

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
  const [plcMetrics, setPlcMetrics] = useState(null);
  const [plcMetricsError, setPlcMetricsError] = useState('');
  const showAdvancedRuntimeItems = false;
  const [lineCommandLoading, setLineCommandLoading] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [eStopOverride, setEStopOverride] = useState(null);

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
      timerId = setInterval(load, RUNTIME_POLL_INTERVAL_MS);
    }

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
    };
  }, [isPolling]);

  useEffect(() => {
    let cancelled = false;
    let timerId;

    if (!showAdvancedRuntimeItems) return () => {};

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
    timerId = setInterval(loadRecentItems, RUNTIME_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timerId;

    async function loadPlcMetrics() {
      try {
        const result = await getPlcLaneMetrics();
        if (cancelled) return;

        if (!result || result.ok === false || result.status === 'error') {
          const message =
            (result && result.error) ||
            'Could not load PLC lane metrics right now.';
          setPlcMetrics(null);
          setPlcMetricsError(message);
          return;
        }

        setPlcMetrics(result);
        setPlcMetricsError('');
      } catch {
        if (cancelled) return;
        setPlcMetrics(null);
        setPlcMetricsError('Could not load PLC lane metrics right now.');
      }
    }

    loadPlcMetrics();
    timerId = setInterval(loadPlcMetrics, RUNTIME_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
    };
  }, []);

  const runtimeFlag = runtimeStatus?.status || null;
  const transportDown = Boolean(fetchError) || !runtimeStatus;
  const runtimeOffline = Boolean(fetchError);
  const hardwareMode = runtimeStatus?.hardware_mode === 'REAL' ? 'REAL' : 'FAKE';
  const isPhase0Fake = Boolean(runtimeStatus) && hardwareMode === 'FAKE';
  const lineState = runtimeStatus?.line_state || 'UNKNOWN';
  const flags = runtimeStatus?.flags || {};
  const plcStatus = runtimeStatus?.plc || {};
  const plcMetricsSnapshot = runtimeStatus?.plc_metrics || {};
  const eStopActive = Boolean(
    eStopOverride ??
      plcStatus?.e_stop_active ??
      plcMetricsSnapshot?.e_stop_active ??
      flags.e_stop_active,
  );
  const faultActive = Boolean(
    plcStatus?.fault_active ??
      plcMetricsSnapshot?.fault_active ??
      flags.fault_active,
  );
  const faultCode = plcStatus?.fault_code ?? plcMetricsSnapshot?.fault_code ?? null;
  const hasLineData = Boolean(runtimeStatus);
  const isLinePaused = lineState === 'PAUSED';
  const isLineStopped =
    lineState === 'IDLE' || lineState === 'FAULT_STOP' || lineState === 'SAFE_STOP';
  const { send: sendLineCommand, error: lineCommandError } = useLineCommand({
    siteId: runtimeStatus?.env?.site_id || null,
    lineId: runtimeStatus?.env?.line_id || null,
  });
  const siteId = runtimeStatus?.env?.site_id || null;
  const lineId = runtimeStatus?.env?.line_id || null;
  const plcDevicesResult = usePlcDevices(siteId, lineId);
  const plcDevices = plcDevicesResult?.data?.devices || [];
  const runtimeAlerts = useRuntimeAlerts({ siteId, lineId }, runtimeStatus, plcDevices);
  const canShowDebugControls =
    process.env.NODE_ENV !== 'production' &&
    isPhase0Fake &&
    runtimeStatus?.env?.site_id &&
    runtimeStatus?.env?.line_id;
  const canShowLocalEStopToggle = process.env.NODE_ENV !== 'production';

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

    return components.map((component) => {
      const card = buildComponentCard({
        ...component,
        transportDown,
        runtimeOffline,
      });

      let nextCard = card;

      if (isPhase0Fake) {
        if (card.id === 'jetsonLink' && card.status === 'ok') {
          nextCard = {
            ...card,
            helper: `${card.helper} Simulated AI runner (no real camera). Good for testing and training.`,
          };
        } else if (card.id === 'plc') {
          if (card.status === 'ok') {
            nextCard = {
              ...card,
              helper: `${card.helper} Fake PLC – picks are simulated in software. Later this will be connected to a real PLC.`,
            };
          } else {
            nextCard = {
              ...card,
              helper: `${card.helper} Simulator is not producing PLC data. Check Jetson / runtime simulator.`,
            };
          }
        }
      }

      if (isLinePaused && (card.id === 'jetsonLink' || card.id === 'plc')) {
        return {
          ...nextCard,
          helper: `${nextCard.helper} (line paused)`,
        };
      }

      return nextCard;
    });
  }, [runtimeStatus, transportDown, runtimeOffline, isPhase0Fake, isLinePaused]);

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

  const canStart =
    hasLineData &&
    !eStopActive &&
    (lineState === 'IDLE' ||
      lineState === 'PAUSED' ||
      (lineState === 'FAULT_STOP' && !faultActive));
  const canPause = hasLineData && !eStopActive && lineState === 'RUNNING';
  const canStop = hasLineData && !eStopActive && lineState === 'RUNNING';
  const canResetFault =
    hasLineData && !eStopActive && lineState === 'FAULT_STOP' && faultActive;

  const handleAction = async (action) => {
    if (!action || lineCommandLoading) return;
    setLineCommandLoading(action);
    try {
      await sendLineCommand(action);
    } finally {
      setLineCommandLoading(null);
    }
  };

  const lineStateMessage = useMemo(() => {
    if (!hasLineData) return 'Line status is unavailable.';
    if (eStopActive) return 'Emergency stop is active on the line.';
    if (lineState === 'RUNNING') return 'Line is running.';
    if (lineState === 'PAUSED') {
      return 'Line is paused. No new items are being processed.';
    }
    if (lineState === 'SAFE_STOP') return 'Emergency stop is active on the line.';
    if (lineState === 'FAULT_STOP') {
      return 'Line stopped due to a fault. Reset fault to continue.';
    }
    if (lineState === 'IDLE') return 'Line is idle.';
    return `Line state: ${lineState}`;
  }, [hasLineData, lineState, eStopActive]);

  const lineControlWarning = useMemo(() => {
    if (eStopActive || lineState === 'SAFE_STOP') {
      return 'Emergency stop is active. Fix the physical E-stop and reset PLC. Line controls are disabled.';
    }
    if (lineState === 'FAULT_STOP') {
      return 'PLC reports a fault. Investigate the line, then reset fault and start when it is safe.';
    }
    return null;
  }, [eStopActive, lineState]);

  const startButtonClass =
    lineState === 'RUNNING'
      ? 'live-mode-control-button is-success is-active'
      : 'live-mode-control-button is-success is-outline';
  const pauseButtonClass =
    lineState === 'PAUSED'
      ? 'live-mode-control-button is-warning is-active'
      : 'live-mode-control-button is-warning is-outline';
  const stopButtonClass =
    lineState === 'RUNNING'
      ? 'live-mode-control-button is-danger is-outline'
      : 'live-mode-control-button is-danger is-outline';
  const resetButtonClass = 'live-mode-control-button is-neutral';
  const confirmContent = useMemo(() => {
    switch (confirmAction) {
      case 'START':
        return {
          title: 'Start the line?',
          description: 'This will allow new items to be processed on this line.',
          confirmLabel: 'Start line',
        };
      case 'PAUSE':
        return {
          title: 'Pause the line?',
          description: 'This will pause the line and stop processing new items.',
          confirmLabel: 'Pause line',
        };
      case 'STOP':
        return {
          title: 'Stop the line?',
          description: 'This will stop the line. Operators may need to restart it manually.',
          confirmLabel: 'Stop line',
        };
      case 'RESET_FAULT':
        return {
          title: 'Reset line fault?',
          description:
            'Only reset faults after checking the physical line for issues. This does not override any active emergency stop.',
          confirmLabel: 'Reset fault',
        };
      default:
        return null;
    }
  }, [confirmAction]);

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      await handleAction(confirmAction);
    } finally {
      setConfirmAction(null);
    }
  };

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

  const plcLanes =
    Array.isArray(plcMetrics?.lanes) ? plcMetrics.lanes : [];

  const hasPlcLaneData = plcLanes.some((lane) => {
    const counters = lane?.counters || lane?.metrics || {};
    return Object.values(counters).some(
      (value) => typeof value === 'number' && Number.isFinite(value) && value > 0,
    );
  });

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
          {isPhase0Fake && (
            <p className="live-mode-hero-hint">
              This is a fully simulated line. PLC and motors are fake – we use this mode for
              development and operator training.
            </p>
          )}
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

      {eStopActive && (
        <section className="live-mode-estop-banner">
          <div className="live-mode-estop-title">Emergency stop is active</div>
          <div className="live-mode-estop-subtitle">
            Check the physical line E-stop(s) and reset the PLC before attempting to start the line.
          </div>
        </section>
      )}

      <RuntimeAlertsCard
        health={runtimeAlerts.health}
        events={runtimeAlerts.events}
        isLoading={runtimeAlerts.isLoading}
        isError={runtimeAlerts.isError}
      />

      <section className="dev-card live-mode-controls-card">
        <header className="live-mode-section-header">
          <div>
            <p className="dev-card-eyebrow">Line controls</p>
            <h3>Start / Pause / Stop</h3>
          </div>
        </header>
        <div className="live-mode-controls-body">
          <div className="live-mode-controls-buttons">
            <button
              type="button"
              className={startButtonClass}
              onClick={() => setConfirmAction('START')}
              disabled={!canStart || lineCommandLoading !== null}
            >
              {lineCommandLoading === 'START' ? (
                <span className="live-mode-control-inline">
                  <span className="live-mode-control-spinner" />
                  Starting…
                </span>
              ) : (
                'Start'
              )}
            </button>
            <button
              type="button"
              className={pauseButtonClass}
              onClick={() => setConfirmAction('PAUSE')}
              disabled={!canPause || lineCommandLoading !== null}
            >
              {lineCommandLoading === 'PAUSE' ? (
                <span className="live-mode-control-inline">
                  <span className="live-mode-control-spinner" />
                  Pausing…
                </span>
              ) : (
                'Pause'
              )}
            </button>
            <button
              type="button"
              className={stopButtonClass}
              onClick={() => setConfirmAction('STOP')}
              disabled={!canStop || lineCommandLoading !== null}
            >
              {lineCommandLoading === 'STOP' ? (
                <span className="live-mode-control-inline">
                  <span className="live-mode-control-spinner" />
                  Stopping…
                </span>
              ) : (
                'Stop'
              )}
            </button>
            {faultActive && !eStopActive && (
              <button
                type="button"
                className={resetButtonClass}
                onClick={() => setConfirmAction('RESET_FAULT')}
                disabled={!canResetFault || lineCommandLoading !== null}
              >
                {lineCommandLoading === 'RESET_FAULT' ? (
                  <span className="live-mode-control-inline">
                    <span className="live-mode-control-spinner" />
                    Resetting…
                  </span>
                ) : (
                  'Reset fault'
                )}
              </button>
            )}
          </div>
          <p className="live-mode-controls-helper">{lineStateMessage}</p>
          {lineControlWarning && (
            <p className="live-mode-controls-warning">{lineControlWarning}</p>
          )}
          {lineCommandError && (
            <p className="live-mode-controls-error">{lineCommandError}</p>
          )}
          {isPhase0Fake && (
            <p className="live-mode-controls-meta">
              In this training setup, these controls send commands to the simulator. In production,
              they will be wired to the real PLC.
            </p>
          )}
        </div>
      </section>

      <section className="dev-card live-mode-signals-card">
        <header className="live-mode-section-header">
          <div>
            <p className="dev-card-eyebrow">Runtime health</p>
            <h3>Links &amp; components</h3>
          </div>
          {isLinePaused && (
            <span className="live-mode-section-badge">
              Line paused – links are idle
            </span>
          )}
          {!isLinePaused && isLineStopped && (
            <span className="live-mode-section-badge">
              Line stopped – links are idle
            </span>
          )}
        </header>
        <div className="live-mode-signals-grid">
          {signalCards.map((card) => (
            <div
              key={card.id}
              className={`live-mode-component-card live-mode-component-card--${card.status}`}
            >
              <div className="live-mode-component-card-header">
                <div className="live-mode-component-card-label-row">
                  <span className="live-mode-component-card-label">{card.label}</span>
                  {card.id === 'plc' && eStopActive && (
                    <span className="live-mode-plc-badge is-estop">E-stop ACTIVE</span>
                  )}
                  {card.id === 'plc' && !eStopActive && faultActive && (
                    <span className="live-mode-plc-badge is-fault">
                      PLC fault{faultCode ? ` ${faultCode}` : ''}
                    </span>
                  )}
                </div>
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
        {(canShowLocalEStopToggle || canShowDebugControls) && (
          <div className="live-mode-debug-controls">
            <p className="live-mode-debug-label">Simulation controls (dev only)</p>
            {canShowLocalEStopToggle && (
              <div className="live-mode-debug-buttons">
                <button
                  type="button"
                  className="live-mode-debug-button is-estop"
                  onClick={() => setEStopOverride(true)}
                >
                  Force E-stop ON (local)
                </button>
                <button
                  type="button"
                  className="live-mode-debug-button is-estop"
                  onClick={() => setEStopOverride(false)}
                >
                  Force E-stop OFF (local)
                </button>
                <button
                  type="button"
                  className="live-mode-debug-button"
                  onClick={() => setEStopOverride(null)}
                >
                  Clear local override
                </button>
              </div>
            )}
            {canShowDebugControls && (
              <DebugPlcSimControls
                siteId={runtimeStatus.env.site_id}
                lineId={runtimeStatus.env.line_id}
              />
            )}
          </div>
        )}
      </section>

      <section className="dev-card live-mode-lanes-card">
        <header className="live-mode-section-header">
          <div>
            <p className="dev-card-eyebrow">Runtime lanes</p>
            <h3>PLC &amp; conveyor</h3>
          </div>
        </header>
        {isPhase0Fake && (
          <p className="plc-lanes-helper">
            These numbers come from the simulator. In production they will be driven by real PLC
            feedback.
          </p>
        )}
        <div className="plc-lanes-grid">
          {plcMetricsError && (
            <p className="plc-lanes-helper is-error">{plcMetricsError}</p>
          )}
          {!plcMetricsError && plcLanes.length > 0 && hasPlcLaneData && (
            <>
              {plcLanes.map((lane, index) => {
                const counters = lane?.counters || lane?.metrics || {};
                const picksOk = counters.picks_success ?? counters.picks_ok ?? 0;
                const picksMissed = counters.picks_missed ?? 0;
                const picksTimeout = counters.picks_timeout ?? 0;
                const picksErrors =
                  (counters.picks_error || 0) + (counters.picks_cancelled || 0);
                const laneLabel = lane?.lane_id || lane?.id || `Lane ${index + 1}`;

                return (
                  <div key={laneLabel} className="plc-lane-card">
                    <div className="plc-lane-header">
                      <p className="plc-lane-title">{laneLabel}</p>
                      {lane?.window_sec && (
                        <span className="plc-lane-window">
                          Last {Math.round(lane.window_sec / 60)}m
                        </span>
                      )}
                    </div>
                    <div className="plc-lane-metrics">
                      <div className="plc-lane-metric">
                        <span>OK</span>
                        <strong>{picksOk}</strong>
                      </div>
                      <div className="plc-lane-metric">
                        <span>Missed</span>
                        <strong>{picksMissed}</strong>
                      </div>
                      <div className="plc-lane-metric">
                        <span>Timeout</span>
                        <strong>{picksTimeout}</strong>
                      </div>
                      <div className="plc-lane-metric">
                        <span>Errors</span>
                        <strong>{picksErrors}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {!plcMetricsError && (!plcLanes.length || !hasPlcLaneData) && (
            <p className="plc-lanes-helper">
              No picks in this window yet. Run items to see PLC lane metrics.
            </p>
          )}
        </div>
      </section>

      <PlcDeviceListPanel siteId={siteId} lineId={lineId} />

      {showAdvancedRuntimeItems && (
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
      )}

      {confirmAction && confirmContent && (
        <div
          className="dev-modal-overlay"
          onClick={() => {
            if (!lineCommandLoading) setConfirmAction(null);
          }}
        >
          <div
            className="live-mode-confirm-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Line command confirmation"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="live-mode-confirm-header">
              <p className="dev-card-eyebrow">Confirm action</p>
              <h3 className="live-mode-confirm-title">{confirmContent.title}</h3>
              <p className="live-mode-confirm-description">{confirmContent.description}</p>
            </div>
            <div className="live-mode-confirm-actions">
              <button
                type="button"
                className="dev-ghost-button"
                onClick={() => setConfirmAction(null)}
                disabled={lineCommandLoading !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="live-mode-control-button is-success is-active"
                onClick={handleConfirmAction}
                disabled={lineCommandLoading !== null}
              >
                {lineCommandLoading ? 'Sending…' : confirmContent.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default RuntimeStatusPage;
