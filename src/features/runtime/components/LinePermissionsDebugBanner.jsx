import React from 'react';
import { useLinePermissions } from '../hooks/useLinePermissions.js';

/**
 * LinePermissionsDebugBanner
 *
 * Small, non-intrusive banner showing:
 *   - Current Stage-0 role (DEV / ADMIN / SUPERVISOR / OPERATOR / VIEWER).
 *   - Which line actions are allowed according to the backend:
 *       - Start, Pause, Stop, Reset fault, Device commands.
 *
 * This is meant for dev / debug builds only and helps you verify
 * that the role model is wired correctly before we enforce it harder
 * in the backend and UI.
 */
export function LinePermissionsDebugBanner() {
  const { role, allowed, isLoading, isError } = useLinePermissions();

  if (isLoading && !role) {
    return (
      <div className="dev-permissions-banner is-loading">
        <p className="dev-permissions-note">Line permissions: loading…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="dev-permissions-banner is-error">
        <p className="dev-permissions-note">
          Line permissions: error loading (check debug token).
        </p>
      </div>
    );
  }

  if (!role || !allowed) {
    return (
      <div className="dev-permissions-banner is-muted">
        <p className="dev-permissions-note">
          Line permissions: no data (debug only).
        </p>
      </div>
    );
  }

  const pills = [
    {
      key: 'start',
      label: 'Start',
      enabled: allowed.line_start,
    },
    {
      key: 'pause',
      label: 'Pause',
      enabled: allowed.line_pause,
    },
    {
      key: 'stop',
      label: 'Stop',
      enabled: allowed.line_stop,
    },
    {
      key: 'reset_fault',
      label: 'Reset fault',
      enabled: allowed.line_reset_fault,
    },
    {
      key: 'device_cmd',
      label: 'Device cmd',
      enabled: allowed.device_command,
    },
  ];

  return (
    <div className="dev-permissions-banner">
      <div className="dev-permissions-header">
        <div>
          <p className="dev-permissions-title">Line control role</p>
          <p className="dev-permissions-note">Stage-0 debug permissions snapshot.</p>
        </div>
        <span className="runtime-alerts-pill is-unknown">{role}</span>
      </div>
      <div className="dev-permissions-pills">
        {pills.map((pill) => (
          <span
            key={pill.key}
            className={[
              'runtime-alerts-pill',
              pill.enabled ? 'is-ok' : 'is-unknown is-disabled',
            ].join(' ')}
          >
            {pill.label}
          </span>
        ))}
      </div>
    </div>
  );
}
