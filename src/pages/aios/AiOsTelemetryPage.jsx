import { useCallback, useEffect, useMemo, useState } from 'react';
import '../../styles/aios.css';
import {
  fetchAgentSummary,
  fetchIncidents,
  fetchMessageEvents,
  fetchReliabilityScores,
  fetchIncidentSpikes,
  fetchTelemetryOverview,
} from '../../api/telemetryClient';

const TIME_RANGE_OPTIONS = [
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 90 days', value: '90d', days: 90 },
];

const SPIKE_WINDOW_PRESETS = {
  '7d': { window_hours: 24, baseline_days: 7 },
  '30d': { window_hours: 48, baseline_days: 14 },
  '90d': { window_hours: 72, baseline_days: 30 },
  default: { window_hours: 24, baseline_days: 7 },
};

function useAsyncData(loader, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    let mounted = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    loader()
      .then((data) => {
        if (mounted) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        console.error(error);
        if (mounted) setState({ data: null, loading: false, error });
      });
    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

function formatMinutes(value) {
  if (value == null) return '—';
  if (value < 60) return `${value} min`;
  const hours = value / 60;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)} hr`;
}

function ReliabilityBadge({ score }) {
  if (score == null) {
    return (
      <span className="aios-reliability-badge is-muted">
        <strong>—</strong>
        <span>Reliability</span>
      </span>
    );
  }
  const level = score >= 85 ? 'high' : score >= 65 ? 'medium' : 'low';
  return (
    <span className={`aios-reliability-badge is-${level}`}>
      <strong>{score}</strong>
      <span>Reliability</span>
    </span>
  );
}

function SpikeIndicator({ spike }) {
  if (!spike) {
    return (
      <span className="aios-spike-indicator" title="Spike data not available for this agent yet.">
        <span className="aios-spike-dot" />
        Stable
      </span>
    );
  }
  const { spike_detected: detected, spike_strength: strength } = spike;
  const title = detected
    ? `Spike detected · strength ${strength}`
    : 'No spike detected in the active window.';
  return (
    <span className={`aios-spike-indicator ${detected ? 'is-active' : ''}`} title={title}>
      <span className="aios-spike-dot" />
      {detected ? 'Spike' : 'Stable'}
    </span>
  );
}

function AgentCard({ agent }) {
  const summary = agent.summary || {};
  const reliability = agent.reliability || {};
  const incidentTypes = Object.entries(summary.incidents || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const tags = Object.entries(summary.tags || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const spike = agent.spike;

  return (
    <div className="dev-card aios-card aios-card--stacked">
      <div className="aios-card-header">
        <div>
          <p className="aios-card-eyebrow">Agent</p>
          <h3 className="aios-card-title">{agent.agent_id}</h3>
          <p className="aios-card-subtitle">
            {summary.event_count || reliability.event_count || 0} events ·{' '}
            {reliability.incident_count ?? Object.values(summary.incidents || {}).reduce((sum, count) => sum + count, 0)} incidents
          </p>
        </div>
        <div className="aios-agent-stats">
          <ReliabilityBadge score={reliability.reliability_score} />
          <SpikeIndicator spike={spike} />
        </div>
      </div>
      <div className="aios-detail-grid">
        <div>
          <div className="aios-detail-label">First event</div>
          <div className="aios-detail-value">{summary.first_event_at || '—'}</div>
        </div>
        <div>
          <div className="aios-detail-label">Last event</div>
          <div className="aios-detail-value">{summary.last_event_at || '—'}</div>
        </div>
        <div>
          <div className="aios-detail-label">Incident rate</div>
          <div className="aios-detail-value">
            {reliability.incident_rate_per_1000_events != null
              ? `${reliability.incident_rate_per_1000_events} / 1k`
              : '—'}
          </div>
        </div>
        <div>
          <div className="aios-detail-label">Avg resolve</div>
          <div className="aios-detail-value">
            {formatMinutes(reliability.avg_resolution_minutes ?? summary.avg_incident_resolution_minutes)}
          </div>
        </div>
      </div>
      <div className="aios-breakdown aios-breakdown--compact">
        <div className="aios-breakdown-item">
          <p className="aios-card-subtitle">Auto detection</p>
          <p className="aios-card-title">
            {reliability.auto_detection_ratio != null
              ? `${Math.round(reliability.auto_detection_ratio * 100)}%`
              : '—'}
          </p>
        </div>
        <div className="aios-breakdown-item">
          <p className="aios-card-subtitle">Spike strength</p>
          <p className="aios-card-title">
            {spike ? spike.spike_strength : '—'}
          </p>
        </div>
        <div className="aios-breakdown-item">
          <p className="aios-card-subtitle">Spike window</p>
          {spike?.window?.recent ? (
            <p className="aios-card-title">
              {spike.window.recent.start.slice(0, 10)} → {spike.window.recent.end.slice(0, 10)}
            </p>
          ) : (
            <p className="aios-card-title">—</p>
          )}
        </div>
      </div>
      <div>
        <div className="aios-detail-label">Incident types</div>
        <ul className="aios-list">
          {!incidentTypes.length && <li>No incident data in this window.</li>}
          {incidentTypes.map(([type, count]) => (
            <li key={`${agent.agent_id}-${type}`}>
              <span className="aios-dot" />
              {type}: {count}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="aios-detail-label">Tag distribution</div>
        <div className="aios-chip-group">
          {!tags.length && <span className="aios-chip">No tags</span>}
          {tags.map(([tag, count]) => (
            <span key={`${agent.agent_id}-${tag}`} className="aios-chip">
              {tag}: {count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TelemetryOverview({
  overview,
  loading,
  totalIncidents,
  timeRangeLabel,
  lowestReliability,
  behaviourAnalyticsHint,
}) {
  const topIncidentTypes = overview?.top_incident_types || [];
  const highestIncidentRate = overview?.agents_with_highest_incident_rate || [];
  const improvements = overview?.agents_with_best_improvement || [];
  const lowestReliabilityAgents = (lowestReliability || []).slice(0, 3);

  return (
    <section className="aios-grid aios-grid--three">
      <div className="dev-card aios-card">
        <p className="aios-card-eyebrow">Incidents this window</p>
        {loading ? (
          <p className="aios-card-subtitle">Loading overview…</p>
        ) : (
          <>
            <div className="aios-highlight">{totalIncidents ?? '—'}</div>
            <p className="aios-card-subtitle">
              {timeRangeLabel}. Lowest reliability:{' '}
              {lowestReliabilityAgents.length ? `${lowestReliabilityAgents[0].agent_id} (${lowestReliabilityAgents[0].reliability_score})` : '—'}
            </p>
          </>
        )}
      </div>

      <div className="dev-card aios-card">
        <p className="aios-card-eyebrow">Top incident types</p>
        <ul className="aios-list">
          {!loading && !topIncidentTypes.length && <li>No incidents recorded.</li>}
          {loading && <li>Gathering incident types…</li>}
          {topIncidentTypes.map((entry) => (
            <li key={entry.incident_type}>
              <span className="aios-dot" />
              {entry.incident_type}: {entry.count}
            </li>
          ))}
        </ul>
      </div>

      <div className="dev-card aios-card">
        <p className="aios-card-eyebrow">Risk spotlight</p>
        <ul className="aios-list">
          {!loading && !highestIncidentRate.length && <li>No risk spikes detected.</li>}
          {loading && <li>Loading agent rates…</li>}
          {highestIncidentRate.map((entry) => (
            <li key={entry.agent_id}>
              <span className="aios-dot" />
              {entry.agent_id}: {entry.incident_rate} / 1k events
            </li>
          ))}
        </ul>
      </div>

      <div className="dev-card aios-card">
        <p className="aios-card-eyebrow">Reliability improvements</p>
        <ul className="aios-list">
          {!loading && !improvements.length && <li>No improvements logged.</li>}
          {loading && <li>Reviewing incident deltas…</li>}
          {improvements.map((entry) => (
            <li key={entry.agent_id}>
              <span className="aios-dot" />
              {entry.agent_id}: −{entry.improvement} incidents
            </li>
          ))}
        </ul>
      </div>

      <div className="dev-card aios-card">
        <p className="aios-card-eyebrow">Lowest reliability agents</p>
        <ul className="aios-list">
          {!loading && !lowestReliabilityAgents.length && <li>No telemetry yet.</li>}
          {loading && <li>Waiting for reliability scores…</li>}
          {lowestReliabilityAgents.map((entry) => (
            <li key={entry.agent_id}>
              <span className="aios-dot" />
              {entry.agent_id}: {entry.reliability_score}
            </li>
          ))}
        </ul>
      </div>

      <div className="dev-card aios-card">
        <p className="aios-card-eyebrow">Behaviour analytics</p>
        <p className="aios-card-title">
          {behaviourAnalyticsHint?.lastRun || 'Waiting for run'}
        </p>
        <p className="aios-card-subtitle">
          {behaviourAnalyticsHint?.summary
            || 'CoreAgent can trigger BehaviourAnalyticsAgent to scan telemetry and emit follow-up tasks.'}
        </p>
      </div>
    </section>
  );
}

function IncidentTable({ incidents, onSelect, selectedId }) {
  return (
    <div className="aios-table-lite">
      <div className="aios-table-lite-header">
        <span>ID</span>
        <span>Type</span>
        <span>Severity</span>
        <span>Status</span>
        <span>Originator</span>
      </div>
      {incidents.map((incident) => (
        <button
          key={incident.incident_id}
          type="button"
          className={`aios-table-lite-row ${selectedId === incident.incident_id ? 'is-active' : ''}`}
          onClick={() => onSelect(incident)}
        >
          <span>{incident.incident_id}</span>
          <span>{incident.incident_type}</span>
          <span>
            <span className={`aios-status-chip status-${incident.severity}`}>
              {incident.severity}
            </span>
          </span>
          <span>{incident.resolution_status}</span>
          <span>{incident.originator?.id}</span>
        </button>
      ))}
      {!incidents.length && (
        <div className="aios-card-subtitle" style={{ padding: '0.8rem 0' }}>
          No incidents found for the current filters.
        </div>
      )}
    </div>
  );
}

function IncidentDetail({ incident }) {
  if (!incident) {
    return (
      <div className="dev-card aios-card">
        <p className="aios-card-subtitle">Select an incident to see details.</p>
      </div>
    );
  }
  return (
    <div className="dev-card aios-card aios-card--stacked">
      <div className="aios-card-header">
        <div>
          <h3 className="aios-card-title">{incident.incident_id}</h3>
          <p className="aios-card-subtitle">{incident.incident_type}</p>
        </div>
        <span className={`aios-status-chip status-${incident.severity}`}>
          {incident.severity}
        </span>
      </div>
      <div className="aios-detail-grid">
        <div>
          <div className="aios-detail-label">Status</div>
          <div className="aios-detail-value">{incident.resolution_status}</div>
        </div>
        <div>
          <div className="aios-detail-label">Created</div>
          <div className="aios-detail-value">{incident.created_at}</div>
        </div>
        <div>
          <div className="aios-detail-label">Resolved</div>
          <div className="aios-detail-value">{incident.resolved_at || '—'}</div>
        </div>
      </div>
      <div>
        <div className="aios-detail-label">Originator / Detected by</div>
        <div className="aios-detail-value">
          {incident.originator?.id} → {incident.detected_by?.id}
        </div>
      </div>
      <div>
        <div className="aios-detail-label">Symptoms</div>
        <ul className="aios-list">
          {(incident.symptoms || []).map((symptom) => (
            <li key={symptom}>
              <span className="aios-dot" />
              {symptom}
            </li>
          ))}
          {(!incident.symptoms || incident.symptoms.length === 0) && <li>No symptoms recorded.</li>}
        </ul>
      </div>
      {incident.root_cause_summary && (
        <div>
          <div className="aios-detail-label">Root cause</div>
          <p>{incident.root_cause_summary}</p>
        </div>
      )}
      {incident.corrective_action && (
        <div>
          <div className="aios-detail-label">Corrective action</div>
          <p>{incident.corrective_action}</p>
        </div>
      )}
      {incident.message_refs?.length ? (
        <div>
          <div className="aios-detail-label">Message refs</div>
          <div className="aios-chip-group">
            {incident.message_refs.map((msg) => (
              <span key={msg} className="aios-chip">
                {msg}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TimelineExplorer() {
  const [query, setQuery] = useState({ correlation_key: 'agent_task_id', correlation_value: '' });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = useCallback(async () => {
    if (!query.correlation_value) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMessageEvents(query);
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="dev-card aios-card aios-card--stacked">
      <div className="aios-card-header">
        <div>
          <h3 className="aios-card-title">Timeline Explorer</h3>
          <p className="aios-card-subtitle">
            Reconstruct message sequences for a given task, incident, or decision ID.
          </p>
        </div>
      </div>
      <div className="aios-two-column">
        <div className="aios-column">
          <label className="aios-filter-field">
            <span>Correlation key</span>
            <select
              value={query.correlation_key}
              onChange={(event) => setQuery((prev) => ({
                ...prev,
                correlation_key: event.target.value,
              }))}
            >
              <option value="agent_task_id">agent_task_id</option>
              <option value="incident_id">incident_id</option>
              <option value="decision_id">decision_id</option>
            </select>
          </label>
        </div>
        <div className="aios-column">
          <label className="aios-filter-field">
            <span>Correlation value</span>
            <input
              type="text"
              value={query.correlation_value}
              onChange={(event) => setQuery((prev) => ({
                ...prev,
                correlation_value: event.target.value,
              }))}
              placeholder="ATP-2025-010"
            />
          </label>
        </div>
      </div>
      <button
        type="button"
        className="aios-primary-btn"
        onClick={handleSearch}
        disabled={!query.correlation_value || loading}
      >
        {loading ? 'Loading…' : 'Load timeline'}
      </button>
      {error && <p className="aios-card-subtitle">Unable to load events – check backend.</p>}
      <div className="aios-card aios-card--stacked" style={{ background: 'var(--dev-bg-soft)' }}>
        {events.length === 0 && !loading && (
          <p className="aios-card-subtitle">No events yet. Enter an ID and search.</p>
        )}
        <ul className="aios-list">
          {events.map((event) => (
            <li key={event.message_id} style={{ alignItems: 'flex-start', flexDirection: 'column' }}>
              <div>
                <strong>{event.timestamp_utc}</strong> · {event.author?.id} ({event.channel})
              </div>
              <div>{event.content_summary}</div>
              {event.tags?.length ? (
                <div className="aios-chip-group">
                  {event.tags.map((tag) => (
                    <span key={`${event.message_id}-${tag}`} className="aios-chip">{tag}</span>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function AiOsTelemetryPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [showSpikesOnly, setShowSpikesOnly] = useState(false);
  const [incidentFilters, setIncidentFilters] = useState({
    incident_type: '',
    severity: '',
    status: '',
  });
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);

  const timeParams = useMemo(() => {
    const now = new Date();
    const end = now.toISOString();
    const option = TIME_RANGE_OPTIONS.find((entry) => entry.value === timeRange) || TIME_RANGE_OPTIONS[0];
    const start = new Date(now.getTime() - option.days * 24 * 60 * 60 * 1000).toISOString();
    return { start_time: start, end_time: end, label: option.label };
  }, [timeRange]);

  const spikePreset = SPIKE_WINDOW_PRESETS[timeRange] || SPIKE_WINDOW_PRESETS.default;

  const agentSummaryState = useAsyncData(
    () => fetchAgentSummary({ start_time: timeParams.start_time, end_time: timeParams.end_time }),
    [timeParams.start_time, timeParams.end_time],
  );

  const reliabilityState = useAsyncData(
    () => fetchReliabilityScores({ start_time: timeParams.start_time, end_time: timeParams.end_time }),
    [timeParams.start_time, timeParams.end_time],
  );

  const spikesState = useAsyncData(
    () => fetchIncidentSpikes({
      end_time: timeParams.end_time,
      window_hours: spikePreset.window_hours,
      baseline_days: spikePreset.baseline_days,
    }),
    [timeParams.end_time, timeRange],
  );

  const overviewState = useAsyncData(
    () => fetchTelemetryOverview({ start_time: timeParams.start_time, end_time: timeParams.end_time }),
    [timeParams.start_time, timeParams.end_time],
  );

  const incidentsState = useAsyncData(
    () => fetchIncidents({
      ...incidentFilters,
      start_time: timeParams.start_time,
      end_time: timeParams.end_time,
    }),
    [
      incidentFilters.incident_type,
      incidentFilters.severity,
      incidentFilters.status,
      timeParams.start_time,
      timeParams.end_time,
    ],
  );

  const agentCards = useMemo(() => {
    const summary = agentSummaryState.data || [];
    const reliability = reliabilityState.data || [];
    const spikes = spikesState.data || [];

    const summaryMap = new Map(summary.map((agent) => [agent.agent_id, agent]));
    const reliabilityMap = new Map(reliability.map((agent) => [agent.agent_id, agent]));
    const spikesMap = new Map(spikes.map((entry) => [entry.agent_id, entry]));

    const agentIds = new Set([
      ...summaryMap.keys(),
      ...reliabilityMap.keys(),
      ...spikesMap.keys(),
    ]);

    let combined = Array.from(agentIds).map((agentId) => ({
      agent_id: agentId,
      summary: summaryMap.get(agentId),
      reliability: reliabilityMap.get(agentId),
      spike: spikesMap.get(agentId),
    }));

    if (showSpikesOnly) {
      combined = combined.filter((entry) => entry.spike?.spike_detected);
    }

    return combined.sort((a, b) => {
      const aScore = a.reliability?.reliability_score ?? 0;
      const bScore = b.reliability?.reliability_score ?? 0;
      return aScore - bScore;
    });
  }, [
    agentSummaryState.data,
    reliabilityState.data,
    spikesState.data,
    showSpikesOnly,
  ]);

  const activeSpikesCount = useMemo(
    () => (spikesState.data || []).filter((entry) => entry.spike_detected).length,
    [spikesState.data],
  );

  const incidents = useMemo(
    () => incidentsState.data || [],
    [incidentsState.data],
  );
  const selectedIncident = useMemo(() => {
    if (!incidents.length) return null;
    if (selectedIncidentId) {
      const match = incidents.find((incident) => incident.incident_id === selectedIncidentId);
      if (match) return match;
    }
    return incidents[0];
  }, [incidents, selectedIncidentId]);

  const totalIncidents = useMemo(() => {
    const snapshot = overviewState.data?.reliability_snapshot || [];
    if (!snapshot.length) return null;
    return snapshot.reduce((sum, entry) => sum + (entry.incident_count || 0), 0);
  }, [overviewState.data]);

  const lowestReliability = useMemo(() => {
    const list = [...(reliabilityState.data || [])];
    return list.sort((a, b) => a.reliability_score - b.reliability_score);
  }, [reliabilityState.data]);

  const behaviourAnalyticsHint = useMemo(() => {
    const meta = overviewState.data?.behaviour_analytics || null;
    return {
      lastRun: meta?.last_run_at || 'Awaiting BehaviourAnalyticsAgent run',
      summary: meta?.summary || 'CoreAgent can trigger BehaviourAnalyticsAgent to analyse telemetry and emit follow-up tasks.',
    };
  }, [overviewState.data]);

  return (
    <div className="aios-page aios-logs-page">
      <div className="dev-card aios-card aios-card--stacked">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">Telemetry & Behaviour</h2>
            <p className="aios-card-subtitle">
              Monitor message events, incidents, reliability, and task timelines across AI OS agents.
            </p>
          </div>
          <div className="aios-chip-group">
            {TIME_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`aios-chip ${timeRange === option.value ? 'is-active' : ''}`}
                onClick={() => setTimeRange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="aios-chip-row">
          <button
            type="button"
            className={`aios-chip ${showSpikesOnly ? 'is-active' : ''}`}
            onClick={() => setShowSpikesOnly((prev) => !prev)}
          >
            Show agents with active spikes ({activeSpikesCount})
          </button>
          <p className="aios-card-subtitle">
            Spike window: {spikePreset.window_hours}h recent vs {spikePreset.baseline_days}d baseline.
          </p>
        </div>
      </div>

      {overviewState.error ? (
        <div className="dev-card aios-card">
          <p className="aios-card-subtitle">
            Failed to load telemetry overview. Ensure <code>/api/telemetry/analytics/overview</code> is reachable.
          </p>
        </div>
      ) : (
        <TelemetryOverview
          overview={overviewState.data}
          loading={overviewState.loading}
          totalIncidents={totalIncidents}
          timeRangeLabel={timeParams.label}
          lowestReliability={lowestReliability}
          behaviourAnalyticsHint={behaviourAnalyticsHint}
        />
      )}

      {(agentSummaryState.error || reliabilityState.error || spikesState.error) && (
        <div className="dev-card aios-card">
          <p className="aios-card-subtitle">
            Agent metric calls failed. Check <code>/api/telemetry/summary/agents</code>,{' '}
            <code>/api/telemetry/reliability/agents</code>, and <code>/api/telemetry/incidents/spikes</code>.
          </p>
        </div>
      )}

      <section className="aios-grid aios-grid--two">
        {agentCards.map((agent) => (
          <AgentCard key={agent.agent_id} agent={agent} />
        ))}
        {!agentCards.length && (
          <div className="dev-card aios-card">
            <p className="aios-card-subtitle">
              {agentSummaryState.loading || reliabilityState.loading
                ? 'Loading agent telemetry…'
                : 'No telemetry data yet for this range.'}
            </p>
          </div>
        )}
      </section>

      <section className="aios-two-column">
        <div className="aios-column">
          <div className="dev-card aios-card aios-card--stacked">
            <div className="aios-card-header">
              <div>
                <h3 className="aios-card-title">Incident Dashboard</h3>
                <p className="aios-card-subtitle">Filter behaviour incidents by type, severity, status.</p>
              </div>
            </div>
            <div className="aios-filter-bar">
              <label className="aios-filter-field">
                <span>Type</span>
                <input
                  type="text"
                  value={incidentFilters.incident_type}
                  onChange={(event) => setIncidentFilters((prev) => ({
                    ...prev,
                    incident_type: event.target.value,
                  }))}
                  placeholder="UPDATE_PROTOCOL_VIOLATION"
                />
              </label>
              <label className="aios-filter-field">
                <span>Severity</span>
                <select
                  value={incidentFilters.severity}
                  onChange={(event) => setIncidentFilters((prev) => ({
                    ...prev,
                    severity: event.target.value,
                  }))}
                >
                  <option value="">All</option>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </select>
              </label>
              <label className="aios-filter-field">
                <span>Status</span>
                <select
                  value={incidentFilters.status}
                  onChange={(event) => setIncidentFilters((prev) => ({
                    ...prev,
                    status: event.target.value,
                  }))}
                >
                  <option value="">All</option>
                  <option value="pending">pending</option>
                  <option value="in_progress">in_progress</option>
                  <option value="resolved">resolved</option>
                </select>
              </label>
            </div>
            {incidentsState.loading && <p className="aios-card-subtitle">Loading incidents…</p>}
            {incidentsState.error && (
              <p className="aios-card-subtitle">
                Failed to load incidents. Ensure <code>/api/telemetry/incidents</code> accepts current filters.
              </p>
            )}
            {!incidentsState.loading && incidentsState.data && (
              <IncidentTable
                incidents={incidents}
                onSelect={(incident) => setSelectedIncidentId(incident.incident_id)}
                selectedId={selectedIncident?.incident_id}
              />
            )}
          </div>
        </div>
        <div className="aios-column">
          <IncidentDetail incident={selectedIncident} />
        </div>
      </section>

      <TimelineExplorer />

      <div className="aios-card aios-card--stacked" style={{ background: 'var(--dev-bg-soft)' }}>
        <h3 className="aios-card-title">Developer notes</h3>
        <ul className="aios-list">
          <li>
            <span className="aios-dot" />
            Agent metrics combine <code>/api/telemetry/summary/agents</code> (events/tags) +
            <code>/api/telemetry/reliability/agents</code> (scores, incident rates).
          </li>
          <li>
            <span className="aios-dot" />
            Spike detection uses <code>/api/telemetry/incidents/spikes</code>. Toggle filters client-side to spotlight agents in alert state.
          </li>
          <li>
            <span className="aios-dot" />
            Overview cards read <code>/api/telemetry/analytics/overview</code>; future BehaviourAnalyticsAgent runs can populate <code>behaviour_analytics</code> metadata.
          </li>
          <li>
            <span className="aios-dot" />
            Incident dashboard queries <code>/api/telemetry/incidents</code> with current filters; timeline explorer calls <code>/api/telemetry/message-events</code> keyed by correlation IDs.
          </li>
          <li>
            <span className="aios-dot" />
            Reliability badges expect server-side scoring; the UI intentionally avoids local math to keep parity with backend config.
          </li>
        </ul>
      </div>
    </div>
  );
}
