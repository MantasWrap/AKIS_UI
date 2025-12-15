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
      if (activeFilters.classLabel !== 'all' && item.classLabel !== activeFilters.classLabel) {
        return false;
      }
      if (activeFilters.status !== 'all' && item.status !== activeFilters.status) {
        return false;
      }
      if (activeFilters.camera !== 'all' && item.sourceCamera !== activeFilters.camera) {
        return false;
      }
      if (activeFilters.period !== 'all' && item.lastSeen !== activeFilters.period) {
        return false;
      }
      if (search && !item.id.toLowerCase().includes(search.toLowerCase())) {
        return false;
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

  return (
    <div className="items-page">
      <section className="dev-card items-hero-card">
        <div>
          <p className="dev-card-eyebrow">{header.eyebrow}</p>
          <h2 className="dev-card-title">Simulation items</h2>
          <p className="dev-card-subtitle">
            {header.description}
          </p>
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
            label="Period"
            options={filters.periods}
            value={activeFilters.period}
            onSelect={(value) => handleFilterChange('period', value)}
          />
        </aside>

        <section className="items-table-section">
          <div className="items-table-meta">
            <div>
              <p className="items-table-count">
                Showing <strong>{filteredItems.length}</strong> of {items.length} mock items
              </p>
              <p className="items-table-hint">
                Filter and click any row to inspect a single mock item in more detail.
              </p>
            </div>
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
                    className={item.id === selectedId ? 'is-selected' : ''}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <td>{item.id}</td>
                    <td>{item.classLabel}</td>
                    <td>{item.status}</td>
                    <td>{(item.confidence * 100).toFixed(1)}%</td>
                    <td>{item.timestamp}</td>
                    <td>{item.sourceLane}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {selectedItem && (
          <section className="items-detail-section">
            <div className="items-detail-card">
              <div className="items-detail-head">
                <h3 className="items-detail-title">{selectedItem.id}</h3>
                <p className="items-detail-eyebrow">Mock item</p>
                <p className="items-detail-sub">
                  {selectedItem.timestamp} · {selectedItem.sourceCamera}
                </p>
              </div>
              <dl className="items-detail-grid">
                <DetailRow label="Class" value={selectedItem.classLabel} />
                <DetailRow label="Status" value={selectedItem.status} />
                <DetailRow label="Confidence" value={`${(selectedItem.confidence * 100).toFixed(1)}%`} />
                <DetailRow label="Source lane" value={selectedItem.sourceLane} />
                <DetailRow label="Dimensions" value={selectedItem.dimensions} />
                <DetailRow label="Weight" value={selectedItem.weight} />
              </dl>
              <div className="items-detail-notes">
                <p className="items-detail-label">Notes</p>
                <p className="items-detail-value">{selectedItem.notes}</p>
              </div>
              <div className="items-detail-doc">
                <p className="items-detail-label">Doc reference</p>
                <code className="items-detail-value items-detail-doc-ref">
                  {selectedItem.docRef}
                </code>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, options, value, onSelect }) {
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
          const id = typeof option === 'string' ? option : option.id;
          const chipLabel = typeof option === 'string' ? option : option.label;
          const isActive = value === id;
          const chipValue = id === 'all' ? 'all' : id;
          return (
            <button
              key={id}
              type="button"
              className={`items-filter-chip ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelect(chipValue)}
            >
              {chipLabel}
            </button>
          );
        })}
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
