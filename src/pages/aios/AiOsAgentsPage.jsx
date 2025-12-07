import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

export default function AiOsAgentsPage() {
  const { agents } = aiOsMockData;

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">AI OS · Agents</h2>
            <p className="aios-card-subtitle">Owner-level AI collaborators pulled from docs specs.</p>
          </div>
          <span className="aios-tag">{agents.total} total</span>
        </div>
        <div className="aios-table">
          <div className="aios-table-row aios-table-row--head">
            <span>Agent</span>
            <span>Focus</span>
            <span>Status</span>
            <span>Cost</span>
          </div>
          {agents.roster.map((agent) => (
            <div key={agent.name} className="aios-table-row">
              <span>
                <strong>{agent.name}</strong>
                <div style={{ color: 'var(--dev-text-muted)', fontSize: '0.8rem' }}>{agent.role}</div>
              </span>
              <span>{agent.focus}</span>
              <span>
                <span className="aios-pill">{agent.status}</span>
              </span>
              <span>
                {agent.cost}
                <div style={{ color: 'var(--dev-text-muted)', fontSize: '0.8rem' }}>
                  {agent.actions} actions
                </div>
              </span>
            </div>
          ))}
        </div>
        <div className="aios-card-footnote">
          Mocked from Owner_Agents_Dashboard_Spec.md — backend wiring to come with AI OS pipelines.
        </div>
      </div>
    </div>
  );
}
