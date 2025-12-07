import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

export default function AiOsSecurityPage() {
  const { security } = aiOsMockData;

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">Security &amp; access</h2>
            <p className="aios-card-subtitle">Owner security posture snapshot.</p>
          </div>
          <span className="aios-tag">OS Security</span>
        </div>

        <div className="aios-table">
          <div className="aios-table-row aios-table-row--head">
            <span>Role</span>
            <span>Scope</span>
            <span>Focus</span>
            <span />
          </div>
          {security.roles.map((role) => (
            <div key={role.name} className="aios-table-row">
              <span><strong>{role.name}</strong></span>
              <span>{role.scope}</span>
              <span>{role.focus}</span>
              <span>
                <span className="aios-pill">Doc</span>
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <h3 className="aios-card-title" style={{ fontSize: '1rem' }}>Guardrails</h3>
          <div className="aios-guardrail-list">
            {security.guardrails.map((guardrail) => (
              <span key={guardrail}>• {guardrail}</span>
            ))}
          </div>
        </div>

        <div className="aios-card-footnote">
          Security model mirrors Owner_Security_and_Access_Settings_Spec.md — API hooks pending.
        </div>
      </div>
    </div>
  );
}
