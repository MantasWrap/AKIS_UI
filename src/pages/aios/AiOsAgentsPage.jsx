import { useEffect, useMemo, useState } from 'react';
import '../../styles/aios.css';
import { useAiOsMockData } from '../../hooks/useAiOsMockData';
import {
  createDefaultAgent,
  DEFAULT_AGENT_BEHAVIOUR,
  DEFAULT_AGENT_STARTUP,
} from '../../mock/aiOsMockData';

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

const SLIDER_COPY = {
  uiCreativityLevel: {
    label: 'UI creativity',
    helper: 'Dial how bold this agent pushes UI polish versus speed.',
  },
  backendPlanningBias: {
    label: 'Backend planning',
    helper: 'Higher levels keep backend roadmaps front and center.',
  },
  docsEditBias: {
    label: 'Docs focus',
    helper: 'Guides how often the agent rewrites specs and docs.',
  },
};

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

const DEFAULT_BEHAVIOUR = DEFAULT_AGENT_BEHAVIOUR;
const DEFAULT_STARTUP = DEFAULT_AGENT_STARTUP;

const buildBehaviourFromSource = (source = {}) => {
  const permissions = {
    ...DEFAULT_BEHAVIOUR.permissions,
    ...(source.permissions || {}),
  };

  return {
    uiCreativityLevel: source.uiCreativityLevel ?? DEFAULT_BEHAVIOUR.uiCreativityLevel,
    backendPlanningBias: source.backendPlanningBias ?? DEFAULT_BEHAVIOUR.backendPlanningBias,
    docsEditBias: source.docsEditBias ?? DEFAULT_BEHAVIOUR.docsEditBias,
    permissions,
    canEditReact: permissions.canEditReact,
    canTouchBackend: permissions.canTouchBackend,
    usesMockDataByDefault: permissions.usesMockDataByDefault,
    canEditDocs: permissions.canEditDocs,
  };
};

const getEffectiveBehaviour = (agent, overrides = null) => {
  const base = buildBehaviourFromSource(agent?.behaviourSettings);
  if (!overrides) return base;

  const mergedPermissions = {
    ...base.permissions,
    canEditReact: overrides.canEditReact ?? base.permissions.canEditReact,
    canTouchBackend: overrides.canTouchBackend ?? base.permissions.canTouchBackend,
    usesMockDataByDefault: overrides.usesMockDataByDefault ?? base.permissions.usesMockDataByDefault,
    canEditDocs: overrides.canEditDocs ?? base.permissions.canEditDocs,
  };

  return {
    uiCreativityLevel: overrides.uiCreativityLevel ?? base.uiCreativityLevel,
    backendPlanningBias: overrides.backendPlanningBias ?? base.backendPlanningBias,
    docsEditBias: overrides.docsEditBias ?? base.docsEditBias,
    permissions: mergedPermissions,
    canEditReact: mergedPermissions.canEditReact,
    canTouchBackend: mergedPermissions.canTouchBackend,
    usesMockDataByDefault: mergedPermissions.usesMockDataByDefault,
    canEditDocs: mergedPermissions.canEditDocs,
  };
};

const getStartupMessage = (agent) => ({
  ...DEFAULT_STARTUP,
  ...(agent?.startupMessage || {}),
});

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
  const behaviour = getEffectiveBehaviour(agent);
  const base = {
    name: agent.name,
    uiCreativityLevel: behaviour.uiCreativityLevel,
    backendPlanningBias: behaviour.backendPlanningBias,
    docsEditBias: behaviour.docsEditBias,
    canEditReact: behaviour.canEditReact,
    canTouchBackend: behaviour.canTouchBackend,
    usesMockDataByDefault: behaviour.usesMockDataByDefault,
    canEditDocs: behaviour.canEditDocs,
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

  const [agentsState, setAgentsState] = useState(() => (
    roster.length ? roster : [createDefaultAgent('mock-agent-seed')]
  ));

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

  const getAgentSettings = (agentId) => {
    if (!agentId) return null;
    const merged = {
      ...(baseSettings[agentId] || {}),
      ...(settingsState[agentId] || {}),
    };
    if (!merged.name) {
      const fallback = agentsState.find((agent) => agent.id === agentId);
      if (fallback?.name) {
        merged.name = fallback.name;
      }
    }
    return merged;
  };

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
    setSettingsState((prev) => {
      const baseValue = baseSettings[agentId]?.[field];
      const currentValue = prev[agentId]?.[field];
      const safeBase = typeof baseValue === 'boolean' ? baseValue : false;
      const nextValue = currentValue === undefined ? !safeBase : !currentValue;
      return {
        ...prev,
        [agentId]: {
          ...prev[agentId],
          [field]: nextValue,
          presetId: PRESET_CUSTOM,
        },
      };
    });
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
    const template = createDefaultAgent(id, {
      name: `New agent ${agentsState.length + 1}`,
      notes: 'Mock-only agent placeholder.',
      status: 'Draft',
    });
    const behaviour = getEffectiveBehaviour(template);
    setAgentsState((prev) => [template, ...prev]);
    updateAgentSettings(id, {
      name: template.name,
      uiCreativityLevel: behaviour.uiCreativityLevel,
      backendPlanningBias: behaviour.backendPlanningBias,
      docsEditBias: behaviour.docsEditBias,
      canEditReact: behaviour.canEditReact,
      canTouchBackend: behaviour.canTouchBackend,
      usesMockDataByDefault: behaviour.usesMockDataByDefault,
      canEditDocs: behaviour.canEditDocs,
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
    ? agentsState.find((agent) => agent.id === selectedAgentId) || null
    : null;
  const selectedAgentSettings = selectedAgent
    ? getAgentSettings(selectedAgent.id)
    : null;
  const selectedAgentBehaviour = selectedAgent
    ? getEffectiveBehaviour(selectedAgent, selectedAgentSettings)
    : null;
  const startup = selectedAgent
    ? getStartupMessage(selectedAgent)
    : DEFAULT_STARTUP;
  const selectedAgentVisible = selectedAgent
    ? filteredAgents.some((agent) => agent.id === selectedAgent.id)
    : false;

  const handleCopyStartup = (agent) => {
    const startupDetails = getStartupMessage(agent);
    const payload = startupDetails.body
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
    const docPath = getStartupMessage(agent).docPath || agent?.startupDocPath || 'docs/EN';
    console.log('Mock doc open:', docPath);
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
                    <h2 className="aios-agent-detail-name">{selectedAgentSettings?.name || selectedAgent.name}</h2>
                    <p className="aios-agent-detail-role">
                      {selectedAgent.role}
                      <span className="aios-agent-detail-tier-pill">
                        {TIER_LABELS[selectedAgent.tier] || selectedAgent.tier || selectedAgent.type}
                      </span>
                    </p>
                    <span className="aios-agent-detail-meta">Mock edit · {TIER_LABELS[selectedAgent.tier] || 'Agent'}</span>
                  </div>
                  <div className="aios-agent-detail-actions">
                    <span className="aios-agent-preset-pill">{presetLabel(selectedAgentSettings)}</span>
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
                    value={selectedAgentSettings?.name || selectedAgent.name}
                    onChange={(event) => handleNameChange(selectedAgent.id, event.target.value)}
                  />
                  <p className="aios-agent-detail-rename-note">Visible only in this mock session.</p>
                </div>

                <section
                  className="aios-agent-detail-section"
                  aria-labelledby={`${selectedAgent.id}-preset-heading`}
                  aria-describedby={`${selectedAgent.id}-preset-sub`}
                >
                  <div className="aios-agent-detail-section-header">
                    <h3 className="aios-section-title" id={`${selectedAgent.id}-preset-heading`}>Behaviour preset</h3>
                    <span id={`${selectedAgent.id}-preset-sub`} className="aios-agent-detail-section-sub">Choose a preset or fine-tune sliders.</span>
                  </div>
                  <div className="aios-agent-detail-section-body">
                    <div className="aios-agent-preset-row">
                      <div className="aios-detail-label">Mode preset</div>
                      <select
                        className="aios-agent-preset-select"
                        value={selectedAgentSettings?.presetId || PRESET_CUSTOM}
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
                        if (!selectedAgentSettings || selectedAgentSettings.presetId === PRESET_CUSTOM) {
                          return 'Adjust sliders to fine-tune behaviour.';
                        }
                        const preset = modePresets.find((item) => item.id === selectedAgentSettings.presetId);
                        return preset?.description || 'Adjust sliders to fine-tune behaviour.';
                      })()}
                    </div>

                    {['uiCreativityLevel', 'backendPlanningBias', 'docsEditBias'].map((key) => {
                      const levels = key === 'uiCreativityLevel' ? creativityLevels : biasLevels;
                      const sliderIdx = sliderIndex(
                        levels,
                        selectedAgentBehaviour?.[key],
                      );
                      const sliderCopy = SLIDER_COPY[key];
                      return (
                        <div key={key} className="aios-agent-detail-slider-row">
                          <div className="aios-agent-detail-slider-label">
                            <span className="label-main">
                              {sliderCopy?.label}
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
                          <p className="aios-agent-slider-caption">
                            {sliderCopy?.helper || levels[sliderIdx]?.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section
                  className="aios-agent-detail-section"
                  aria-labelledby={`${selectedAgent.id}-perm-heading`}
                  aria-describedby={`${selectedAgent.id}-perm-sub`}
                >
                  <div className="aios-agent-detail-section-header">
                    <h3 className="aios-section-title" id={`${selectedAgent.id}-perm-heading`}>Permissions</h3>
                    <span id={`${selectedAgent.id}-perm-sub`} className="aios-agent-detail-section-sub">Control what this agent can touch.</span>
                  </div>
                  <div className="aios-agent-detail-section-body">
                    <div className="aios-agent-card-perms">
                      {TOGGLES.map((toggle) => (
                        <label key={toggle.id} className="aios-agent-perm-row">
                          <input
                            type="checkbox"
                            checked={!!selectedAgentBehaviour?.[toggle.id]}
                            onChange={() => handleToggleChange(selectedAgent.id, toggle.id)}
                          />
                          <span>{toggle.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </section>

                <section
                  className="aios-agent-detail-section aios-agent-detail-section--startup"
                  aria-labelledby={`${selectedAgent.id}-startup-heading`}
                  aria-describedby={`${selectedAgent.id}-startup-sub`}
                >
                  <div className="aios-agent-detail-section-header">
                    <h3 className="aios-section-title" id={`${selectedAgent.id}-startup-heading`}>Startup message</h3>
                    <span id={`${selectedAgent.id}-startup-sub`} className="aios-agent-detail-section-sub">
                      Copied into new chats when you summon this agent.
                    </span>
                  </div>
                  <div className="aios-agent-detail-section-body">
                    <p className="aios-agent-detail-startup-snippet">
                      {startup.body}
                    </p>
                    <div className="aios-agent-startup-meta">
                      <span className="aios-agent-startup-doc-label">Linked doc:</span>
                      <span className="aios-agent-startup-doc-path">
                        {startup.docPath || selectedAgent.startupDocPath || 'docs/EN'}
                      </span>
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
                  </div>
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
