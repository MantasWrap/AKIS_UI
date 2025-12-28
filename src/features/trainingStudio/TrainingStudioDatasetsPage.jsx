import React, { useEffect, useState } from 'react';
import { API_BASE } from '../../api/client.js';

export function TrainingStudioDatasetsPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    media_path: '',
    site_id: 'SITE_LT_01',
    line_id: 'LINE_01',
    camera_id: '',
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDatasets() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/api/training-studio/datasets`);
        const body = await res.json();
        if (!res.ok || body.status !== 'ok') {
          throw new Error(body.error || 'Failed to load datasets');
        }
        if (!cancelled) {
          setDatasets(body.datasets || []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Failed to load datasets');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDatasets();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/training-studio/datasets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          media_path: form.media_path,
          site_id: form.site_id,
          line_id: form.line_id,
          camera_id: form.camera_id || null,
          media_type: 'video',
          item_source: 'MANUAL',
        }),
      });

      const body = await res.json();
      if (!res.ok || body.status !== 'ok') {
        throw new Error(body.error || 'Failed to create dataset');
      }
      setDatasets((prev) => [...prev, body.dataset]);
      setForm((prev) => ({
        ...prev,
        name: '',
        media_path: '',
      }));
    } catch (e) {
      setError(e.message || 'Failed to create dataset');
    }
  }

  return (
    <section className="ts-page">
      <header className="ts-page-header">
        <div>
          <h2>Datasets &amp; Media</h2>
          <p>Register media for manual training and experiments.</p>
        </div>
      </header>

      <div className="ts-layout-split">
        <section className="ts-panel">
          <h3>New dataset</h3>
          <form className="ts-form" onSubmit={onSubmit}>
            <label className="ts-field">
              <span>Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>

            <label className="ts-field">
              <span>Media path on controller PC</span>
              <input
                type="text"
                value={form.media_path}
                onChange={(e) =>
                  setForm({ ...form, media_path: e.target.value })
                }
                placeholder="/data/training/videos/foo.mp4"
                required
              />
            </label>

            <div className="ts-field-grid">
              <label className="ts-field">
                <span>Site</span>
                <input
                  type="text"
                  value={form.site_id}
                  onChange={(e) =>
                    setForm({ ...form, site_id: e.target.value })
                  }
                />
              </label>
              <label className="ts-field">
                <span>Line</span>
                <input
                  type="text"
                  value={form.line_id}
                  onChange={(e) =>
                    setForm({ ...form, line_id: e.target.value })
                  }
                />
              </label>
              <label className="ts-field">
                <span>Camera ID</span>
                <input
                  type="text"
                  value={form.camera_id}
                  onChange={(e) =>
                    setForm({ ...form, camera_id: e.target.value })
                  }
                  placeholder="CAM01"
                />
              </label>
            </div>

            {error && <p className="ts-error">{error}</p>}

            <button type="submit" className="ts-btn">
              Save dataset
            </button>
          </form>
        </section>

        <section className="ts-panel">
          <h3>Existing datasets</h3>
          {loading && <p className="ts-helper">Loading datasets…</p>}
          {!loading && error && <p className="ts-error">{error}</p>}
          {!loading && !error && datasets.length === 0 && (
            <p className="ts-helper">No datasets yet.</p>
          )}
          {!loading && !error && datasets.length > 0 && (
            <div className="ts-table-wrap">
              <table className="ts-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Site/Line</th>
                    <th>Camera</th>
                    <th>Media path</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((dataset) => (
                    <tr key={dataset.id}>
                      <td>{dataset.name}</td>
                      <td>
                        {dataset.site_id} / {dataset.line_id}
                      </td>
                      <td>{dataset.camera_id || 'n/a'}</td>
                      <td>
                        <code>{dataset.media_path}</code>
                      </td>
                      <td>{dataset.media_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
