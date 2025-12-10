import { useMemo, useState } from 'react';
import '../styles/items.css';
import { itemsMockData } from '../mock/itemsMockData.js';

const FILTER_DEFAULTS = {
  classLabel: 'all',
  status: 'all',
  camera: 'all',
  period: '24h',
};

export default function MockItemsPage() {
  const { header, filters, items } = itemsMockData;
  const [activeFilters, setActiveFilters] = useState(FILTER_DEFAULTS);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

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

  const selectedItem = filteredItems.find((item) => item.id === selectedId) || items.find((item) => item.id === selectedId) || null;

  const handleFilterChange = (key, value) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="items-page">
      <section className="dev-card items-hero-card">
        <div>
          <p className="dev-card-eyebrow">{header.eyebrow}</p>
          <h2 className="dev-card-title">Items</h2>
          <p className="dev-card-subtitle">{header.description}</p>
        </div>
        <div className="items-search">
          <input
            type="search"
            placeholder="Search item id"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
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
          <div className="items-table-meta">
            <span>{filteredItems.length} items · mock data only</span>
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
                    <td>{Math.round(item.confidence * 100)}%</td>
                    <td>{item.timestamp}</td>
                    <td>{item.sourceLane}</td>
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
  return (
    <div className="items-detail-card">
      <div className="items-detail-head">
        <div>
          <p className="items-detail-eyebrow">Mock item</p>
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
        <DetailRow label="Confidence" value={`${Math.round(item.confidence * 100)}%`} />
        <DetailRow label="Source lane" value={item.sourceLane} />
        <DetailRow label="Dimensions" value={item.dimensions} />
        <DetailRow label="Weight" value={item.weight} />
      </dl>
      <div className="items-detail-notes">
        <p className="items-detail-label">Notes</p>
        <p>{item.notes}</p>
      </div>
      <div className="items-detail-doc">
        <p className="items-detail-label">Doc reference</p>
        <code>{item.docRef}</code>
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
