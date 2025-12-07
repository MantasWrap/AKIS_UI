import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

export default function OwnerApiDocsPage() {
  const { api } = aiOsMockData;

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">API documentation</h2>
            <p className="aios-card-subtitle">Owner + developer API overview (future work).</p>
          </div>
          <span className="aios-tag">Stub</span>
        </div>

        <div className="aios-api-grid">
          {api.sections.map((section) => (
            <div key={section.title} className="aios-placeholder">
              <strong>{section.title}</strong>
              <p style={{ margin: '0.35rem 0 0', color: 'var(--dev-text-muted)' }}>{section.body}</p>
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
