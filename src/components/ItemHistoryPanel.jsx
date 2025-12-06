import { useEffect, useMemo, useState } from 'react';
import { getItemHistory } from '../api/client';

export default function ItemHistoryPanel({ itemId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [requestId, setRequestId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      if (!itemId) return;
      setLoading(true);
      setError(null);
      setHistory([]);
      setRequestId(null);
      const result = await getItemHistory(itemId);
      if (cancelled) return;
      if (result?.error) {
        setError(result.error);
        setRequestId(result.requestId || null);
        setHistory([]);
      } else {
        setHistory(result.events || []);
        setRequestId(result.requestId || null);
        setError(null);
      }
      setLoading(false);
    }
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const content = useMemo(() => {
    if (!itemId) {
      return null;
    }
    if (loading) {
      return <div>Loading history…</div>;
    }
    if (error) {
      return (
        <div style={{ color: 'var(--dev-danger)' }}>
          {error}
          {requestId && (
            <div style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: 'var(--dev-text-muted)' }}>requestId: {requestId}</div>
          )}
        </div>
      );
    }
    if (!history.length) {
      return <div>No history found for this item yet.</div>;
    }
    return (
      <div className="dev-history-events">
        {history.map((event) => (
          <div key={event.id} className="dev-history-event">
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{event.created_at || 'Unknown time'}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--dev-text-muted)', marginBottom: '0.5rem' }}>
              Source: {event.source || '—'} · Pick status: {event.pick_status || '—'} · Chute: {event.chute_id || '—'}
            </div>
            <pre className="dev-json-viewer">{JSON.stringify(event.payload, null, 2)}</pre>
          </div>
        ))}
      </div>
    );
  }, [itemId, loading, error, history, requestId]);

  if (!itemId) {
    return null;
  }

  return (
    <div className="dev-modal-overlay" onClick={onClose}>
      <div
        className="dev-history-panel"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="dev-section-eyebrow">Item history</div>
            <h3 style={{ margin: '0.2rem 0 0.25rem 0' }}>{itemId}</h3>
            <div style={{ color: 'var(--dev-text-muted)', fontSize: '0.85rem' }}>
              View of recent ingest events & payload.
            </div>
          </div>
          <button onClick={onClose} className="dev-ghost-button">
            Close
          </button>
        </div>
        <div style={{ marginTop: '1rem' }}>{content}</div>
      </div>
    </div>
  );
}
