import { useMemo, useState } from 'react';
import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

const initialForm = {
  name: '',
  description: '',
  agents: [],
};

export default function AiOsMissionsPage() {
  const { missions, agents } = aiOsMockData;
  const [expandedMissionId, setExpandedMissionId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(initialForm);
  const [mockMessage, setMockMessage] = useState('');

  const agentOptions = useMemo(() => agents.roster.map((agent) => ({ id: agent.id, name: agent.name })), [agents.roster]);

  const toggleMission = (missionId) => {
    setExpandedMissionId((prev) => (prev === missionId ? null : missionId));
  };

  const handleMissionKey = (event, missionId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleMission(missionId);
    }
  };

  const handleDraftChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleAgentToggle = (agentId) => {
    setDraft((prev) => {
      const selected = new Set(prev.agents);
      if (selected.has(agentId)) {
        selected.delete(agentId);
      } else {
        selected.add(agentId);
      }
      return { ...prev, agents: Array.from(selected) };
    });
  };

  const handleCreate = () => {
    setMockMessage('Mission captured (mock only). Backend wiring pending.');
    setDrawerOpen(false);
    setDraft(initialForm);
    setTimeout(() => setMockMessage(''), 4000);
  };

  return (
    <div className="aios-page">
      <div className="aios-missions-header">
        <button type="button" className="dev-pill-button active" onClick={() => setDrawerOpen(true)}>
          New mission
        </button>
        {mockMessage && <span className="aios-highlight-sub">{mockMessage}</span>}
      </div>
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">Missions</h2>
            <p className="aios-card-subtitle">Multi-agent missions &amp; orchestration placeholders.</p>
          </div>
          <span className="aios-tag">Mock only</span>
        </div>

        <div className="aios-mission-list">
          {missions.items.map((mission) => {
            const isOpen = expandedMissionId === mission.id;
            return (
              <div key={mission.id} className={`aios-mission-card ${isOpen ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="aios-mission-trigger"
                  onClick={() => toggleMission(mission.id)}
                  onKeyDown={(event) => handleMissionKey(event, mission.id)}
                  aria-expanded={isOpen}
                >
                  <div>
                    <h4>{mission.name}</h4>
                    <div className="aios-highlight-sub">{mission.description}</div>
                  </div>
                  <div className="aios-mission-meta">
                    <span className="aios-pill">{mission.status}</span>
                    <span>{mission.eta}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="aios-mission-body">
                    <div className="aios-detail-label">Agents</div>
                    <div className="aios-mission-agents">
                      {mission.agents.map((agent) => (
                        <span key={agent} className="aios-pill aios-pill--muted">{agent}</span>
                      ))}
                    </div>
                    <div className="aios-detail-label">Timeline</div>
                    <ul className="aios-mission-steps">
                      {mission.steps.map((step) => (
                        <li key={step.id}>
                          <span className={`aios-step-dot state-${step.state}`} />
                          <div>
                            <strong>{step.title}</strong>
                            <div className="aios-table-subline">Owner: {step.owner}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="aios-card-footnote">{missions.note}</div>
      </div>

      {drawerOpen && (
        <div className="aios-drawer">
          <div className="aios-drawer-overlay" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="aios-drawer-panel" role="dialog" aria-modal="true" aria-label="Create mission">
            <div className="aios-card-header">
              <div>
                <h3 className="aios-card-title">New mission (mock)</h3>
                <p className="aios-card-subtitle">No backend yet — this is a design preview.</p>
              </div>
              <button type="button" className="dev-pill-button" onClick={() => setDrawerOpen(false)}>
                Close
              </button>
            </div>
            <label className="aios-form-field">
              <span>Mission name</span>
              <input
                type="text"
                value={draft.name}
                onChange={(event) => handleDraftChange('name', event.target.value)}
                placeholder="Owner onboarding improvements"
              />
            </label>
            <label className="aios-form-field">
              <span>Description</span>
              <textarea
                value={draft.description}
                onChange={(event) => handleDraftChange('description', event.target.value)}
                placeholder="Short summary for UI Boss + Codex"
              />
            </label>
            <div className="aios-form-field">
              <span>Agents</span>
              <div className="aios-mission-agent-picker">
                {agentOptions.map((option) => (
                  <label key={option.id}>
                    <input
                      type="checkbox"
                      checked={draft.agents.includes(option.id)}
                      onChange={() => handleAgentToggle(option.id)}
                    />
                    {option.name}
                  </label>
                ))}
              </div>
            </div>
            <button type="button" className="dev-pill-button active" onClick={handleCreate}>
              Create mission (mock)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
