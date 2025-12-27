import { useMemo, useState } from 'react';
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

export function PlcDeviceListPanel({ siteId, lineId }) {
  const { data, isLoading, isError, refetch } = usePlcDevices(siteId, lineId);
  const devices = Array.isArray(data?.devices) ? data.devices : [];
  const [busyKey, setBusyKey] = useState(null);
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

  // Device commands are visible only in dev mode, for a specific line, and if
  // the current role is allowed to send device commands.
  const canShowCommands =
    isDevMode && Boolean(siteId && lineId) && canDeviceCommandForRole;

  const sendDeviceSim = async (deviceId, payload, actionKey) => {
    if (!deviceId || busyKey) return;
    setBusyKey(actionKey);
    try {
      await fetch(`${API_BASE}/api/debug/plc/device/status`, {
        method: 'POST',
        headers: {
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

      {allowed && !canDeviceCommandForRole && (
        <p className="live-mode-device-permission-note">
          Device Start/Stop commands are disabled for your role
          {role ? ` (${role})` : ''}. You can still inspect device status and IO.
        </p>
      )}

      {isError && (
        <p className="live-mode-device-error">Could not load PLC devices.</p>
      )}
      {!isError && !isLoading && devices.length === 0 && (
        <p className="live-mode-device-empty">No devices registered for this line yet.</p>
      )}
      <div className="live-mode-device-list">
        {devices.map((device) => {
          const badge = deviceStatusBadge(device.status);
          const canSimulate =
            isDevMode &&
            (device.device_type === 'CONVEYOR_SECTION' || device.device_type === 'CHUTE');

          return (
            <div key={device.device_id} className="live-mode-device-item">
              <div className="live-mode-device-row">
                <div className="live-mode-device-main">
                  <div className="live-mode-device-header-row">
                    <div className="live-mode-device-name">
                      <span className={`device-badge ${badge.className}`}>{badge.label}</span>
                      <span className="live-mode-device-title">{device.device_name}</span>
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
                          <span className="live-mode-device-io-value">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {canShowCommands && device.device_type === 'CONVEYOR_SECTION' && (
                    <div className="live-mode-device-command">
                      <p className="live-mode-device-command-label">Device controls</p>
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
                        <p className="live-mode-device-command-error">{deviceCommandError}</p>
                      )}
                    </div>
                  )}
                  {canSimulate && (
                    <div className="live-mode-device-sim">
                      <p className="live-mode-device-command-label">Simulation controls</p>
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
