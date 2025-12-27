import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../../api/client.js';
import { usePlcDevices } from '../../runtime/hooks/usePlcDevices.js';
import { usePlcDeviceCommand } from '../../runtime/hooks/usePlcDeviceCommand.js';
import { useLinePermissions } from '../../runtime/hooks/useLinePermissions.js';

function getDebugHeaders() {
  const token =
    import.meta.env.VITE_AKIS_DEBUG_TOKEN ||
    import.meta.env.VITE_DEBUG_TOKEN ||
    '';
  if (!token) return {};
  return { 'x-debug-token': token };
}

function deviceStatusBadge(status) {
  if (!status) {
    return { label: 'Unknown', className: 'device-badge is-unknown' };
  }
  if (status.status_fault) {
    return { label: 'Fault', className: 'device-badge is-fault' };
  }
  if (status.status_running) {
    return { label: 'Running', className: 'device-badge is-running' };
  }
  if (status.status_stopped) {
    return { label: 'Stopped', className: 'device-badge is-stopped' };
  }
  return { label: 'Unknown', className: 'device-badge is-unknown' };
}

async function fetchPlcModeSummary({ siteId, lineId }) {
  const params = new URLSearchParams();
  if (siteId) params.set('site_id', siteId);
  if (lineId) params.set('line_id', lineId);

  const query = params.toString();
  const url = query
    ? `${API_BASE}/api/debug/plc/siemens/metrics?${query}`
    : `${API_BASE}/api/debug/plc/siemens/metrics`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...getDebugHeaders(),
    },
  }).catch(() => null);

  if (!res || !res.ok) return null;
  const body = await res.json().catch(() => ({}));
  return {
    connector: body.connector || null,
    hardware_mode: body.hardware_mode || null,
    real_io_mode: body.real_io_mode || null,
  };
}

/**
 * Full debug panel: can show commands + simulation when allowed.
 * Used in Live Mode.
 */
export function PlcDeviceListPanel({ siteId, lineId }) {
  const { data, isLoading, isError, refetch } = usePlcDevices(siteId, lineId);
  const devices = Array.isArray(data?.devices) ? data.devices : [];
  const [busyKey, setBusyKey] = useState(null);
  const [plcMode, setPlcMode] = useState(null);

  const isDevMode =
    import.meta.env?.DEV ??
    (typeof process !== 'undefined' &&
      process.env &&
      process.env.NODE_ENV !== 'production');

  const { role, allowed } = useLinePermissions();
  const deviceCommand = usePlcDeviceCommand(siteId, lineId, {
    onSuccess: refetch,
  });
  const deviceCommandError = deviceCommand.error;

  // If permissions endpoint fails or is not ready, default to "true" so dev is not blocked.
  const canDeviceCommandForRole = allowed ? !!allowed.device_command : true;

  // Determine if we are in a "read-only" PLC mode (Siemens REAL + READ_ONLY).
  const isReadOnlyPlcMode = useMemo(() => {
    if (!plcMode) return false;
    const connector = (plcMode.connector || '').toUpperCase();
    const hardware = (plcMode.hardware_mode || '').toUpperCase();
    const realIo = (plcMode.real_io_mode || '').toUpperCase();
    return connector === 'SIEMENS' && hardware === 'REAL' && realIo === 'READ_ONLY';
  }, [plcMode]);

  // Only allow real device commands when NOT in Siemens read-only mode.
  const canShowCommands =
    isDevMode &&
    Boolean(siteId && lineId) &&
    canDeviceCommandForRole &&
    !isReadOnlyPlcMode;

  // Simulation is always dev-only; we also hide it in Siemens real read-only mode.
  const canSimulateForDevice = (device) => {
    if (!isDevMode || isReadOnlyPlcMode) return false;
    return device.device_type === 'CONVEYOR_SECTION' || device.device_type === 'CHUTE';
  };

  const sendDeviceSim = async (deviceId, payload, actionKey) => {
    if (!deviceId || busyKey) return;
    setBusyKey(actionKey);
    try {
      await fetch(`${API_BASE}/api/debug/plc/device/status`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...getDebugHeaders(),
        },
        body: JSON.stringify({
          site_id: siteId,
          line_id: lineId,
          device_id: deviceId,
          ...payload,
        }),
      });
      refetch();
    } finally {
      setBusyKey(null);
    }
  };

  const commandBusyKey = useMemo(
    () => (deviceCommand.isSending ? 'command' : null),
    [deviceCommand.isSending],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const mode = await fetchPlcModeSummary({ siteId, lineId });
      if (!cancelled) setPlcMode(mode);
    })();

    return () => {
      cancelled = true;
    };
  }, [siteId, lineId]);

  return (
    <section className="dev-card live-mode-device-panel">
      <header className="live-mode-device-header">
        <div>
          <p className="dev-card-eyebrow">PLC inventory</p>
          <h3>Devices on this line</h3>
        </div>
        <p className="live-mode-device-count">
          {isLoading ? 'Loading…' : `${devices.length} devices`}
        </p>
      </header>

      {plcMode && (
        <p className="live-mode-device-helper">
          Connector: {plcMode.connector || 'unknown'} · Hardware:{' '}
          {plcMode.hardware_mode || 'unknown'} · IO mode:{' '}
          {plcMode.real_io_mode || 'unknown'}
        </p>
      )}

      {isReadOnlyPlcMode && (
        <p className="live-mode-device-helper">
          PLC is in <strong>read-only</strong> mode. Device controls and simulation
          are disabled; this panel shows what AKIS reads from PLC.
        </p>
      )}

      {allowed && !canDeviceCommandForRole && (
        <p className="live-mode-device-helper">
          Your role ({role || 'unknown'}) is not allowed to send device commands for
          this line.
        </p>
      )}

      {isError && (
        <p className="live-mode-device-error">
          Could not load devices for this line. Check debug token / backend logs.
        </p>
      )}

      {!isError && !isLoading && devices.length === 0 && (
        <p className="live-mode-device-empty">No devices registered for this line yet.</p>
      )}

      <div className="live-mode-device-list">
        {devices.map((device) => {
          const badge = deviceStatusBadge(device.status);
          const canSimulate = canSimulateForDevice(device);

          return (
            <div key={device.device_id} className="live-mode-device-item">
              <div className="live-mode-device-row">
                <div className="live-mode-device-main">
                  <div className="live-mode-device-header-row">
                    <div className="live-mode-device-name">
                      <span className={`device-badge ${badge.className}`}>
                        {badge.label}
                      </span>
                      <span className="live-mode-device-title">
                        {device.device_name}
                      </span>
                    </div>
                    <div className="live-mode-device-type">
                      <span className="live-mode-device-type-label">Type</span>
                      <span className="live-mode-device-type-value">
                        {device.device_type || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="live-mode-device-id">ID: {device.device_id}</div>
                  {device.io && typeof device.io === 'object' && (
                    <div className="live-mode-device-io">
                      {Object.entries(device.io).map(([key, value]) => (
                        <div key={key} className="live-mode-device-io-row">
                          <span className="live-mode-device-io-key">{key}</span>
                          <span className="live-mode-device-io-value">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {canShowCommands && device.device_type === 'CONVEYOR_SECTION' && (
                    <div className="live-mode-device-command">
                      <p className="live-mode-device-command-label">
                        Device controls (fake PLC / lab only)
                      </p>
                      <div className="live-mode-device-actions">
                        <button
                          type="button"
                          className="live-mode-device-action is-running"
                          disabled={commandBusyKey !== null}
                          onClick={() =>
                            deviceCommand.send({
                              deviceId: device.device_id,
                              command: 'START_SECTION',
                            })
                          }
                        >
                          {commandBusyKey ? 'Sending…' : 'Start section'}
                        </button>
                        <button
                          type="button"
                          className="live-mode-device-action is-stopped"
                          disabled={commandBusyKey !== null}
                          onClick={() =>
                            deviceCommand.send({
                              deviceId: device.device_id,
                              command: 'STOP_SECTION',
                            })
                          }
                        >
                          {commandBusyKey ? 'Sending…' : 'Stop section'}
                        </button>
                      </div>
                      {deviceCommandError && (
                        <p className="live-mode-device-command-error">
                          {deviceCommandError}
                        </p>
                      )}
                    </div>
                  )}

                  {canSimulate && (
                    <div className="live-mode-device-sim">
                      <p className="live-mode-device-command-label">
                        Simulation controls (no real PLC writes)
                      </p>
                      <div className="live-mode-device-actions">
                        <button
                          type="button"
                          className="live-mode-device-action is-running"
                          disabled={busyKey === `${device.device_id}-run`}
                          onClick={() =>
                            sendDeviceSim(
                              device.device_id,
                              { running: true, fault: false },
                              `${device.device_id}-run`,
                            )
                          }
                        >
                          {busyKey === `${device.device_id}-run`
                            ? 'Setting running…'
                            : 'Sim: Set running'}
                        </button>
                        <button
                          type="button"
                          className="live-mode-device-action is-stopped"
                          disabled={busyKey === `${device.device_id}-stop`}
                          onClick={() =>
                            sendDeviceSim(
                              device.device_id,
                              { running: false, fault: false },
                              `${device.device_id}-stop`,
                            )
                          }
                        >
                          {busyKey === `${device.device_id}-stop`
                            ? 'Setting stopped…'
                            : 'Sim: Set stopped'}
                        </button>
                        <button
                          type="button"
                          className="live-mode-device-action is-fault"
                          disabled={busyKey === `${device.device_id}-fault`}
                          onClick={() =>
                            sendDeviceSim(
                              device.device_id,
                              { running: false, fault: true },
                              `${device.device_id}-fault`,
                            )
                          }
                        >
                          {busyKey === `${device.device_id}-fault`
                            ? 'Setting fault…'
                            : 'Sim: Set fault'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Read-only variant for StatusPage: only badges + IO, no controls.
 */
export function PlcDeviceListReadOnlyPanel({ siteId, lineId }) {
  const { data, isLoading, isError } = usePlcDevices(siteId, lineId);
  const devices = Array.isArray(data?.devices) ? data.devices : [];

  return (
    <section className="dev-card live-mode-device-panel">
      <header className="live-mode-device-header">
        <div>
          <p className="dev-card-eyebrow">PLC inventory</p>
          <h3>Devices on this line</h3>
        </div>
        <p className="live-mode-device-count">
          {isLoading ? 'Loading…' : `${devices.length} devices`}
        </p>
      </header>

      {isError && (
        <p className="live-mode-device-error">
          Could not load devices for this line. Check debug token / backend logs.
        </p>
      )}

      {!isError && !isLoading && devices.length === 0 && (
        <p className="live-mode-device-empty">No devices registered for this line yet.</p>
      )}

      <div className="live-mode-device-list">
        {devices.map((device) => {
          const badge = deviceStatusBadge(device.status);

          return (
            <div key={device.device_id} className="live-mode-device-item">
              <div className="live-mode-device-row">
                <div className="live-mode-device-main">
                  <div className="live-mode-device-header-row">
                    <div className="live-mode-device-name">
                      <span className={`device-badge ${badge.className}`}>
                        {badge.label}
                      </span>
                      <span className="live-mode-device-title">
                        {device.device_name}
                      </span>
                    </div>
                    <div className="live-mode-device-type">
                      <span className="live-mode-device-type-label">Type</span>
                      <span className="live-mode-device-type-value">
                        {device.device_type || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="live-mode-device-id">ID: {device.device_id}</div>
                  {device.io && typeof device.io === 'object' && (
                    <div className="live-mode-device-io">
                      {Object.entries(device.io).map(([key, value]) => (
                        <div key={key} className="live-mode-device-io-row">
                          <span className="live-mode-device-io-key">{key}</span>
                          <span className="live-mode-device-io-value">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
