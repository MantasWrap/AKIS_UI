import { useState } from 'react';
import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

export default function AiOsSettingsPage() {
  const { settings } = aiOsMockData;
  const [toggles, setToggles] = useState(settings.toggles);

  const handleToggle = (toggleId) => {
    setToggles((prev) =>
      prev.map((toggle) =>
        toggle.id === toggleId ? { ...toggle, enabled: !toggle.enabled } : toggle,
      ),
    );
  };

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">AI OS settings</h2>
            <p className="aios-card-subtitle">Read-only toggles sourced from specs.</p>
          </div>
          <span className="aios-tag">Mock</span>
        </div>

        <div className="aios-settings-sections">
          <div className="aios-settings-card">
            <h3>General</h3>
            <div className="aios-settings-list">
              {toggles.map((toggle) => (
                <label key={toggle.id} className="aios-settings-entry">
                  <div>
                    {toggle.label}
                    <small>{toggle.helper}</small>
                    <div className="aios-table-subline">Mock, not persisted</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={toggle.enabled}
                    onChange={() => handleToggle(toggle.id)}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="aios-settings-card">
            <h3>Budgets &amp; limits</h3>
            <div className="aios-detail-grid">
              <div>
                <div className="aios-detail-label">Monthly cap</div>
                <div className="aios-highlight">{settings.budget.monthlyCap}</div>
              </div>
              <div>
                <div className="aios-detail-label">Alert threshold</div>
                <div className="aios-highlight-sub">{settings.budget.alertThreshold}</div>
              </div>
              <div>
                <div className="aios-detail-label">Next review</div>
                <div className="aios-highlight-sub">{settings.budget.nextReview}</div>
              </div>
            </div>
          </div>

          <div className="aios-settings-card">
            <h3>Docs &amp; snapshots</h3>
            <ul className="aios-list">
              {settings.docs.map((doc) => (
                <li key={doc.title}>
                  <span className="aios-dot" />
                  <div>
                    <strong>{doc.title}</strong>
                    <div className="aios-table-subline">{doc.summary}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="aios-card-footnote">{settings.note}</div>
      </div>
    </div>
  );
}
