import { usePlcDevices } from '../../runtime/hooks/usePlcDevices.js';

export function PlcDeviceListPanel({ siteId, lineId }) {
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
        <p className="live-mode-device-error">Could not load PLC devices.</p>
      )}
      {!isError && !isLoading && devices.length === 0 && (
        <p className="live-mode-device-empty">No devices registered for this line yet.</p>
      )}
      <div className="live-mode-device-list">
        {devices.map((device) => (
          <div key={device.device_id} className="live-mode-device-item">
            <div className="live-mode-device-row">
              <span className="live-mode-device-name">
                {device.name || device.device_id}
              </span>
              <span className="live-mode-device-type">
                {device.device_type || 'Unknown'}
              </span>
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
          </div>
        ))}
      </div>
    </section>
  );
}
