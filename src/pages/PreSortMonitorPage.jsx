import React, { useEffect, useMemo, useState } from 'react';
import { fetchPhotoboxLatestAll } from '../api/photoboxClient';

function badge(evt) {
  if (!evt) return { text: 'NO DATA', cls: 'badge badge-muted' };
  if (evt.schema === 'photobox_inference_failed_v1') {
    return { text: `FAILED: ${evt.error_code}`, cls: 'badge badge-danger' };
  }
  if (evt.schema === 'photobox_inference_result_v1') {
    return { text: `OK: ${evt.quality_grade}`, cls: 'badge badge-success' };
  }
  return { text: evt.schema, cls: 'badge badge-muted' };
}

export default function PreSortMonitorPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPhotoboxLatestAll();
      setEvents(res.events || []);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, []);

  const rows = useMemo(() => {
    const sorted = [...events].sort((a, b) =>
      (a.photobox_id || '').localeCompare(b.photobox_id || ''),
    );
    return sorted;
  }, [events]);

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Pre-sort monitor</h2>
      <div style={{ opacity: 0.7, marginBottom: 12 }}>
        Shows latest inference event per photobox (OK or FAILED).
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            border: '1px solid #f0c',
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          Error: {error}
        </div>
      )}

      {loading && !rows.length ? (
        <div>Loading...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                textAlign: 'left',
                borderBottom: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <th style={{ padding: 8 }}>Photobox</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Item</th>
              <th style={{ padding: 8 }}>Chute</th>
              <th style={{ padding: 8 }}>Detail</th>
              <th style={{ padding: 8 }}>Received</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((evt) => {
              const b = badge(evt);
              const chute = evt?.sorting_plan?.chute_id || '-';
              const detail = evt?.detail || '-';
              return (
                <tr
                  key={(evt.photobox_id || 'x') + ':' + (evt.item_id || Math.random())}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <td style={{ padding: 8 }}>{evt.photobox_id}</td>
                  <td style={{ padding: 8 }}>
                    <span className={b.cls}>{b.text}</span>
                  </td>
                  <td style={{ padding: 8, fontFamily: 'monospace' }}>
                    {evt.item_id}
                  </td>
                  <td style={{ padding: 8 }}>{chute}</td>
                  <td
                    style={{
                      padding: 8,
                      maxWidth: 520,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {detail}
                  </td>
                  <td style={{ padding: 8, fontFamily: 'monospace' }}>
                    {evt.received_at || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <style>{`
        .badge{display:inline-block;padding:3px 8px;border-radius:999px;font-size:12px;font-weight:600}
        .badge-success{background:rgba(0,200,120,0.18);border:1px solid rgba(0,200,120,0.35)}
        .badge-danger{background:rgba(255,60,60,0.18);border:1px solid rgba(255,60,60,0.35)}
        .badge-muted{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12)}
      `}</style>
    </div>
  );
}
