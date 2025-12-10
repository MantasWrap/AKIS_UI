import { useEffect, useMemo, useState } from 'react';
import '../styles/items.css';
import { itemsMockData } from '../mock/itemsMockData.js';
import { getRuntimeItems } from '../api/client.js';

const FILTER_DEFAULTS = {
  classLabel: 'all',
  status: 'all',
  camera: 'all',
  period: '24h',
};

export default function MockItemsPage() {
  const { header, filters } = itemsMockData;
  const mockItems = useMemo(() => formatMockItems(itemsMockData.items || []), []);
  const [activeFilters, setActiveFilters] = useState(FILTER_DEFAULTS);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [dataSource, setDataSource] = useState('mock');
  const [items, setItems] = useState(mockItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeFilters.classLabel !== 'all' && item.classLabel !== activeFilters.classLabel) return false;
      if (activeFilters.status !== 'all' && item.status !== activeFilters.status) return false;
      if (activeFilters.camera !== 'all' && item.sourceCamera !== activeFilters.camera) return false;
      if (activeFilters.period !== 'all' && item.lastSeen !== activeFilters.period) return false;
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        return item.id.toLowerCase().includes(term);
      }
      return true;
    });
  }, [items, activeFilters, search]);

  const selectedItem =
    filteredItems.find((item) => item.id === selectedId) ||
    items.find((item) => item.id === selectedId) ||
    null;

  const handleFilterChange = (key, value) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    let active = true;

    async function hydrate() {
      setSelectedId(null);
      if (dataSource === 'mock') {
        setLoading(false);
        setError(null);
        setItems(mockItems);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const runtimeResponse = await getRuntimeItems({ limit: 50 });
        if (!active) return;

        if (Array.isArray(runtimeResponse?.items)) {
          const mapped = runtimeResponse.items
            .map(mapRuntimeItem)
            .filter(Boolean);
          if (mapped.length === 0) {
            setError('Runtime is online but returned no items yet. Showing mock sample.');
            setItems(mockItems);
          } else {
            setItems(mapped);
          }
        } else if (runtimeResponse?.error) {
          throw new Error(runtimeResponse.error);
        } else {
          setItems([]);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Runtime items unavailable. Showing mock sample.');
        setItems(mockItems);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    hydrate();

    return () => {
      active = false;
    };
  }, [dataSource, mockItems]);

  const handleDataSourceChange = (source) => {
    if (source === dataSource) return;
    setDataSource(source);
  };

  const dataSourceLabel = (() => {
    if (dataSource === 'runtime' && !error) return 'runtime snapshot';
    if (dataSource === 'runtime' && error) return 'mock fallback';
    return 'mock data';
  })();

  return (
    <div className="items-page">
      <section className="dev-card items-hero-card">
        <div>
          <p className="dev-card-eyebrow">{header.eyebrow}</p>
          <h2 className="dev-card-title">Items</h2>
          <p className="dev-card-subtitle">{header.description}</p>
        </div>
        <div className="items-hero-actions">
          <div className="items-search">
            <input
              type="search"
              placeholder="Search item id"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="items-data-source-toggle items-filter-group">
            <p className="items-filter-label">Data source</p>
            <div className="items-filter-chips">
              <button
                type="button"
                className={`items-filter-chip ${dataSource === 'mock' ? 'is-active' : ''}`}
                onClick={() => handleDataSourceChange('mock')}
              >
                Mock
              </button>
              <button
                type="button"
                className={`items-filter-chip ${dataSource === 'runtime' ? 'is-active' : ''}`}
                onClick={() => handleDataSourceChange('runtime')}
              >
                Runtime
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="items-layout">
        <aside className="items-filter-panel">
          <FilterGroup
            label="Class"
            options={filters.classes}
            value={activeFilters.classLabel}
            onSelect={(value) => handleFilterChange('classLabel', value)}
          />
          <FilterGroup
            label="Status"
            options={filters.statuses}
            value={activeFilters.status}
            onSelect={(value) => handleFilterChange('status', value)}
          />
          <FilterGroup
            label="Source camera"
            options={filters.cameras}
            value={activeFilters.camera}
            onSelect={(value) => handleFilterChange('camera', value)}
          />
          <FilterGroup
            label="Last seen"
            options={filters.periods.map((period) => period.label)}
            customMap={filters.periods.reduce((acc, period) => {
              acc[period.label] = period.id;
              return acc;
            }, {})}
            value={activeFilters.period}
            onSelect={(value) => handleFilterChange('period', value)}
          />
        </aside>

        <section className="items-table-section">
          {error && dataSource === 'runtime' && (
            <div className="items-inline-error">
              {error}
            </div>
          )}
          <div className="items-table-meta">
            <span>
              {loading ? 'Loading…' : `${filteredItems.length} items`} · {dataSourceLabel}
            </span>
            <button type="button" className="dev-ghost-button" onClick={() => {
              setActiveFilters(FILTER_DEFAULTS);
              setSearch('');
            }}
            >
              Reset filters
            </button>
          </div>
          <div className="items-table-wrapper">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Item ID</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Timestamp</th>
                  <th>Source lane</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={selectedId === item.id ? 'is-selected' : ''}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <td>
                      <button type="button" className="items-table-id" onClick={() => setSelectedId(item.id)}>
                        {item.id}
                      </button>
                    </td>
                    <td>{item.classLabel}</td>
                    <td>
                      <span className={`items-status-pill status-${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{typeof item.confidence === 'number' ? `${Math.round(item.confidence * 100)}%` : '—'}</td>
                    <td>{item.timestamp || '—'}</td>
                    <td>{item.sourceLane || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className={`items-detail-panel ${selectedItem ? 'is-visible' : ''}`}>
          {selectedItem ? (
            <ItemDetails item={selectedItem} onClose={() => setSelectedId(null)} />
          ) : (
            <div className="items-detail-empty">
              Select an item to preview doc-backed metadata.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function FilterGroup({ label, options, value, onSelect, customMap }) {
  const resolvedValue = customMap ? Object.entries(customMap).find(([, id]) => id === value)?.[0] || 'all' : value;
  return (
    <div className="items-filter-group">
      <p className="items-filter-label">{label}</p>
      <div className="items-filter-chips">
        <button
          type="button"
          className={`items-filter-chip ${value === 'all' ? 'is-active' : ''}`}
          onClick={() => onSelect('all')}
        >
          All
        </button>
        {options.map((option) => {
          const optionValue = customMap ? customMap[option] : option;
          const isActive = resolvedValue === option;
          return (
            <button
              key={option}
              type="button"
              className={`items-filter-chip ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelect(optionValue)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ItemDetails({ item, onClose }) {
  const isRuntime = item?.runtime;
  return (
    <div className="items-detail-card">
      <div className="items-detail-head">
        <div>
          <p className="items-detail-eyebrow">{isRuntime ? 'Runtime item' : 'Mock item'}</p>
          <h3>{item.id}</h3>
          <p className="items-detail-sub">{item.timestamp} · {item.sourceCamera}</p>
        </div>
        <button type="button" className="dev-ghost-button" onClick={onClose}>
          Close
        </button>
      </div>
      <dl className="items-detail-grid">
        <DetailRow label="Class" value={item.classLabel} />
        <DetailRow label="Status" value={item.status} />
        <DetailRow label="Confidence" value={typeof item.confidence === 'number' ? `${Math.round(item.confidence * 100)}%` : '—'} />
        <DetailRow label="Source lane" value={item.sourceLane} />
        <DetailRow label="Dimensions" value={item.dimensions || (isRuntime ? 'Not available yet for runtime items' : 'n/a')} />
        <DetailRow label="Weight" value={item.weight || (isRuntime ? 'Not available yet for runtime items' : 'n/a')} />
      </dl>
      <div className="items-detail-notes">
        <p className="items-detail-label">Notes</p>
        <p>{isRuntime ? 'Not available yet for runtime items.' : item.notes}</p>
      </div>
      <div className="items-detail-doc">
        <p className="items-detail-label">Doc reference</p>
        <code>{isRuntime ? 'Not available yet for runtime items.' : item.docRef}</code>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="items-detail-label">{label}</p>
      <p className="items-detail-value">{value}</p>
    </div>
  );
}

function formatMockItems(list) {
  return (list || []).map((item) => ({
    ...item,
    runtime: false,
  }));
}

function mapRuntimeItem(item) {
  if (!item) return null;
  const timestamp = item.capture?.timestamp || null;
  const formattedTimestamp = formatRuntimeTimestamp(timestamp);
  const status = formatPickStatus(item.plc_feedback?.pick_status);
  return {
    id: item.item_id || item.id || `runtime-${Math.random().toString(36).slice(2, 8)}`,
    classLabel: item.ai_prediction?.classes?.category || 'Unknown',
    status,
    confidence: typeof item.confidence === 'number' ? item.confidence : null,
    timestamp: formattedTimestamp,
    sourceLane: item.line_id || 'Runtime lane',
    sourceCamera: 'Runtime camera',
    lastSeen: deriveLastSeenBucket(timestamp),
    notes: null,
    dimensions: null,
    weight: null,
    docRef: null,
    runtime: true,
  };
}

function formatRuntimeTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function deriveLastSeenBucket(timestamp) {
  if (!timestamp) return '24h';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '24h';
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours <= 0.5) return 'today';
  if (diffHours <= 24) return '24h';
  return '7d';
}

function formatPickStatus(pickStatus) {
  if (!pickStatus) return 'Pending';
  const normalized = pickStatus.toLowerCase();
  switch (normalized) {
    case 'pending':
      return 'Pending';
    case 'fired':
      return 'Fired';
    case 'missed':
      return 'Missed';
    case 'cancelled':
    case 'cancelled_safe_mode':
      return 'Cancelled';
    case 'error':
      return 'Error';
    default:
      return 'Pending';
  }
}
