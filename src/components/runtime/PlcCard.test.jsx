import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlcCard from './PlcCard.jsx';

function buildPlc(overrides = {}) {
  return {
    mode: 'stub',
    notes: 'Stub PLC for dev/bring-up.',
    metrics_summary: {
      has_data: true,
      last_heartbeat_at: '2025-01-01T00:00:00Z',
      age_s: 5,
      healthy: true,
      raw: {
        stats: {
          picks_seen: 7,
          posts: 3,
          gated_lines: 2,
          skips_no_chute: 1,
        },
      },
    },
    ...overrides,
  };
}

describe('PlcCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:05Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders healthy metrics with stats', () => {
    render(<PlcCard plc={buildPlc()} />);
    expect(screen.getByText('PLC')).toBeInTheDocument();
    expect(screen.getByLabelText('PLC mode')).toHaveTextContent('STUB');
    expect(screen.getByLabelText('PLC health')).toHaveTextContent('Healthy');
    expect(screen.getByText('Last heartbeat:')).toBeInTheDocument();
    expect(screen.getByText('5s ago')).toBeInTheDocument();
    expect(screen.getByText('2025-01-01T00:00:00Z')).toBeInTheDocument();

    expect(screen.getByText('Picks seen')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Posts sent')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders stale metrics when healthy=false', () => {
    const plc = buildPlc({
      metrics_summary: {
        ...buildPlc().metrics_summary,
        healthy: false,
      },
    });
    render(<PlcCard plc={plc} />);
    expect(screen.getByLabelText('PLC health')).toHaveTextContent('Stale');
    expect(screen.getByText('5s ago')).toBeInTheDocument();
  });

  it('renders no-data state when has_data=false or summary missing', () => {
    render(<PlcCard plc={buildPlc({ metrics_summary: { has_data: false } })} />);
    expect(screen.getByLabelText('PLC health')).toHaveTextContent('No data');
    expect(screen.getByText('No PLC metrics received yet.')).toBeInTheDocument();
    expect(screen.getByText('Try running the PLC stub or scenario runner.')).toBeInTheDocument();
  });

  it('renders backend error state', () => {
    render(<PlcCard plc={buildPlc()} error="Invalid debug token" />);
    expect(screen.getByText('PLC status unavailable (backend error).')).toBeInTheDocument();
  });
});
