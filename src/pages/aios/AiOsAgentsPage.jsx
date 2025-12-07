import { useEffect, useMemo, useState } from 'react';
import '../../styles/aios.css';
import { useAiOsMockData } from '../../hooks/useAiOsMockData';

const BASE_LEVELS = [
  { id: 'off', label: 'Off', description: 'Avoid unless explicitly requested.' },
  { id: 'low', label: 'Low', description: 'Only when necessary.' },
  { id: 'medium', label: 'Med', description: 'Balanced across workstreams.' },
  { id: 'high', label: 'High', description: 'Bias toward this area.' },
  { id: 'max', label: 'Max', description: 'Primary focus.' },
];

const TOGGLES = [
  { id: 'canEditReact', label: 'Can edit React UI' },
  { id: 'canTouchBackend', label: 'Can propose backend changes' },
  { id: 'usesMockDataByDefault', label: 'Uses mock data by default' },
  { id: 'canEditDocs', label: 'Can modify docs/specs' },
];

const TIER_LABELS = {
  domain_boss: 'Domain Boss',
  implementer: 'Implementer',
  os_supervisor: 'Supervisor',
};

const PRESET_CUSTOM = 'custom';
const tierRank = {
  os_supervisor: 0,
  domain_boss: 1,
  boss: 1,
  implementer: 2,
  default: 3,
};

const DEFAULT_NEW_AGENT = {
  id: '',
  name: 'New agent',
  role: 'Describe this agent',
  tier: 'implementer',
  type: 'implementer',
  status: 'Draft',
  monthlyCost: 0,
  notes: 'Mock-only agent placeholder.',
  uiCreativityLevel: 'medium',
  backendPlanningBias: 'medium',
  docsEditBias: 'medium',
  canEditReact: true,
  canTouchBackend: false,
  usesMockDataByDefault: true,
  canEditDocs: true,
  startupMessageLabel: 'Mock startup template',
  startupDocPath: 'docs/EN/SYSTEM/Agent_Startup_Template.md',
  startupMessageSnippet: 'Explain what this agent focuses on when a session begins.',
};

const sliderIndex = (levels, value) => {
  const idx = levels.findIndex((level) => level.id === value);
  return idx >= 0 ? idx : 2;
};

const findMatchingPreset = (values, presets) => presets.find((preset) => (
  preset.uiCreativityLevel === values.uiCreativityLevel
  && preset.backendPlanningBias === values.backendPlanningBias
  && preset.docsEditBias === values.docsEditBias
  && preset.canEditReact === values.canEditReact
  && preset.canTouchBackend === values.canTouchBackend
  && preset.usesMockDataByDefault === values.usesMockDataByDefault
  && preset.canEditDocs === values.canEditDocs
));

const buildInitialSettings = (roster, presets) => roster.reduce((acc, agent) => {
  const base = {
    name: agent.name,
    uiCreativityLevel: agent.uiCreativityLevel || 'medium',
    backendPlanningBias: agent.backendPlanningBias || 'medium',
    docsEditBias: agent.docsEditBias || 'medium',
    canEditReact: agent.canEditReact ?? false,
    canTouchBackend: agent.canTouchBackend ?? false,
    usesMockDataByDefault: agent.usesMockDataByDefault ?? true,
    canEditDocs: agent.canEditDocs ?? false,
  };
  const presetMatch = findMatchingPreset(base, presets);
  acc[agent.id] = {
    ...base,
    presetId: presetMatch ? presetMatch.id : PRESET_CUSTOM,
  };
  return acc;
}, {});

export default function AiOsAgentsPage() {
  const {
    agents,
    modePresets = [],
  } = useAiOsMockData();

  const roster = useMemo(() => agents?.roster || [], [agents]);

  const [agentsState, setAgentsState] = useState(() => roster);

  const [settingsState, setSettingsState] = useState({});
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [copiedAgentId, setCopiedAgentId] = useState(null);

  const creativityLevels = agents?.creativityLevels || BASE_LEVELS;
  const biasLevels = agents?.biasLevels || BASE_LEVELS;
  const filterOptions = agents?.filters || [{ id: 'all', label: 'All agents' }];

  const baseSettings = useMemo(
    () => buildInitialSettings(agentsState, modePresets),
    [agentsState, modePresets],
  );

  const mapSliderValue = (levels, index) => {
    const safeIndex = Math.min(Math.max(Number(index), 0), levels.length - 1);
    return levels[safeIndex]?.id || levels[0]?.id || 'medium';
  };

  const updateAgentSettings = (agentId, partial) => {
    setSettingsState((prev) => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        ...partial,
      },
    }));
  };

  const handleNameChange = (agentId, value) => {
    updateAgentSettings(agentId, { name: value, presetId: PRESET_CUSTOM });
  };

  const handleSliderChange = (agentId, sliderKey, index) => {
    const levels = sliderKey === 'uiCreativityLevel' ? creativityLevels : biasLevels;
    const level = mapSliderValue(levels, index);
    updateAgentSettings(agentId, { [sliderKey]: level, presetId: PRESET_CUSTOM });
  };

  const handleToggleChange = (agentId, field) => {
    setSettingsState((prev) => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        [field]: !prev[agentId]?.[field],
        presetId: PRESET_CUSTOM,
      },
    }));
  };

  const handlePresetChange = (agentId, presetId) => {
    if (presetId === PRESET_CUSTOM || !presetId) {
      updateAgentSettings(agentId, { presetId: PRESET_CUSTOM });
      return;
    }
    const preset = modePresets.find((item) => item.id === presetId);
    if (!preset) return;
    updateAgentSettings(agentId, {
      uiCreativityLevel: preset.uiCreativityLevel,
      backendPlanningBias: preset.backendPlanningBias,
      docsEditBias: preset.docsEditBias,
      canEditReact: preset.canEditReact,
      canTouchBackend: preset.canTouchBackend,
      usesMockDataByDefault: preset.usesMockDataByDefault,
      canEditDocs: preset.canEditDocs,
      presetId,
    });
  };

  const handleCreateAgent = () => {
    const id = `mock-agent-${Date.now()}`;
    const template = { ...DEFAULT_NEW_AGENT, id, name: `${DEFAULT_NEW_AGENT.name} ${agentsState.length + 1}` };
    setAgentsState((prev) => [template, ...prev]);
    updateAgentSettings(id, {
      name: template.name,
      uiCreativityLevel: template.uiCreativityLevel,
      backendPlanningBias: template.backendPlanningBias,
      docsEditBias: template.docsEditBias,
      canEditReact: template.canEditReact,
      canTouchBackend: template.canTouchBackend,
      usesMockDataByDefault: template.usesMockDataByDefault,
      canEditDocs: template.canEditDocs,
      presetId: PRESET_CUSTOM,
    });
    setSelectedAgentId(id);
  };

  const handleDeleteAgent = (agentId) => {
    const agent = agentsState.find((item) => item.id === agentId);
    const label = agent?.name || 'this agent';
    if (!window.confirm(`Delete ${label}? This action is mock-only.`)) {
      return;
    }
    setAgentsState((prev) => prev.filter((item) => item.id !== agentId));
    setSettingsState((prev) => {
      const next = { ...prev };
      delete next[agentId];
      return next;
    });
    if (selectedAgentId === agentId) {
      setSelectedAgentId(null);
    }
  };

  const presetLabel = (settings) => {
    if (!settings || !settings.presetId) return 'Custom';
    if (settings.presetId === PRESET_CUSTOM) return 'Custom';
    return modePresets.find((preset) => preset.id === settings.presetId)?.label || 'Preset';
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredAgents = useMemo(() => {
    const byType = agentsState.filter((agent) => {
      if (filter === 'all') return true;
      return agent.type === filter || agent.tier === filter;
    });
    const bySearch = byType.filter((agent) => {
      if (!normalizedSearch) return true;
      return (
        agent.name?.toLowerCase().includes(normalizedSearch)
        || agent.role?.toLowerCase().includes(normalizedSearch)
        || agent.notes?.toLowerCase().includes(normalizedSearch)
      );
    });
    return [...bySearch].sort((a, b) => {
      if (sortKey === 'tier') {
        const aRank = tierRank[a.tier] ?? tierRank.default;
        const bRank = tierRank[b.tier] ?? tierRank.default;
        if (aRank === bRank) return (a.name || '').localeCompare(b.name || '');
        return aRank - bRank;
      }
      if (sortKey === 'cost') {
        return (b.monthlyCost || 0) - (a.monthlyCost || 0);
      }
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [agentsState, filter, normalizedSearch, sortKey]);

  const selectedAgent = selectedAgentId
    ? agentsState.find((agent) => agent.id === selectedAgentId)
    : null;
  const selectedAgentVisible = selectedAgent
    ? filteredAgents.some((agent) => agent.id === selectedAgent.id)
    : false;

  const getAgentSettings = (agentId) => ({
    ...(baseSettings[agentId] || {}),
    ...(settingsState[agentId] || {}),
  });

  const handleCopyStartup = (agent) => {
    const payload = agent.startupMessageSnippet
      || `Startup message placeholder for ${agent.name}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(payload).catch(() => {});
    }
    setCopiedAgentId(agent.id);
  };

  useEffect(() => {
    if (!copiedAgentId) return;
    const timer = setTimeout(() => setCopiedAgentId(null), 2000);
    return () => clearTimeout(timer);
  }, [copiedAgentId]);

  const handleOpenStartupDoc = (agent) => {
    console.log('Mock doc open:', agent.startupDocPath);
  };

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-agents-header">
          <div className="aios-card-header">
            <div>
              <h2 className="aios-card-title">AI OS · Agents</h2>
              <p className="aios-card-subtitle">
                Focus an agent to edit behaviour sliders, presets, and startup guidance. All controls are mock-only.
              </p>
            </div>
            <span className="aios-tag">{agentsState.length} total</span>
          </div>
          <button type="button" className="aios-agents-create-btn" onClick={handleCreateAgent}>
            New agent
          </button>
        </div>

        <div className="aios-agents-toolbar">
          <div className="aios-chip-group" role="group" aria-label="Agent type filter">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`aios-chip ${filter === option.id ? 'is-active' : ''}`}
                onClick={() => {
                  setFilter(option.id);
                  setSelectedAgentId(null);
                }}
                aria-pressed={filter === option.id}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="aios-agents-search-sort">
            <input
              type="search"
              className="aios-agents-search"
              placeholder="Search agents"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSelectedAgentId(null);
              }}
            />
            <select
              className="aios-agents-sort"
              value={sortKey}
              onChange={(event) => {
                setSortKey(event.target.value);
                setSelectedAgentId(null);
              }}
            >
              <option value="name">Name A–Z</option>
              <option value="tier">Tier</option>
              <option value="cost">Cost high → low</option>
            </select>
          </div>
        </div>

        {filteredAgents.length === 0 ? (
          <div className="aios-agent-empty-state">
            No agents match your filters. Clear search or switch filters to see more.
          </div>
        ) : (
          <div className="aios-agent-focus-layout">
            <div className="aios-agent-tiles" role="tablist" aria-label="Agent selection">
              {filteredAgents.map((agent) => {
                const settings = getAgentSettings(agent.id);
                const tierLabel = TIER_LABELS[agent.tier] || agent.tier || agent.type;
                const isSelected = selectedAgentId === agent.id;
                const dimmed = selectedAgentId && !isSelected;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    className={[
                      'aios-agent-tile',
                      isSelected ? 'is-selected' : '',
                      dimmed ? 'is-dimmed' : '',
                    ].filter(Boolean).join(' ')}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedAgentId((prev) => (prev === agent.id ? null : agent.id))}
                  >
                    <div className="aios-agent-tile-top">
                      <span className="aios-agent-tile-name">{settings.name || agent.name}</span>
                      <span className={`aios-agent-tier aios-agent-tier--${agent.tier || 'default'}`}>
                        {tierLabel}
                      </span>
                    </div>
                    <div className="aios-agent-tile-role">{agent.role}</div>
                    <div className="aios-agent-tile-meta">
                      <span className="aios-agent-preset-pill">{presetLabel(settings)}</span>
                      <span className="aios-agent-status">{agent.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedAgentVisible ? (
              <div className="aios-agent-detail-panel">
                <div className="aios-agent-detail-header">
                  <div className="aios-agent-detail-identity">
                    <h2 className="aios-agent-detail-name">{getAgentSettings(selectedAgent.id).name || selectedAgent.name}</h2>
                    <p className="aios-agent-detail-role">
                      {selectedAgent.role}
                      <span className="aios-agent-detail-tier-pill">
                        {TIER_LABELS[selectedAgent.tier] || selectedAgent.tier || selectedAgent.type}
                      </span>
                    </p>
                    <span className="aios-agent-detail-meta">Mock edit · {TIER_LABELS[selectedAgent.tier] || 'Agent'}</span>
                  </div>
                  <div className="aios-agent-detail-actions">
                    <span className="aios-agent-preset-pill">{presetLabel(getAgentSettings(selectedAgent.id))}</span>
                    <button type="button" className="aios-agent-focus-exit" onClick={() => setSelectedAgentId(null)}>
                      Back to overview
                    </button>
                  </div>
                </div>

                <div className="aios-agent-detail-rename">
                  <label className="aios-detail-label" htmlFor={`${selectedAgent.id}-focused-name`}>Rename (mock)</label>
                  <input
                    id={`${selectedAgent.id}-focused-name`}
                    className="aios-agent-name-input"
                    value={getAgentSettings(selectedAgent.id).name || selectedAgent.name}
                    onChange={(event) => handleNameChange(selectedAgent.id, event.target.value)}
                  />
                </div>

                <section className="aios-agent-detail-section">
                  <div className="aios-agent-detail-section-header">
                    <h3>Behaviour preset</h3>
                    <span className="aios-agent-detail-section-sub">Choose a preset or fine-tune sliders.</span>
                  </div>
                  <div className="aios-agent-preset-row">
                    <div className="aios-detail-label">Mode preset</div>
                    <select
                      className="aios-agent-preset-select"
                      value={getAgentSettings(selectedAgent.id).presetId || PRESET_CUSTOM}
                      onChange={(event) => handlePresetChange(selectedAgent.id, event.target.value)}
                    >
                      <option value={PRESET_CUSTOM}>Custom</option>
                      {modePresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="aios-agent-preset-caption">
                    {(() => {
                      const settings = getAgentSettings(selectedAgent.id);
                      if (settings.presetId === PRESET_CUSTOM || !settings.presetId) {
                        return 'Adjust sliders to fine-tune behaviour.';
                      }
                      const preset = modePresets.find((item) => item.id === settings.presetId);
                      return preset?.description || 'Adjust sliders to fine-tune behaviour.';
                    })()}
                  </div>

                  {['uiCreativityLevel', 'backendPlanningBias', 'docsEditBias'].map((key) => {
                    const settings = getAgentSettings(selectedAgent.id);
                    const sliderIdx = sliderIndex(
                      key === 'uiCreativityLevel' ? creativityLevels : biasLevels,
                      settings[key],
                    );
                    const levels = key === 'uiCreativityLevel' ? creativityLevels : biasLevels;
                    return (
                      <div key={key} className="aios-agent-detail-slider-row">
                        <div className="aios-agent-detail-slider-label">
                          <span className="label-main">
                            {key === 'uiCreativityLevel' && 'UI Creativity'}
                            {key === 'backendPlanningBias' && 'Backend planning'}
                            {key === 'docsEditBias' && 'Docs focus'}
                          </span>
                          <span className="label-meta">{levels[sliderIdx]?.label}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={levels.length - 1}
                          value={sliderIdx}
                          className="aios-agent-slider"
                          onChange={(event) => handleSliderChange(selectedAgent.id, key, event.target.value)}
                        />
                        {key === 'uiCreativityLevel' && (
                          <div className="aios-agent-slider-caption">{levels[sliderIdx]?.description}</div>
                        )}
                      </div>
                    );
                  })}
                </section>

                <section className="aios-agent-detail-section">
                  <div className="aios-agent-detail-section-header">
                    <h3>Permissions</h3>
                    <span className="aios-agent-detail-section-sub">Control what this agent can touch.</span>
                  </div>
                  <div className="aios-agent-card-perms">
                    {TOGGLES.map((toggle) => (
                      <label key={toggle.id} className="aios-agent-perm-row">
                        <input
                          type="checkbox"
                          checked={!!getAgentSettings(selectedAgent.id)[toggle.id]}
                        onChange={() => handleToggleChange(selectedAgent.id, toggle.id)}
                      />
                      <span>{toggle.label}</span>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="aios-agent-detail-section aios-agent-detail-section--startup">
                  <div className="aios-agent-detail-section-header">
                    <h3>Startup message</h3>
                    <span className="aios-agent-detail-section-sub">
                      Copied into new chats when you summon this agent.
                    </span>
                  </div>
                  <p className="aios-agent-detail-startup-snippet">
                    {selectedAgent.startupMessageSnippet}
                  </p>
                  <div className="aios-agent-startup-meta">
                    <span className="aios-agent-startup-doc-label">Linked doc:</span>
                    <span className="aios-agent-startup-doc-path">{selectedAgent.startupDocPath}</span>
                  </div>
                  <div className="aios-agent-detail-startup-actions">
                    <button
                      type="button"
                      className="aios-agent-btn-soft"
                      onClick={() => handleCopyStartup(selectedAgent)}
                    >
                      {copiedAgentId === selectedAgent.id ? 'Copied!' : 'Copy message'}
                    </button>
                    <button
                      type="button"
                      className="aios-agent-btn-ghost"
                      onClick={() => handleOpenStartupDoc(selectedAgent)}
                    >
                      Open in docs
                    </button>
                  </div>
                  <p className="aios-agent-detail-startup-hint">
                    <em>Mock only</em> — copy uses canned text until OS-config wiring lands.
                  </p>
                </section>

                <footer className="aios-agent-card-footer">
                  <span className="aios-agent-mock-tag">Mock only · no persistence</span>
                  <div className="aios-agent-detail-footer-actions">
                    <button type="button" className="aios-agent-delete-btn" onClick={() => handleDeleteAgent(selectedAgent.id)}>
                      Delete agent (mock)
                    </button>
                    <button type="button" className="aios-agent-profiles-link">
                      View profiles
                    </button>
                  </div>
                </footer>
              </div>
            ) : (
              <div className="aios-agent-placeholder">
                Select an agent tile to open focus mode and edit behaviour controls.
              </div>
            )}
          </div>
        )}

        <div className="aios-card-footnote">
          Mocked from Owner_Agents_Dashboard_Spec.md — backend wiring to come with AI OS pipelines.
        </div>
      </div>
    </div>
  );
}
