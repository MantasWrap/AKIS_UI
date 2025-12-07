import { useMemo, useState } from 'react';
import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

export default function AiOsPipelinePage() {
  const { pipeline } = aiOsMockData;
  const [selectedStageId, setSelectedStageId] = useState(pipeline.currentStageId || pipeline.stages[0]?.id);

  const selectedStage = useMemo(
    () => pipeline.stages.find((stage) => stage.id === selectedStageId) || pipeline.stages[0],
    [pipeline.stages, selectedStageId],
  );

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">AI dev pipeline</h2>
            <p className="aios-card-subtitle">Derived from AI_Development_Pipeline.md</p>
          </div>
          <span className="aios-tag">Current stage · {pipeline.stage}</span>
        </div>

        <div className="aios-stage-grid">
          {pipeline.stages.map((stage) => (
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
