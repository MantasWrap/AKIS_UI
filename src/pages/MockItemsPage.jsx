import { useEffect, useMemo, useState } from 'react';
import { API_BASE, getMockItems, getRuntimeItems } from '../api/client';
import ItemHistoryPanel from '../components/ItemHistoryPanel';

const LIMIT_OPTIONS = [10, 25, 50, 100];
const PICK_STATUS_OPTIONS = ['PENDING', 'FIRED', 'MISSED', 'ERROR'];

export default function MockItemsPage() {
  const [source, setSource] = useState('runtime'); // 'runtime' | 'mock'
  const [limit, setLimit] = useState(25);
  const [pickStatus, setPickStatus] = useState('all');
  const [chuteId, setChuteId] = useState('');
  const [itemIdFilter, setItemIdFilter] = useState('');
  const [rawItems, setRawItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [historyItemId, setHistoryItemId] = useState(null);

  const visibleItems = useMemo(() => {
    const trimmed = itemIdFilter.trim().toLowerCase();
    return rawItems.filter((item) => {
      if (hiddenIds.has(item.item_id)) return false;
      if (!trimmed) return true;
      return (item.item_id || '').toLowerCase().includes(trimmed);
    });
  }, [rawItems, hiddenIds, itemIdFilter]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const available = new Set(visibleItems.map((item) => item.item_id));
      const next = new Set([...prev].filter((id) => available.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [visibleItems]);

  useEffect(() => {
    loadItems(source, limit, pickStatus, chuteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, limit, pickStatus, chuteId]);

  async function loadItems(nextSource = source, nextLimit = limit, status = pickStatus, chute = chuteId) {
    setLoading(true);
    setError(null);
    try {
      const result =
        nextSource === 'runtime'
          ? await getRuntimeItems({
              limit: nextLimit,
              pick_status: status !== 'all' ? status : undefined,
              chute_id: chute.trim() ? chute.trim() : undefined,
            })
          : await getMockItems(nextLimit);
      if (result?.ok === false) {
        setError(deriveItemsError(result));
        setRawItems([]);
        setTotal(0);
      } else {
        setRawItems(result.items || []);
        setTotal(result.total || 0);
        setHiddenIds(new Set());
        setError(null);
      }
      setSelectedIds(new Set());
    } catch (err) {
      setError(deriveItemsError({ error: err.message }));
      setRawItems([]);
      setTotal(0);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }

  const selectedItems = useMemo(
    () => visibleItems.filter((item) => selectedIds.has(item.item_id)),
    [visibleItems, selectedIds]
  );

  const allVisibleSelected =
    visibleItems.length > 0 && visibleItems.every((item) => selectedIds.has(item.item_id));

  const toggleSelectAll = () => {
    if (visibleItems.length === 0) return;
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(visibleItems.map((item) => item.item_id)));
  };

  const toggleItemSelection = (itemId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleCopySelected = async () => {
    if (!selectedItems.length || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(selectedItems.map((item) => item.item_id).join('\n'));
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(`Failed to copy IDs: ${err.message}`);
    }
  };

  const handleExportSelected = () => {
    if (!selectedItems.length) return;
    const blob = new Blob([JSON.stringify(selectedItems, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `runtime-items-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRemoveFromView = () => {
    if (!selectedItems.length) return;
    setHiddenIds((prev) => {
      const next = new Set(prev);
      selectedItems.forEach((item) => next.add(item.item_id));
      return next;
    });
    setSelectedIds(new Set());
  };

  const clearHidden = () => setHiddenIds(new Set());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="dev-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="dev-card-title">Runtime items</div>
            <p className="dev-card-subtitle">
              Phase 0 debug view (OWNER / ENGINEER). API base:{' '}
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{API_BASE}</span>
            </p>
          </div>
          <SourceToggle source={source} setSource={(value) => setSource(value)} disabled={loading} />
        </div>
        <FilterToolbar
          source={source}
          limit={limit}
          setLimit={setLimit}
          pickStatus={pickStatus}
          setPickStatus={setPickStatus}
          chuteId={chuteId}
          setChuteId={setChuteId}
          itemIdFilter={itemIdFilter}
          setItemIdFilter={setItemIdFilter}
          loading={loading}
        />
        <div className="dev-toolbar" style={{ marginTop: '1rem' }}>
          <button className="dev-pill-button active" onClick={() => loadItems(source, limit, pickStatus, chuteId)} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          {hiddenIds.size > 0 && (
            <button className="dev-ghost-button" onClick={clearHidden} disabled={loading}>
              Restore removed items ({hiddenIds.size})
            </button>
          )}
        </div>
      </div>

      {error && <div style={{ color: 'var(--dev-error)' }}>{error}</div>}

      {!error && !loading && visibleItems.length === 0 && (
        <div className="dev-card">
          {source === 'runtime'
            ? 'No runtime items yet — start Jetson dev runtime or send a manual ingest request.'
            : 'No mock items to show.'}
        </div>
      )}

      {!error && visibleItems.length > 0 && (
        <div className="dev-card">
          {selectedIds.size > 0 && (
            <SelectedActionsBar
              count={selectedIds.size}
              onCopy={handleCopySelected}
              onExport={handleExportSelected}
              onClear={() => setSelectedIds(new Set())}
              onRemove={handleRemoveFromView}
            />
          )}
          <div style={{ overflowX: 'auto' }}>
            <table className="dev-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all visible items"
                    />
                  </th>
                  <th>item_id</th>
                  <th>timestamp</th>
                  <th>encoder</th>
                  <th>site</th>
                  <th>line</th>
                  <th>prediction</th>
                  <th>chute</th>
                  <th>pick_status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr key={item.item_id} className={selectedIds.has(item.item_id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.item_id)}
                        onChange={() => toggleItemSelection(item.item_id)}
                        aria-label={`Select ${item.item_id}`}
                      />
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      <button className="dev-table-link" onClick={() => setHistoryItemId(item.item_id)}>
                        {item.item_id}
                      </button>
                    </td>
                    <td>{formatTimestamp(item.capture?.timestamp)}</td>
                    <td>{item.capture?.encoder_seen ?? '—'}</td>
                    <td>{item.site_id || '—'}</td>
                    <td>{item.line_id || '—'}</td>
                    <td>{formatPrediction(item)}</td>
                    <td>{item.sorting_decision?.chute_id || '—'}</td>
                    <td>{item.plc_feedback?.pick_status || '—'}</td>
                    <td>
                      <button className="dev-table-link" onClick={() => setHistoryItemId(item.item_id)}>
                        View history
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '0.5rem', color: 'var(--dev-text-muted)', fontSize: '0.85rem' }}>
              Showing {visibleItems.length} of {total || rawItems.length} items.
            </div>
          </div>
        </div>
      )}

      <ItemHistoryPanel itemId={historyItemId} onClose={() => setHistoryItemId(null)} />
    </div>
  );
}

function SourceToggle({ source, setSource, disabled }) {
  return (
    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
      {['runtime', 'mock'].map((value) => (
        <button
          key={value}
          className={`dev-pill-button ${source === value ? 'active' : ''}`}
          onClick={() => setSource(value)}
          disabled={disabled}
        >
          {value === 'runtime' ? 'Runtime (controller)' : 'Mock data'}
        </button>
      ))}
    </div>
  );
}

function FilterToolbar({
  source,
  limit,
  setLimit,
  pickStatus,
  setPickStatus,
  chuteId,
  setChuteId,
  itemIdFilter,
  setItemIdFilter,
  loading,
}) {
  return (
    <div className="dev-toolbar" style={{ marginTop: '1rem' }}>
      <div className="dev-toolbar-group">
        <label>
          <span style={{ fontSize: '0.8rem', color: 'var(--dev-text-muted)' }}>Limit</span>
          <select className="dev-select" value={limit} onChange={(e) => setLimit(Number(e.target.value))} disabled={loading}>
            {LIMIT_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      {source === 'runtime' && (
        <>
          <div className="dev-toolbar-group">
            <label>
              <span style={{ fontSize: '0.8rem', color: 'var(--dev-text-muted)' }}>pick_status</span>
              <select className="dev-select" value={pickStatus} onChange={(e) => setPickStatus(e.target.value)} disabled={loading}>
                <option value="all">All</option>
                {PICK_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="dev-toolbar-group">
            <label>
              <span style={{ fontSize: '0.8rem', color: 'var(--dev-text-muted)' }}>chute_id</span>
              <input
                className="dev-input"
                type="text"
                value={chuteId}
                onChange={(e) => setChuteId(e.target.value)}
                placeholder="CHUTE_JETSON_SIM"
                disabled={loading}
              />
            </label>
          </div>
        </>
      )}
      <div className="dev-toolbar-group" style={{ flex: '1 1 240px' }}>
        <label style={{ width: '100%' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--dev-text-muted)' }}>item_id contains</span>
          <div style={{ position: 'relative' }}>
            <input
              className="dev-input"
              type="text"
              value={itemIdFilter}
              onChange={(e) => setItemIdFilter(e.target.value)}
              placeholder="Search current table"
              disabled={loading}
              style={{ paddingRight: '2rem' }}
            />
            {itemIdFilter && (
              <button
                type="button"
                onClick={() => setItemIdFilter('')}
                style={{
                  position: 'absolute',
                  right: '0.4rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--dev-text-muted)',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            )}
          </div>
        </label>
      </div>
    </div>
  );
}

function SelectedActionsBar({ count, onCopy, onExport, onClear, onRemove }) {
  return (
    <div
      style={{
        border: '1px solid #1976d2',
        background: '#e3f2fd',
        borderRadius: '8px',
        padding: '0.75rem',
        marginBottom: '0.75rem',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <strong>Selected: {count} item(s)</strong>
      <button onClick={onCopy} style={ghostButton}>
        Copy IDs
      </button>
      <button onClick={onExport} style={ghostButton}>
        Export JSON
      </button>
      <button onClick={onRemove} style={ghostButton}>
        Remove from view
      </button>
      <button onClick={onClear} style={ghostButton}>
        Clear selection
      </button>
    </div>
  );
}

function deriveItemsError(result) {
  if (!result) return 'Unknown error.';
  if (result.status === 503) {
    return 'Controller not ready to serve runtime items yet.';
  }
  const message = result.error || 'Request failed.';
  if (message.toLowerCase().includes('failed to fetch')) {
    return `Cannot reach controller at ${API_BASE}. Is npm run dev running?`;
  }
  return message;
}

function formatTimestamp(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatPrediction(item) {
  const category = item.ai_prediction?.classes?.category || '—';
  const subcategory = item.ai_prediction?.classes?.subcategory || null;
  const quality = item.ai_prediction?.classes?.quality || null;
  const fragments = [category];
  if (subcategory) fragments.push(subcategory);
  if (quality) fragments.push(`Q:${quality}`);
  return fragments.join(' / ');
}

const linkButton = {
  border: 'none',
  background: 'none',
  color: 'var(--dev-accent)',
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'underline',
  fontSize: '0.85rem',
};
