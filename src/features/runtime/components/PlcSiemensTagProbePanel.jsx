import React, { useMemo, useState } from 'react';
import { API_BASE } from '../../../api/client.js';
import { useCurrentSiteLine } from '../hooks/useCurrentSiteLine.js';

function getDebugHeaders() {
  const token =
    import.meta.env.VITE_AKIS_DEBUG_TOKEN ||
    import.meta.env.VITE_DEBUG_TOKEN ||
    '';
  if (!token) return {};
  return { 'x-debug-token': token };
}

async function postTagProbe({ siteId, lineId, tags }) {
  const params = new URLSearchParams();
  if (siteId) params.set('site_id', siteId);
  if (lineId) params.set('line_id', lineId);

  const url = `${API_BASE}/api/debug/plc/siemens/tag-probe?${params.toString()}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...getDebugHeaders(),
    },
    body: JSON.stringify({ site_id: siteId, line_id: lineId, tags }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || body.error || `Probe failed (${res.status})`);
    err.code = body.error;
    throw err;
  }
  return body.result || null;
}

export function PlcSiemensTagProbePanel() {
  const { siteId, lineId } = useCurrentSiteLine();

  const defaults = useMemo(
    () => [
      { key: 'estop_main', logical: 'AKIS_SAFETY_ESTOP_MAIN_ACTIVE' },
      { key: 'plc_fault', logical: 'AKIS_PLC_GENERAL_FAULT' },
    ],
    [],
  );

  const [tagsJson, setTagsJson] = useState(JSON.stringify(defaults, null, 2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const onProbe = async () => {
    setError('');
    setResult(null);

    let tags = null;
    try {
      const parsed = JSON.parse(tagsJson);
      if (!Array.isArray(parsed)) {
        throw new Error('Input must be a JSON array of {key, logical} or {key, address}.');
      }
      tags = parsed;
    } catch (e) {
      setError(e.message || 'Invalid JSON');
      return;
    }

    try {
      setLoading(true);
      const data = await postTagProbe({ siteId, lineId, tags });
      setResult(data);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Probe failed');
    } finally {
      setLoading(false);
    }
  };

  const rows =
    result?.read?.results && typeof result.read.results === 'object'
      ? Object.entries(result.read.results)
      : [];

  return (
    <section className="dev-card runtime-line-summary">
      <header className="dev-card-header">
        <div>
          <p className="dev-card-eyebrow">PLC / Siemens</p>
          <h3>Tag read probe</h3>
        </div>
        <div className="runtime-line-summary-badges">
          <button
            className="dev-btn"
            onClick={onProbe}
            disabled={loading}
            type="button"
          >
            {loading ? 'Reading…' : 'Probe'}
          </button>
        </div>
      </header>

      {error && <p className="runtime-alerts-error">{error}</p>}

      <div className="runtime-line-summary-body">
        <div className="runtime-line-summary-section">
          <h4>Tags (JSON)</h4>
          <p className="runtime-line-summary-note">
            Provide a JSON array. Each item may include <code>logical</code> or{' '}
            <code>address</code>.
          </p>
          <textarea
            value={tagsJson}
            onChange={(e) => setTagsJson(e.target.value)}
            className="dev-textarea"
            rows={8}
          />
        </div>

        <div className="runtime-line-summary-section">
          <h4>Results</h4>
          {!result && <p className="runtime-line-summary-note">No probe yet.</p>}

          {result && (
            <>
              <ul className="runtime-line-summary-list">
                <li>
                  <span className="runtime-alerts-label">Read OK</span>
                  <span className="runtime-alerts-pill is-unknown">
                    {result.read?.ok ? 'YES' : 'NO'}
                  </span>
                </li>
                <li>
                  <span className="runtime-alerts-label">Elapsed</span>
                  <span className="runtime-alerts-pill is-unknown">
                    {result.read?.elapsed_ms ?? null} ms
                  </span>
                </li>
                {result.read?.error && (
                  <li>
                    <span className="runtime-alerts-label">Error</span>
                    <span className="runtime-alerts-pill is-alert">
                      {result.read.error}
                    </span>
                  </li>
                )}
              </ul>

              {rows.length > 0 && (
                <div className="dev-table-wrap">
                  <table className="dev-table">
                    <thead>
                      <tr>
                        <th>Key</th>
                        <th>Address</th>
                        <th>Raw</th>
                        <th>Bool</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(([key, v]) => (
                        <tr key={key}>
                          <td>
                            <code>{key}</code>
                          </td>
                          <td>
                            <code>{v?.address ?? ''}</code>
                          </td>
                          <td>
                            <code>{v?.raw === null ? 'null' : String(v?.raw)}</code>
                          </td>
                          <td>{v?.bool === null ? '—' : v.bool ? 'TRUE' : 'FALSE'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
