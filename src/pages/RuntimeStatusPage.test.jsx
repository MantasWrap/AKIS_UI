import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RuntimeStatusPage from './RuntimeStatusPage.jsx';
import { getRecentRuntimeItems, getRuntimeStatus } from '../api/client.js';

vi.mock('../api/client.js', () => ({
  getRuntimeStatus: vi.fn(),
  getRecentRuntimeItems: vi.fn(),
}));

function buildRuntimeStatus(overrides = {}) {
  return {
    status: 'ok',
    hardware_mode: 'FAKE',
    meta: {
      age_seconds: 5,
    },
    db: { ok: true },
    jetson_link: { ok: true },
    runtime_bridge: { ok: true },
    plc: { ok: true },
    errors: [],
    lanes: [],
    ...overrides,
  };
}

describe('RuntimeStatusPage (Stage 1 Live mode UX polish)', () => {
  beforeEach(() => {
    getRecentRuntimeItems.mockResolvedValue({ items: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Healthy snapshot: shows connected status, fresh stream, and working tiles', async () => {
    getRuntimeStatus.mockResolvedValue(buildRuntimeStatus());

    const { unmount } = render(<RuntimeStatusPage />);

    expect(await screen.findByText('Runtime connected')).toBeInTheDocument();
    expect(screen.getByText('✅ Line is running normally.')).toBeInTheDocument();
    expect(screen.getByText('Fresh')).toBeInTheDocument();
    expect(screen.getByText('Training mode · Fake hardware (Phase 0)')).toBeInTheDocument();

    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Camera & AI link')).toBeInTheDocument();
    expect(screen.getByText('Controller brain')).toBeInTheDocument();
    expect(screen.getByText('PLC / sorter connection')).toBeInTheDocument();

    const workingChips = screen.getAllByText('Working normally');
    expect(workingChips.length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('No issues reported.').length).toBeGreaterThanOrEqual(1);

    unmount();
  });

  it('Degraded / DB-less soft-fail: shows warning line status and DB helper', async () => {
    getRuntimeStatus.mockResolvedValue(
      buildRuntimeStatus({
        status: 'error',
        db: { ok: false },
        jetson_link: null,
        runtime_bridge: null,
        plc: { ok: false },
      }),
    );

    const { unmount } = render(<RuntimeStatusPage />);

    expect(await screen.findByText('Runtime error')).toBeInTheDocument();
    expect(screen.getByText('⚠️ Line is running but needs attention.')).toBeInTheDocument();
    expect(screen.getByText('Degraded: database not configured.')).toBeInTheDocument();
    expect(screen.getAllByText('Waiting for first heartbeat.').length).toBeGreaterThanOrEqual(2);

    unmount();
  });

  it('Transport/auth error: shows mock stream pill and no-data line status', async () => {
    getRuntimeStatus.mockRejectedValue(new Error('Network error'));

    const { unmount } = render(<RuntimeStatusPage />);

    expect(
      await screen.findByText('Runtime not connected · mock preview'),
    ).toBeInTheDocument();
    expect(screen.getByText('⛔ Line is not receiving data.')).toBeInTheDocument();

    unmount();
  });

  it('No data but healthy API: waiting helpers appear for missing components', async () => {
    getRuntimeStatus.mockResolvedValue(
      buildRuntimeStatus({
        jetson_link: null,
        runtime_bridge: null,
      }),
    );

    const { unmount } = render(<RuntimeStatusPage />);

    expect(await screen.findByText('Runtime connected')).toBeInTheDocument();
    expect(screen.getByText('✅ Line is running normally.')).toBeInTheDocument();
    expect(screen.getAllByText('Waiting for first heartbeat.').length).toBeGreaterThanOrEqual(2);

    unmount();
  });
});
