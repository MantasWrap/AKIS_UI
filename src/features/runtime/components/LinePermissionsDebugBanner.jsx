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
      <div className="rounded-md border border-dashed border-slate-500 px-3 py-1 text-xs text-slate-400 mb-2">
        Line permissions: loading...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-red-500/60 bg-red-500/5 px-3 py-1 text-xs text-red-600 mb-2">
        Line permissions: error loading (check debug token)
      </div>
    );
  }

  if (!role || !allowed) {
    return (
      <div className="rounded-md border border-slate-500 px-3 py-1 text-xs text-slate-400 mb-2">
        Line permissions: no data (debug only)
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
    <div className="rounded-md border border-slate-600 bg-slate-900/60 px-3 py-2 text-xs text-slate-100 mb-3 flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold tracking-wide">
          Line control role (Stage-0 debug)
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-700 px-2 py-0.5 text-[11px] uppercase tracking-wide">
          {role}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {pills.map((pill) => (
          <span
            key={pill.key}
            className={[
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide',
              pill.enabled
                ? 'bg-emerald-600/80 text-emerald-50'
                : 'bg-slate-700 text-slate-300/70 line-through',
            ].join(' ')}
          >
            {pill.label}
          </span>
        ))}
      </div>
    </div>
  );
}
