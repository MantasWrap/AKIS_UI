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
  const filterOptions = agents?.filters || [{ id: 'all', label: 'All agents' }];
  const creativityLevels = agents?.creativityLevels || BASE_LEVELS;
  const biasLevels = agents?.biasLevels || BASE_LEVELS;

  const [filter, setFilter] = useState(filterOptions[0]?.id || 'all');
  const [settingsState, setSettingsState] = useState(() => buildInitialSettings(roster, modePresets));

  useEffect(() => {
    setSettingsState(buildInitialSettings(roster, modePresets));
  }, [roster, modePresets]);

  const filteredAgents = useMemo(() => {
    if (filter === 'all') return roster;
    return roster.filter((agent) => agent.type === filter);
  }, [roster, filter]);

  const updateAgentSettings = (agentId, partial) => {
    setSettingsState((prev) => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        ...partial,
      },
    }));
  };

  const mapSliderValue = (levels, index) => {
    const safeIndex = Math.min(Math.max(Number(index), 0), levels.length - 1);
    return levels[safeIndex]?.id || levels[0]?.id || 'medium';
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

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">AI OS · Agents</h2>
            <p className="aios-card-subtitle">
              Configure behaviour presets. Controls are mock-only until OS-config APIs land.
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
            const uiSliderIndex = sliderIndex(creativityLevels, settings.uiCreativityLevel);
            const backendSliderIndex = sliderIndex(biasLevels, settings.backendPlanningBias);
            const docsSliderIndex = sliderIndex(biasLevels, settings.docsEditBias);
            const uiLevelMeta = creativityLevels[uiSliderIndex] || creativityLevels[0];
            const tierLabel = TIER_LABELS[agent.tier] || agent.tier || agent.type;
            const activePreset = settings.presetId && settings.presetId !== PRESET_CUSTOM
              ? modePresets.find((preset) => preset.id === settings.presetId)
              : null;

            return (
              <div key={agent.id} className="aios-agent-card">
                <header className="aios-agent-card-header">
                  <div className="aios-agent-name-block">
                    <label className="aios-detail-label" htmlFor={`${agent.id}-name`}>Agent name</label>
                    <div className="aios-agent-name-edit">
                      <input
                        id={`${agent.id}-name`}
                        className="aios-agent-name-input"
                        value={settings.name || agent.name}
                        onChange={(event) => handleNameChange(agent.id, event.target.value)}
                      />
                      <span className="aios-agent-edit-hint">mock edit</span>
                    </div>
                    <div className="aios-agent-role-row">
                      <span className="aios-agent-role">{agent.role}</span>
                      <span className={`aios-agent-tier aios-agent-tier--${agent.tier || 'default'}`}>
                        {tierLabel}
                      </span>
                    </div>
                  </div>
                </header>

                <section className="aios-agent-card-modes">
                  <div className="aios-agent-preset-row">
                    <div className="aios-detail-label">Mode preset</div>
                    <select
                      className="aios-agent-preset-select"
                      value={settings.presetId || PRESET_CUSTOM}
                      onChange={(event) => handlePresetChange(agent.id, event.target.value)}
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
                    {activePreset ? activePreset.description : 'Adjust sliders to fine-tune behaviour.'}
                  </div>

                  <div className="aios-agent-slider-block">
                    <div className="aios-agent-slider-row">
                      <div className="aios-agent-slider-label">
                        <span>UI Creativity</span>
                        <span className="aios-agent-slider-level">{uiLevelMeta?.label}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={creativityLevels.length - 1}
                        value={uiSliderIndex}
                        className="aios-agent-slider"
                        onChange={(event) => handleSliderChange(agent.id, 'uiCreativityLevel', event.target.value)}
                      />
                      <div className="aios-agent-slider-caption">{uiLevelMeta?.description}</div>
                    </div>

                    <div className="aios-agent-slider-row">
                      <div className="aios-agent-slider-label">
                        <span>Backend planning</span>
                        <span className="aios-agent-slider-level">
                          {biasLevels[backendSliderIndex]?.label}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={biasLevels.length - 1}
                        value={backendSliderIndex}
                        className="aios-agent-slider"
                        onChange={(event) => handleSliderChange(agent.id, 'backendPlanningBias', event.target.value)}
                      />
                    </div>

                    <div className="aios-agent-slider-row">
                      <div className="aios-agent-slider-label">
                        <span>Docs edit focus</span>
                        <span className="aios-agent-slider-level">
                          {biasLevels[docsSliderIndex]?.label}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={biasLevels.length - 1}
                        value={docsSliderIndex}
                        className="aios-agent-slider"
                        onChange={(event) => handleSliderChange(agent.id, 'docsEditBias', event.target.value)}
                      />
                    </div>
                  </div>
                </section>

                <section className="aios-agent-card-perms">
                  {TOGGLES.map((toggle) => (
                    <label key={toggle.id} className="aios-agent-perm-row">
                      <input
                        type="checkbox"
                        checked={!!settings[toggle.id]}
                        onChange={() => handleToggleChange(agent.id, toggle.id)}
                      />
                      <span>{toggle.label}</span>
                    </label>
                  ))}
                </section>

                <footer className="aios-agent-card-footer">
                  <span className="aios-agent-mock-tag">Mock only · no persistence</span>
                  <button type="button" className="aios-agent-profiles-link">
                    View profiles
                  </button>
                </footer>
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
