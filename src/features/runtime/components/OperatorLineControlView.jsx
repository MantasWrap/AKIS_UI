import React from 'react';
import { useCurrentSiteLine } from '../hooks/useCurrentSiteLine.js';
import { RuntimeAlertsCard } from './RuntimeAlertsCard.jsx';
import { useLinePermissions } from '../hooks/useLinePermissions.js';
import { useLineCommand } from '../hooks/useLineCommand.js';

/**
 * OperatorLineControlView
 *
 * A simplified, tenant-facing view for controlling one line:
 *   - Shows runtime alerts (including PLC health).
 *   - Exposes Start / Pause / Stop / Reset fault buttons.
 *   - Respects roles (backend enforces; UI hides/disables buttons when
 *     /api/runtime/line/permissions says the action is not allowed).
 *
 * No dev-only debug elements (no PLC sim, no Siemens debug panel).
 */
export function OperatorLineControlView() {
  const { siteId, lineId } = useCurrentSiteLine();
  const { role, allowed } = useLinePermissions();
  const { send, isSending, error } = useLineCommand(siteId, lineId);

  const canStart = allowed ? !!allowed.line_start : true;
  const canPause = allowed ? !!allowed.line_pause : true;
  const canStop = allowed ? !!allowed.line_stop : true;
  const canResetFault = allowed ? !!allowed.line_reset_fault : true;

  const handleCommand = (action) => {
    if (isSending) return;
    send({ action });
  };

  return (
    <div className="operator-line-page">
      <header className="operator-line-header">
        <div>
          <p className="dev-card-eyebrow">Operator view</p>
          <h1>Conveyor line – Operator control</h1>
        </div>
        <div className="operator-line-meta">
          <span className="operator-line-pill">
            Site: {siteId} · Line: {lineId}
          </span>
          {role && (
            <span className="operator-line-pill">
              Role: {role}
            </span>
          )}
        </div>
      </header>

      <div className="operator-line-layout">
        <div className="operator-line-left">
          <RuntimeAlertsCard siteId={siteId} lineId={lineId} />
        </div>
        <div className="operator-line-right">
          <section className="dev-card operator-line-controls">
            <header className="dev-card-header">
              <div>
                <p className="dev-card-eyebrow">Line control</p>
                <h2>Start / Pause / Stop / Reset</h2>
              </div>
            </header>

            <div className="operator-line-buttons">
              <button
                type="button"
                className="operator-btn operator-btn-start"
                disabled={isSending || !canStart}
                onClick={() => handleCommand('START')}
              >
                {isSending ? 'Sending…' : 'Start line'}
              </button>
              <button
                type="button"
                className="operator-btn operator-btn-pause"
                disabled={isSending || !canPause}
                onClick={() => handleCommand('PAUSE')}
              >
                {isSending ? 'Sending…' : 'Pause line'}
              </button>
              <button
                type="button"
                className="operator-btn operator-btn-stop"
                disabled={isSending || !canStop}
                onClick={() => handleCommand('STOP')}
              >
                {isSending ? 'Sending…' : 'Stop line'}
              </button>
            </div>

            <div className="operator-line-buttons operator-line-buttons-secondary">
              <button
                type="button"
                className="operator-btn operator-btn-reset"
                disabled={isSending || !canResetFault}
                onClick={() => handleCommand('RESET_FAULT')}
              >
                {isSending ? 'Sending…' : 'Reset PLC fault'}
              </button>
            </div>

            {allowed && (!canStart || !canPause || !canStop || !canResetFault) && (
              <p className="operator-line-permission-note">
                Some actions are disabled for your role. Ask a supervisor if you
                need additional permissions.
              </p>
            )}

            {error && (
              <p className="operator-line-error">
                {error}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
