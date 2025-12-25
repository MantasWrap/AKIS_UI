import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../../../api/client.js';

function getDebugHeaders() {
  const token =
    import.meta.env.VITE_AKIS_DEBUG_TOKEN ||
    import.meta.env.VITE_DEBUG_TOKEN ||
    '';
  if (!token) return {};
  return { 'x-debug-token': token };
}

async function fetchPlcDevices(siteId, lineId, signal) {
  const params = new URLSearchParams();
  if (siteId) params.set('site_id', siteId);
  if (lineId) params.set('line_id', lineId);
  const url = params.toString()
    ? `${API_BASE}/api/runtime/plc/devices?${params.toString()}`
    : `${API_BASE}/api/runtime/plc/devices`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...getDebugHeaders(),
    },
    signal,
  });
  if (!res.ok) {
    throw new Error(`Failed to load PLC devices: ${res.status}`);
  }
  return res.json();
}

export function usePlcDevices(siteId, lineId) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setIsError(false);
      try {
        const payload = await fetchPlcDevices(siteId, lineId, controller.signal);
        if (cancelled) return;
        setData(payload);
      } catch (error) {
        if (cancelled || error?.name === 'AbortError') return;
        setIsError(true);
        setData(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [siteId, lineId, refreshKey]);

  return { data, isLoading, isError, refetch };
}
