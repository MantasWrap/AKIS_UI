import { useMemo, useState } from 'react';
import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

const TAB_MAP = [
  { id: 'owner', label: 'Owner API' },
  { id: 'tenant', label: 'Tenant API' },
];

export default function OwnerApiDocsPage() {
  const { api } = aiOsMockData;
  const [tab, setTab] = useState('owner');
  const endpoints = useMemo(() => api.endpoints[tab] || [], [api.endpoints, tab]);

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">API documentation</h2>
            <p className="aios-card-subtitle">Owner and developer API overview (future work).</p>
          </div>
          <span className="aios-tag">Stub</span>
        </div>

        <div className="aios-api-summary">
          {api.sections.map((section) => (
            <div key={section.title} className="aios-placeholder">
              <strong>{section.title}</strong>
              <p>{section.body}</p>
            </div>
          ))}
        </div>

        <div className="aios-tab-list" role="tablist" aria-label="API surface">
          {TAB_MAP.map((tabMeta) => (
            <button
              key={tabMeta.id}
              type="button"
              role="tab"
              aria-selected={tab === tabMeta.id}
              className={`aios-tab ${tab === tabMeta.id ? 'is-active' : ''}`}
              onClick={() => setTab(tabMeta.id)}
            >
              {tabMeta.label}
            </button>
          ))}
        </div>

        <div className="aios-api-grid">
          {endpoints.map((endpoint) => (
            <div key={endpoint.path} className="aios-placeholder">
              <div className="aios-endpoint-head">
                <span className="aios-pill">{endpoint.method}</span>
                <span className="aios-endpoint-status">{endpoint.status}</span>
              </div>
              <div className="aios-endpoint-path">{endpoint.path}</div>
              <p>{endpoint.description}</p>
              <pre className="aios-code">
                <code>{endpoint.example}</code>
              </pre>
            </div>
          ))}
        </div>

        <div className="aios-card-footnote">
          {api.release} • Hook to docs/EN specs once OpenAPI is ready.
        </div>
      </div>
    </div>
  );
}
