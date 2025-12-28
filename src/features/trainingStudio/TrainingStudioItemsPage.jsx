import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../api/client.js';
import { useShortcutProfile } from './hooks/useShortcutProfile.js';

const CLASS_OPTIONS = [
  { id: 'T_SHIRT', label: 'T-shirt' },
  { id: 'TOWEL', label: 'Towel' },
  { id: 'SHEET', label: 'Sheet' },
];

function resolveClassName(classId) {
  return CLASS_OPTIONS.find((option) => option.id === classId)?.label || classId;
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

  const { findActionForEvent } = useShortcutProfile();

  const buildQuery = useCallback(
    (extra = {}) => {
      const params = new URLSearchParams();
      if (siteId) params.append('site_id', siteId);
      if (lineId) params.append('line_id', lineId);
      if (cameraId) params.append('camera_id', cameraId);
      if (extra.after_item_id) {
        params.append('after_item_id', extra.after_item_id);
      }
      if (extra.before_item_id) {
        params.append('before_item_id', extra.before_item_id);
      }
      return params.toString();
    },
    [siteId, lineId, cameraId],
  );

  const applyItem = useCallback((item) => {
    setCurrentItem(item);
    if (!item) return;
    setStatus(item.status || 'UNREVIEWED');
    const labels = item.current_label_set?.labels || [];
    if (labels.length > 0) {
      setClassId(labels[0].class_id || CLASS_OPTIONS[0].id);
      setIsIgnored(Boolean(labels[0].is_ignored));
    } else {
      setClassId(CLASS_OPTIONS[0].id);
      setIsIgnored(false);
    }
  }, []);

  const fetchNext = useCallback(
    async (opts = {}) => {
      setLoading(true);
      setError('');
      try {
        const qs = buildQuery({ after_item_id: opts.afterItemId });
        const res = await fetch(
          `${API_BASE}/api/training-studio/items/live/next?${qs}`,
        );
        const body = await res.json();
        if (!res.ok || body.status !== 'ok') {
          throw new Error(body.error || 'Failed to load next live item');
        }
        applyItem(body.item || null);
      } catch (e) {
        setError(e.message || 'Failed to load next live item');
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
        const qs = buildQuery({ before_item_id: opts.beforeItemId });
        const res = await fetch(
          `${API_BASE}/api/training-studio/items/live/prev?${qs}`,
        );
        const body = await res.json();
        if (!res.ok || body.status !== 'ok') {
          throw new Error(body.error || 'Failed to load previous live item');
        }
        applyItem(body.item || null);
      } catch (e) {
        setError(e.message || 'Failed to load previous live item');
      } finally {
        setLoading(false);
      }
    },
    [applyItem, buildQuery],
  );

  useEffect(() => {
    fetchNext({ afterItemId: null });
    setHistory([]);
  }, [siteId, lineId, cameraId, fetchNext]);

  async function handleSaveAndNext() {
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
              confidence: 1.0,
              bbox_x: 0,
              bbox_y: 0,
              bbox_w: 1,
              bbox_h: 1,
              is_ignored: isIgnored,
            },
          ],
        },
      };

      const res = await fetch(
        `${API_BASE}/api/training-studio/items/live/${currentItem.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );
      const body = await res.json();
      if (!res.ok || body.status !== 'ok') {
        throw new Error(body.error || 'Failed to save live item');
      }

      setHistory((prev) => [...prev, currentItem.id].slice(-50));
      await fetchNext({ afterItemId: currentItem.id });
    } catch (e) {
      setError(e.message || 'Failed to save live item');
    } finally {
      setLoading(false);
    }
  }

  async function handlePrev() {
    if (!currentItem && history.length === 0) return;
    const lastId = history[history.length - 1];
    if (!lastId && currentItem) {
      await fetchPrev({ beforeItemId: currentItem.id });
      return;
    }
    if (!lastId) return;
    setHistory((prev) => prev.slice(0, prev.length - 1));
    await fetchPrev({ beforeItemId: lastId });
  }

  useEffect(() => {
    function onKeyDown(evt) {
      const action = findActionForEvent(evt);
      if (!action) return;

      if (action === 'save_and_next') {
        evt.preventDefault();
        handleSaveAndNext();
        return;
      }
      if (action === 'prev_item') {
        evt.preventDefault();
        handlePrev();
        return;
      }
      if (action.startsWith('set_class:')) {
        evt.preventDefault();
        const cls = action.split(':')[1];
        setClassId(cls);
        return;
      }
      if (action === 'toggle_ignore') {
        evt.preventDefault();
        setIsIgnored((prev) => !prev);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [findActionForEvent, handlePrev, handleSaveAndNext]);

  return (
    <section className="ts-panel">
      <header className="ts-panel-header">
        <div>
          <h3>Live items - one-by-one review</h3>
          <p className="ts-helper">
            Items captured from Jetson during real conveyor operation. Save and
            Next records your correction and jumps to the next matching item.
          </p>
        </div>
        <div className="ts-field-grid">
          <label className="ts-field">
            <span>Site</span>
            <input
              type="text"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
            />
          </label>
          <label className="ts-field">
            <span>Line</span>
            <input
              type="text"
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
            />
          </label>
          <label className="ts-field">
            <span>Camera</span>
            <input
              type="text"
              value={cameraId}
              onChange={(e) => setCameraId(e.target.value)}
            />
          </label>
        </div>
      </header>

      {error && <p className="ts-error">{error}</p>}
      {!error && !currentItem && !loading && (
        <p className="ts-helper">
          No live items available for the current filters yet. In Phase E this
          view is backed by an in-memory demo store. Later it will be wired to
          real Jetson ingest and snapshots.
        </p>
      )}

      {currentItem && (
        <div className="ts-manual-layout">
          <div className="ts-manual-media">
            <div className="ts-media-placeholder">
              <p>
                Live item: {currentItem.site_id} / {currentItem.line_id} /{' '}
                {currentItem.camera_id}
              </p>
              <p className="ts-helper">
                Timestamp: {currentItem.timestamp || '—'}
                <br />
                Media preview and model overlays will be wired later to real
                frames from Jetson/controller PC.
              </p>
            </div>
          </div>

          <div className="ts-manual-form">
            <label className="ts-field">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="UNREVIEWED">Unreviewed</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="REVIEWED">Reviewed</option>
              </select>
            </label>

            <label className="ts-field">
              <span>Class</span>
              <select value={classId} onChange={(e) => setClassId(e.target.value)}>
                {CLASS_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="ts-helper">
                In real deployments class list will come from the NVIDIA model
                and config used on Jetson.
              </p>
            </label>

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
                className="ts-btn"
                onClick={handlePrev}
                disabled={loading}
              >
                Previous
              </button>
              <button
                type="button"
                className="ts-btn"
                onClick={handleSaveAndNext}
                disabled={loading || !currentItem}
              >
                Save and Next
              </button>
            </div>

            <p className="ts-helper">
              Keyboard shortcuts (default profile):
              <br />
              <code>S</code> - Save and Next, <code>Left</code> / <code>Right</code>
              - Prev or Next, <code>1</code>/<code>2</code>/<code>3</code> - classes,
              <code>X</code> - toggle ignore.
            </p>
          </div>
        </div>
      )}

      {loading && <p className="ts-helper">Loading...</p>}
    </section>
  );
}

function ManualItemsReview() {
  const [datasets, setDatasets] = useState([]);
  const [datasetId, setDatasetId] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState('UNREVIEWED');
  const [classId, setClassId] = useState(CLASS_OPTIONS[0].id);
  const [isIgnored, setIsIgnored] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { findActionForEvent } = useShortcutProfile();

  const activeDatasetLabel = useMemo(() => {
    const found = datasets.find((dataset) => dataset.id === datasetId);
    return found ? `${found.name} (${found.site_id}/${found.line_id})` : '';
  }, [datasets, datasetId]);

  useEffect(() => {
    let cancelled = false;

    async function loadDatasets() {
      try {
        const res = await fetch(`${API_BASE}/api/training-studio/datasets`);
        const body = await res.json();
        if (!res.ok || body.status !== 'ok') {
          throw new Error(body.error || 'Failed to load datasets');
        }
        const manual = (body.datasets || []).filter(
          (dataset) => dataset.item_source === 'MANUAL' || !dataset.item_source,
        );
        if (!cancelled) {
          setDatasets(manual);
          if (manual.length > 0) {
            setDatasetId((prev) => prev || manual[0].id);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Failed to load datasets');
        }
      }
    }

    loadDatasets();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyItem = useCallback((item) => {
    setCurrentItem(item);
    if (!item) return;
    setStatus(item.status || 'UNREVIEWED');
    const labels = item.current_label_set?.labels || [];
    if (labels.length > 0) {
      setClassId(labels[0].class_id || CLASS_OPTIONS[0].id);
      setIsIgnored(Boolean(labels[0].is_ignored));
    } else {
      setClassId(CLASS_OPTIONS[0].id);
      setIsIgnored(false);
    }
  }, []);

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
          throw new Error(body.error || 'Failed to load next item');
        }
        applyItem(body.item || null);
      } catch (e) {
        setError(e.message || 'Failed to load next item');
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
          throw new Error(body.error || 'Failed to load previous item');
        }
        applyItem(body.item || null);
      } catch (e) {
        setError(e.message || 'Failed to load previous item');
      } finally {
        setLoading(false);
      }
    },
    [applyItem, datasetId],
  );

  useEffect(() => {
    if (!datasetId) return;
    fetchNext({ afterItemId: null });
  }, [datasetId, fetchNext]);

  async function handleSaveAndNext() {
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
              confidence: 1.0,
              bbox_x: 0,
              bbox_y: 0,
              bbox_w: 1,
              bbox_h: 1,
              is_ignored: isIgnored,
            },
          ],
        },
      };

      const res = await fetch(
        `${API_BASE}/api/training-studio/items/manual/${currentItem.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );
      const body = await res.json();
      if (!res.ok || body.status !== 'ok') {
        throw new Error(body.error || 'Failed to save item');
      }

      setHistory((prev) => [...prev, currentItem.id].slice(-20));
      await fetchNext({ afterItemId: currentItem.id });
    } catch (e) {
      setError(e.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  }

  async function handlePrev() {
    if (!datasetId) return;
    const lastId = history[history.length - 1];
    if (!lastId && currentItem) {
      await fetchPrev({ beforeItemId: currentItem.id });
      return;
    }
    if (!lastId) return;
    setHistory((prev) => prev.slice(0, prev.length - 1));
    await fetchPrev({ beforeItemId: lastId });
  }

  useEffect(() => {
    function onKeyDown(evt) {
      const action = findActionForEvent(evt);
      if (!action) return;

      if (action === 'save_and_next') {
        evt.preventDefault();
        handleSaveAndNext();
        return;
      }
      if (action === 'prev_item') {
        evt.preventDefault();
        handlePrev();
        return;
      }
      if (action.startsWith('set_class:')) {
        evt.preventDefault();
        const cls = action.split(':')[1];
        setClassId(cls);
        return;
      }
      if (action === 'toggle_ignore') {
        evt.preventDefault();
        setIsIgnored((prev) => !prev);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [findActionForEvent, handlePrev, handleSaveAndNext]);

  return (
    <section className="ts-panel">
      <header className="ts-panel-header">
        <div>
          <h3>Manual items - one-by-one review</h3>
          <p className="ts-helper">
            Save and Next will persist your changes and immediately load the next
            item in this dataset.
          </p>
        </div>
        <label className="ts-field">
          <span>Dataset</span>
          <select
            value={datasetId}
            onChange={(e) => {
              setDatasetId(e.target.value);
              setHistory([]);
              setCurrentItem(null);
            }}
          >
            {datasets.map((dataset) => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.name} ({dataset.site_id}/{dataset.line_id})
              </option>
            ))}
          </select>
        </label>
      </header>

      {error && <p className="ts-error">{error}</p>}
      {!error && !currentItem && !loading && datasetId && (
        <p className="ts-helper">
          No manual items available yet. In Phase B this is backed by an in-memory
          demo store. Later it will be real frames from imported media.
        </p>
      )}
      {!error && !currentItem && !loading && !datasetId && (
        <p className="ts-helper">
          No manual datasets available yet. Create one in Datasets & Media.
        </p>
      )}

      {currentItem && (
        <div className="ts-manual-layout">
          <div className="ts-manual-media">
            <div className="ts-media-placeholder">
              <p>Item {currentItem.frame_index ?? currentItem.id}</p>
              <p className="ts-helper">
                Media preview will be wired later to real frames/video. For now
                this is a placeholder.
              </p>
            </div>
            <p className="ts-helper">
              Dataset: {activeDatasetLabel || 'n/a'}
            </p>
            <p className="ts-helper">
              Site: {currentItem.site_id} | Line: {currentItem.line_id}
              {currentItem.camera_id ? ` | Camera: ${currentItem.camera_id}` : ''}
            </p>
          </div>

          <div className="ts-manual-form">
            <label className="ts-field">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="UNREVIEWED">Unreviewed</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="REVIEWED">Reviewed</option>
              </select>
            </label>

            <label className="ts-field">
              <span>Class</span>
              <select value={classId} onChange={(e) => setClassId(e.target.value)}>
                {CLASS_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="ts-helper">
                In production, the class list will come from the NVIDIA model
                configuration.
              </p>
            </label>

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
                className="ts-btn"
                onClick={handlePrev}
                disabled={loading}
              >
                Previous
              </button>
              <button
                type="button"
                className="ts-btn"
                onClick={handleSaveAndNext}
                disabled={loading || !currentItem}
              >
                Save and Next
              </button>
            </div>

            <p className="ts-helper">
              Keyboard shortcuts (default profile):
              <br />
              <code>S</code> - Save and Next, <code>Left</code> / <code>Right</code>
              - Prev or Next, <code>1</code>/<code>2</code>/<code>3</code> - classes,
              <code>X</code> - toggle ignore.
            </p>
          </div>
        </div>
      )}

      {loading && <p className="ts-helper">Loading...</p>}
    </section>
  );
}

export function TrainingStudioItemsPage() {
  const [activeTab, setActiveTab] = useState('live');

  return (
    <section className="ts-page">
      <header className="ts-page-header">
        <div>
          <h2>Items</h2>
          <p>Review items from live Jetson and manual datasets.</p>
        </div>
      </header>

      <div className="ts-tab-strip">
        <button
          className={activeTab === 'live' ? 'ts-tab is-active' : 'ts-tab'}
          type="button"
          onClick={() => setActiveTab('live')}
        >
          Live Items
        </button>
        <button
          className={activeTab === 'manual' ? 'ts-tab is-active' : 'ts-tab'}
          type="button"
          onClick={() => setActiveTab('manual')}
        >
          Manual Items
        </button>
      </div>

      {activeTab === 'live' && <LiveItemsReview />}
      {activeTab === 'manual' && <ManualItemsReview />}
    </section>
  );
}
