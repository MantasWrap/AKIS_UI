import { useMemo, useState } from 'react';
import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

const DOC_SCOPE_OPTIONS = [
  { id: 'docs-en', label: 'Share docs/EN snapshot only', helper: 'UI Boss + Codex see EN/ folder only.' },
  { id: 'docs-en-server', label: 'Share docs/EN + server/', helper: 'Owner-approved extended scope.' },
  { id: 'docs-custom', label: 'Manual (describe in notes)', helper: 'Use mission notes to describe exceptions.' },
];

const initialForm = {
  name: '',
  objective: '',
  environments: ['Mac'],
  agents: [],
  docScope: 'docs-en',
};

export default function AiOsMissionsPage() {
  const { missions, agents } = aiOsMockData;
  const [missionList, setMissionList] = useState(missions.items);
  const [selectedMissionId, setSelectedMissionId] = useState(missions.items[0]?.id ?? null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(initialForm);
  const [mockMessage, setMockMessage] = useState('');

  const agentLookup = useMemo(
    () =>
      agents.roster.reduce((acc, agent) => {
        acc[agent.id] = agent;
        return acc;
      }, {}),
    [agents.roster],
  );

  const agentOptions = useMemo(
    () => agents.roster.map((agent) => ({ id: agent.id, name: agent.name })),
    [agents.roster],
  );

  const selectedMission =
    missionList.find((mission) => mission.id === selectedMissionId) || missionList[0] || null;

  const handleDraftChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field, value) => {
    setDraft((prev) => {
      const set = new Set(prev[field]);
      if (set.has(value)) {
        set.delete(value);
      } else {
        set.add(value);
      }
      return { ...prev, [field]: Array.from(set) };
    });
  };

  const handleCreate = () => {
    const docScopeMap = {
      'docs-en': {
        label: 'docs/EN',
        scope: 'Share EN/ only',
        rules: ['Only docs/EN snapshot shared until Owner extends scope.'],
      },
      'docs-en-server': {
        label: 'docs/EN + server/',
        scope: 'Share EN + server/',
        rules: ['Owner approved sharing EN/ + server/ for this mission.'],
      },
      'docs-custom': {
        label: 'Custom attachment',
        scope: 'Manual share (describe in notes)',
        rules: ['Document custom sharing rules in the mission objective before running agents.'],
      },
    };
    const scopeConfig = docScopeMap[draft.docScope] || docScopeMap['docs-en'];

    const newMission = {
      id: `mission-${Date.now()}`,
      name: draft.name || 'Untitled mission',
      status: 'Planned',
      statusVariant: 'planned',
      stage: 'Scheduled',
      updatedAt: 'Just now',
      environments: draft.environments.length ? draft.environments : ['Mac'],
      nextStep: draft.objective || 'Describe next step in docs.',
      description: draft.objective || 'Mock mission captured via UI only.',
      timeline: [
        {
          id: 'timeline-brief',
          title: 'Capture mission brief',
          timestamp: 'Now',
          state: 'active',
          description: 'Write summary + attach EN.zip in chat.',
        },
        {
          id: 'timeline-run',
          title: 'Run agents',
          timestamp: 'Next',
          state: 'pending',
          description: 'UI Boss + Codex loop after Owner review.',
        },
      ],
      agents: (draft.agents.length ? draft.agents : ['ui-boss']).map((agentId) => {
        const meta = agentLookup[agentId];
        return {
          id: agentId,
          name: meta?.name || agentId,
          role: meta?.role || 'Agent',
          tier: meta?.tier || 'Implementer',
          preset: meta?.primaryMode || 'Custom',
          status: 'Planned',
        };
      }),
      files: [
        {
          id: 'mission-docs',
          label: scopeConfig.label,
          scope: scopeConfig.scope,
          detail: 'Mock entry; replace when backend is wired.',
        },
      ],
      rules: scopeConfig.rules,
    };

    setMissionList((prev) => [newMission, ...prev]);
    setSelectedMissionId(newMission.id);
    setDrawerOpen(false);
    setDraft(initialForm);
    setMockMessage('Mission captured (mock only). Backend wiring pending.');
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

      <div className="dev-card aios-card aios-card--stacked">
        <div className="aios-card-header">
          <div>
            <p className="aios-card-eyebrow">Mission control</p>
            <h2 className="aios-card-title">Multi-agent missions</h2>
            <p className="aios-card-subtitle">Read-only cockpit for AI OS 0.1 missions.</p>
          </div>
          <span className="aios-tag">Mock data</span>
        </div>
        <div className="aios-missions-summary">
          <div className="aios-summary-card">
            <p className="aios-card-eyebrow">Running</p>
            <div className="aios-highlight">{missions.summary.active}</div>
          </div>
          <div className="aios-summary-card">
            <p className="aios-card-eyebrow">Paused</p>
            <div className="aios-highlight">{missions.summary.paused}</div>
          </div>
          <div className="aios-summary-card">
            <p className="aios-card-eyebrow">Next window</p>
            <div className="aios-highlight-sub">{missions.summary.nextWindow}</div>
          </div>
        </div>

        <div className="aios-missions-layout">
          <div className="aios-missions-list" role="list">
            {missionList.map((mission) => {
              const isActive = mission.id === selectedMission?.id;
              return (
                <button
                  key={mission.id}
                  type="button"
                  className={`aios-mission-tile ${isActive ? 'is-active' : ''}`}
                  onClick={() => setSelectedMissionId(mission.id)}
                  aria-pressed={isActive}
                >
                  <div className="aios-mission-tile-head">
                    <div>
                      <p className="aios-card-eyebrow">{mission.stage}</p>
                      <h4>{mission.name}</h4>
                    </div>
                    <span className={`aios-status-chip status-${mission.statusVariant}`}>
                      {mission.status}
                    </span>
                  </div>
                  <div className="aios-mission-tile-body">
                    <div className="aios-mission-environments">
                      {mission.environments.map((env) => (
                        <span key={`${mission.id}-${env}`} className="aios-pill aios-pill--muted">
                          {env}
                        </span>
                      ))}
                    </div>
                    <p className="aios-mission-next">{mission.nextStep}</p>
                    <div className="aios-mission-agent-avatars">
                      {mission.agents.map((agent) => {
                        const meta = agentLookup[agent.id] || {};
                        const label = meta.name || agent.name || agent.id;
                        return (
                          <span
                            key={`${mission.id}-${agent.id}`}
                            className="aios-mission-avatar"
                            title={label}
                          >
                            {(label || '?').charAt(0)}
                          </span>
                        );
                      })}
                    </div>
                    <span className="aios-mission-updated">{mission.updatedAt}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="aios-mission-detail">
            {selectedMission ? (
              <>
                <div className="aios-mission-detail-head">
                  <div>
                    <p className="aios-card-eyebrow">Selected mission</p>
                    <h3>{selectedMission.name}</h3>
                    <div className="aios-mission-detail-meta">
                      <span className={`aios-status-chip status-${selectedMission.statusVariant}`}>
                        {selectedMission.status}
                      </span>
                      <span className="aios-mission-stage-pill">{selectedMission.stage}</span>
                      <span className="aios-mission-detail-updated">{selectedMission.updatedAt}</span>
                    </div>
                    <div className="aios-mission-detail-envs">
                      {selectedMission.environments.map((env) => (
                        <span key={`${selectedMission.id}-env-${env}`} className="aios-pill aios-pill--muted">
                          {env}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button type="button" className="dev-pill-button">
                    View in logs (mock)
                  </button>
                </div>
                <p className="aios-mission-description">{selectedMission.description}</p>

                <div className="aios-mission-detail-section">
                  <header>
                    <h4 className="aios-section-title">Timeline & checklist</h4>
                    <span className="aios-card-eyebrow">Steps auto-sync from missions log</span>
                  </header>
                  <ul className="aios-mission-timeline">
                    {selectedMission.timeline.map((step) => (
                      <li key={step.id} className={`aios-mission-step state-${step.state}`}>
                        <div>
                          <strong>{step.title}</strong>
                          <p>{step.description}</p>
                        </div>
                        <span>{step.timestamp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="aios-mission-detail-section">
                  <header>
                    <h4 className="aios-section-title">Agents on mission</h4>
                    <span className="aios-card-eyebrow">Statuses are mock only</span>
                  </header>
                  <div className="aios-mission-agent-grid">
                    {selectedMission.agents.map((agent) => (
                      <article key={agent.id} className="aios-mission-agent-card">
                        <header>
                          <div>
                            <strong>{agent.name}</strong>
                            <p>{agent.role}</p>
                          </div>
                          <span className="aios-pill">{agent.status}</span>
                        </header>
                        <dl>
                          <div>
                            <dt>Tier</dt>
                            <dd>{agent.tier}</dd>
                          </div>
                          <div>
                            <dt>Preset</dt>
                            <dd>{agent.preset}</dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="aios-mission-detail-section">
                  <header>
                    <h4 className="aios-section-title">Files & rules</h4>
                    <span className="aios-card-eyebrow">Doc scopes enforced manually</span>
                  </header>
                  <div className="aios-mission-files">
                    {selectedMission.files.map((file) => (
                      <div key={file.id} className="aios-mission-file-card">
                        <div>
                          <strong>{file.label}</strong>
                          <p>{file.detail}</p>
                        </div>
                        <span className="aios-pill aios-pill--muted">{file.scope}</span>
                      </div>
                    ))}
                  </div>
                  <ul className="aios-mission-rules">
                    {selectedMission.rules.map((rule) => (
                      <li key={`${selectedMission.id}-${rule}`}>{rule}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="aios-mission-empty">
                <p>Select a mission on the left to see its timeline.</p>
              </div>
            )}
          </div>
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
                <p className="aios-card-subtitle">Design preview only. No orchestration yet.</p>
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
              <span>Objective / next step</span>
              <textarea
                value={draft.objective}
                onChange={(event) => handleDraftChange('objective', event.target.value)}
                placeholder="Short summary for UI Boss + Codex"
              />
            </label>

            <div className="aios-form-field">
              <span>Environments</span>
              <div className="aios-chip-row">
                {missions.environments.map((env) => (
                  <button
                    key={env}
                    type="button"
                    className={`aios-chip ${draft.environments.includes(env) ? 'is-active' : ''}`}
                    onClick={() => handleArrayToggle('environments', env)}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>

            <div className="aios-form-field">
              <span>Agents</span>
              <div className="aios-mission-agent-picker">
                {agentOptions.map((option) => (
                  <label key={option.id}>
                    <input
                      type="checkbox"
                      checked={draft.agents.includes(option.id)}
                      onChange={() => handleArrayToggle('agents', option.id)}
                    />
                    {option.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="aios-form-field">
              <span>Doc sharing rules</span>
              <div className="aios-radio-stack">
                {DOC_SCOPE_OPTIONS.map((option) => (
                  <label key={option.id} className="aios-radio-card">
                    <input
                      type="radio"
                      name="doc-scope"
                      value={option.id}
                      checked={draft.docScope === option.id}
                      onChange={() => handleDraftChange('docScope', option.id)}
                    />
                    <div>
                      <strong>{option.label}</strong>
                      <p>{option.helper}</p>
                    </div>
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
