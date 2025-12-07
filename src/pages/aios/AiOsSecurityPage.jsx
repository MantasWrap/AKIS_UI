import { useState } from 'react';
import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

export default function AiOsSecurityPage() {
  const { security } = aiOsMockData;
  const [toggles, setToggles] = useState(security.toggles);
  const [docProfile, setDocProfile] = useState(security.docExposure.profile);

  const handleToggle = (toggleId) => {
    setToggles((prev) =>
      prev.map((toggle) =>
        toggle.id === toggleId ? { ...toggle, enabled: !toggle.enabled } : toggle,
      ),
    );
  };

  return (
    <div className="aios-page">
      <div className="dev-card aios-card aios-card--stacked">
        <div className="aios-card-header">
          <div>
            <p className="aios-card-eyebrow">Safety cockpit</p>
            <h2 className="aios-card-title">Security &amp; access</h2>
            <p className="aios-card-subtitle">Owner-facing controls for OS Security (mock only).</p>
          </div>
          <span className="aios-tag">OS Security</span>
        </div>

        <div className="aios-security-summary">
          <div className="aios-security-pill">
            <span>Security posture</span>
            <strong>{security.summary.posture}</strong>
          </div>
          <div className="aios-security-pill">
            <span>Tenant isolation</span>
            <strong>{security.summary.tenantIsolation}</strong>
            <p>{security.summary.isolationDetail}</p>
          </div>
          <div className="aios-security-chip-row">
            {security.summary.quickChips.map((chip) => (
              <span key={chip.id} className={`aios-security-chip tone-${chip.tone}`}>
                <span>{chip.label}</span>
                <strong>{chip.value}</strong>
              </span>
            ))}
          </div>
          <div className="aios-security-updated">{security.summary.updatedAt}</div>
        </div>

        <section className="aios-security-section">
          <header>
            <h3>Roles &amp; access map</h3>
            <p>Mirror of AI_OS_Security_and_Access_Model.md – read-only mock.</p>
          </header>
          <div className="aios-role-table" role="table" aria-label="Role capability matrix">
            <div className="aios-role-row aios-role-row--head" role="row">
              <div role="columnheader">Role</div>
              {security.capabilities.map((capability) => (
                <div key={capability.id} role="columnheader">
                  {capability.label}
                </div>
              ))}
            </div>
            {security.roles.map((role) => (
              <div key={role.id} className="aios-role-row" role="row">
                <div role="cell">
                  <strong>{role.name}</strong>
                  <p>{role.description}</p>
                  <span className="aios-pill aios-pill--muted">{role.tier}</span>
                </div>
                {security.capabilities.map((capability) => (
                  <div key={`${role.id}-${capability.id}`} role="cell">
                    <span
                      className={`aios-capability-dot ${
                        role.capabilities[capability.id] ? 'is-allowed' : ''
                      }`}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="aios-security-section">
          <header>
            <h3>MFA &amp; verification</h3>
            <p>Switches reflect Owner_Security_and_Access_Settings_Spec.md (mock state only).</p>
          </header>
          <div className="aios-security-toggle-list">
            {toggles.map((toggle) => (
              <label key={toggle.id} className="aios-security-toggle">
                <div>
                  <strong>{toggle.label}</strong>
                  <p>{toggle.helper}</p>
                </div>
                <button
                  type="button"
                  className={`aios-switch ${toggle.enabled ? 'is-on' : ''}`}
                  onClick={() => handleToggle(toggle.id)}
                >
                  <span />
                </button>
              </label>
            ))}
          </div>
        </section>

        <section className="aios-security-section">
          <header>
            <h3>Doc / IP exposure</h3>
            <p>Choose exposure profile + guardrails for AI OS docs.</p>
          </header>
          <div className="aios-doc-profile">
            {security.docExposure.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`aios-doc-profile-card ${docProfile === option.id ? 'is-active' : ''}`}
                onClick={() => setDocProfile(option.id)}
              >
                <div>
                  <strong>{option.label}</strong>
                  <p>{option.summary}</p>
                </div>
                <span>{option.notes}</span>
              </button>
            ))}
          </div>
          <ul className="aios-doc-policy-list">
            {security.docExposure.policies.map((policy) => (
              <li key={policy}>{policy}</li>
            ))}
          </ul>
        </section>

        <div className="aios-card-footnote">
          Mirrors Owner_Security_and_Access_Settings_Spec.md and AI_OS_Security_and_Access_Model.md — backend hooks pending.
        </div>
      </div>
    </div>
  );
}
