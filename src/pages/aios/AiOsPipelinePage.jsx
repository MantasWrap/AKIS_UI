import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

const STATE_COLORS = {
  done: 'rgba(34,197,94,0.18)',
  in_progress: 'rgba(59,130,246,0.2)',
  up_next: 'rgba(249,115,22,0.2)',
  future: 'rgba(148,163,184,0.25)',
};

export default function AiOsPipelinePage() {
  const { pipeline } = aiOsMockData;

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">AI dev pipeline</h2>
            <p className="aios-card-subtitle">Derived from AI_Development_Pipeline.md</p>
          </div>
          <span className="aios-tag">{`Stage ${pipeline.stage}`}</span>
        </div>

        <div className="aios-stage-list">
          {pipeline.stages.map((stage) => (
            <div key={stage.id} className="aios-stage-item">
              <div>
                <strong>{`${stage.id} · ${stage.label}`}</strong>
                <div style={{ color: 'var(--dev-text-muted)', marginTop: '0.15rem' }}>{stage.summary}</div>
              </div>
              <span
                className="aios-pill"
                style={{ background: STATE_COLORS[stage.state] || 'rgba(0,0,0,0.05)', color: 'var(--dev-text-soft)' }}
              >
                {stage.state.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>

        <div className="aios-card-footnote">
          Mock sequencing only – pipeline orchestration will call backend once PLC + pipelines land.
        </div>
      </div>
    </div>
  );
}
