import { useEffect, useMemo, useState } from 'react';
import '../styles/devDashboard.css';

// NOTE: Deprecated: owner overview now lives on ProgressPage.
import {
  getProgressSummary,
  getProgressTimeline,
  getTelemetrySummaryAgents,
  getTelemetrySummaryIncidents,
  getTelemetryReliabilityAgents,
  getTelemetryAnalyticsOverview,
  getTelemetryAnalyticsForAgent,
} from '../api/client';

function formatDateLabel(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
  });
}

function computeChecklistStats(summary) {
  if (!summary) return null;
  const { activePhaseId, phases } = summary;
  if (!activePhaseId || !Array.isArray(phases)) return null;
  const phase = phases.find((p) => p.phaseId === activePhaseId) || phases[0];
  if (!phase || !phase.checklist) return null;

  const completed = Number(phase.checklist.completed || 0);
  const total = Number(phase.checklist.total || 0);
  const openItems =
    Array.isArray(phase.checklist.openItems) && phase.checklist.openItems.length > 0
      ? phase.checklist.openItems.length
      : Math.max(total - completed, 0);

  const percent =
    typeof phase.checklist.percent === 'number'
      ? phase.checklist.percent
      : total > 0
        ? Math.round((completed / total) * 100)
        : 0;

  return {
    phaseName: phase.name || summary.activePhase || 'Current phase',
    completed,
    total,
    openItems,
    percent,
  };
}

function computeReliabilityLabel(score) {
  if (score == null) return { label: 'Not enough data yet', tone: 'unknown' };
  if (score >= 80) return { label: 'Stable', tone: 'ok' };
  if (score >= 50) return { label: 'Watch', tone: 'warn' };
  return { label: 'Needs attention', tone: 'error' };
}

export default function OwnerHomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [agentSummary, setAgentSummary] = useState(null);
  const [incidentSummary, setIncidentSummary] = useState(null);
  const [reliabilitySummary, setReliabilitySummary] = useState(null);
  const [analyticsOverview, setAnalyticsOverview] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [selectedAgentAnalytics, setSelectedAgentAnalytics] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const requestOptions = refreshKey > 0 ? { fresh: true } : {};

        const [
          summaryData,
          timelineData,
          agentsSummaryData,
          incidentsSummaryData,
          reliabilityData,
          analyticsData,
        ] = await Promise.all([
          getProgressSummary(requestOptions),
          getProgressTimeline({ ...requestOptions, limit: 10 }),
          getTelemetrySummaryAgents(requestOptions),
          getTelemetrySummaryIncidents(requestOptions),
          getTelemetryReliabilityAgents(requestOptions),
          getTelemetryAnalyticsOverview(requestOptions),
        ]);

        if (isCancelled) {
          return;
        }

        if (summaryData && summaryData.ok === false) {
          setError((prev) => prev || `Could not load progress summary: ${summaryData.error}`);
        } else if (summaryData) {
          const data = summaryData.data || summaryData;
          setSummary(data);
        }

        if (timelineData && timelineData.ok === false) {
          setError((prev) => prev || `Could not load progress timeline: ${timelineData.error}`);
        } else if (timelineData) {
          const entries = Array.isArray(timelineData.entries)
            ? timelineData.entries
            : Array.isArray(timelineData)
              ? timelineData
              : [];
          setTimeline(entries);
        }

        if (agentsSummaryData && agentsSummaryData.error) {
          setError((prev) => prev || `Could not load agent telemetry: ${agentsSummaryData.error}`);
        } else if (agentsSummaryData) {
          setAgentSummary(agentsSummaryData);
        }

        if (incidentsSummaryData && incidentsSummaryData.error) {
          setError((prev) => prev || `Could not load incident summary: ${incidentsSummaryData.error}`);
        } else if (incidentsSummaryData) {
          setIncidentSummary(incidentsSummaryData);
        }

        if (reliabilityData && reliabilityData.error) {
          setError((prev) => prev || `Could not load reliability data: ${reliabilityData.error}`);
        } else if (reliabilityData) {
          setReliabilitySummary(reliabilityData);
        }

        if (analyticsData && analyticsData.error) {
          setError((prev) => prev || `Could not load analytics overview: ${analyticsData.error}`);
        } else if (analyticsData) {
          setAnalyticsOverview(analyticsData);
        }
      } catch (err) {
        console.error('Failed to load owner home data', err);
        if (!isCancelled) {
          setError('Failed to load owner home data. Check console or try again later.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    let isCancelled = false;

    async function loadAgentAnalytics() {
      if (!selectedAgentId) {
        setSelectedAgentAnalytics(null);
        return;
      }

      try {
        const data = await getTelemetryAnalyticsForAgent(selectedAgentId, {});
        if (isCancelled) return;

        if (data && data.error) {
          setSelectedAgentAnalytics(null);
          return;
        }

        setSelectedAgentAnalytics(data || null);
      } catch (err) {
        console.warn('Failed to load agent analytics', err);
        if (!isCancelled) {
          setSelectedAgentAnalytics(null);
        }
      }
    }

    loadAgentAnalytics();

    return () => {
      isCancelled = true;
    };
  }, [selectedAgentId]);

  const checklistStats = useMemo(() => computeChecklistStats(summary), [summary]);

  const overallReliability = useMemo(() => {
    const agents = (reliabilitySummary && reliabilitySummary.agents) || [];
    if (!agents.length) return null;
    const scores = agents
      .map((a) => (typeof a.reliability_score === 'number' ? a.reliability_score : null))
      .filter((v) => v != null);
    if (!scores.length) return null;
    const avg = scores.reduce((sum, v) => sum + v, 0) / scores.length;
    return computeReliabilityLabel(Math.round(avg));
  }, [reliabilitySummary]);

  const incidentsTotal = useMemo(() => {
    if (!incidentSummary || !incidentSummary.incidents) return 0;
    return Object.values(incidentSummary.incidents).reduce(
      (sum, value) => sum + (Number(value) || 0),
      0,
    );
  }, [incidentSummary]);

  const topIncidentTypes =
    analyticsOverview && Array.isArray(analyticsOverview.top_incident_types)
      ? analyticsOverview.top_incident_types
      : [];

  const agentsWithHighestIncidentRate =
    analyticsOverview && Array.isArray(analyticsOverview.agents_with_highest_incident_rate)
      ? analyticsOverview.agents_with_highest_incident_rate
      : [];

  const reliabilitySnapshot =
    analyticsOverview && Array.isArray(analyticsOverview.reliability_snapshot)
      ? analyticsOverview.reliability_snapshot
      : (reliabilitySummary && Array.isArray(reliabilitySummary.agents)
          ? reliabilitySummary.agents
          : []);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSelectAgent = (agentId) => {
    setSelectedAgentId(agentId);
  };

  return (
    <div className="dev-dashboard-page">
      <header className="dev-dashboard-card">
        <div className="dev-dashboard-card-header">
          <div>
            <h1 className="dev-card-title">Owner home</h1>
            <p className="dev-card-subtitle">
              High-level view of where we are, what changed, and which agents need attention.
            </p>
          </div>
          <div className="dev-dashboard-header-actions">
            <button
              type="button"
              className="dev-dashboard-refresh-btn"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>
        {error && (
          <div className="dev-dashboard-alert dev-dashboard-alert-error">
            <p>{error}</p>
          </div>
        )}
      </header>

      <section className="dev-dashboard-grid">
        <article className="dev-dashboard-card">
          <header className="dev-dashboard-card-header">
            <div>
              <h2 className="dev-card-title">Current phase</h2>
              <p className="dev-card-subtitle">
                Snapshot of the main phase and checklist items.
              </p>
            </div>
          </header>
          {loading && !summary && (
            <p className="dev-dashboard-placeholder">Loading current phase…</p>
          )}
          {!loading && !summary && !error && (
            <p className="dev-dashboard-placeholder">
              Owner overview is not available yet. Progress summary has not been generated.
            </p>
          )}
          {summary && checklistStats && (
            <div className="dev-dashboard-pill-row">
              <div className="dev-dashboard-pill">
                <div className="pill-label">Phase</div>
                <div className="pill-value">{checklistStats.phaseName}</div>
                <p className="pill-description">
                  Updated {formatDateLabel(summary.generatedAt)}.
                </p>
              </div>
              <div className="dev-dashboard-pill">
                <div className="pill-label">Checklist</div>
                <div className="pill-value">
                  {checklistStats.completed} / {checklistStats.total}
                </div>
                <p className="pill-description">
                  {checklistStats.openItems} open items · {checklistStats.percent}% done
                </p>
              </div>
              {summary.plugPlay && typeof summary.plugPlay.percent === 'number' && (
                <div className="dev-dashboard-pill">
                  <div className="pill-label">Plug &amp; play</div>
                  <div className="pill-value">{summary.plugPlay.percent}% ready</div>
                  <p className="pill-description">
                    {summary.plugPlay.eta
                      ? `ETA ${formatShortDate(summary.plugPlay.eta)}`
                      : 'ETA not set yet.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </article>

        <article className="dev-dashboard-card">
          <header className="dev-dashboard-card-header">
            <div>
              <h2 className="dev-card-title">Recent progress</h2>
              <p className="dev-card-subtitle">
                Recent changes across backend, frontend, docs, runtime, and PLC.
              </p>
            </div>
          </header>
          {loading && !timeline.length && (
            <p className="dev-dashboard-placeholder">Loading recent progress…</p>
          )}
          {!loading && (!timeline || timeline.length === 0) && !error && (
            <p className="dev-dashboard-placeholder">
              No progress entries yet for this window.
            </p>
          )}
          {timeline && timeline.length > 0 && (
            <ul className="dev-dashboard-timeline">
              {timeline.slice(0, 8).map((entry) => (
                <li key={entry.id || `${entry.date}-${entry.title}`}>
                  <div className="timeline-row">
                    <div className="timeline-main">
                      <div className="timeline-title-row">
                        <span className="timeline-title">{entry.title || 'Work item'}</span>
                        {entry.topic && (
                          <span className="timeline-topic-chip">{entry.topic}</span>
                        )}
                      </div>
                      {entry.summary && (
                        <p className="timeline-summary">{entry.summary}</p>
                      )}
                    </div>
                    <div className="timeline-meta">
                      {entry.date && (
                        <span className="timeline-date">{entry.date}</span>
                      )}
                      {entry.dev && (
                        <span className="timeline-dev">{entry.dev}</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="dev-dashboard-card">
          <header className="dev-dashboard-card-header">
            <div>
              <h2 className="dev-card-title">Incidents &amp; reliability</h2>
              <p className="dev-card-subtitle">
                Quick snapshot of incidents and which agents should be watched.
              </p>
            </div>
          </header>

          {loading && !agentSummary && !incidentSummary && !reliabilitySummary && (
            <p className="dev-dashboard-placeholder">Loading incidents &amp; reliability…</p>
          )}

          {!loading &&
            !agentSummary &&
            !incidentSummary &&
            !reliabilitySummary &&
            !analyticsOverview &&
            !error && (
              <p className="dev-dashboard-placeholder">
                No telemetry data available yet. System has not recorded agent events.
              </p>
            )}

          <div className="dev-dashboard-pill-row">
            <div className="dev-dashboard-pill">
              <div className="pill-label">Overall reliability</div>
              <div className="pill-value">
                {overallReliability ? overallReliability.label : 'Not enough data'}
              </div>
              <p className="pill-description">
                {incidentsTotal > 0
                  ? `${incidentsTotal} incident${incidentsTotal === 1 ? '' : 's'} in this window.`
                  : 'No incidents recorded in this window.'}
              </p>
            </div>
            <div className="dev-dashboard-pill">
              <div className="pill-label">Top incident type</div>
              <div className="pill-value">
                {topIncidentTypes.length > 0
                  ? topIncidentTypes[0].incident_type
                  : 'None recorded'}
              </div>
              <p className="pill-description">
                {topIncidentTypes.length > 0
                  ? `${topIncidentTypes[0].count} events`
                  : 'No incident types in this window.'}
              </p>
            </div>
          </div>

          {agentsWithHighestIncidentRate.length > 0 && (
            <div className="dev-dashboard-subsection">
              <h3 className="dev-card-subtitle">Agents with highest incident rate</h3>
              <table className="dev-dashboard-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Incident rate</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {agentsWithHighestIncidentRate.map((row) => (
                    <tr key={row.agent_id}>
                      <td>{row.agent_id}</td>
                      <td>{row.incident_rate != null ? `${row.incident_rate}%` : '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="dev-dashboard-link-button"
                          onClick={() => handleSelectAgent(row.agent_id)}
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reliabilitySnapshot && reliabilitySnapshot.length > 0 && (
            <div className="dev-dashboard-subsection">
              <h3 className="dev-card-subtitle">Reliability snapshot by agent</h3>
              <table className="dev-dashboard-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Reliability</th>
                    <th>Events</th>
                    <th>Incidents</th>
                  </tr>
                </thead>
                <tbody>
                  {reliabilitySnapshot.map((agent) => (
                    <tr key={agent.agent_id}>
                      <td>{agent.agent_id}</td>
                      <td>
                        {agent.reliability_score != null
                          ? `${agent.reliability_score}`
                          : '—'}
                      </td>
                      <td>{agent.event_count != null ? agent.event_count : '—'}</td>
                      <td>{agent.incident_count != null ? agent.incident_count : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedAgentId && selectedAgentAnalytics && (
            <div className="dev-dashboard-subsection">
              <h3 className="dev-card-subtitle">
                {selectedAgentId} – details
              </h3>
              <p className="dev-dashboard-footnote">
                Simple, read-only view using <code>/api/telemetry/analytics/agent/{'{agentId}'}</code>.
              </p>
              <div className="dev-dashboard-pill-row">
                <div className="dev-dashboard-pill">
                  <div className="pill-label">Incidents</div>
                  <div className="pill-value">
                    {selectedAgentAnalytics.incident_count != null
                      ? selectedAgentAnalytics.incident_count
                      : '—'}
                  </div>
                </div>
                <div className="dev-dashboard-pill">
                  <div className="pill-label">Events</div>
                  <div className="pill-value">
                    {selectedAgentAnalytics.event_count != null
                      ? selectedAgentAnalytics.event_count
                      : '—'}
                  </div>
                </div>
                {selectedAgentAnalytics.reliability != null && (
                  <div className="dev-dashboard-pill">
                    <div className="pill-label">Reliability</div>
                    <div className="pill-value">
                      {selectedAgentAnalytics.reliability}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
