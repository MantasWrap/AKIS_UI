import { useEffect, useState } from 'react';
import '../styles/devDashboard.css';
import { devDashboardMock } from '../mock/devConsoleMockData.js';
import { getProgressSummary } from '../api/client';
import { emitNavigation } from '../modules/navigationBus.js';

export default function StatusPage() {
  const {
    hero,
    systemOverview,
    controllerHealth,
    endpoints,
  } = devDashboardMock;
  const [copiedId, setCopiedId] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadSummary() {
      try {
        const data = await getProgressSummary({});
        if (isCancelled) return;

        if (!data) {
          setSummary(null);
          return;
        }

        const payload = data.data || data.summary || data;
        setSummary(payload);
      } catch (error) {
        console.warn('Owner summary load failed', error);
      }
    }

    loadSummary();

    return () => {
      isCancelled = true;
    };
  }, []);

  const currentPhaseText = (() => {
    if (!summary) return '';

    const { activePhaseId, phases, activePhase } = summary;
    if (!Array.isArray(phases) || phases.length === 0) {
      return activePhase || '';
    }

    const phase =
      (activePhaseId && phases.find((p) => p.phaseId === activePhaseId)) ||
      phases[0];

    if (!phase) {
      return activePhase || '';
    }

    const name = phase.name || activePhase || 'Current phase';
    const checklist = phase.checklist || {};
    const completed = Number(checklist.completed || 0);
    const total = Number.isFinite(Number(checklist.total))
      ? Number(checklist.total)
      : 0;
    const percent =
      typeof checklist.percent === 'number'
        ? Math.round(checklist.percent)
        : total > 0
          ? Math.round((completed / total) * 100)
          : 0;

    const totalLabel = total > 0 ? `${completed}/${total}` : `${completed}`;
    return `${name} · ${totalLabel} items · ${percent}% done`;
  })();

  const handleNavigate = (targetKey) => {
    emitNavigation(targetKey);
  };

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
            <h2 className="dev-card-title">Dev dashboard</h2>
            <p className="dev-card-subtitle">{hero.body}</p>
          </div>
          <span className="dev-status-chip status-mock">Mock only</span>
        </header>
        {currentPhaseText && (
          <p
            className="dev-dashboard-phase-line"
          >
            Current phase: {currentPhaseText}
          </p>
        )}
        <div className="dev-dashboard-quick-links">
          <button
            type="button"
            className="dev-dashboard-quick-link"
            onClick={() => handleNavigate('progress')}
          >
            Progress overview
          </button>
          <button
            type="button"
            className="dev-dashboard-quick-link"
            onClick={() => handleNavigate('runtimeStatus')}
          >
            Live mode
          </button>
          <button
            type="button"
            className="dev-dashboard-quick-link"
            onClick={() => handleNavigate('items')}
          >
            Simulation items
          </button>
        </div>
        <div className="dev-dashboard-pill-row">
          {systemOverview.map((tile) => (
            <article key={tile.id} className="dev-dashboard-pill">
              <div className="pill-top">
                <span className="pill-label">{tile.label}</span>
                <span className={`pill-status pill-status-${tile.status}`}>
                  {tile.statusLabel}
                </span>
              </div>
              <p className="pill-description">{tile.description}</p>
              <p className="pill-meta">{tile.meta}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dev-card dev-controller-card">
        <header className="dev-dashboard-card-header">
          <div>
            <h3 className="dev-card-title">Controller &amp; database</h3>
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
            <h3 className="dev-card-title">Endpoints &amp; tools</h3>
            <p className="dev-card-subtitle">
              Calm list of URLs we keep handy while everything is mock-only.
            </p>
          </div>
        </header>
        <div className="dev-endpoints-layout">
          <div className="dev-endpoint-main">
            <div>
              <p className="dev-endpoint-eyebrow">API base</p>
              <p className="dev-endpoint-title">{endpoints.apiBase}</p>
              <p className="dev-endpoint-description">
                Swap this to the real Owner API base when controller + runtime go live.
              </p>
            </div>
          </div>
          <div className="dev-endpoint-lists">
            <div className="dev-endpoint-list-block">
              <p className="dev-endpoint-eyebrow">Health &amp; runtime</p>
              <ul className="dev-endpoint-list">
                {endpoints.list.map((endpoint) => (
                  <li key={endpoint.id} className="dev-endpoint-item">
                    <div className="dev-endpoint-item-main">
                      <div>
                        <p className="dev-endpoint-title">{endpoint.label}</p>
                        <p className="dev-endpoint-description">{endpoint.description}</p>
                      </div>
                      <button
                        type="button"
                        className="dev-endpoint-copy"
                        onClick={() => handleCopy(endpoint.path, endpoint.id)}
                      >
                        {copiedId === endpoint.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <code className="dev-endpoint-path">{endpoint.path}</code>
                  </li>
                ))}
              </ul>
            </div>
            <div className="dev-endpoint-docs">
              <p className="dev-endpoint-eyebrow">Docs</p>
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
          </div>
        </div>
      </section>
    </div>
  );
}
