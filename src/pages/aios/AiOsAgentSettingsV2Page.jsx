import { useMemo, useState } from 'react';
import '../../styles/aios.css';
import { useAiOsMockData } from '../../hooks/useAiOsMockData';

const BEHAVIOUR_FIELDS = [
  { key: 'mode', label: 'Mode', options: ['FAST', 'DEEP'] },
  { key: 'tone', label: 'Tone', options: ['owner_direct', 'designer_partner', 'incident_commander'] },
  { key: 'layout_profile', label: 'Layout profile', options: ['structured', 'card_stack', 'two_column'] },
  { key: 'brand_profile', label: 'Brand profile', options: ['dev_console', 'system_console'] },
  { key: 'safety_profile', label: 'Safety profile', options: ['core_locked', 'ui_only', 'runtime_blocking'] },
];

const PERFORMANCE_FIELDS = [
  { key: 'fast_max_tokens', label: 'FAST max tokens', type: 'number', min: 800, max: 6000, step: 100 },
  { key: 'deep_max_tokens', label: 'DEEP max tokens', type: 'number', min: 1200, max: 8000, step: 100 },
  { key: 'context_budget_policy', label: 'Context budget policy', options: ['balanced', 'visual_priority', 'slo_guarded'] },
];

const FORMATTING_FIELDS = [
  { key: 'prefers_markdown', label: 'Prefers Markdown', type: 'boolean' },
  { key: 'prefers_file_links', label: 'Prefers file links', type: 'boolean' },
  { key: 'prefers_copy_blocks', label: 'Prefers copy blocks', type: 'boolean' },
];

function AgentRow({ agent, active, onSelect }) {
  return (
    <button
      type="button"
      className={`aios-agent-row ${active ? 'is-active' : ''}`}
      onClick={() => onSelect(agent.id)}
    >
      <div>
        <p className="aios-card-title">{agent.name}</p>
        <p className="aios-card-subtitle">{agent.role}</p>
      </div>
      <span className="aios-tag">{agent.tier}</span>
    </button>
  );
}

function FieldControl({
  groupKey,
  field,
  value,
  onChange,
}) {
  const handleChange = (event) => {
    const { type, checked, value: raw } = event.target;
    const nextValue = type === 'checkbox'
      ? checked
      : (field.type === 'number' ? Number(raw) : raw);
    onChange(groupKey, field.key, nextValue);
  };

  if (field.type === 'boolean') {
    return (
      <label className="aios-settings-field">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={handleChange}
        />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.type === 'number') {
    return (
      <label className="aios-settings-field">
        <span>{field.label}</span>
        <input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step || 100}
          value={value ?? ''}
          onChange={handleChange}
        />
      </label>
    );
  }

  const options = field.options || [];
  return (
    <label className="aios-settings-field">
      <span>{field.label}</span>
      <select value={value || ''} onChange={handleChange}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function SettingsGroup({ title, description, groupKey, fields, values, onChange }) {
  return (
    <div className="dev-card aios-card aios-settings-group">
      <div className="aios-card-header">
        <div>
          <h3 className="aios-card-title">{title}</h3>
          <p className="aios-card-subtitle">{description}</p>
        </div>
      </div>
      <div className="aios-settings-grid">
        {fields.map((field) => (
          <FieldControl
            key={`${groupKey}-${field.key}`}
            groupKey={groupKey}
            field={field}
            value={values?.[field.key]}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

export default function AiOsAgentSettingsV2Page() {
  const { agentSettingsV2 } = useAiOsMockData();
  const agents = useMemo(() => agentSettingsV2?.agents || [], [agentSettingsV2]);
  const apiMeta = agentSettingsV2?.api || {};
  const [activeAgentId, setActiveAgentId] = useState(null);
  const [agentOverrides, setAgentOverrides] = useState({});
  const [lastPayload, setLastPayload] = useState(null);

  const activeAgent = useMemo(() => {
    if (!agents.length) return null;
    const match = agents.find((agent) => agent.id === activeAgentId);
    return match || agents[0];
  }, [agents, activeAgentId]);

  const draft = useMemo(() => {
    if (!activeAgent) return null;
    const overrides = agentOverrides[activeAgent.id] || {};
    return {
      behaviour: {
        ...activeAgent.behaviour,
        ...(overrides.behaviour || {}),
      },
      performance: {
        ...activeAgent.performance,
        ...(overrides.performance || {}),
      },
      formatting: {
        ...activeAgent.formatting,
        ...(overrides.formatting || {}),
      },
    };
  }, [activeAgent, agentOverrides]);

  const pendingForAgent = activeAgent ? (agentOverrides[activeAgent.id] || {}) : {};
  const hasPending = activeAgent && Object.keys(pendingForAgent).length > 0;

  const handleSelectAgent = (agentId) => {
    setActiveAgentId(agentId);
  };

  const handleFieldChange = (groupKey, fieldKey, value) => {
    if (!activeAgent) return;
    setAgentOverrides((prev) => {
      const current = prev[activeAgent.id] || {};
      const nextGroup = {
        ...(current[groupKey] || {}),
        [fieldKey]: value,
      };
      return {
        ...prev,
        [activeAgent.id]: {
          ...current,
          [groupKey]: nextGroup,
        },
      };
    });
  };

  const handleSubmit = () => {
    if (!activeAgent || !hasPending) return;
    const payload = {
      agentId: activeAgent.id,
      schemaVersion: apiMeta.schemaVersion || 2,
      changes: pendingForAgent,
      emittedAt: new Date().toISOString(),
    };
    setLastPayload(payload);
    setAgentOverrides((prev) => {
      const next = { ...prev };
      delete next[activeAgent.id];
      return next;
    });
    console.debug('[AgentSettingsV2] Structured update payload', payload);
  };

  if (!agents.length) {
    return (
      <div className="aios-page">
        <div className="dev-card aios-card">
          <h2 className="aios-card-title">Agent settings unavailable</h2>
          <p className="aios-card-subtitle">
            No agent settings were found in the mock data. Backend should expose
            {` ${apiMeta.readEndpoint || '/api/owner/ai-os/agents/settings'}`} returning
            the schema described in AI_OS_Agent_Model.md.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="aios-page aios-settings-page">
      <div className="aios-two-column">
        <div className="aios-column aios-column--sidebar">
          <div className="dev-card aios-card">
            <h2 className="aios-card-title">Agents</h2>
            <p className="aios-card-subtitle">Per-agent behaviour schema (v2)</p>
            <div className="aios-agent-list">
              {agents.map((agent) => (
                <AgentRow
                  key={agent.id}
                  agent={agent}
                  active={agent.id === activeAgent?.id}
                  onSelect={handleSelectAgent}
                />
              ))}
            </div>
          </div>
          <div className="dev-card aios-card">
            <h3 className="aios-card-title">Developer notes</h3>
            <ul className="aios-list">
              <li>
                Read config via <code>{apiMeta.readEndpoint}</code> (GET) · expect <code>schemaVersion: 2</code>.
              </li>
              <li>
                Persist updates with <code>{apiMeta.updateEndpoint}</code> (PATCH) using the payload preview below.
              </li>
              <li>
                Backend should validate behaviour/performance/formatting keys match AI_OS_Agent_Model.md.
              </li>
            </ul>
          </div>
        </div>

        <div className="aios-column">
          <div className="aios-settings-layout">
            <SettingsGroup
              title="Behaviour"
              description="Mode, tone, layout, brand, and safety profiles per Agent Model v2."
              groupKey="behaviour"
              fields={BEHAVIOUR_FIELDS}
              values={draft?.behaviour}
              onChange={handleFieldChange}
            />
            <SettingsGroup
              title="Performance"
              description="FAST/DEEP token budgets and context policy."
              groupKey="performance"
              fields={PERFORMANCE_FIELDS}
              values={draft?.performance}
              onChange={handleFieldChange}
            />
            <SettingsGroup
              title="Formatting"
              description="Preferred output wrappers so Codex and Dev Console stay aligned."
              groupKey="formatting"
              fields={FORMATTING_FIELDS}
              values={draft?.formatting}
              onChange={handleFieldChange}
            />
          </div>

          <div className="dev-card aios-card aios-settings-footer">
            <div>
              <h3 className="aios-card-title">Structured update preview</h3>
              <p className="aios-card-subtitle">
                Updates are emitted as JSON and sent to the backend—no free-text allowed. Payloads also flow into the Agent Settings v2 API.
              </p>
            </div>
            <button
              type="button"
              className="aios-primary-btn"
              onClick={handleSubmit}
              disabled={!hasPending}
            >
              Emit update
            </button>
            <pre className="aios-code-block">
              {JSON.stringify({
                agentId: activeAgent?.id,
                schemaVersion: apiMeta.schemaVersion || 2,
                changes: pendingForAgent,
              }, null, 2)}
            </pre>
            {lastPayload ? (
              <div className="aios-last-payload">
                <p className="aios-card-subtitle">Last emitted payload</p>
                <pre className="aios-code-block">{JSON.stringify(lastPayload, null, 2)}</pre>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
