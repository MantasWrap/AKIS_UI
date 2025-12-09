import '../../styles/aios.css';
import { useAiOsMockData } from '../../hooks/useAiOsMockData';

function WhatsNewList({ items }) {
  return (
    <ul className="aios-whats-new">
      {items.map((item) => (
        <li key={item.title}>
          <h4>{item.title}</h4>
          <p>{item.description}</p>
        </li>
      ))}
    </ul>
  );
}

export default function AiOsAboutUpdatesPage() {
  const { about } = useAiOsMockData();
  const releaseLinks = about?.links || {};

  return (
    <div className="aios-page aios-about-page">
      <div className="dev-card aios-card aios-about-hero">
        <div className="aios-about-version">
          <p className="aios-card-eyebrow">Current version</p>
          <h2 className="aios-about-title">{about?.version}</h2>
          <p className="aios-about-codename">Codename · {about?.codename}</p>
        </div>
        <div className="aios-about-meta">
          <div>
            <span className="aios-detail-label">Release date</span>
            <p className="aios-detail-value">{about?.releaseDate}</p>
          </div>
          <div>
            <span className="aios-detail-label">Build</span>
            <p className="aios-detail-value">{about?.build}</p>
          </div>
          <div>
            <span className="aios-detail-label">Highlights</span>
            <p className="aios-detail-value">{about?.highlights?.join(' · ')}</p>
          </div>
        </div>
        <div className="aios-about-actions">
          <a className="aios-primary-btn" href={`/${releaseLinks.changelog || ''}`} target="_blank" rel="noreferrer">
            View full changelog
          </a>
          <a className="aios-secondary-btn" href={`/${releaseLinks.achievements || ''}`} target="_blank" rel="noreferrer">
            View achievements
          </a>
        </div>
      </div>

      <div className="aios-two-column">
        <div className="aios-column">
          <div className="dev-card aios-card">
            <h3 className="aios-card-title">What’s new in {about?.version}</h3>
            <p className="aios-card-subtitle">
              Pulled from <code>docs/EN/CORE/AI_OS_Changelog.md</code>. Mirrors the macOS-style panel MJZ requested.
            </p>
            <WhatsNewList items={about?.whatsNew || []} />
          </div>
        </div>
        <div className="aios-column">
          <div className="dev-card aios-card">
            <h3 className="aios-card-title">Integration notes</h3>
            <ul className="aios-list">
              <li>
                Backend endpoint suggestion: <code>/api/owner/ai-os/releases/current</code> → returns version, codename, whatsNew, links.
              </li>
              <li>
                “View Achievements” button should deep link to the new Achievements & Milestones page (same router key).
              </li>
              <li>
                Expose release metadata to Dev Console shell so other surfaces (toast, header badge) can reference the same source.
              </li>
            </ul>
            <div className="aios-about-links">
              <a className="aios-link" href={`/${releaseLinks.maturity || ''}`} target="_blank" rel="noreferrer">
                AI OS Maturity Tracker
              </a>
              <a className="aios-link" href={`/${releaseLinks.changelog || ''}`} target="_blank" rel="noreferrer">
                AI OS Changelog
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
