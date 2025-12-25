import { useEffect, useMemo, useState } from 'react';
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

async function fetchRecentEvents(siteId, lineId, signal) {
  const params = new URLSearchParams();
  if (siteId) params.set('site_id', siteId);
  if (lineId) params.set('line_id', lineId);
  params.set('kind', 'SAFETY,FAULT,PLC_DEVICE');
  params.set('since_ms_ago', '600000');
  params.set('limit', '20');

  const url = `${API_BASE}/api/runtime/events?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...getDebugHeaders(),
    },
    signal,
  });
  if (!res.ok) {
    throw new Error(`Failed to load runtime alerts: ${res.status}`);
  }
  const body = await res.json();
  return { events: body.events || body.items || [] };
}

async function fetchPlcHealth(siteId, lineId, signal) {
  const params = new URLSearchParams();
  if (siteId) params.set('site_id', siteId);
  if (lineId) params.set('line_id', lineId);
  const url = `${API_BASE}/api/runtime/plc/health?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...getDebugHeaders(),
    },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Failed to load PLC health: ${res.status}`);
  }

  const body = await res.json();
  return body && body.health ? body.health : null;
}

export function deriveRuntimeHealth({
  lineState,
  eStopActive,
  faultActive,
  devicesWithFault,
}) {
  if (eStopActive || lineState === 'SAFE_STOP') {
    return 'ALERT';
  }
  if (faultActive || lineState === 'FAULT_STOP' || devicesWithFault > 0) {
    return 'ALERT';
  }
  if (lineState === 'PAUSED') {
    return 'WARN';
  }
  return 'OK';
}

export function useRuntimeAlerts(input, status, plcDevices) {
  const { siteId, lineId } = input || {};
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [plcHealth, setPlcHealth] = useState(null);

  // Poll recent SAFETY / FAULT / PLC_DEVICE events.
  useEffect(() => {
    if (!siteId || !lineId) {
      setEvents([]);
      setIsLoading(false);
      setIsError(false);
      return undefined;
    }

    let cancelled = false;
    let timerId;
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setIsError(false);
      try {
        const payload = await fetchRecentEvents(siteId, lineId, controller.signal);
        if (cancelled) return;
        setEvents(payload.events || []);
      } catch (error) {
        if (cancelled || error?.name === 'AbortError') return;
        setIsError(true);
        setEvents([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    timerId = setInterval(load, RUNTIME_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
      controller.abort();
    };
  }, [siteId, lineId]);

  // Poll PLC connection health in the same cadence.
  useEffect(() => {
    if (!siteId || !lineId) {
      setPlcHealth(null);
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function loadPlcHealth() {
      try {
        const health = await fetchPlcHealth(siteId, lineId, controller.signal);
        if (cancelled) return;
        setPlcHealth(health);
      } catch (error) {
        if (cancelled || error?.name === 'AbortError') return;
        // We keep plcHealth as-is on error; runtime events still work.
      }
    }

    loadPlcHealth();
    const timerId = setInterval(loadPlcHealth, RUNTIME_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
      controller.abort();
    };
  }, [siteId, lineId]);

  const health = useMemo(() => {
    const lineState = status?.line_state ?? null;
    const flags = status?.flags || {};
    const eStopActive = Boolean(flags.e_stop_active);
    const faultActive = Boolean(flags.fault_active);
    const devicesWithFault = (plcDevices || []).filter(
      (device) => device?.status?.status_fault,
    ).length;

    return deriveRuntimeHealth({
      lineState,
      eStopActive,
      faultActive,
      devicesWithFault,
    });
  }, [status, plcDevices]);

  // Tiny "PLC connection health" surface: always show a synthetic alert row
  // when we have plcHealth data.
  const eventsWithPlc = useMemo(() => {
    const baseEvents = Array.isArray(events) ? events : [];
    if (!plcHealth) {
      return baseEvents;
    }

    const statusRaw = plcHealth.status || '';
    const plcStatus = String(statusRaw).toUpperCase();

    const connector = String(plcHealth.connector || '').toUpperCase();
    const isSimulation =
      plcHealth.is_simulation === true ||
      connector === 'FAKE' ||
      plcStatus === 'SIMULATION';

    let summary;
    if (isSimulation) {
      summary = 'PLC connection in simulation mode';
    } else if (plcStatus === 'REAL') {
      summary = 'PLC connection in real-line mode';
    } else {
      summary = `PLC connection status: ${plcStatus.toLowerCase() || 'unknown'}`;
    }

    const synthetic = {
      id: 'plc-connection-health',
      kind: 'PLC_CONN',
      summary,
      created_at: new Date().toISOString(),
    };

    return [synthetic, ...baseEvents];
  }, [events, plcHealth]);

  return {
    health,
    events: eventsWithPlc,
    isLoading,
    isError,
  };
}
