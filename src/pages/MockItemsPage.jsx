import { useEffect, useMemo, useState } from 'react';
import '../styles/items.css';
import { getRuntimeItems } from '../api/client.js';

const TIME_WINDOWS = [
  { id: '15m', label: 'Last 15 min' },
  { id: '1h', label: 'Last hour' },
  { id: '24h', label: 'Last 24h' },
  { id: '7d', label: 'Last 7 days' },
  { id: 'all', label: 'All time' },
];

const STATUS_FILTERS = [
  { id: 'all', label: 'All statuses' },
  { id: 'SEEN', label: 'Seen' },
  { id: 'DECIDED', label: 'Decided' },
  { id: 'ROUTED', label: 'Routed' },
  { id: 'DROPPED', label: 'Dropped' },
];

const FILTER_DEFAULTS = {
  timeWindow: '1h',
  status: 'all',
  category: 'all',
  quality: 'all',
  camera: 'all',
  chute: 'all',
  lane: 'all',
};

function getItemId(item) {
  return item?.item_id || item?.id || '—';
}

function getItemSeenAt(item) {
  return (
    item?.capture?.timestamp ||
    item?.meta?.created_at ||
    item?.timestamp ||
    null
  );
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  // NaN check
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function isWithinWindow(item, windowId) {
  if (windowId === 'all') return true;
  const seenAt = parseDate(getItemSeenAt(item));
  if (!seenAt) return false;
  const now = new Date();
  const diffMs = now.getTime() - seenAt.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  switch (windowId) {
    case '15m':
      return diffMinutes <= 15;
    case '1h':
      return diffMinutes <= 60;
    case '24h':
      return diffMinutes <= 60 * 24;
    case '7d':
      return diffMinutes <= 60 * 24 * 7;
    default:
      return true;
  }
}

function computePipelineStatus(item) {
  const hasDecision = Boolean(item?.sorting_decision);
  const pickStatus = item?.plc_feedback?.pick_status || null;

  if (!hasDecision) return 'SEEN';

  if (!pickStatus) return 'DECIDED';

  const normalized = String(pickStatus).toUpperCase();
  if (normalized === 'FIRED' || normalized === 'SUCCESS') return 'ROUTED';
  if (normalized === 'MISSED' || normalized === 'FAILED' || normalized === 'ERROR') {
    return 'DROPPED';
  }

  return 'DECIDED';
}

function getCategory(item) {
  return item?.ai_prediction?.classes?.category || '—';
}

function getQuality(item) {
  return item?.ai_prediction?.classes?.quality || '—';
}

function getCameraId(item) {
  return item?.capture?.camera_id || null;
}

function getLaneId(item) {
  return item?.lane_id || item?.capture?.lane_id || null;
}

function getChuteId(item) {
  return item?.sorting_decision?.chute_id || null;
}

function formatShortTime(value) {
  const d = parseDate(value);
  if (!d) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatShortDateTime(value) {
  const d = parseDate(value);
  if (!d) return '—';
  return d.toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatWeightKg(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const abs = Math.abs(value);
  const decimals = abs < 1 ? 3 : 2;
  return `${value.toFixed(decimals)} kg`;
}

export default function MockItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const result = await getRuntimeItems({ limit: 200 });
        if (cancelled) return;

        if (result?.ok === false) {
          setError(result.error || 'Failed to load simulation items from runtime.');
          setItems([]);
          return;
        }

        const payload = Array.isArray(result)
          ? result
          : Array.isArray(result?.items)
          ? result.items
          : [];

        setItems(payload);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError?.message
              ? `Failed to load simulation items from runtime: ${loadError.message}`
              : 'Failed to load simulation items from runtime.',
          );
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const derivedOptions = useMemo(() => {
    const categories = new Set();
    const qualities = new Set();
    const cameras = new Set();
    const chutes = new Set();
    const lanes = new Set();

    items.forEach((item) => {
      const cat = getCategory(item);
      if (cat && cat !== '—') categories.add(cat);

      const q = getQuality(item);
      if (q && q !== '—') qualities.add(q);

      const cam = getCameraId(item);
      if (cam) cameras.add(cam);

      const chute = getChuteId(item);
      if (chute) chutes.add(chute);

      const lane = getLaneId(item);
      if (lane) lanes.add(lane);
    });

    return {
      categories: Array.from(categories).sort(),
      qualities: Array.from(qualities).sort(),
      cameras: Array.from(cameras).sort(),
      chutes: Array.from(chutes).sort(),
      lanes: Array.from(lanes).sort(),
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const id = getItemId(item);
      const pipelineStatus = computePipelineStatus(item);
      const category = getCategory(item);
      const quality = getQuality(item);
      const camera = getCameraId(item);
      const chute = getChuteId(item);
      const lane = getLaneId(item);

      if (search && !String(id).toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      if (!isWithinWindow(item, filters.timeWindow)) {
        return false;
      }

      if (filters.status !== 'all' && pipelineStatus !== filters.status) {
        return false;
      }

      if (filters.category !== 'all' && category !== filters.category) {
        return false;
      }

      if (filters.quality !== 'all' && quality !== filters.quality) {
        return false;
      }

      if (filters.camera !== 'all' && camera !== filters.camera) {
        return false;
      }

      if (filters.chute !== 'all' && chute !== filters.chute) {
        return false;
      }

      if (filters.lane !== 'all' && lane !== filters.lane) {
        return false;
      }

      return true;
    });
  }, [items, filters, search]);

  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    return (
      filteredItems.find((item) => getItemId(item) === selectedId) ||
      items.find((item) => getItemId(item) === selectedId) ||
      null
    );
  }, [filteredItems, items, selectedId]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRefresh = () => {
    if (!loading) {
      setRefreshKey((prev) => prev + 1);
    }
  };

  return (
    <div className="items-page">
      <section className="dev-card items-hero-card">
        <div>
          <p className="dev-card-eyebrow">Phase 0 · Runtime items preview</p>
          <h2 className="dev-card-title">Simulation items</h2>
          <p className="dev-card-subtitle">
            Items from the runtime using the real AI schema. Phase 0 simulation only – PLC hardware is
            not connected yet.
          </p>
        </div>
        <div className="items-search">
          <label className="items-search-label" htmlFor="items-search-input">
            Search by item ID
          </label>
          <input
            id="items-search-input"
            type="search"
            placeholder="Search by item_id…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="items-refresh-button"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </section>

      <div className="items-layout">
        <aside className="items-filter-panel">
          <FilterGroup
            label="Time window"
            value={filters.timeWindow}
            onSelect={(value) => handleFilterChange('timeWindow', value)}
            options={TIME_WINDOWS}
          />
          <FilterGroup
            label="Status"
            value={filters.status}
            onSelect={(value) => handleFilterChange('status', value)}
            options={STATUS_FILTERS}
          />
          <FilterGroup
            label="Category"
            value={filters.category}
            onSelect={(value) => handleFilterChange('category', value)}
            options={derivedOptions.categories}
          />
          <FilterGroup
            label="Quality"
            value={filters.quality}
            onSelect={(value) => handleFilterChange('quality', value)}
            options={derivedOptions.qualities}
          />
          {derivedOptions.cameras.length > 0 && (
            <FilterGroup
              label="Camera"
              value={filters.camera}
              onSelect={(value) => handleFilterChange('camera', value)}
              options={derivedOptions.cameras}
            />
          )}
          {derivedOptions.chutes.length > 0 && (
            <FilterGroup
              label="Chute"
              value={filters.chute}
              onSelect={(value) => handleFilterChange('chute', value)}
              options={derivedOptions.chutes}
            />
          )}
          {derivedOptions.lanes.length > 0 && (
            <FilterGroup
              label="Lane"
              value={filters.lane}
              onSelect={(value) => handleFilterChange('lane', value)}
              options={derivedOptions.lanes}
            />
          )}
        </aside>

        <section className="items-table-section dev-card">
          <header className="items-table-header">
            <div>
              <p className="dev-card-eyebrow">Runtime items</p>
              <h3>Simulation items table</h3>
              <p className="items-table-subtitle">
                Read-only view of recent runtime items. Use it to check clothing tags and routing
                decisions before real hardware is connected.
              </p>
            </div>
            <p className="items-table-meta">
              {loading && 'Loading items…'}
              {!loading && error && (
                <span className="items-error-text">{error}</span>
              )}
              {!loading && !error && (
                <>
                  Showing <strong>{filteredItems.length}</strong> of{' '}
                  <strong>{items.length}</strong> items
                </>
              )}
            </p>
          </header>

          <div className="items-table-wrapper">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Item ID</th>
                  <th>Category</th>
                  <th>Quality</th>
                  <th>Status</th>
                  <th>Lane</th>
                  <th>Camera</th>
                  <th>Chute</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const id = getItemId(item);
                  const seenAt = getItemSeenAt(item);
                  const pipelineStatus = computePipelineStatus(item);
                  const category = getCategory(item);
                  const quality = getQuality(item);
                  const lane = getLaneId(item) || '—';
                  const camera = getCameraId(item) || '—';
                  const chute = getChuteId(item) || '—';
                  const isSelected = selectedId === id;

                  return (
                    <tr
                      key={id}
                      className={isSelected ? 'is-selected' : ''}
                      onClick={() => setSelectedId(isSelected ? null : id)}
                    >
                      <td>{formatShortTime(seenAt)}</td>
                      <td>{id}</td>
                      <td>{category}</td>
                      <td>{quality}</td>
                      <td>{pipelineStatus}</td>
                      <td>{lane}</td>
                      <td>{camera}</td>
                      <td>{chute}</td>
                    </tr>
                  );
                })}
                {!loading && !error && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="items-empty-state">
                        No items match the current filters yet. Try widening the time window or
                        clearing some filters.
                      </div>
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={8}>
                      <div className="items-empty-state">Loading items from runtime…</div>
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={8}>
                      <div className="items-empty-state">
                        {error} If this keeps happening, ask your engineer to check the controller logs
                        and the /api/items endpoint.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="items-detail-section dev-card">
          {selectedItem ? (
            <ItemDetail item={selectedItem} />
          ) : (
            <div className="items-detail-empty">
              Select an item in the table to see clothing attributes, AI confidences, routing, PLC
              feedback, and Fake Hardware weights.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterGroup({ label, value, onSelect, options }) {
  const normalizedOptions = Array.isArray(options)
    ? options.map((option) =>
        typeof option === 'string' ? { id: option, label: option } : option,
      )
    : [];

  const hasAllOption = normalizedOptions.some((option) => option.id === 'all');
  const displayOptions = hasAllOption
    ? normalizedOptions
    : [{ id: 'all', label: 'All' }, ...normalizedOptions];

  return (
    <div className="items-filter-group">
      <p className="items-filter-label">{label}</p>
      <div className="items-filter-chips">
        {displayOptions.map((option) => {
          const id = option.id;
          const chipLabel = option.label;
          const isActive = value === id;
          return (
            <button
              key={id}
              type="button"
              className={`items-filter-chip ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelect(id)}
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
    <div className="items-detail-row">
      <p className={value ? 'items-detail-label' : 'items-detail-label is-muted'}>
        {label}
      </p>
      <p className="items-detail-value">{value ?? '—'}</p>
    </div>
  );
}

function ItemDetail({ item }) {
  const classes = item?.ai_prediction?.classes || {};
  const rawConfidences = item?.ai_prediction?.confidences;
  const routing = item?.sorting_decision || {};
  const plc = item?.plc_feedback || {};
  const weights = item?.weights || {};
  const seenAt = getItemSeenAt(item);
  const pipelineStatus = computePipelineStatus(item);

  const confidenceEntries = useMemo(() => {
    const confidences =
      rawConfidences && typeof rawConfidences === 'object' ? rawConfidences : {};
    return Object.entries(confidences)
      .filter(([, v]) => typeof v === 'number')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [rawConfidences]);

  const formattedWeightBefore = formatWeightKg(weights.box_weight_kg_before);
  const formattedWeightAfter = formatWeightKg(weights.box_weight_kg_after);
  const formattedEstimatedWeight = formatWeightKg(weights.estimated_item_weight_kg);
  const missingWeightTelemetry =
    !formattedWeightBefore || !formattedWeightAfter || !formattedEstimatedWeight;

  return (
    <div className="items-detail-card">
      <header className="items-detail-header">
        <div>
          <p className="dev-card-eyebrow">Item detail</p>
          <h3>{getItemId(item)}</h3>
          <p className="items-detail-subtitle">
            {pipelineStatus} · seen at {formatShortDateTime(seenAt)}
          </p>
        </div>
      </header>

      <div className="items-detail-grid">
        <section>
          <h4 className="items-detail-section-title">Clothing attributes</h4>
          <div className="items-detail-grid-inner">
            <DetailRow label="Category" value={classes.category} />
            <DetailRow label="Subcategory" value={classes.subcategory} />
            <DetailRow label="Gender" value={classes.gender} />
            <DetailRow label="Season" value={classes.season} />
            <DetailRow label="Quality" value={classes.quality} />
            <DetailRow label="Damage" value={classes.damage} />
            <DetailRow label="Dirt" value={classes.dirt} />
            <DetailRow label="Brand" value={classes.brand} />
          </div>
        </section>

        <section>
          <h4 className="items-detail-section-title">AI confidences</h4>
          {confidenceEntries.length === 0 ? (
            <p className="items-detail-helper">
              No confidence breakdown provided for this item yet.
            </p>
          ) : (
            <ul className="items-confidence-list">
              {confidenceEntries.map(([key, value]) => (
                <li key={key} className="items-confidence-row">
                  <span className="items-confidence-key">{key}</span>
                  <span className="items-confidence-value">
                    {(value * 100).toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h4 className="items-detail-section-title">Routing decision</h4>
          <div className="items-detail-grid-inner">
            <DetailRow label="Chute" value={routing.chute_id} />
            <DetailRow label="Rule set" value={routing.rule_set_id} />
            <DetailRow label="Target product" value={routing.target_product_code} />
            <DetailRow
              label="Encoder fire position"
              value={
                routing.encoder_fire_position != null
                  ? String(routing.encoder_fire_position)
                  : null
              }
            />
            <DetailRow
              label="Valve open (ms)"
              value={
                routing.valve_open_ms != null ? String(routing.valve_open_ms) : null
              }
            />
          </div>
        </section>

        <section>
          <h4 className="items-detail-section-title">PLC feedback</h4>
          <div className="items-detail-grid-inner">
            <DetailRow label="Pick status" value={plc.pick_status} />
            <DetailRow label="Pick time" value={plc.pick_timestamp} />
            <DetailRow
              label="Pick error code"
              value={
                plc.pick_error_code != null ? String(plc.pick_error_code) : null
              }
            />
            <DetailRow label="Pick command ID" value={plc.pick_command_id} />
          </div>
        </section>

        <section>
          <h4 className="items-detail-section-title">Weights (Fake Hardware, Phase 0)</h4>
          <div className="items-detail-grid-inner">
            <DetailRow
              label="Chute weight before drop"
              value={formattedWeightBefore}
            />
            <DetailRow
              label="Chute weight after drop"
              value={formattedWeightAfter}
            />
            <DetailRow
              label="Estimated item weight"
              value={formattedEstimatedWeight}
            />
          </div>
          <p className="items-detail-helper">
            Weights are simulated by Fake Hardware in Phase 0. Not a real scale.
          </p>
          {missingWeightTelemetry && (
            <p className="items-detail-helper">No weight telemetry for this item yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
