import { useMemo, useState } from 'react';
import '../../styles/aios.css';
import { useAiOsMockData } from '../../hooks/useAiOsMockData';

const TABS = [
  { key: 'pipeline', label: 'Agent task pipeline' },
  { key: 'decisionLog', label: 'Core decision log' },
  { key: 'maturity', label: 'AI OS maturity tracker' },
];

function TabButton({ tab, active, onClick }) {
  return (
    <button
      type="button"
      className={`aios-tab ${active ? 'is-active' : ''}`}
      onClick={() => onClick(tab.key)}
    >
      {tab.label}
    </button>
  );
}

function PipelineList({ entries, onSelect, activeId }) {
  return (
    <div className="aios-table-lite">
      <div className="aios-table-lite-header">
        <span>Phase</span>
        <span>Agent</span>
        <span>Status</span>
        <span>Summary</span>
      </div>
      {entries.map((entry) => (
        <button
          type="button"
          key={entry.id}
          className={`aios-table-lite-row ${activeId === entry.id ? 'is-active' : ''}`}
          onClick={() => onSelect(entry)}
        >
          <span>{entry.phase}</span>
          <span>{entry.agent}</span>
          <span className={`aios-status-chip status-${entry.status}`}>{entry.status}</span>
          <span>{entry.summary}</span>
        </button>
      ))}
    </div>
  );
}

function DecisionCard({ decision }) {
  return (
    <div className="aios-log-card">
      <div className="aios-card-header">
        <div>
          <p className="aios-card-eyebrow">{decision.date}</p>
          <h3 className="aios-card-title">{decision.title}</h3>
          <p className="aios-card-subtitle">{decision.summary}</p>
        </div>
        <span className="aios-tag">CORE</span>
      </div>
      <div className="aios-log-meta">
        <div>
          <div className="aios-detail-label">Entry ID</div>
          <div className="aios-detail-value">{decision.entry_id}</div>
        </div>
        <div>
          <div className="aios-detail-label">Drivers</div>
          <div className="aios-detail-value">{decision.drivers.join(', ')}</div>
        </div>
      </div>
      <div className="aios-doc-links">
        {decision.docs.map((doc) => (
          <a key={doc} href={`/${doc}`} className="aios-link" target="_blank" rel="noreferrer">
            View {doc.split('/').slice(-1)[0]}
          </a>
        ))}
      </div>
    </div>
  );
}

function MaturityCard({ snapshot }) {
  return (
    <div className="aios-log-card">
      <div className="aios-card-header">
        <div>
          <p className="aios-card-eyebrow">{snapshot.date}</p>
          <h3 className="aios-card-title">AI OS {snapshot.version}</h3>
          <p className="aios-card-subtitle">Score {snapshot.score}</p>
        </div>
        <span className="aios-tag">Maturity</span>
      </div>
      <ul className="aios-list">
        {snapshot.highlights.map((highlight) => (
          <li key={highlight}>
            <span className="aios-dot" />
            {highlight}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AiOsCoreLogsPage() {
  const { coreLogs } = useAiOsMockData();
  const pipelineEntries = useMemo(
    () => coreLogs?.pipeline?.entries || [],
    [coreLogs],
  );
  const decisionEntries = useMemo(
    () => coreLogs?.decisionLog || [],
    [coreLogs],
  );
  const maturitySnapshots = useMemo(
    () => coreLogs?.maturitySnapshots || [],
    [coreLogs],
  );

  const [activeTab, setActiveTab] = useState('pipeline');
  const [selectedPipeline, setSelectedPipeline] = useState(pipelineEntries[0] || null);
  const [agentFilter, setAgentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const agents = useMemo(
    () => Array.from(new Set(pipelineEntries.map((entry) => entry.agent))),
    [pipelineEntries],
  );
  const statuses = useMemo(
    () => Array.from(new Set(pipelineEntries.map((entry) => entry.status))),
    [pipelineEntries],
  );

  const filteredPipeline = useMemo(() => pipelineEntries.filter((entry) => {
    const matchesAgent = agentFilter === 'all' || entry.agent === agentFilter;
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesAgent && matchesStatus;
  }), [pipelineEntries, agentFilter, statusFilter]);

  const handleSelectPipeline = (entry) => {
    setSelectedPipeline(entry);
  };

  return (
    <div className="aios-page aios-logs-page">
      <div className="dev-card aios-card">
        <div className="aios-tab-list">
          {TABS.map((tab) => (
            <TabButton
              key={tab.key}
              tab={tab}
              active={activeTab === tab.key}
              onClick={setActiveTab}
            />
          ))}
        </div>
        <p className="aios-card-subtitle">
          Viewer federates Agent Task Pipeline, Core Decision Log, and AI OS Maturity Tracker. BackendAgent should expose <code>/api/owner/ai-os/logs?surface=*</code> returning these slices.
        </p>
      </div>

      {activeTab === 'pipeline' && (
        <div className="aios-two-column">
          <div className="aios-column">
            <div className="dev-card aios-card">
              <div className="aios-filter-bar">
                <label className="aios-filter-field">
                  <span>Agent</span>
                  <select value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)}>
                    <option value="all">All</option>
                    {agents.map((agent) => (
                      <option key={agent} value={agent}>{agent}</option>
                    ))}
                  </select>
                </label>
                <label className="aios-filter-field">
                  <span>Status</span>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="all">All</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </div>
              <PipelineList
                entries={filteredPipeline}
                activeId={selectedPipeline?.id}
                onSelect={handleSelectPipeline}
              />
            </div>
          </div>
          <div className="aios-column">
            <div className="dev-card aios-card">
              <h3 className="aios-card-title">Entry detail</h3>
              {selectedPipeline ? (
                <div className="aios-log-detail">
                  <p className="aios-card-subtitle">{selectedPipeline.summary}</p>
                  <dl>
                    <div>
                      <dt>Owner</dt>
                      <dd>{selectedPipeline.owner}</dd>
                    </div>
                    <div>
                      <dt>Agent</dt>
                      <dd>{selectedPipeline.agent}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{selectedPipeline.status}</dd>
                    </div>
                    <div>
                      <dt>Updated</dt>
                      <dd>{selectedPipeline.updatedAt}</dd>
                    </div>
                  </dl>
                  <p className="aios-card-subtitle">
                    Deep link to Agent Task Pipeline markdown:
                    {' '}
                    <a
                      href="/docs/EN/CORE/Agent_Task_Pipeline.md"
                      className="aios-link"
                      target="_blank"
                      rel="noreferrer"
                    >
                      docs/EN/CORE/Agent_Task_Pipeline.md
                    </a>
                  </p>
                </div>
              ) : (
                <p className="aios-card-subtitle">Select a pipeline entry to see details.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'decisionLog' && (
        <div className="aios-grid aios-grid--two">
          {decisionEntries.map((entry) => (
            <DecisionCard key={entry.entry_id} decision={entry} />
          ))}
        </div>
      )}

      {activeTab === 'maturity' && (
        <div className="aios-grid aios-grid--two">
          {maturitySnapshots.map((snapshot) => (
            <MaturityCard key={snapshot.version} snapshot={snapshot} />
          ))}
        </div>
      )}
    </div>
  );
}
