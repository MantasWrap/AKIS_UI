import React, { useEffect, useMemo, useState } from 'react';
import { fetchRecentPhotoboxInspections } from '../api/photoboxClient';

export default function PreSortMonitorPage() {
  const [state, setState] = useState({ loading: true, error: null, events: [] });

  async function load() {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchRecentPhotoboxInspections({ limit: 80 });
      setState({ loading: false, error: null, events: data?.events || [] });
    } catch (err) {
      setState({ loading: false, error: err?.message || 'Failed to load', events: [] });
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const e of state.events) {
      const key = e.photobox_id || 'UNKNOWN';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return Array.from(map.entries());
  }, [state.events]);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Pre-sort Monitor</h2>
        <button className="dev-nav-link" onClick={load} disabled={state.loading}>
          Refresh
        </button>
      </div>

      <p style={{ opacity: 0.8, marginTop: 8 }}>
        Option B (distributed capture): latest photobox inference results ingested by Controller.
      </p>

      {state.error && (
        <div style={{ padding: 12, border: '1px solid rgba(255,0,0,0.35)', borderRadius: 10, marginTop: 12 }}>
          <b>Error:</b> {state.error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12, marginTop: 12 }}>
        {grouped.map(([photoboxId, events]) => {
          const last = events[0];
          return (
            <div key={photoboxId} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: 700 }}>{photoboxId}</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>{last?.received_at || ''}</div>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.9 }}>
                <div><b>Item:</b> {last?.item_id || '-'}</div>
                <div><b>Grade:</b> {last?.quality_grade || '-'} <span style={{ opacity: 0.7 }}>(conf {last?.confidence ?? '-'})</span></div>
                <div><b>Chute:</b> {last?.sorting_plan?.chute_id || '-'}</div>
                <div><b>Model:</b> {last?.model?.id || '-'} {last?.model?.version ? `(${last.model.version})` : ''}</div>
                <div><b>Defects:</b> {Array.isArray(last?.defects) ? last.defects.length : 0}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
