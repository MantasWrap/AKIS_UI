import React, { useEffect, useMemo, useState } from 'react';
import { fetchRecentPhotoboxInspections } from '../../api/photoboxClient.js';

function normalizeViews(evt) {
  const views = Array.isArray(evt?.views) ? evt.views : [];
  const byView = new Map(views.map((v) => [v.view, v]));
  const order = ['top', 'bottom', 'left', 'right'];
  return order.map((k) => {
    const v = byView.get(k);
    return {
      view: k,
      url: v?.image_ref?.url || '',
      image_id: v?.image_ref?.image_id || '',
      mime: v?.image_ref?.mime || '',
    };
  });
}

function statusLabel(evt) {
  const schema = String(evt?.schema || '');
  if (!schema) return { text: 'NO DATA', kind: 'muted' };
  if (schema.includes('failed')) {
    return { text: `FAILED: ${evt.error_code || 'UNKNOWN'}`, kind: 'bad' };
  }
  if (schema.includes('result')) {
    return { text: `OK: ${evt.quality_grade || '-'}`, kind: 'ok' };
  }
  return { text: schema, kind: 'muted' };
}

function StatusChip({ evt }) {
  const s = statusLabel(evt);
  const cls =
    s.kind === 'ok'
      ? 'ts-chip ts-chip-ok'
      : s.kind === 'bad'
        ? 'ts-chip ts-chip-bad'
        : 'ts-chip ts-chip-muted';
  return <span className={cls}>{s.text}</span>;
}

export default function TrainingStudioPhotoboxItemsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetchRecentPhotoboxInspections({ limit: 120 });
      const ev = Array.isArray(res?.events) ? res.events : [];
      setEvents(ev);
      if (!selectedId && ev.length) setSelectedId(ev[0].item_id);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byItem = useMemo(() => {
    const m = new Map();
    for (const e of events) {
      if (!e?.item_id) continue;
      if (!m.has(e.item_id)) m.set(e.item_id, []);
      m.get(e.item_id).push(e);
    }
    return m;
  }, [events]);

  const itemIds = useMemo(() => Array.from(byItem.keys()), [byItem]);

  const selectedEvents = useMemo(
    () => byItem.get(selectedId) || [],
    [byItem, selectedId],
  );
  const latest = selectedEvents[0] || null;

  const views = useMemo(() => normalizeViews(latest), [latest]);
  const missingViews = views.filter((v) => !v.url).map((v) => v.view);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Photobox Items</h2>
      <p className="ts-help">
        Each photobox item_id is one inspection with 4 views (top/bottom/left/right). Click an item to see its images.
      </p>

      {error && (
        <div className="ts-alert ts-alert-bad">
          <b>Error:</b> {error}
        </div>
      )}

      <div className="ts-grid-2">
        <div className="ts-card">
          <div className="ts-card-title">Recent items</div>
          {loading && !itemIds.length ? (
            <div className="ts-muted">Loading...</div>
          ) : !itemIds.length ? (
            <div className="ts-muted">No photobox events yet. Run the sim to generate items.</div>
          ) : (
            <div className="ts-list">
              {itemIds.slice(0, 60).map((id) => {
                const evs = byItem.get(id) || [];
                const head = evs[0] || {};
                const active = id === selectedId;
                return (
                  <button
                    key={id}
                    type="button"
                    className={active ? 'ts-list-row is-active' : 'ts-list-row'}
                    onClick={() => setSelectedId(id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{id}</div>
                      <StatusChip evt={head} />
                    </div>
                    <div className="ts-muted" style={{ marginTop: 6, fontSize: 12 }}>
                      {head.photobox_id || '-'} · {head.received_at || '-'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="ts-card">
          <div className="ts-card-title">Item details</div>

          {!latest ? (
            <div className="ts-muted">Select an item.</div>
          ) : (
            <>
              <div className="ts-kv">
                <div>
                  <span className="ts-muted">item_id</span>
                  <div style={{ fontFamily: 'monospace' }}>{latest.item_id}</div>
                </div>
                <div>
                  <span className="ts-muted">photobox</span>
                  <div>{latest.photobox_id}</div>
                </div>
                <div>
                  <span className="ts-muted">status</span>
                  <div>
                    <StatusChip evt={latest} />
                  </div>
                </div>
                <div>
                  <span className="ts-muted">chute</span>
                  <div>{latest?.sorting_plan?.chute_id || '-'}</div>
                </div>
              </div>

              {missingViews.length > 0 && (
                <div className="ts-alert ts-alert-warn" style={{ marginTop: 10 }}>
                  <b>LOST MEDIA:</b> missing views: {missingViews.join(', ')}
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 10,
                  marginTop: 12,
                }}
              >
                {views.map((v) => (
                  <div key={v.view} className="ts-thumb">
                    <div className="ts-thumb-label">{v.view}</div>
                    {v.url ? (
                      <a href={v.url} target="_blank" rel="noreferrer">
                        <img alt={v.view} src={v.url} />
                      </a>
                    ) : (
                      <div className="ts-thumb-missing">missing</div>
                    )}
                  </div>
                ))}
              </div>

              {String(latest?.schema || '').includes('failed') && (
                <div className="ts-muted" style={{ marginTop: 12 }}>
                  <b>Failure detail:</b> {latest.detail || '-'}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .ts-grid-2{display:grid;grid-template-columns: 380px 1fr;gap:12px}
        @media (max-width: 1100px){.ts-grid-2{grid-template-columns:1fr}}
        .ts-card{border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:12px}
        .ts-card-title{font-weight:700;margin-bottom:10px}
        .ts-help{opacity:0.8;margin-top:6px}
        .ts-muted{opacity:0.7}
        .ts-list{display:flex;flex-direction:column;gap:8px}
        .ts-list-row{width:100%;text-align:left;border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:10px;background:transparent;color:inherit;cursor:pointer}
        .ts-list-row:hover{border-color: rgba(255,255,255,0.18)}
        .ts-list-row.is-active{border-color: rgba(120,180,255,0.55)}
        .ts-chip{display:inline-block;padding:3px 8px;border-radius:999px;font-size:12px;font-weight:700}
        .ts-chip-ok{background:rgba(0,200,120,0.18);border:1px solid rgba(0,200,120,0.35)}
        .ts-chip-bad{background:rgba(255,60,60,0.18);border:1px solid rgba(255,60,60,0.35)}
        .ts-chip-muted{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12)}
        .ts-alert{border-radius:12px;padding:10px;margin-top:10px}
        .ts-alert-bad{border:1px solid rgba(255,60,60,0.35);background:rgba(255,60,60,0.08)}
        .ts-alert-warn{border:1px solid rgba(255,200,60,0.35);background:rgba(255,200,60,0.08)}
        .ts-kv{display:grid;grid-template-columns: 1fr 1fr;gap:10px;margin-top:6px}
        .ts-thumb{border:1px solid rgba(255,255,255,0.12);border-radius:12px;overflow:hidden}
        .ts-thumb-label{padding:6px 8px;font-size:12px;opacity:0.85}
        .ts-thumb img{width:100%;height:90px;object-fit:cover;display:block}
        .ts-thumb-missing{height:90px;display:flex;align-items:center;justify-content:center;opacity:0.6;border-top:1px dashed rgba(255,255,255,0.18)}
      `}</style>
    </div>
  );
}
