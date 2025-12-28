import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../api/client.js';
import { useShortcutProfile } from './hooks/useShortcutProfile.js';

const CLASS_OPTIONS = [
  { id: 'T_SHIRT', label: 'T-shirt' },
  { id: 'TOWEL', label: 'Towel' },
  { id: 'SHEET', label: 'Sheet' },
];

const SITE_OPTIONS = [
  { id: 'SITE_LT_01', label: 'SITE_LT_01 / Dev site' },
];

const LINE_OPTIONS = [
  { id: 'LINE_01', label: 'LINE_01 / Main dev line' },
];

const CAMERA_OPTIONS = [
  { id: 'CAM01', label: 'CAM01' },
];

function resolveClassName(classId) {
  return CLASS_OPTIONS.find((option) => option.id === classId)?.label || classId;
}

function MediaStatusChip({ media, mediaError }) {
  if (media && media.url) {
    return (
      <span className="ts-media-chip ts-media-chip-ok">
        Media loaded
      </span>
    );
  }
  if (mediaError) {
    return (
      <span className="ts-media-chip ts-media-chip-error">
        Media error
      </span>
    );
  }
  return (
    <span className="ts-media-chip ts-media-chip-muted">
      No media yet
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
      return params.toString() ? `?${params.toString()}` : '';
    },
    [siteId, lineId, cameraId],
  );

  const fetchMediaForItem = useCallback(
    async (item) => {
      if (!item) {
        setMedia(null);
        setMediaError('');
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/api/training-studio/items/live/${encodeURIComponent(item.id)}/media`,
        );
        if (!response.ok) {
          if (response.status === 404) {
            setMedia(null);
            setMediaError('');
            return;
          }
          throw new Error('Failed to load live item media');
        }
        const data = await response.json();
        if (data.status === 'ok') {
          setMedia(data.media || null);
          setMediaError('');
        } else {
          setMedia(null);
          setMediaError(data.error || 'Failed to load live item media');
        }
      } catch (e) {
        setMedia(null);
        setMediaError(e.message || 'Failed to load live item media');
      }
    },
    [],
  );

  const applyItem = useCallback(
    (item) => {
      setCurrentItem(item);
      fetchMediaForItem(item);
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
    },
    [fetchMediaForItem],
  );

  const fetchNext = useCallback(
    async (opts = {}) => {
      setLoading(true);
      setError('');
      try {
        const query = buildQuery({
          after_item_id: opts.afterItemId || null,
        });
        const response = await fetch(
          `${API_BASE}/api/training-studio/items/live/next${query}`,
        );
        if (!response.ok) {
          throw new Error('Failed to load next live item');
        }
        const data = await response.json();
        if (data.status !== 'ok') {
          throw new Error(data.error || 'Failed to load next live item');
        }
        if (!data.item) {
          applyItem(null);
          return;
        }
        applyItem(data.item);
      } catch (e) {
        setError(e.message || 'Failed to load next live item');
      } finally {
        setLoading(false);
      }
    },
    [applyItem, buildQuery],
  );

  const fetchPrev = useCallback(
    async () => {
      if (!history.length) return;
      const previous = history[history.length - 1];
      setLoading(true);
      setError('');
      try {
        const query = buildQuery({
          before_item_id: previous.id,
        });
        const response = await fetch(
          `${API_BASE}/api/training-studio/items/live/prev${query}`,
        );
        if (!response.ok) {
          throw new Error('Failed to load previous live item');
        }
        const data = await response.json();
        if (data.status !== 'ok') {
          throw new Error(data.error || 'Failed to load previous live item');
        }
        if (!data.item) {
          return;
        }
        setHistory((prev) => prev.slice(0, -1));
        applyItem(data.item);
      } catch (e) {
        setError(e.message || 'Failed to load previous live item');
      } finally {
        setLoading(false);
      }
    },
    [applyItem, buildQuery, history],
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
      const body = {
        status,
        class_id: classId,
        is_ignored: isIgnored,
      };
      const response = await fetch(
        `${API_BASE}/api/training-studio/items/live/${encodeURIComponent(currentItem.id)}/review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        throw new Error('Failed to save live item review');
      }
      const data = await response.json();
      if (data.status !== 'ok') {
        throw new Error(data.error || 'Failed to save live item review');
      }
      if (currentItem) {
        setHistory((prev) => [...prev, currentItem]);
      }
      await fetchNext({ afterItemId: currentItem.id });
    } catch (e) {
      setError(e.message || 'Failed to save live item review');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    const action = findActionForEvent(event);
    if (!action) return;
    if (action.id === 'training_studio_next') {
      event.preventDefault();
      handleSaveAndNext();
    } else if (action.id === 'training_studio_prev') {
      event.preventDefault();
      fetchPrev();
    }
  }

  return (
    <section className="ts-panel" onKeyDown={handleKeyDown} tabIndex={0}>
      <header className="ts-panel-header">
        <div>
          <h2>Live Items</h2>
          <p className="ts-helper">
            Review items captured from the conveyor during live operation.
            In dev mode, data is seeded from the Live Items DB and Jetson ingest tools.
          </p>
        </div>
        <div className="ts-panel-filters">
          <label className="ts-field">
            <span>Site</span>
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              {SITE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="ts-field">
            <span>Line</span>
            <select value={lineId} onChange={(e) => setLineId(e.target.value)}>
              {LINE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="ts-field">
            <span>Camera</span>
            <select value={cameraId} onChange={(e) => setCameraId(e.target.value)}>
              {CAMERA_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="ts-panel-body">
        {error && (
          <p className="ts-error">{error}</p>
        )}
        {!currentItem && !error && (
          <p className="ts-helper">
            No items found for the selected filters.
          </p>
        )}
        {currentItem && (
          <div className="ts-manual-layout">
            <div className="ts-manual-media">
              <div className="ts-media-placeholder">
                <div className="ts-media-placeholder-header">
                  <MediaStatusChip media={media} mediaError={mediaError} />
                </div>
                {media && media.url ? (
                  <>
                    <img
                      src={`${API_BASE}${media.url}`}
                      alt={`Live item ${currentItem.id}`}
                    />
                    <div className="ts-item-meta-row">
                      <span className="ts-item-id-pill">
                        ID: {currentItem.id}
                      </span>
                      <span className="ts-item-meta-chip">
                        {currentItem.site_id} / {currentItem.line_id} / {currentItem.camera_id}
                      </span>
                    </div>
                    <p className="ts-helper">
                      Timestamp: {currentItem.timestamp || '—'}
                      <br />
                      Media preview and model overlays will be wired later to real
                      frames from Jetson/controller PC.
                    </p>
                    {mediaError && (
                      <p className="ts-helper">{mediaError}</p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="ts-item-meta-row">
                      <span className="ts-item-id-pill">
                        ID: {currentItem.id}
                      </span>
                      <span className="ts-item-meta-chip">
                        {currentItem.site_id} / {currentItem.line_id} / {currentItem.camera_id}
                      </span>
                    </div>
                    <p className="ts-helper">
                      Timestamp: {currentItem.timestamp || '—'}
                      <br />
                      Media preview and model overlays will be wired later to real
                      frames from Jetson/controller PC.
                    </p>
                    {mediaError && (
                      <p className="ts-helper">{mediaError}</p>
                    )}
                  </>
                )}
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
                <p className="ts-helper">
                  This status is stored together with your HUMAN label set.
                </p>
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
                  className="ts-btn ts-btn-muted"
                  disabled={loading || !history.length}
                  onClick={fetchPrev}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="ts-btn ts-btn-primary"
                  disabled={loading || !currentItem}
                  onClick={handleSaveAndNext}
                >
                  Save &amp; Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
  const [media, setMedia] = useState(null);
  const [mediaError, setMediaError] = useState('');

  const { findActionForEvent } = useShortcutProfile();

  const activeDatasetLabel = useMemo(() => {
    if (!datasetId) return '';
    const ds = datasets.find((d) => d.id === datasetId);
    if (!ds) return '';
    return ds.name || ds.id;
  }, [datasets, datasetId]);

  const fetchDatasets = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/training-studio/datasets/manual`,
      );
      if (!response.ok) {
        throw new Error('Failed to load datasets');
      }
      const data = await response.json();
      if (data.status !== 'ok') {
        throw new Error(data.error || 'Failed to load datasets');
      }
      setDatasets(data.datasets || []);
      if (!datasetId && data.datasets.length > 0) {
        setDatasetId(data.datasets[0].id);
      }
    } catch (e) {
      setError(e.message || 'Failed to load datasets');
    }
  }, [datasetId]);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const buildQuery = useCallback(
    (extra = {}) => {
      const params = new URLSearchParams();
      if (datasetId) params.append('dataset_id', datasetId);
      if (extra.after_item_id) {
        params.append('after_item_id', extra.after_item_id);
      }
      if (extra.before_item_id) {
        params.append('before_item_id', extra.before_item_id);
      }
      return params.toString() ? `?${params.toString()}` : '';
    },
    [datasetId],
  );

  const fetchMediaForItem = useCallback(
    async (item) => {
      if (!item) {
        setMedia(null);
        setMediaError('');
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/api/training-studio/items/manual/${encodeURIComponent(item.id)}/media`,
        );
        if (!response.ok) {
          if (response.status === 404) {
            setMedia(null);
            setMediaError('');
            return;
          }
          throw new Error('Failed to load manual item media');
        }
        const data = await response.json();
        if (data.status === 'ok') {
          setMedia(data.media || null);
          setMediaError('');
        } else {
          setMedia(null);
          setMediaError(data.error || 'Failed to load manual item media');
        }
      } catch (e) {
        setMedia(null);
        setMediaError(e.message || 'Failed to load manual item media');
      }
    },
    [],
  );

  const applyItem = useCallback(
    (item) => {
      setCurrentItem(item);
      fetchMediaForItem(item);
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
    },
    [fetchMediaForItem],
  );

  const fetchNext = useCallback(
    async (opts = {}) => {
      if (!datasetId) return;
      setLoading(true);
      setError('');
      try {
        const query = buildQuery({
          after_item_id: opts.afterItemId || null,
        });
        const response = await fetch(
          `${API_BASE}/api/training-studio/items/manual/next${query}`,
        );
        if (!response.ok) {
          throw new Error('Failed to load next manual item');
        }
        const data = await response.json();
        if (data.status !== 'ok') {
          throw new Error(data.error || 'Failed to load next manual item');
        }
        if (!data.item) {
          applyItem(null);
          return;
        }
        applyItem(data.item);
      } catch (e) {
        setError(e.message || 'Failed to load next manual item');
      } finally {
        setLoading(false);
      }
    },
    [applyItem, buildQuery, datasetId],
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
        const query = `?${params.toString()}`;
        const response = await fetch(
          `${API_BASE}/api/training-studio/items/manual/prev${query}`,
        );
        if (!response.ok) {
          throw new Error('Failed to load previous manual item');
        }
        const data = await response.json();
        if (data.status !== 'ok') {
          throw new Error(data.error || 'Failed to load previous manual item');
        }
        if (!data.item) {
          return;
        }
        setHistory((prev) => prev.slice(0, -1));
        applyItem(data.item);
      } catch (e) {
        setError(e.message || 'Failed to load previous manual item');
      } finally {
        setLoading(false);
      }
    },
    [applyItem, datasetId],
  );

  useEffect(() => {
    if (!datasetId) return;
    fetchNext({ afterItemId: null });
    setHistory([]);
  }, [datasetId, fetchNext]);

  async function handleSaveAndNext() {
    if (!currentItem || !datasetId) return;
    setLoading(true);
    setError('');
    try {
      const body = {
        status,
        class_id: classId,
        is_ignored: isIgnored,
      };
      const response = await fetch(
        `${API_BASE}/api/training-studio/items/manual/${encodeURIComponent(currentItem.id)}/review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        throw new Error('Failed to save manual item review');
      }
      const data = await response.json();
      if (data.status !== 'ok') {
        throw new Error(data.error || 'Failed to save manual item review');
      }
      if (currentItem) {
        setHistory((prev) => [...prev, currentItem]);
      }
      await fetchNext({ afterItemId: currentItem.id });
    } catch (e) {
      setError(e.message || 'Failed to save manual item review');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    const action = findActionForEvent(event);
    if (!action) return;
    if (action.id === 'training_studio_next') {
      event.preventDefault();
      handleSaveAndNext();
    } else if (action.id === 'training_studio_prev') {
      event.preventDefault();
      fetchPrev({
        beforeItemId: history.length ? history[history.length - 1].id : null,
      });
    }
  }

  return (
    <section className="ts-panel" onKeyDown={handleKeyDown} tabIndex={0}>
      <header className="ts-panel-header">
        <div>
          <h2>Manual Items</h2>
          <p className="ts-helper">
            Phase A/B: items come from offline datasets recorded on the
            controller PC.
          </p>
        </div>
        <div className="ts-panel-filters">
          <label className="ts-field">
            <span>Dataset</span>
            <select
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
            >
              <option value="">Select dataset…</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name || dataset.id}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="ts-panel-body">
        {error && (
          <p className="ts-error">{error}</p>
        )}
        {datasets.length === 0 && !error && (
          <p className="ts-helper">
            No datasets registered yet. Use the Datasets &amp; Media tab to register
            an offline dataset first.
          </p>
        )}
        {datasetId && !currentItem && !loading && !error && (
          <p className="ts-helper">
            No items found for dataset <strong>{activeDatasetLabel}</strong>.
          </p>
        )}
        {currentItem && (
          <div className="ts-manual-layout">
            <div className="ts-manual-media">
              <div className="ts-media-placeholder">
                <div className="ts-media-placeholder-header">
                  <MediaStatusChip media={media} mediaError={mediaError} />
                </div>
                {media && media.url ? (
                  <>
                    <img
                      src={`${API_BASE}${media.url}`}
                      alt={`Manual item ${currentItem.id}`}
                    />
                    <p className="ts-helper">
                      Item {currentItem.frame_index ?? currentItem.id}
                    </p>
                  </>
                ) : (
                  <>
                    <p>Item {currentItem.frame_index ?? currentItem.id}</p>
                    <p className="ts-helper">
                      Media preview and overlays will be wired later to real
                      frames from offline datasets recorded on the controller PC.
                    </p>
                    {mediaError && (
                      <p className="ts-helper">{mediaError}</p>
                    )}
                  </>
                )}
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
                <p className="ts-helper">
                  This status is stored together with your HUMAN label set.
                </p>
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
                  config used for this dataset.
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
                  className="ts-btn ts-btn-muted"
                  disabled={loading || !history.length}
                  onClick={() => {
                    if (!history.length) return;
                    const previous = history[history.length - 1];
                    fetchPrev({ beforeItemId: previous.id });
                  }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="ts-btn ts-btn-primary"
                  disabled={loading || !currentItem}
                  onClick={handleSaveAndNext}
                >
                  Save &amp; Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function TrainingStudioItemsPage() {
  const [activeTab, setActiveTab] = useState('live');

  return (
    <section className="ts-page">
      <header className="ts-page-header ts-page-header-tabs">
        <div>
          <h1>Items</h1>
          <p className="ts-helper">
            Review items coming from the controller/Jetson and adjust labels before
            training models.
          </p>
        </div>
        <div className="ts-tabs">
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
      </header>
    </section>
  );
}
