import { useMemo, useState } from 'react';
import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

export default function AiOsModesPage() {
  const { modes } = aiOsMockData;
  const [selectedModeId, setSelectedModeId] = useState(modes.list[0]?.id);

  const selectedMode = useMemo(
    () => modes.list.find((mode) => mode.id === selectedModeId) || modes.list[0],
    [modes.list, selectedModeId],
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
            {modes.list.map((mode) => (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={selectedModeId === mode.id}
                className={`aios-mode-button ${selectedModeId === mode.id ? 'is-active' : ''}`}
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

        <div className="aios-card-footnote">
          Specs source: Owner_AI_OS_Home_Spec.md &amp; Owner_AIModes_Dashboard_Spec.md · data mocked only.
        </div>
      </div>
    </div>
  );
}
