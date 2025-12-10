import { useState } from 'react';
import '../styles/devDashboard.css';
import { devDashboardMock } from '../mock/devConsoleMockData.js';

export default function StatusPage() {
  const {
    hero,
    systemOverview,
    controllerHealth,
    endpoints,
  } = devDashboardMock;
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = async (value, id) => {
    if (!navigator?.clipboard || !value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch (error) {
      console.warn('Copy failed', error);
    }
  };

  return (
    <div className="dev-dashboard-page">
      <section className="dev-card dev-dashboard-card">
        <header className="dev-dashboard-card-header">
          <div>
            <p className="dev-card-eyebrow">{hero.eyebrow}</p>
            <h2 className="dev-card-title">System overview</h2>
            <p className="dev-card-subtitle">{hero.body}</p>
          </div>
          <span className="dev-status-chip status-mock">Mock only</span>
        </header>
        <div className="dev-dashboard-pill-row">
          {systemOverview.map((tile) => (
            <article key={tile.id} className="dev-dashboard-pill">
              <div className="pill-top">
                <span className="pill-label">{tile.label}</span>
                <span className={`dev-status-chip status-${tile.status}`}>
                  {tile.statusLabel}
                </span>
              </div>
              <p className="pill-description">{tile.description}</p>
              <span className="pill-meta">{tile.meta}</span>
            </article>
          ))}
        </div>
      </section>

      <div className="dev-dashboard-grid">
        <section className="dev-card dev-controller-card">
          <header className="dev-dashboard-card-header">
            <div>
              <h3 className="dev-card-title">Controller & database</h3>
              <p className="dev-card-subtitle">Structured fields ready for live health data.</p>
            </div>
            <span className="dev-status-chip status-waiting">Awaiting runtime</span>
          </header>
          <p className="dev-controller-summary">{controllerHealth.summary}</p>
          <dl className="dev-controller-grid">
            {controllerHealth.fields.map((field) => (
              <div key={field.id} className="dev-controller-field">
                <dt>{field.label}</dt>
                <dd className={field.placeholder ? 'is-placeholder' : ''}>
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="dev-controller-footnote">{controllerHealth.emptyState}</div>
        </section>

        <section className="dev-card dev-endpoints-card">
          <header className="dev-dashboard-card-header">
            <div>
              <h3 className="dev-card-title">Endpoints & tools</h3>
              <p className="dev-card-subtitle">
                Calm list of URLs we keep handy while everything is mock-only.
              </p>
            </div>
          </header>
          <div className="dev-endpoint-base">
            <span className="dev-endpoint-label">API base</span>
            <code>{endpoints.apiBase}</code>
          </div>
          <ul className="dev-endpoint-list">
            {endpoints.list.map((endpoint) => {
              const fullUrl = `${endpoints.apiBase}${endpoint.path}`;
              const isCopied = copiedId === endpoint.id;
              return (
                <li key={endpoint.id} className="dev-endpoint-item">
                  <div className="dev-endpoint-main">
                    <div>
                      <p className="dev-endpoint-title">{endpoint.label}</p>
                      <p className="dev-endpoint-description">{endpoint.description}</p>
                    </div>
                    <button
                      type="button"
                      className="dev-pill-button active"
                      onClick={() => handleCopy(fullUrl, endpoint.id)}
                    >
                      {isCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="dev-endpoint-path">{fullUrl}</code>
                </li>
              );
            })}
          </ul>
          <div className="dev-endpoint-docs">
            <p className="dev-endpoint-label">Docs</p>
            <ul>
              {endpoints.docs.map((doc) => (
                <li key={doc.id}>
                  <p className="dev-endpoint-title">{doc.label}</p>
                  <p className="dev-endpoint-description">{doc.description}</p>
                  <code>{doc.path}</code>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
