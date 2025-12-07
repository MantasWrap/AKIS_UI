import { useMemo, useState } from 'react';
import '../../styles/aios.css';
import { useAiOsMockData } from '../../hooks/useAiOsMockData';

const TOGGLE_SUMMARY = [
  { id: 'canEditReact', label: 'React UI' },
  { id: 'canTouchBackend', label: 'Backend' },
  { id: 'usesMockDataByDefault', label: 'Mock data' },
  { id: 'canEditDocs', label: 'Docs' },
];

const levelLabel = (value) => (value ? value.toUpperCase() : 'MED');

export default function AiOsModesPage() {
  const { modes = { list: [] }, modePresets = [] } = useAiOsMockData();
  const modeList = useMemo(() => modes.list || [], [modes.list]);
  const [selectedModeId, setSelectedModeId] = useState(modeList[0]?.id || null);

  const activeModeId = useMemo(() => {
    if (!modeList.length) return null;
    if (selectedModeId && modeList.some((mode) => mode.id === selectedModeId)) {
      return selectedModeId;
    }
    return modeList[0].id;
  }, [modeList, selectedModeId]);

  const selectedMode = useMemo(
    () => modeList.find((mode) => mode.id === activeModeId),
    [modeList, activeModeId],
  );

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">AI OS · Modes</h2>
            <p className="aios-card-subtitle">Documented communication surfaces for owner &amp; missions.</p>
          </div>
          <span className="aios-tag">{modes.total} modes</span>
        </div>

        <div className="aios-modes-layout">
          <div className="aios-mode-list" role="tablist" aria-label="Communication modes">
            {modeList.map((mode) => (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={activeModeId === mode.id}
                className={`aios-mode-button ${activeModeId === mode.id ? 'is-active' : ''}`}
                onClick={() => setSelectedModeId(mode.id)}
              >
                <div>
                  <strong>{mode.name}</strong>
                  <div className="aios-table-subline">{mode.channel}</div>
                </div>
                <div className="aios-mode-meta">
                  <span>{mode.usage}</span>
                  <span className="aios-pill">{mode.status}</span>
                </div>
              </button>
            ))}
          </div>

          {selectedMode && (
            <div className="aios-mode-inspector">
              <div className="aios-card-header">
                <div>
                  <h3 className="aios-card-title">{selectedMode.name}</h3>
                  <p className="aios-card-subtitle">{selectedMode.description}</p>
                </div>
                <span className="aios-tag">Latency {selectedMode.latency}</span>
              </div>
              <p className="aios-highlight-sub">{selectedMode.notes}</p>
              <div>
                <div className="aios-detail-label">Agents using this mode</div>
                <ul className="aios-list">
                  {selectedMode.agents.map((agent) => (
                    <li key={agent}>
                      <span className="aios-dot" />
                      {agent}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="aios-mode-presets">
          <div className="aios-card-header">
            <div>
              <h3 className="aios-card-title">Mode presets</h3>
              <p className="aios-card-subtitle">
                Behaviour bundles applied from the Agents dashboard. Mock-only until OS-config APIs land.
              </p>
            </div>
            <span className="aios-tag">{modePresets.length} presets</span>
          </div>

          <div className="aios-mode-gallery">
            {modePresets.map((preset) => (
              <div key={preset.id} className="aios-mode-card">
                <div className="aios-mode-card-header">
                  <span className="aios-pill">{preset.label}</span>
                  <span className="aios-mode-card-id">{preset.id}</span>
                </div>
                <p className="aios-mode-card-description">{preset.description}</p>
                <div className="aios-mode-card-sliders">
                  <div className="aios-mode-card-slider-row">
                    <span>UI creativity</span>
                    <span className="aios-mode-card-slider-level">{levelLabel(preset.uiCreativityLevel)}</span>
                  </div>
                  <div className="aios-mode-card-slider-row">
                    <span>Backend planning</span>
                    <span className="aios-mode-card-slider-level">{levelLabel(preset.backendPlanningBias)}</span>
                  </div>
                  <div className="aios-mode-card-slider-row">
                    <span>Docs focus</span>
                    <span className="aios-mode-card-slider-level">{levelLabel(preset.docsEditBias)}</span>
                  </div>
                </div>
                <div className="aios-mode-card-flags">
                  {TOGGLE_SUMMARY.map((toggle) => (
                    <span
                      key={toggle.id}
                      className={`aios-pill ${preset[toggle.id] ? '' : 'aios-pill--muted'}`}
                    >
                      {toggle.label} {preset[toggle.id] ? 'ON' : 'OFF'}
                    </span>
                  ))}
                </div>
                {preset.recommendedAgents?.length ? (
                  <div className="aios-mode-card-meta">
                    Recommended for: {preset.recommendedAgents.join(', ')}
                  </div>
                ) : null}
                <footer className="aios-mode-card-footer">
                  Mock preset · no persistence
                </footer>
              </div>
            ))}
          </div>
        </div>

        <div className="aios-card-footnote">
          Specs source: Owner_AI_OS_Home_Spec.md &amp; Owner_AIModes_Dashboard_Spec.md · data mocked only.
        </div>
      </div>
    </div>
  );
}
