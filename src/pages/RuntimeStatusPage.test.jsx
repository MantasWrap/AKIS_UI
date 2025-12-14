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

describe('RuntimeStatusPage (Task 11 Stage 2)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Healthy signal cards when summaries are healthy', async () => {
    getRuntimeStatus.mockResolvedValueOnce(buildRuntimeStatus());
    render(<RuntimeStatusPage />);

    expect(await screen.findByText('Jetson runtime')).toBeInTheDocument();
    expect(screen.getByText('MQTT bridge')).toBeInTheDocument();

    // two signal chips should read Healthy
    const healthyChips = screen.getAllByText('Healthy');
    expect(healthyChips.length).toBeGreaterThanOrEqual(2);

    expect(screen.getByText('Live API')).toBeInTheDocument();
  });

  it('renders Waiting states when has_data=false (no crash)', async () => {
    getRuntimeStatus.mockResolvedValueOnce(
      buildRuntimeStatus({
        jetson_metrics_summary: { has_data: false, healthy: false, age_s: null },
        bridge_stats_summary: { has_data: false, healthy: false, age_s: null, mqtt_connected: null },
      }),
    );

    render(<RuntimeStatusPage />);

    expect(await screen.findByText('Jetson runtime')).toBeInTheDocument();
    const waitingChips = screen.getAllByText('Waiting');
    expect(waitingChips.length).toBeGreaterThanOrEqual(2);

    expect(screen.getAllByText(/No heartbeat yet|No stats yet/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders Backend error hero + Offline signals when getRuntimeStatus returns ok:false', async () => {
    getRuntimeStatus.mockResolvedValueOnce({ ok: false, error: 'Invalid debug token' });

    render(<RuntimeStatusPage />);

    expect(await screen.findByText('Backend error')).toBeInTheDocument();
    expect(screen.getAllByText('Offline').length).toBeGreaterThanOrEqual(1);

    // PLC card should show backend error state (transport error)
    expect(screen.getByText('PLC status unavailable (backend error).')).toBeInTheDocument();
  });
});
