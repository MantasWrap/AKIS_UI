import { useCallback, useState } from 'react';
import { API_BASE } from '../../../api/client.js';

function getDebugHeaders() {
  const token =
    import.meta.env.VITE_AKIS_DEBUG_TOKEN ||
    import.meta.env.VITE_DEBUG_TOKEN ||
    '';
  if (!token) return {};
  return { 'x-debug-token': token };
}

async function sendLineCommand({ siteId, lineId, action }) {
  const res = await fetch(`${API_BASE}/api/runtime/line/command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getDebugHeaders(),
    },
    body: JSON.stringify({
      site_id: siteId,
      line_id: lineId,
      action,
    }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(
      body.message || body.error || `Line command failed: ${res.status}`,
    );
    error.code = body.error;
    throw error;
  }

  return body;
}

export function useLineCommand(siteId, lineId) {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const send = useCallback(
    async ({ action }) => {
      if (!action || isSending) return;
      setIsSending(true);
      setError('');
      try {
        await sendLineCommand({ siteId, lineId, action });
      } catch (err) {
        if (err?.code === 'line_command_not_allowed_for_role') {
          setError('Your role is not allowed to perform this line action.');
        } else if (err?.code === 'estop_active') {
          setError('Emergency stop is active. Fix the physical E-stop before commands.');
        } else if (err?.code === 'fault_active') {
          setError('PLC fault is active. Reset the fault before starting the line.');
        } else if (err?.code === 'plc_not_available') {
          setError(
            'PLC is not available for line control (misconfigured or offline). Fix PLC config/connection before trying again.',
          );
        } else if (err?.message) {
          setError(err.message);
        } else {
          setError('Line command failed.');
        }
      } finally {
        setIsSending(false);
      }
    },
    [siteId, lineId, isSending],
  );

  return { send, isSending, error };
}
