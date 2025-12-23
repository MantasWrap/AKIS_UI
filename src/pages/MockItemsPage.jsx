import { Fragment, useEffect, useMemo, useState } from 'react';
import '../styles/items.css';
import { getRuntimeItems, getItemTrace } from '../api/client.js';

const HEALTH_FILTERS = [
  { id: 'all', label: 'All items' },
  { id: 'ok', label: 'OK' },
  { id: 'needs_attention', label: 'Needs attention' },
];

const FILTER_DEFAULTS = {
  category: 'all',
  health: 'all',
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

function getCategory(item) {
  return item?.ai_prediction?.classes?.category || '—';
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
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const decimals = abs < 1 ? 3 : 2;
  return `${value.toFixed(decimals)} kg`;
}

function getEstimatedItemWeight(item) {
  const value = item?.weights?.estimated_item_weight_kg;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getItemTraceEvents(item) {
  const traceEvents = item?.trace_events || item?.trace?.events || item?.traceEvents;
  if (Array.isArray(traceEvents) && traceEvents.length > 0) {
    return traceEvents;
  }

  const captureTs = item?.capture?.timestamp || item?.timestamp || null;
  const events = [];

  if (item?.capture) {
    events.push({
      type: 'CAPTURE',
      timestamp: item.capture.timestamp || captureTs,
      payload: item.capture,
    });
  }

  if (item?.ai_prediction) {
    events.push({
      type: 'AI_DECISION',
      timestamp: item.ai_prediction.timestamp || captureTs,
      payload: item.ai_prediction,
    });
  }

  if (item?.sorting_decision) {
    events.push({
      type: 'ROUTING',
      timestamp: item.sorting_decision.timestamp || captureTs,
      payload: item.sorting_decision,
    });
  }

  if (item?.plc_feedback) {
    events.push({
      type: 'PLC_FEEDBACK',
      timestamp: item.plc_feedback.pick_timestamp || captureTs,
      payload: item.plc_feedback,
    });
  }

  return events;
}

function getEventTimestamp(event) {
  if (!event) return null;
  return event.ts || event.timestamp || event.time || null;
}

function classifyItemHealth(item) {
  const events = getItemTraceEvents(item)
    .map((event) => ({
      ...event,
      type: (event.type || '').toString().toUpperCase(),
      timestamp: getEventTimestamp(event),
    }))
    .filter((event) => event.type);

  const capture = events.find((event) => event.type === 'CAPTURE');
  const decision = events.find((event) => event.type === 'AI_DECISION');
  const routing = events.find((event) => event.type === 'ROUTING');
  const plc = events.find((event) => event.type === 'PLC_FEEDBACK');

  if (!capture || !decision || !routing) {
    return { health: 'needs_attention', label: '⚠️ Something missing' };
  }

  const captureTs = parseDate(capture.timestamp)?.getTime();
  const decisionTs = parseDate(decision.timestamp)?.getTime();
  const routingTs = parseDate(routing.timestamp)?.getTime();

  if (!Number.isFinite(captureTs) || !Number.isFinite(decisionTs) || !Number.isFinite(routingTs)) {
    return { health: 'needs_attention', label: '⚠️ Something missing' };
  }

  if (captureTs <= decisionTs && decisionTs <= routingTs) {
    if (plc) {
      return { health: 'ok', label: '✅ Everything OK' };
    }
    return { health: 'ok', label: '✅ OK (no Fake PLC feedback yet)' };
  }

  return { health: 'needs_attention', label: '⚠️ Something missing' };
}

function buildItemStorySteps(item) {
  const events = getItemTraceEvents(item)
    .map((event, index) => ({
      ...event,
      type: (event.type || '').toString().toUpperCase(),
      timestamp: getEventTimestamp(event),
      id: event.id || `${event.type || 'event'}-${index}`,
    }))
    .filter((event) => event.type)
    .sort((a, b) => {
      const aTs = parseDate(a.timestamp)?.getTime() || 0;
      const bTs = parseDate(b.timestamp)?.getTime() || 0;
      return aTs - bTs;
    });

  return events.reduce((steps, event) => {
    const time = formatShortTime(event.timestamp);
    const payload = event.payload || {};

    if (event.type === 'CAPTURE') {
      steps.push({
        id: event.id,
        time,
        label: 'Camera saw the item',
        detail: null,
      });
      return steps;
    }

    if (event.type === 'AI_DECISION') {
      const category =
        payload.category ||
        payload.ai_category ||
        payload.classes?.category ||
        item?.ai_prediction?.classes?.category ||
        null;
      steps.push({
        id: event.id,
        time,
        label: 'AI guessed the category',
        detail: category ? `Category: ${category}` : null,
      });
      return steps;
    }

    if (event.type === 'ROUTING') {
      const chuteId =
        payload.chute_id ||
        payload.routing?.chute_id ||
        item?.sorting_decision?.chute_id ||
        null;
      steps.push({
        id: event.id,
        time,
        label: 'Controller chose a chute',
        detail: chuteId != null ? `Chute ${chuteId}` : null,
      });
      return steps;
    }

    if (event.type === 'PLC_FEEDBACK') {
      const status =
        (payload.pick_status || payload.status || '')
          .toString()
          .toUpperCase() || null;
      steps.push({
        id: event.id,
        time,
        label: 'Fake PLC confirmed the pick',
        detail: status
          ? `Result: ${status} · Fake PLC only – training mode, not real hardware.`
          : 'Fake PLC only – training mode, not real hardware.',
      });
      return steps;
    }

    return steps;
  }, []);
}

function mapTraceEventToStep(event, index) {
  if (!event) {
    return {
      id: `event-${index}`,
      label: 'Unknown event',
      summary: '',
      time: '—',
    };
  }

  const type = (event.type || '').toString().toUpperCase();
  const ts = event.ts || event.timestamp || null;
  const time = formatShortTime(ts);
  const payload = event.payload || {};
  let label;
  let summary;

  if (type === 'CAPTURE') {
    label = 'CAPTURE · Seen by Jetson';
    const cameraId =
      payload.camera_id || payload.camera || payload.capture?.camera_id;
    const laneId = payload.lane_id || payload.capture?.lane_id;
    if (cameraId && laneId) {
      summary = `Camera ${cameraId}, lane ${laneId}`;
    } else if (cameraId) {
      summary = `Camera ${cameraId}`;
    } else if (laneId) {
      summary = `Lane ${laneId}`;
    } else {
      summary = 'Image captured.';
    }
  } else if (type === 'AI_DECISION') {
    label = 'AI DECISION · AI classified the item';
    const category =
      payload.category ||
      payload.ai_category ||
      payload.classes?.category;
    const quality = payload.quality || payload.classes?.quality;
    if (category && quality) {
      summary = `${category}, quality ${quality}`;
    } else if (category) {
      summary = category;
    } else {
      summary = 'AI decision computed.';
    }
  } else if (type === 'ROUTING') {
    label = 'ROUTING · Routing decided chute';
    const chuteId = payload.chute_id || payload.routing?.chute_id;
    if (chuteId != null) {
      summary = `Routing decided chute ${chuteId}.`;
    } else {
      summary = 'Routing decision applied.';
    }
  } else if (type === 'PLC_FEEDBACK') {
    label = 'PLC FEEDBACK · Fake PLC feedback';
    const status =
      (payload.pick_status || payload.status || '')
        .toString()
        .toUpperCase() || null;
    if (status) {
      summary = `Fake PLC feedback: ${status}`;
    } else {
      summary = 'Fake PLC feedback received.';
    }
  } else {
    label = `${type || 'EVENT'} · Runtime event`;
    summary = payload.message || 'Event recorded in runtime.';
  }

  return {
    id: `${type || 'event'}-${index}`,
    label,
    summary,
    time,
  };
}

export default function MockItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [search, setSearch] = useState('');
  const [expandedItemIds, setExpandedItemIds] = useState(() => new Set());
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

    items.forEach((item) => {
      const cat = getCategory(item);
      if (cat && cat !== '—') categories.add(cat);
    });

    return {
      categories: Array.from(categories).sort(),
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const id = getItemId(item);
      const category = getCategory(item);
      const { health } = classifyItemHealth(item);

      if (search && !String(id).toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      if (filters.category !== 'all' && category !== filters.category) {
        return false;
      }

      if (filters.health !== 'all' && health !== filters.health) {
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

  const handleToggleStory = (id) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="items-page">
      <section className="dev-card items-hero-card">
        <div>
          <p className="dev-card-eyebrow">Phase 0 · Training mode</p>
          <h2 className="dev-card-title">Simulation items</h2>
          <p className="dev-card-subtitle">
            Phase 0 training replay. This view shows how items move through camera, AI and Fake PLC
            with simulated weights. Not live production data.
          </p>
          <p className="items-hero-intro">
            Each row below is one item that went through the system in training mode. For each item you
            can see when the camera saw it, what AI guessed, which chute the controller chose, and if
            Fake PLC confirmed the pick. Real PLC and real scales will replace this later in production.
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
        <section className="items-table-section dev-card">
          <header className="items-table-header">
            <div>
              <p className="dev-card-eyebrow">Runtime items</p>
              <h3>Simulation items table</h3>
              <p className="items-table-subtitle">
                Read-only view of recent runtime items. It keeps the focus on training mode events and
                simple outcomes.
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
          <div className="items-filter-bar">
            <FilterGroup
              label="Category"
              value={filters.category}
              onSelect={(value) => handleFilterChange('category', value)}
              options={[{ id: 'all', label: 'All categories' }, ...derivedOptions.categories]}
            />
            <FilterGroup
              label="Status"
              value={filters.health}
              onSelect={(value) => handleFilterChange('health', value)}
              options={HEALTH_FILTERS}
            />
          </div>
          <p className="items-table-helper">
            Weights here are simulated. The goal is to test logic, not real scales.
          </p>

          <div className="items-table-wrapper">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Item ID</th>
                  <th>Category</th>
                  <th>Chute</th>
                  <th>Weight (Simulated – Fake HW)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const id = getItemId(item);
                  const seenAt = getItemSeenAt(item);
                  const category = getCategory(item);
                  const chute = getChuteId(item) || '—';
                  const weight = getEstimatedItemWeight(item);
                  const formattedWeight = formatWeightKg(weight);
                  const health = classifyItemHealth(item);
                  const storySteps = buildItemStorySteps(item);
                  const isSelected = selectedId === id;
                  const isExpanded = expandedItemIds.has(id);

                  return (
                    <Fragment key={id}>
                      <tr
                        className={isSelected ? 'is-selected' : ''}
                        onClick={() => setSelectedId(isSelected ? null : id)}
                      >
                        <td>{formatShortTime(seenAt)}</td>
                        <td>{id}</td>
                        <td>{category}</td>
                        <td>{chute}</td>
                        <td>{formattedWeight}</td>
                        <td>
                          <div className="items-status-cell">
                            <span
                              className={`dev-status-chip ${
                                health.health === 'ok' ? 'status-ok' : 'status-waiting'
                              }`}
                            >
                              {health.label}
                            </span>
                            <button
                              type="button"
                              className="items-story-toggle"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleToggleStory(id);
                              }}
                            >
                              {isExpanded ? 'Hide steps' : 'Show steps'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="items-story-row">
                          <td colSpan={6}>
                            {storySteps.length === 0 ? (
                              <p className="items-story-empty">
                                No story steps available yet for this item.
                              </p>
                            ) : (
                              <ul className="items-story-list">
                                {storySteps.map((step) => (
                                  <li key={step.id} className="items-story-step">
                                    <span className="items-story-time">{step.time}</span>
                                    <span className="items-story-label">{step.label}</span>
                                    {step.detail && (
                                      <span className="items-story-detail">{step.detail}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {!loading && !error && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="items-empty-state">
                        No items match the current filters yet. Try clearing some filters.
                      </div>
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={6}>
                      <div className="items-empty-state">Loading items from runtime…</div>
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={6}>
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
              Select an item in the table to see training details, AI guesses, routing, Fake PLC
              feedback, and simulated weights.
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
  const health = classifyItemHealth(item);

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
    formattedWeightBefore === '—' ||
    formattedWeightAfter === '—' ||
    formattedEstimatedWeight === '—';

  const [traceState, setTraceState] = useState({
    loading: false,
    error: '',
    events: [],
  });
  const [isTraceOpen, setIsTraceOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTrace() {
      if (!item || !isTraceOpen) {
        return;
      }

      setTraceState((prev) => ({
        ...prev,
        loading: true,
        error: '',
      }));

      const result = await getItemTrace({
        // Phase 0: site/line are taken from controller defaults.
        itemId: getItemId(item),
      });

      if (cancelled) return;

      if (!result || result.ok === false) {
        const message =
          (result && result.error) ||
          'Item trace is not available right now. Ask your engineer to check controller logs.';
        setTraceState({
          loading: false,
          error: message,
          events: [],
        });
        return;
      }

      const events = Array.isArray(result.events) ? result.events : [];
      setTraceState({
        loading: false,
        error: '',
        events,
      });
    }

    loadTrace();

    return () => {
      cancelled = true;
    };
  }, [item, isTraceOpen]);

  return (
    <div className="items-detail-card">
      <header className="items-detail-header">
        <div className="items-detail-header-main">
          <p className="dev-card-eyebrow">Item detail</p>
          <h3>{getItemId(item)}</h3>
        </div>
        <span
          className={`dev-status-chip ${health.health === 'ok' ? 'status-ok' : 'status-waiting'}`}
        >
          {health.label}
        </span>
      </header>
      <p className="items-detail-subtitle">
        Last seen {formatShortDateTime(seenAt)}
      </p>

      <div className="items-detail-grid">
        <section className="items-detail-block">
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

        <section className="items-detail-block">
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

        <section className="items-detail-block">
          <h4 className="items-detail-section-title">Routing &amp; Fake PLC</h4>
          <div className="items-detail-grid-inner">
            <DetailRow label="Chosen chute" value={routing.chute_id} />
            <DetailRow label="Rule set" value={routing.rule_set_id} />
            <DetailRow label="Target product" value={routing.target_product_code} />
            <DetailRow label="Pick status" value={plc.pick_status} />
            <DetailRow label="Pick time" value={plc.pick_timestamp} />
          </div>
          <p className="items-detail-helper">
            Fake PLC only – training mode, not real hardware.
          </p>
        </section>

        <section className="items-detail-block">
          <h4 className="items-detail-section-title">Weight (Simulated – Fake HW)</h4>
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
            Weights here are simulated. The goal is to test logic, not real scales.
          </p>
          {missingWeightTelemetry && (
            <p className="items-detail-helper">No weight telemetry for this item yet.</p>
          )}
        </section>

        <section className="items-detail-block items-detail-block--trace">
          <div className="items-detail-section-header">
            <h4 className="items-detail-section-title">Item trace (debug view)</h4>
            <button
              type="button"
              className="items-filter-chip items-filter-chip-secondary"
              onClick={() => setIsTraceOpen((open) => !open)}
            >
              {isTraceOpen ? 'Hide trace' : 'Show trace'}
            </button>
          </div>
          <p className="items-detail-helper">
            End-to-end timeline for this item: capture, AI, routing and Fake PLC feedback. Phase 0
            debug view only.
          </p>
          {isTraceOpen && (
            <div className="items-detail-trace">
              {traceState.loading && (
                <p className="items-detail-helper">Loading item trace…</p>
              )}
              {!traceState.loading && traceState.error && (
                <p className="items-detail-helper">
                  {traceState.error ||
                    'Item trace is not available right now. Ask your engineer to check controller logs.'}
                </p>
              )}
              {!traceState.loading &&
                !traceState.error &&
                (!traceState.events || traceState.events.length === 0) && (
                  <p className="items-detail-helper">
                    No history events found for this item yet.
                  </p>
                )}
              {!traceState.loading && !traceState.error && traceState.events.length > 0 && (
                <ol className="items-confidence-list">
                  {traceState.events.slice(0, 8).map((event, index) => {
                    const step = mapTraceEventToStep(event, index);
                    return (
                      <li key={step.id} className="items-confidence-row">
                        <span className="items-confidence-key">
                          {step.time !== '—' ? step.time : `Step ${index + 1}`}
                        </span>
                        <span className="items-confidence-value">
                          {step.label}
                          {step.summary ? ` — ${step.summary}` : ''}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
