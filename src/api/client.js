const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_AKIS_API_BASE ||
  'http://localhost:4100';

export async function getHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        (data && data.error) ||
        (data && data.db && data.db.error) ||
        (typeof data === 'string' ? data : null) ||
        `HTTP ${res.status}`;
      return { ok: false, error: message || 'Request failed' };
    }

    return data;
  } catch (err) {
    return { ok: false, error: err.message || 'Network error' };
  }
}

export { API_BASE };

export async function getHealthReady() {
  try {
    const res = await fetch(`${API_BASE}/api/health/ready`);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        (data && data.error) ||
        (data && data.db && data.db.error) ||
        (typeof data === 'string' ? data : null) ||
        `HTTP ${res.status}`;
      return { error: message || 'Request failed', status: res.status, data };
    }

    return { data };
  } catch (err) {
    return { error: err.message || 'Network error' };
  }
}

export async function getMockItems(limit) {
  try {
    const params = new URLSearchParams();
    if (limit && Number.isFinite(Number(limit))) {
      params.set('limit', Number(limit));
    }
    const url = params.toString()
      ? `${API_BASE}/api/items/mock?${params.toString()}`
      : `${API_BASE}/api/items/mock`;

    const res = await fetch(url);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        (data && data.error) ||
        (typeof data === 'string' ? data : null) ||
        `HTTP ${res.status}`;
      return { ok: false, error: message || 'Request failed', status: res.status, data };
    }

    return data;
  } catch (err) {
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function getRuntimeItems(params = {}) {
  try {
    const search = new URLSearchParams();
    const {
      limit,
      category,
      quality,
      chute_id,
      pick_status,
      site_id,
      line_id,
    } = params;

    if (limit && Number.isFinite(Number(limit))) {
      search.set('limit', Number(limit));
    }
    if (category) search.set('category', category);
    if (quality) search.set('quality', quality);
    if (chute_id) search.set('chute_id', chute_id);
    if (pick_status) search.set('pick_status', pick_status);
    if (site_id) search.set('site_id', site_id);
    if (line_id) search.set('line_id', line_id);

    const url = search.toString()
      ? `${API_BASE}/api/items?${search.toString()}`
      : `${API_BASE}/api/items`;

    const res = await fetch(url);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        (data && data.error) ||
        (typeof data === 'string' ? data : null) ||
        `HTTP ${res.status}`;
      return { ok: false, error: message || 'Request failed', status: res.status, data };
    }

    return data;
  } catch (err) {
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function getRuntimeStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/debug/runtime-status`);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        (data && data.error) ||
        (typeof data === 'string' ? data : null) ||
        `HTTP ${res.status}`;
      return { ok: false, error: message || 'Request failed', status: res.status, data };
    }

    return data;
  } catch (err) {
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function getItemHistory(itemId) {
  if (!itemId) {
    return { error: 'Missing item id' };
  }
  try {
    const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(itemId)}/history`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        (data && data.error) ||
        (typeof data === 'string' ? data : null) ||
        `HTTP ${res.status}`;
      return {
        error: message || 'Request failed',
        status: res.status,
        requestId: data?.requestId,
      };
    }
    return {
      events: data.events || [],
      status: res.status,
      requestId: data.requestId,
      item_id: data.item_id,
      count: data.count,
    };
  } catch (err) {
    return { error: err.message || 'Network error' };
  }
}

export async function getProgressSummary(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.fresh) {
      params.set('fresh', '1');
    }
    const url = params.toString()
      ? `${API_BASE}/api/progress/summary?${params.toString()}`
      : `${API_BASE}/api/progress/summary`;

    const res = await fetch(url);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        (data && data.error) ||
        (typeof data === 'string' ? data : null) ||
        `HTTP ${res.status}`;
      return {
        ok: false,
        error: message || 'Request failed',
        status: res.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      ok: false,
      error: err.message || 'Network error',
    };
  }
}

export async function getProgressTimeline(options = {}) {
  try {
    const params = new URLSearchParams();
    const { limit, topic, fresh } = options;
    if (Number.isFinite(Number(limit))) {
      params.set('limit', Number(limit));
    }
    if (topic) {
      params.set('topic', topic);
    }
    if (fresh) {
      params.set('fresh', '1');
    }
    const url = params.toString()
      ? `${API_BASE}/api/progress/timeline?${params.toString()}`
      : `${API_BASE}/api/progress/timeline`;

    const res = await fetch(url);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        (data && data.error) ||
        (typeof data === 'string' ? data : null) ||
        `HTTP ${res.status}`;
      return {
        ok: false,
        error: message || 'Request failed',
        status: res.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      ok: false,
      error: err.message || 'Network error',
    };
  }
}

export async function getPhaseProgress(phaseId, options = {}) {
  if (!phaseId) {
    return {
      ok: false,
      error: 'Missing phase id',
    };
  }

  try {
    const params = new URLSearchParams();
    if (options.fresh) {
      params.set('fresh', '1');
    }
    const url = params.toString()
      ? `${API_BASE}/api/progress/phases/${encodeURIComponent(phaseId)}?${params.toString()}`
      : `${API_BASE}/api/progress/phases/${encodeURIComponent(phaseId)}`;

    const res = await fetch(url);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        (data && data.error) ||
        (typeof data === 'string' ? data : null) ||
        `HTTP ${res.status}`;
      return {
        ok: false,
        error: message || 'Request failed',
        status: res.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return {
      ok: false,
      error: err.message || 'Network error',
    };
  }
}
