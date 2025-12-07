import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

export default function AiOsMissionsPage() {
  const { missions } = aiOsMockData;

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">Missions</h2>
            <p className="aios-card-subtitle">Multi-agent missions &amp; orchestration placeholders.</p>
          </div>
          <span className="aios-tag">Mock only</span>
        </div>

        <div className="aios-mission-list">
          {missions.items.map((mission) => (
            <div key={mission.name} className="aios-mission-card">
              <h4>{mission.name}</h4>
              <div className="aios-highlight-sub">
                {mission.status} · {mission.eta}
              </div>
              <p>{mission.description}</p>
            </div>
          ))}
        </div>

        <div className="aios-card-footnote">{missions.note}</div>
      </div>
    </div>
  );
}
