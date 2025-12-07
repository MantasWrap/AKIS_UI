import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

export default function AiOsSettingsPage() {
  const { settings } = aiOsMockData;

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">AI OS settings</h2>
            <p className="aios-card-subtitle">Read-only toggles until backend wiring lands.</p>
          </div>
          <span className="aios-tag">Mock</span>
        </div>

        <div className="aios-settings-list">
          {settings.toggles.map((toggle) => (
            <label key={toggle.id} className="aios-settings-entry">
              <div>
                {toggle.label}
                <small>{toggle.helper}</small>
              </div>
              <input
                type="checkbox"
                checked={toggle.enabled}
                readOnly
                disabled
                aria-readonly="true"
              />
            </label>
          ))}
        </div>

        <div className="aios-card-footnote">{settings.note}</div>
      </div>
    </div>
  );
}
