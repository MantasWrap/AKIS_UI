import { useMemo, useState } from 'react';
import '../../styles/aios.css';
import '../../styles/api.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

function stringify(value) {
  if (!value) return '';
  return JSON.stringify(value, null, 2);
}

export default function OwnerApiDocsPage() {
  const { api } = aiOsMockData;
  const [tab, setTab] = useState(api.tabs[0]?.id ?? 'owner');

  const currentTab = api.tabs.find((entry) => entry.id === tab) || api.tabs[0];

  const defaultEndpointId = currentTab?.groups?.[0]?.endpoints?.[0]?.id ?? null;
  const [selectedEndpointId, setSelectedEndpointId] = useState(defaultEndpointId);
  const [copiedField, setCopiedField] = useState(null);

  const allEndpoints = useMemo(() => {
    if (!currentTab) return [];
    return currentTab.groups.flatMap((group) =>
      group.endpoints.map((endpoint) => ({ ...endpoint, groupId: group.id })),
    );
  }, [currentTab]);

  const selectedEndpoint =
    allEndpoints.find((endpoint) => endpoint.id === selectedEndpointId) || allEndpoints[0];

  const handleCopy = async (text, field) => {
    if (!text) return;
    try {
      if (typeof navigator === 'undefined' || !navigator?.clipboard) {
        console.warn('Clipboard unavailable in this environment');
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch (error) {
      console.warn('Clipboard copy failed', error);
    }
  };

  const buildCurl = (endpoint) => {
    if (!endpoint) return '';
    const base = 'https://api.mock-akis.dev';
    const headers = `-H "Authorization: Bearer ${tab.toUpperCase()}_TOKEN" -H "Content-Type: application/json"`;
    if (endpoint.request?.body?.example) {
      return `curl -X ${endpoint.method} ${base}${endpoint.path} ${headers} -d '${JSON.stringify(
        endpoint.request.body.example,
      )}'`;
    }
    return `curl -X ${endpoint.method} ${base}${endpoint.path} ${headers}`;
  };

  return (
    <div className="aios-page api-docs-page">
      <div className="dev-card aios-card aios-card--stacked">
        <div className="aios-card-header api-docs-header">
          <div>
            <p className="aios-card-eyebrow">API hub preview</p>
            <h2 className="aios-card-title">Owner &amp; tenant APIs</h2>
            <p className="aios-card-subtitle">{api.description}</p>
          </div>
          <span className="aios-tag">{api.release}</span>
        </div>

        <div className="api-docs-tabs" role="tablist" aria-label="API surfaces">
          {api.tabs.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={tab === entry.id}
              className={`api-docs-tab ${tab === entry.id ? 'is-active' : ''}`}
              onClick={() => {
                setTab(entry.id);
                setSelectedEndpointId(entry.groups?.[0]?.endpoints?.[0]?.id ?? null);
              }}
            >
              <span>{entry.label}</span>
              <p>{entry.summary}</p>
            </button>
          ))}
        </div>

        <div className="api-docs-layout">
          <aside className="api-docs-sidebar" aria-label="Endpoint list">
            {currentTab?.groups?.map((group) => (
              <div key={group.id} className="api-docs-group">
                <h4>{group.label}</h4>
                <p>{group.description}</p>
                <ul>
                  {group.endpoints.map((endpoint) => {
                    const isActive = endpoint.id === selectedEndpoint?.id;
                    return (
                      <li key={endpoint.id}>
                        <button
                          type="button"
                          className={`api-docs-endpoint ${isActive ? 'is-active' : ''}`}
                          onClick={() => setSelectedEndpointId(endpoint.id)}
                        >
                          <span className={`api-docs-method method-${endpoint.method.toLowerCase()}`}>
                            {endpoint.method}
                          </span>
                          <div>
                            <strong>{endpoint.summary}</strong>
                            <code>{endpoint.path}</code>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </aside>

          <section className="api-docs-detail">
            {selectedEndpoint ? (
              <>
                <div className="api-docs-detail-head">
                  <div>
                    <span className={`api-docs-method method-${selectedEndpoint.method.toLowerCase()}`}>
                      {selectedEndpoint.method}
                    </span>
                    <code>{selectedEndpoint.path}</code>
                  </div>
                  <div className="api-docs-detail-actions">
                    <button
                      type="button"
                      className="dev-pill-button ghost"
                      onClick={() => handleCopy(selectedEndpoint.path, 'path')}
                    >
                      {copiedField === 'path' ? 'Copied path' : 'Copy path'}
                    </button>
                    <button
                      type="button"
                      className="dev-pill-button"
                      onClick={() => handleCopy(buildCurl(selectedEndpoint), 'curl')}
                    >
                      {copiedField === 'curl' ? 'Copied curl' : 'Copy curl'}
                    </button>
                  </div>
                </div>
                <p className="api-docs-detail-summary">{selectedEndpoint.description}</p>
                <div className="api-docs-meta">
                  <span>{selectedEndpoint.access}</span>
                  {selectedEndpoint.tags && (
                    <div className="api-docs-tag-row">
                      {selectedEndpoint.tags.map((tag) => (
                        <span key={tag} className="aios-pill aios-pill--muted">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="api-docs-section">
                  <h4>Request</h4>
                  {selectedEndpoint.request?.params?.length ? (
                    <table className="api-docs-table">
                      <thead>
                        <tr>
                          <th>Parameter</th>
                          <th>Type</th>
                          <th>Required</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEndpoint.request.params.map((param) => (
                          <tr key={param.name}>
                            <td>{param.name}</td>
                            <td>{param.type}</td>
                            <td>{param.required ? 'Yes' : 'No'}</td>
                            <td>{param.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="api-docs-muted">No query/path params.</p>
                  )}

                  {selectedEndpoint.request?.body ? (
                    <div className="api-docs-json">
                      <header>Body ({selectedEndpoint.request.body.type})</header>
                      <pre>
                        <code>{stringify(selectedEndpoint.request.body.example)}</code>
                      </pre>
                    </div>
                  ) : null}
                </div>

                <div className="api-docs-section">
                  <h4>Responses</h4>
                  <div className="api-docs-json">
                    <header>Success · {selectedEndpoint.response.success.code}</header>
                    <pre>
                      <code>{stringify(selectedEndpoint.response.success.json)}</code>
                    </pre>
                  </div>
                  {selectedEndpoint.response.error && (
                    <div className="api-docs-json api-docs-json--error">
                      <header>Error · {selectedEndpoint.response.error.code}</header>
                      <pre>
                        <code>{stringify(selectedEndpoint.response.error.json)}</code>
                      </pre>
                      {selectedEndpoint.response.error.note && (
                        <p className="api-docs-muted">{selectedEndpoint.response.error.note}</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="api-docs-empty">
                <p>Select an endpoint on the left to inspect its details.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
