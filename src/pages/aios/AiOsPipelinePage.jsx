import { useMemo, useState } from 'react';
import '../../styles/aios.css';
import { useAiOsMockData } from '../../hooks/useAiOsMockData';

export default function AiOsPipelinePage() {
  const { pipeline } = useAiOsMockData();
  const safeStages = useMemo(() => pipeline?.stages || [], [pipeline]);
  const defaultStageId = pipeline?.currentStageId || safeStages[0]?.id;
  const [selectedStageId, setSelectedStageId] = useState(defaultStageId);

  const selectedStage = useMemo(
    () => safeStages.find((stage) => stage.id === selectedStageId) || safeStages[0],
    [safeStages, selectedStageId],
  );

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">AI dev pipeline</h2>
            <p className="aios-card-subtitle">Derived from AI_Development_Pipeline.md</p>
          </div>
          <span className="aios-tag">Current stage · {pipeline?.stage}</span>
        </div>

        <div className="aios-stage-grid">
          {safeStages.map((stage) => (
            <button
              key={stage.id}
              type="button"
              className={`aios-stage-card ${selectedStageId === stage.id ? 'is-active' : ''}`}
              onClick={() => setSelectedStageId(stage.id)}
              aria-pressed={selectedStageId === stage.id}
            >
              <div className="aios-stage-card-head">
                <span className="aios-pill">{stage.statusTag}</span>
                <strong>{stage.label}</strong>
              </div>
              <p>{stage.summary}</p>
            </button>
          ))}
        </div>

        {selectedStage && (
          <div className="aios-stage-details">
            <div className="aios-card-header">
              <div>
                <h3 className="aios-card-title">{selectedStage.label} · {selectedStage.name}</h3>
                <p className="aios-card-subtitle">{selectedStage.description}</p>
              </div>
              <span className="aios-tag">{selectedStage.statusTag}</span>
            </div>
            <div className="aios-detail-label">Key goals</div>
            <ul className="aios-list">
              {selectedStage.goals.map((goal) => (
                <li key={goal}>
                  <span className="aios-dot" />
                  {goal}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="aios-card-footnote">
          Mock sequencing only – pipeline orchestration will call backend once PLC + pipelines land.
        </div>
      </div>
    </div>
  );
}
