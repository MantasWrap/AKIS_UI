import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

export default function AiOsModesPage() {
  const { modes } = aiOsMockData;

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
        <div className="aios-stage-list">
          {modes.list.map((mode) => (
            <div key={mode.name} className="aios-stage-item">
              <div>
                <strong>{mode.name}</strong>
                <div style={{ color: 'var(--dev-text-muted)', fontSize: '0.85rem' }}>{mode.channel}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{mode.usage}</div>
                <small style={{ color: 'var(--dev-text-muted)' }}>{mode.latency}</small>
              </div>
              <span className="aios-pill" style={{ background: 'rgba(59,130,246,0.18)', color: 'var(--dev-text-soft)' }}>
                {mode.status}
              </span>
            </div>
          ))}
        </div>
        <div className="aios-card-footnote">
          Specs source: Owner_AI_OS_Home_Spec.md &amp; Owner_AI_OS_Settings_Spec.md · data mocked only.
        </div>
      </div>
    </div>
  );
}
