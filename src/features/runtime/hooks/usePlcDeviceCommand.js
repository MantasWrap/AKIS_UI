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

async function sendDeviceCommand({ siteId, lineId, deviceId, command }) {
  const res = await fetch(`${API_BASE}/api/runtime/plc/device/command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getDebugHeaders(),
    },
    body: JSON.stringify({
      site_id: siteId,
      line_id: lineId,
      device_id: deviceId,
      command,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(
      body.message || body.error || `Device command failed: ${res.status}`,
    );
    error.code = body.error;
    throw error;
  }

  return res.json();
}

export function usePlcDeviceCommand(siteId, lineId, { onSuccess } = {}) {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const send = useCallback(
    async ({ deviceId, command }) => {
      if (!deviceId || !command || isSending) return;
      setIsSending(true);
      setError('');
      try {
        await sendDeviceCommand({
          siteId,
          lineId,
          deviceId,
          command,
        });
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
      } catch (err) {
        setError(err?.message || 'Device command failed.');
      } finally {
        setIsSending(false);
      }
    },
    [siteId, lineId, onSuccess, isSending],
  );

  return { send, isSending, error };
}
