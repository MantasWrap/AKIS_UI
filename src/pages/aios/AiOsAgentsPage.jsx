import { useEffect, useMemo, useState } from 'react';
import '../../styles/aios.css';
import { useAiOsMockData } from '../../hooks/useAiOsMockData';

const DEFAULT_CREATIVITY_LEVELS = [
  { id: 'off', label: 'Off', description: 'Do not touch UI unless explicitly asked.' },
  { id: 'low', label: 'Low', description: 'Backend/system work prioritized; UI only when necessary.' },
  { id: 'medium', label: 'Med', description: 'Balanced between UI/UX and backend/system tasks.' },
  { id: 'high', label: 'High', description: 'Bias toward UI, still references docs/specs.' },
  { id: 'max', label: 'Max', description: 'Maximum UI focus, mock data allowed, avoid backend unless requested.' },
];

const TOGGLES = [
  { id: 'canEditReact', label: 'Can edit React UI' },
  { id: 'canTouchBackend', label: 'Can propose backend changes' },
  { id: 'usesMockDataByDefault', label: 'Uses mock data by default' },
  { id: 'canEditDocs', label: 'Can modify docs/specs' },
];

function buildInitialSettings(roster) {
  return roster.reduce((acc, agent) => {
    acc[agent.id] = {
      name: agent.name,
      uiCreativityLevel: agent.uiCreativityLevel || 'medium',
      canEditReact: agent.canEditReact ?? false,
      canTouchBackend: agent.canTouchBackend ?? false,
      usesMockDataByDefault: agent.usesMockDataByDefault ?? true,
      canEditDocs: agent.canEditDocs ?? false,
    };
    return acc;
  }, {});
}

export default function AiOsAgentsPage() {
  const { agents } = useAiOsMockData();
  const roster = useMemo(() => agents?.roster || [], [agents]);
  const filterOptions = agents?.filters || [{ id: 'all', label: 'All agents' }];
  const creativityLevels = agents?.creativityLevels || DEFAULT_CREATIVITY_LEVELS;
  const [filter, setFilter] = useState(filterOptions[0]?.id || 'all');
  const [settingsState, setSettingsState] = useState(() => buildInitialSettings(roster));

  useEffect(() => {
    setSettingsState(buildInitialSettings(roster));
  }, [roster]);

  const filteredAgents = useMemo(() => {
    if (filter === 'all') return roster;
    return roster.filter((agent) => agent.type === filter);
  }, [roster, filter]);

  const handleNameChange = (agentId, value) => {
    setSettingsState((prev) => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        name: value,
      },
    }));
  };

  const handleSliderChange = (agentId, index) => {
    const safeIndex = Math.min(Math.max(Number(index), 0), creativityLevels.length - 1);
    const level = creativityLevels[safeIndex]?.id || creativityLevels[0]?.id || 'medium';
    setSettingsState((prev) => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        uiCreativityLevel: level,
      },
    }));
  };

  const handleToggleChange = (agentId, field) => {
    setSettingsState((prev) => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        [field]: !prev[agentId]?.[field],
      },
    }));
  };

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">AI OS · Agents</h2>
            <p className="aios-card-subtitle">
              Owner-level AI collaborators pulled from docs specs. Settings are mock-only until OS-config API ships.
            </p>
          </div>
          <span className="aios-tag">{agents?.total ?? roster.length} total</span>
        </div>

        <div className="aios-chip-group" role="group" aria-label="Agent type filter">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`aios-chip ${filter === option.id ? 'is-active' : ''}`}
              onClick={() => setFilter(option.id)}
              aria-pressed={filter === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="aios-agents-grid">
          {filteredAgents.map((agent) => {
            const settings = settingsState[agent.id] || {};
            const sliderIndex = Math.max(
              0,
              creativityLevels.findIndex((level) => level.id === settings.uiCreativityLevel),
            );
            const activeLevel = creativityLevels[sliderIndex] || creativityLevels[0];
            return (
              <div key={agent.id} className="aios-agent-card">
                <div className="aios-agent-card-head">
                  <div className="aios-agent-name-block">
                    <label className="aios-detail-label" htmlFor={`${agent.id}-name`}>Agent name</label>
                    <input
                      id={`${agent.id}-name`}
                      className="aios-agent-name-input"
                      value={settings.name || agent.name}
                      onChange={(event) => handleNameChange(agent.id, event.target.value)}
                    />
                  </div>
                  <span className="aios-tag">{agent.status}</span>
                </div>
                <div className="aios-agent-role">{agent.role}</div>
                <div className="aios-agent-meta">
                  <div>
                    <div className="aios-detail-label">Conversation profile</div>
                    <div>{agent.conversationProfile}</div>
                  </div>
                  <div>
                    <div className="aios-detail-label">Permissions</div>
                    <div>{agent.permissionProfile}</div>
                  </div>
                </div>
                <div className="aios-agent-slider-block">
                  <div className="aios-detail-label">UI Creativity</div>
                  <input
                    type="range"
                    min={0}
                    max={creativityLevels.length - 1}
                    value={sliderIndex}
                    className="aios-agent-slider"
                    onChange={(event) => handleSliderChange(agent.id, event.target.value)}
                  />
                  <div className="aios-agent-slider-labels">
                    {creativityLevels.map((level, index) => (
                      <span
                        key={level.id}
                        className={index === sliderIndex ? 'is-active' : ''}
                      >
                        {level.label}
                      </span>
                    ))}
                  </div>
                  <div className="aios-agent-slider-caption">
                    UI focus: <strong>{activeLevel?.label || '—'}</strong> – {activeLevel?.description}
                  </div>
                </div>
                <div className="aios-agent-toggles">
                  {TOGGLES.map((toggle) => (
                    <label key={toggle.id} className="aios-toggle">
                      <input
                        type="checkbox"
                        checked={!!settings[toggle.id]}
                        onChange={() => handleToggleChange(agent.id, toggle.id)}
                      />
                      <span>{toggle.label}</span>
                    </label>
                  ))}
                </div>
                <div className="aios-agent-mock-note">Mock controls · not persisted yet</div>
                <div className="aios-agent-footer">
                  <div>
                    <div className="aios-detail-label">Primary mode</div>
                    <div>{agent.primaryMode}</div>
                  </div>
                  <div>
                    <div className="aios-detail-label">Monthly cost</div>
                    <div>${agent.monthlyCost}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="aios-card-footnote">
          Mocked from Owner_Agents_Dashboard_Spec.md — backend wiring to come with AI OS pipelines.
        </div>
      </div>
    </div>
  );
}
