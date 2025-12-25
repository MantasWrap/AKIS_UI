import { useState } from 'react';
import { API_BASE } from '../../../api/client.js';

function getDebugHeaders() {
  const token =
    import.meta.env.VITE_AKIS_DEBUG_TOKEN ||
    import.meta.env.VITE_DEBUG_TOKEN ||
    '';
  if (!token) return {};
  return { 'x-debug-token': token };
}

export function DebugPlcSimControls({ siteId, lineId }) {
  const [busy, setBusy] = useState(null);

  const callApi = async (path, payload, busyKey) => {
    setBusy(busyKey);
    try {
      await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getDebugHeaders(),
        },
        body: JSON.stringify({
          site_id: siteId,
          line_id: lineId,
          ...payload,
        }),
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="live-mode-debug-buttons">
      <button
        type="button"
        onClick={() => callApi('/api/debug/plc/estop', { active: true }, 'ESTOP_ON')}
        disabled={busy !== null}
        className="live-mode-debug-button is-estop"
      >
        {busy === 'ESTOP_ON' ? 'Applying E-stop…' : 'Simulate E-stop ON'}
      </button>
      <button
        type="button"
        onClick={() => callApi('/api/debug/plc/estop', { active: false }, 'ESTOP_OFF')}
        disabled={busy !== null}
        className="live-mode-debug-button is-estop"
      >
        {busy === 'ESTOP_OFF' ? 'Clearing E-stop…' : 'Clear E-stop'}
      </button>
      <button
        type="button"
        onClick={() => callApi('/api/debug/plc/fault', { active: true }, 'FAULT_ON')}
        disabled={busy !== null}
        className="live-mode-debug-button is-fault"
      >
        {busy === 'FAULT_ON' ? 'Triggering fault…' : 'Simulate fault'}
      </button>
      <button
        type="button"
        onClick={() => callApi('/api/debug/plc/fault', { active: false }, 'FAULT_OFF')}
        disabled={busy !== null}
        className="live-mode-debug-button is-fault"
      >
        {busy === 'FAULT_OFF' ? 'Clearing fault…' : 'Clear fault'}
      </button>
    </div>
  );
}
