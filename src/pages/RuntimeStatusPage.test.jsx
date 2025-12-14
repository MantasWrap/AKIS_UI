import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RuntimeStatusPage from './RuntimeStatusPage.jsx';
import { getRuntimeStatus } from '../api/client.js';

vi.mock('../api/client.js', () => ({
  getRuntimeStatus: vi.fn(),
}));

function buildRuntimeStatus(overrides = {}) {
  return {
    status: 'ok',
    db: { ok: true },
    jetson_metrics_summary: {
      has_data: true,
      last_heartbeat_at: '2025-01-01T00:00:00Z',
      age_s: 5,
      healthy: true,
      raw: {},
    },
    bridge_stats_summary: {
      has_data: true,
      mqtt_connected: true,
      last_update_at: '2025-01-01T00:00:00Z',
      age_s: 4,
      healthy: true,
      raw: {},
    },
    plc: {
      mode: 'stub',
      notes: 'Stub PLC for dev/bring-up.',
      metrics_summary: { has_data: false },
    },
    ...overrides,
  };
}

describe('RuntimeStatusPage (Task 11 Stage 3)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Healthy snapshot: shows Live API and Healthy chips', async () => {
    getRuntimeStatus.mockResolvedValue(buildRuntimeStatus());

    const { unmount } = render(<RuntimeStatusPage />);

    expect(await screen.findByText('Live API')).toBeInTheDocument();
    expect(screen.getByText('Jetson runtime')).toBeInTheDocument();
    expect(screen.getByText('MQTT bridge')).toBeInTheDocument();

    const healthyChips = screen.getAllByText('Healthy');
    expect(healthyChips.length).toBeGreaterThanOrEqual(2);

    expect(screen.getByText('Heartbeat received')).toBeInTheDocument();
    expect(screen.getByText('MQTT connected')).toBeInTheDocument();

    unmount();
  });

  it('Degraded / DB-less soft-fail: shows Live API (degraded) + Waiting chips, PLC is not backend-error', async () => {
    getRuntimeStatus.mockResolvedValue(
      buildRuntimeStatus({
        status: 'error',
        db: { ok: false },
        jetson_metrics_summary: { has_data: false, healthy: false, age_s: null },
        bridge_stats_summary: { has_data: false, healthy: false, age_s: null, mqtt_connected: null },
        plc: {
          mode: 'stub',
          notes: 'Stub PLC for dev/bring-up.',
          metrics_summary: { has_data: false },
        },
      }),
    );

    const { unmount } = render(<RuntimeStatusPage />);

    expect(await screen.findByText('Live API (degraded)')).toBeInTheDocument();

    const waitingChips = screen.getAllByText('Waiting');
    expect(waitingChips.length).toBeGreaterThanOrEqual(2);

    expect(screen.getAllByText(/Waiting for first heartbeat/i).length).toBeGreaterThanOrEqual(1);

    // PLC should follow No data path, not backend error
    expect(screen.queryByText('PLC status unavailable (backend error).')).toBeNull();
    expect(screen.getByText('No PLC metrics received yet.')).toBeInTheDocument();

    unmount();
  });

  it('Transport/auth error: shows Backend error + Offline chips and PLC backend-error state', async () => {
    getRuntimeStatus.mockResolvedValue({ ok: false, error: 'Network error' });

    const { unmount } = render(<RuntimeStatusPage />);

    expect(await screen.findByText('Backend error')).toBeInTheDocument();

    const offlineChips = screen.getAllByText('Offline');
    expect(offlineChips.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('PLC status unavailable (backend error).')).toBeInTheDocument();

    unmount();
  });

  it('No data but healthy API: status ok + has_data=false → Waiting chips', async () => {
    getRuntimeStatus.mockResolvedValue(
      buildRuntimeStatus({
        status: 'ok',
        jetson_metrics_summary: { has_data: false, healthy: false, age_s: null },
        bridge_stats_summary: { has_data: false, healthy: false, age_s: null, mqtt_connected: null },
      }),
    );

    const { unmount } = render(<RuntimeStatusPage />);

    expect(await screen.findByText('Live API')).toBeInTheDocument();
    const waitingChips = screen.getAllByText('Waiting');
    expect(waitingChips.length).toBeGreaterThanOrEqual(2);

    unmount();
  });
});
