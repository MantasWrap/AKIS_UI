import { useCallback, useEffect, useMemo, useState } from 'react';
import '../../styles/aios.css';
import { fetchAgentSummary, fetchIncidents, fetchMessageEvents } from '../../api/telemetryClient';

const TIME_RANGE_OPTIONS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
];

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

function AgentCard({ agent }) {
  const incidentTypes = agent.incidents || {};
  const tags = agent.tags || {};
  return (
    <div className="dev-card aios-card aios-card--stacked">
      <div className="aios-card-header">
        <div>
          <h3 className="aios-card-title">{agent.agent_id}</h3>
          <p className="aios-card-subtitle">
            Events: {agent.event_count || 0}
          </p>
        </div>
        <span className="aios-tag">Telemetry</span>
      </div>
      <div className="aios-detail-grid">
        <div>
          <div className="aios-detail-label">First event</div>
          <div className="aios-detail-value">{agent.first_event_at || '—'}</div>
        </div>
        <div>
          <div className="aios-detail-label">Last event</div>
          <div className="aios-detail-value">{agent.last_event_at || '—'}</div>
        </div>
        <div>
          <div className="aios-detail-label">Avg resolve</div>
          <div className="aios-detail-value">
            {agent.avg_incident_resolution_minutes != null
              ? `${agent.avg_incident_resolution_minutes} min`
              : '—'}
          </div>
        </div>
      </div>
      <div>
        <div className="aios-detail-label">Incident types</div>
        <ul className="aios-list">
          {Object.keys(incidentTypes).length === 0 && <li>No incidents</li>}
          {Object.entries(incidentTypes).map(([type, count]) => (
            <li key={type}>
              <span className="aios-dot" />
              {type}: {count}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="aios-detail-label">Tag distribution</div>
        <div className="aios-chip-group">
          {Object.entries(tags).map(([tag, count]) => (
            <span key={tag} className="aios-chip">
              {tag}: {count}
            </span>
          ))}
          {Object.keys(tags).length === 0 && <span className="aios-chip">No tags</span>}
        </div>
      </div>
    </div>
  );
}

function IncidentTable({ incidents, onSelect }) {
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
          className="aios-table-lite-row"
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
      <div className="aios-card-subtitle">Select an incident to see details.</div>
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
            Reconstruct message sequences for a given task or incident ID.
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
        {loading ? 'Loading...' : 'Load timeline'}
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
  const [incidentFilters, setIncidentFilters] = useState({
    incident_type: '',
    severity: '',
    status: '',
  });
  const [selectedIncident, setSelectedIncident] = useState(null);

  const timeParams = useMemo(() => {
    const now = new Date();
    const end = now.toISOString();
    const rangeMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };
    const days = rangeMap[timeRange] || 7;
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    return { start_time: start, end_time: end };
  }, [timeRange]);

  const agentSummaryState = useAsyncData(
    () => fetchAgentSummary(timeParams),
    [timeParams.start_time, timeParams.end_time],
  );

  const incidentsState = useAsyncData(
    () => fetchIncidents({
      ...incidentFilters,
      start_time: timeParams.start_time,
      end_time: timeParams.end_time,
    }),
    [incidentFilters.incident_type, incidentFilters.severity, incidentFilters.status, timeParams.start_time, timeParams.end_time],
  );

  useEffect(() => {
    if (incidentsState.data && incidentsState.data.length) {
      setSelectedIncident((prev) => prev || incidentsState.data[0]);
    }
  }, [incidentsState.data]);

  return (
    <div className="aios-page aios-logs-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">Telemetry & Behaviour</h2>
            <p className="aios-card-subtitle">
              Monitor message events, incidents, and timelines for AI OS agents.
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
      </div>

      <section className="aios-grid aios-grid--two">
        {agentSummaryState.loading && <div className="aios-card">Loading agent metrics…</div>}
        {agentSummaryState.error && (
          <div className="aios-card">
            <p className="aios-card-subtitle">Failed to load agent summary. Ensure `/api/telemetry/summary/agents` is available.</p>
          </div>
        )}
        {(agentSummaryState.data || []).map((agent) => (
          <AgentCard key={agent.agent_id} agent={agent} />
        ))}
        {!agentSummaryState.loading && agentSummaryState.data?.length === 0 && (
          <div className="aios-card">
            <p className="aios-card-subtitle">No telemetry data yet for this range.</p>
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
            {incidentsState.error && <p className="aios-card-subtitle">Failed to load incidents.</p>}
            {!incidentsState.loading && incidentsState.data && (
              <IncidentTable incidents={incidentsState.data} onSelect={setSelectedIncident} />
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
          <li><span className="aios-dot" />Agent metrics use <code>/api/telemetry/summary/agents?start_time=&amp;end_time=</code>. Expected shape: <code>{{agent_id, event_count, tags, incidents, avg_incident_resolution_minutes}}</code>.</li>
          <li><span className="aios-dot" />Incidents list uses <code>/api/telemetry/incidents</code> with filters (`incident_type`, `severity`, `status`, `start_time`, `end_time`).</li>
          <li><span className="aios-dot" />Timeline explorer calls <code>/api/telemetry/message-events?correlation_key=&amp;correlation_value=</code> to reconstruct sequences for tasks or incidents.</li>
          <li><span className="aios-dot" />Future enhancements: chart visualisations for event rates, incident clustering by severity, deep links into Agent Task Pipeline / Decision Log once Dev Console routing is finalised.</li>
        </ul>
      </div>
    </div>
  );
}
