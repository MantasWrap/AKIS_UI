import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { API_BASE } from '../../api/client.js';
import { useShortcutProfile } from './hooks/useShortcutProfile.js';

const CLASS_OPTIONS = [
  { id: 'T_SHIRT', label: 'T-shirt' },
  { id: 'TROUSERS', label: 'Trousers' },
  { id: 'HOODIE', label: 'Hoodie' },
  { id: 'OTHER', label: 'Other / mixed' },
];

function resolveClassName(id) {
  const found = CLASS_OPTIONS.find((opt) => opt.id === id);
  return found ? found.label : id || 'Unknown';
}

function MediaStatusChip({ media, mediaError }) {
  if (mediaError) {
    return (
      <span className="ts-chip ts-chip-danger">
        <span className="ts-chip-label">Media</span>
        <span>Error loading media</span>
      </span>
    );
  }

  if (media && media.url) {
    return (
      <span className="ts-chip ts-chip-strong">
        <span className="ts-chip-label">Media</span>
        <span>Preview connected (dev)</span>
      </span>
    );
  }

  return (
    <span className="ts-chip">
      <span className="ts-chip-label">Media</span>
      <span>No media yet</span>
    </span>
  );
}

function LiveItemsReview() {
  const [siteId, setSiteId] = useState('SITE_LT_01');
  const [lineId, setLineId] = useState('LINE_01');
  const [cameraId, setCameraId] = useState('CAM01');

  const [currentItem, setCurrentItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState('UNREVIEWED');
  const [classId, setClassId] = useState(CLASS_OPTIONS[0].id);
  const [isIgnored, setIsIgnored] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaError, setMediaError] = useState('');

  const { findActionForEvent } = useShortcutProfile();

  const hasItem = !!currentItem;

  const buildQuery = useCallback(
    (opts = {}) => {
      const params = new URLSearchParams();
      if (siteId) params.append('site_id', siteId);
      if (lineId) params.append('line_id', lineId);
      if (cameraId) params.append('camera_id', cameraId);
      if (opts.afterItemId) params.append('after_item_id', opts.afterItemId);
      if (opts.beforeItemId) params.append('before_item_id', opts.beforeItemId);
      return params.toString();
    },
    [siteId, lineId, cameraId],
  );

  const fetchMediaForItem = useCallback(async (item) => {
    if (!item) {
      setMedia(null);
      setMediaError('');
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/training-studio/items/live/${encodeURIComponent(
          item.id,
        )}/media`,
      );
      const body = await res.json();
      if (!res.ok || body.status !== 'ok') {
        throw new Error(
          body.error || 'Failed to load live item media preview',
        );
      }
      setMedia(body.media || null);
      setMediaError('');
    } catch (err) {
      setMedia(null);
      setMediaError(err.message || 'Failed to load live item media');
    }
  }, []);

  const applyItem = useCallback(
    (item) => {
      setCurrentItem(item || null);
      fetchMediaForItem(item || null);

      if (!item) {
        setStatus('UNREVIEWED');
        setClassId(CLASS_OPTIONS[0].id);
        setIsIgnored(false);
        return;
      }

      setStatus(item.status || 'UNREVIEWED');
      const labels = item.current_label_set?.labels || [];
      const first = labels[0];
      if (first) {
        setClassId(first.class_id || CLASS_OPTIONS[0].id);
        setIsIgnored(Boolean(first.is_ignored));
      } else {
        setClassId(CLASS_OPTIONS[0].id);
        setIsIgnored(false);
      }
    },
    [fetchMediaForItem],
  );

  const fetchNext = useCallback(
    async (opts = {}) => {
      setLoading(true);
      setError('');
      try {
        const qs = buildQuery({ afterItemId: opts.afterItemId });
        const res = await fetch(
          `${API_BASE}/api/training-studio/items/live/next?${qs}`,
        );
        const body = await res.json();
        if (!res.ok || body.status !== 'ok') {
          throw new Error(
            body.error || 'Failed to load next live item from DB',
          );
        }
        applyItem(body.item || null);
      } catch (err) {
        setError(err.message || 'Failed to load live item');
        applyItem(null);
      } finally {
        setLoading(false);
      }
    },
    [applyItem, buildQuery],
  );

  const fetchPrev = useCallback(
    async (opts = {}) => {
      setLoading(true);
      setError('');
      try {
        const qs = buildQuery({ beforeItemId: opts.beforeItemId });
        const res = await fetch(
          `${API_BASE}/api/training-studio/items/live/prev?${qs}`,
        );
        const body = await res.json();
        if (!res.ok || body.status !== 'ok') {
          throw new Error(
            body.error || 'Failed to load previous live item from DB',
          );
        }
        applyItem(body.item || null);
      } catch (err) {
        setError(err.message || 'Failed to load live item');
        applyItem(null);
      } finally {
        setLoading(false);
      }
    },
    [applyItem, buildQuery],
  );

  useEffect(() => {
    setHistory([]);
    fetchNext({});
  }, [siteId, lineId, cameraId, fetchNext]);

  const handleSaveAndNext = useCallback(async () => {
    if (!currentItem) return;
    setLoading(true);
    setError('');

    try {
      const payload = {
        status,
        current_label_set: {
          source: 'HUMAN',
          labels: [
            {
              class_id: classId,
              class_name: resolveClassName(classId),
              confidence: 1,
              bbox_x: 0,
              bbox_y: 0,
              bbox_w: 1,
              bbox_h: 1,
              is_ignored: isIgnored,
              is_uncertain: false,
            },
          ],
        },
      };

      const res = await fetch(
        `${API_BASE}/api/training-studio/items/live/${currentItem.id}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const body = await res.json();
      if (!res.ok || body.status !== 'ok') {
        throw new Error(body.error || 'Failed to save label');
      }

      setHistory((prev) => [...prev, currentItem]);
      await fetchNext({ afterItemId: currentItem.id });
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }, [classId, currentItem, fetchNext, isIgnored, status]);

  const handlePrev = useCallback(async () => {
    setError('');
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((prev) => prev.slice(0, prev.length - 1));
    await fetchPrev({ beforeItemId: previous.id });
  }, [fetchPrev, history]);

  const handleKeyDown = useCallback(
    (event) => {
      const action = findActionForEvent(event);
      if (!action) return;

      if (action === 'save_and_next') {
        event.preventDefault();
        handleSaveAndNext();
      } else if (action === 'prev') {
        event.preventDefault();
        handlePrev();
      }
    },
    [findActionForEvent, handlePrev, handleSaveAndNext],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <section className="ts-panel">
      <header className="ts-panel-header">
        <div>
          <h2 className="ts-panel-title">Live Items</h2>
          <p className="ts-panel-desc">
            Review items captured from the conveyor during live operation.
            In dev mode, data is loaded from the Live Items DB seeded by
            Jetson + controller ingest tools.
          </p>
        </div>
        <div className="ts-panel-filters">
          <label className="ts-field">
            <span>Site</span>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
            >
              <option value="SITE_LT_01">SITE_LT_01 / Dev site</option>
            </select>
          </label>
          <label className="ts-field">
            <span>Line</span>
            <select
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
            >
              <option value="LINE_01">LINE_01 / Main dev line</option>
            </select>
          </label>
          <label className="ts-field">
            <span>Camera</span>
            <select
              value={cameraId}
              onChange={(e) => setCameraId(e.target.value)}
            >
              <option value="CAM01">CAM01</option>
            </select>
          </label>
        </div>
      </header>

      {error && <p className="ts-error">{error}</p>}

      {!hasItem && !loading && !error && (
        <p className="ts-helper">
          No live items yet for these filters. In dev mode this view reads
          from the <strong>ts_live_items</strong> DB table populated by
          the ingest demo tools.
        </p>
      )}

      {loading && (
        <p className="ts-helper">Loading live item from database…</p>
      )}

      {hasItem && (
        <div className="ts-manual-layout">
          <div className="ts-manual-media">
            <div className="ts-media-placeholder">
              <div className="ts-media-header-line">
                <MediaStatusChip
                  media={media}
                  mediaError={mediaError}
                />
              </div>
              {media && media.url ? (
                <>
                  <img
                    src={`${API_BASE}${media.url}`}
                    alt={`Live item ${currentItem.id}`}
                  />
                  <p className="ts-helper">
                    ID: {currentItem.id}
                    <br />
                    Live item: {currentItem.site_id} /{' '}
                    {currentItem.line_id} / {currentItem.camera_id}{' '}
                    {currentItem.timestamp
                      ? `@ ${currentItem.timestamp}`
                      : ''}
                  </p>
                </>
              ) : (
                <>
                  <p>
                    ID: {currentItem.id}
                    <br />
                    Live item: {currentItem.site_id} /{' '}
                    {currentItem.line_id} / {currentItem.camera_id}
                  </p>
                  <p className="ts-helper">
                    Timestamp: {currentItem.timestamp || '—'}
                  </p>
                  <p className="ts-helper">
                    Media preview and model overlays will be wired later
                    to real frames from Jetson / controller PC.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="ts-manual-form">
            <div className="ts-field-grid">
              <label className="ts-field">
                <span>Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="UNREVIEWED">Unreviewed</option>
                  <option value="REVIEWED_OK">Reviewed – OK</option>
                  <option value="REVIEWED_FIX">
                    Reviewed – needs fix
                  </option>
                </select>
                <p className="ts-helper">
                  This status is stored together with your HUMAN label
                  set.
                </p>
              </label>

              <label className="ts-field">
                <span>Class</span>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  {CLASS_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="ts-helper">
                  In real deployments class list will come from the NVIDIA
                  model and config used on Jetson.
                </p>
              </label>
            </div>

            <label className="ts-field ts-inline">
              <input
                type="checkbox"
                checked={isIgnored}
                onChange={(e) => setIsIgnored(e.target.checked)}
              />
              <span>Ignore this item</span>
            </label>

            <div className="ts-actions">
              <button
                type="button"
                className="ts-btn ts-btn-secondary"
                onClick={handlePrev}
                disabled={loading || history.length === 0}
              >
                Previous
              </button>
              <button
                type="button"
                className="ts-btn"
                onClick={handleSaveAndNext}
                disabled={loading || !currentItem}
              >
                Save &amp; Next
              </button>
            </div>

            <p className="ts-helper">
              You can also use your configured Training Studio shortcuts
              (Save &amp; Next / Previous) while this view is focused.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function ManualItemsReview() {
  const [datasets, setDatasets] = useState([]);
  const [datasetId, setDatasetId] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [status, setStatus] = useState('UNREVIEWED');
  const [classId, setClassId] = useState(CLASS_OPTIONS[0].id);
  const [isIgnored, setIsIgnored] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaError, setMediaError] = useState('');

  const { findActionForEvent } = useShortcutProfile();

  const hasItem = !!currentItem;

  useEffect(() => {
    let cancelled = false;

    async function loadDatasets() {
      try {
        const res = await fetch(
          `${API_BASE}/api/training-studio/datasets/manual`,
        );
        const body = await res.json();
        if (!res.ok || body.status !== 'ok') {
          throw new Error(body.error || 'Failed to load datasets');
        }
        if (!cancelled) {
          setDatasets(body.datasets || []);
          if (!datasetId && body.datasets?.length) {
            setDatasetId(body.datasets[0].id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load datasets');
        }
      }
    }

    loadDatasets();

    return () => {
      cancelled = true;
    };
  }, [datasetId]);

  const fetchMediaForItem = useCallback(async (item) => {
    if (!item) {
      setMedia(null);
      setMediaError('');
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/training-studio/items/manual/${encodeURIComponent(
          item.id,
        )}/media`,
      );
      const body = await res.json();
      if (!res.ok || body.status !== 'ok') {
        throw new Error(
          body.error || 'Failed to load manual item media preview',
        );
      }
      setMedia(body.media || null);
      setMediaError('');
    } catch (err) {
      setMedia(null);
      setMediaError(err.message || 'Failed to load manual item media');
    }
  }, []);

  const applyItem = useCallback(
    (item) => {
      setCurrentItem(item || null);
      fetchMediaForItem(item || null);

      if (!item) {
        setStatus('UNREVIEWED');
        setClassId(CLASS_OPTIONS[0].id);
        setIsIgnored(false);
        return;
      }

      setStatus(item.status || 'UNREVIEWED');
      const labels = item.current_label_set?.labels || [];
      const first = labels[0];
      if (first) {
        setClassId(first.class_id || CLASS_OPTIONS[0].id);
        setIsIgnored(Boolean(first.is_ignored));
      } else {
        setClassId(CLASS_OPTIONS[0].id);
        setIsIgnored(false);
      }
    },
    [fetchMediaForItem],
  );

  const fetchNext = useCallback(
    async (opts = {}) => {
      if (!datasetId) return;
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        params.append('dataset_id', datasetId);
        if (opts.afterItemId) {
          params.append('after_item_id', opts.afterItemId);
        }

        const res = await fetch(
          `${API_BASE}/api/training-studio/items/manual/next?${params.toString()}`,
        );
        const body = await res.json();
        if (!res.ok || body.status !== 'ok') {
          throw new Error(
            body.error || 'Failed to load next manual item',
          );
        }
        applyItem(body.item || null);
      } catch (err) {
        setError(err.message || 'Failed to load manual item');
        applyItem(null);
      } finally {
        setLoading(false);
      }
    },
    [applyItem, datasetId],
  );

  const fetchPrev = useCallback(
    async (opts = {}) => {
      if (!datasetId) return;
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        params.append('dataset_id', datasetId);
        if (opts.beforeItemId) {
          params.append('before_item_id', opts.beforeItemId);
        }

        const res = await fetch(
          `${API_BASE}/api/training-studio/items/manual/prev?${params.toString()}`,
        );
        const body = await res.json();
        if (!res.ok || body.status !== 'ok') {
          throw new Error(
            body.error || 'Failed to load previous manual item',
          );
        }
        applyItem(body.item || null);
      } catch (err) {
        setError(err.message || 'Failed to load manual item');
        applyItem(null);
      } finally {
        setLoading(false);
      }
    },
    [applyItem, datasetId],
  );

  useEffect(() => {
    if (datasetId) {
      fetchNext({});
    }
  }, [datasetId, fetchNext]);

  const handleSaveAndNext = useCallback(async () => {
    if (!currentItem) return;
    setLoading(true);
    setError('');

    try {
      const payload = {
        status,
        current_label_set: {
          source: 'HUMAN',
          labels: [
            {
              class_id: classId,
              class_name: resolveClassName(classId),
              confidence: 1,
              bbox_x: 0,
              bbox_y: 0,
              bbox_w: 1,
              bbox_h: 1,
              is_ignored: isIgnored,
              is_uncertain: false,
            },
          ],
        },
      };

      const res = await fetch(
        `${API_BASE}/api/training-studio/items/manual/${currentItem.id}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const body = await res.json();
      if (!res.ok || body.status !== 'ok') {
        throw new Error(body.error || 'Failed to save label');
      }

      await fetchNext({ afterItemId: currentItem.id });
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }, [classId, currentItem, fetchNext, isIgnored, status]);

  const handlePrev = useCallback(async () => {
    if (!currentItem) return;
    await fetchPrev({ beforeItemId: currentItem.id });
  }, [currentItem, fetchPrev]);

  const handleKeyDown = useCallback(
    (event) => {
      const action = findActionForEvent(event);
      if (!action) return;

      if (action === 'save_and_next') {
        event.preventDefault();
        handleSaveAndNext();
      } else if (action === 'prev') {
        event.preventDefault();
        handlePrev();
      }
    },
    [findActionForEvent, handlePrev, handleSaveAndNext],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <section className="ts-panel">
      <header className="ts-panel-header">
        <div>
          <h2 className="ts-panel-title">Manual Items</h2>
          <p className="ts-panel-desc">
            Label items from imported video or image datasets stored on
            the controller PC.
          </p>
        </div>
        <div className="ts-panel-filters">
          <label className="ts-field">
            <span>Dataset</span>
            <select
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
            >
              {datasets.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name || ds.id}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {error && <p className="ts-error">{error}</p>}

      {!hasItem && !loading && !error && (
        <p className="ts-helper">
          Select a dataset to start reviewing manual items. Items point to
          frames inside controller PC media folders.
        </p>
      )}

      {loading && (
        <p className="ts-helper">Loading manual item from dataset…</p>
      )}

      {hasItem && (
        <div className="ts-manual-layout">
          <div className="ts-manual-media">
            <div className="ts-media-placeholder">
              <div className="ts-media-header-line">
                <MediaStatusChip
                  media={media}
                  mediaError={mediaError}
                />
              </div>
              {media && media.url ? (
                <>
                  <img
                    src={`${API_BASE}${media.url}`}
                    alt={`Manual item ${currentItem.id}`}
                  />
                  <p className="ts-helper">
                    ID: {currentItem.id}
                    <br />
                    Source: {currentItem.media_path || '—'}
                  </p>
                </>
              ) : (
                <>
                  <p>
                    ID: {currentItem.id}
                    <br />
                    Source: {currentItem.media_path || '—'}
                  </p>
                  <p className="ts-helper">
                    Timestamp / frame index:{' '}
                    {currentItem.frame_index ?? '—'}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="ts-manual-form">
            <div className="ts-field-grid">
              <label className="ts-field">
                <span>Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="UNREVIEWED">Unreviewed</option>
                  <option value="REVIEWED_OK">Reviewed – OK</option>
                  <option value="REVIEWED_FIX">
                    Reviewed – needs fix
                  </option>
                </select>
              </label>

              <label className="ts-field">
                <span>Class</span>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  {CLASS_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="ts-field ts-inline">
              <input
                type="checkbox"
                checked={isIgnored}
                onChange={(e) => setIsIgnored(e.target.checked)}
              />
              <span>Ignore this item</span>
            </label>

            <div className="ts-actions">
              <button
                type="button"
                className="ts-btn ts-btn-secondary"
                onClick={handlePrev}
                disabled={loading || !currentItem}
              >
                Previous
              </button>
              <button
                type="button"
                className="ts-btn"
                onClick={handleSaveAndNext}
                disabled={loading || !currentItem}
              >
                Save &amp; Next
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function TrainingStudioItemsPage() {
  const [activeTab, setActiveTab] = useState('live');

  return (
    <div className="ts-page">
      <header className="ts-page-header">
        <div className="ts-page-kicker">AKIS · Training Studio</div>
        <h1 className="ts-page-title">Items</h1>
        <p className="ts-page-subtitle">
          Review and improve labels for live and manual items before
          training models.
        </p>
      </header>

      <div className="ts-layout-split">
        <section className="ts-panel">
          <div className="ts-items-intro">
            <h2>How items work</h2>
            <p>
              Live Items come from the conveyor and Jetson/runtime ingest.
              Manual Items are frames from imported datasets on the
              controller PC.
            </p>
            <ul className="ts-items-intro-list">
              <li>
                Use <strong>Live Items</strong> to correct predictions on
                real production flows.
              </li>
              <li>
                Use <strong>Manual Items</strong> to label offline video /
                image datasets.
              </li>
              <li>
                Human label sets are stored separately from model
                predictions for later training.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
            <div className="ts-tabs">
              <button
                type="button"
                className={
                  'ts-tab ' + (activeTab === 'live' ? 'ts-tab-active' : '')
                }
                onClick={() => setActiveTab('live')}
              >
                Live Items
              </button>
              <button
                type="button"
                className={
                  'ts-tab ' +
                  (activeTab === 'manual' ? 'ts-tab-active' : '')
                }
                onClick={() => setActiveTab('manual')}
              >
                Manual Items
              </button>
            </div>
          </div>

          {activeTab === 'live' ? <LiveItemsReview /> : <ManualItemsReview />}
        </section>
      </div>
    </div>
  );
}
