import { useEffect, useState } from 'react';
import { API_BASE } from '../../../api/client.js';
import { RUNTIME_POLL_INTERVAL_MS } from './useRuntimePollingConfig.js';

function getDebugHeaders() {
  const token =
    import.meta.env.VITE_AKIS_DEBUG_TOKEN ||
    import.meta.env.VITE_DEBUG_TOKEN ||
    '';
  if (!token) return {};
  return { 'x-debug-token': token };
}

async function fetchLinePermissions(signal) {
  const url = `${API_BASE}/api/runtime/line/permissions`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...getDebugHeaders(),
    },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Failed to load line permissions: ${res.status}`);
  }

  const body = await res.json();
  return body || null;
}

/**
 * useLinePermissions
 *
 * Stage-0.5 UI helper for line control roles.
 * Reads the current role + allowed_actions from /api/runtime/line/permissions.
 *
 * Source of truth:
 *   - Backend lineControlPermissions.js
 *   - x-debug-role header or AKIS_DEBUG_ROLE env
 *
 * Intended use:
 *   - Show a small "Role: OPERATOR (debug)" banner.
 *   - Decide whether to show/disable Start/Stop/Reset/Device command controls.
 */
export function useLinePermissions() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setIsError(false);
      try {
        const payload = await fetchLinePermissions(controller.signal);
        if (cancelled) return;
        setData(payload);
      } catch (error) {
        if (cancelled || error?.name === 'AbortError') return;
        setIsError(true);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    const timerId = setInterval(load, RUNTIME_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
      controller.abort();
    };
  }, []);

  const role = data?.role || null;
  const allowed = data?.allowed_actions || null;

  return {
    role,
    allowed,
    raw: data,
    isLoading,
    isError,
  };
}
