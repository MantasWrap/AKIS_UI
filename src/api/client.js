const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_AKIS_API_BASE ||
  'http://localhost:4100';

function getDebugHeaders() {
  const token =
    import.meta.env.VITE_AKIS_DEBUG_TOKEN ||
    import.meta.env.VITE_DEBUG_TOKEN ||
    '';
  if (!token) return {};
  return { 'x-debug-token': token };
}

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
      return {
        error: message || 'Request failed',
        status: res.status,
        data,
      };
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
      return {
        ok: false,
        error: message || 'Request failed',
        status: res.status,
        data,
      };
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
      return {
        ok: false,
        error: message || 'Request failed',
        status: res.status,
        data,
      };
    }

    return data;
  } catch (err) {
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function getRuntimeStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/debug/runtime-status`, {
      headers: getDebugHeaders(),
    });
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
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function getItemTrace(params = {}) {
  try {
    const search = new URLSearchParams();
    const { siteId, lineId, itemId } = params || {};

    if (siteId) search.set('site_id', siteId);
    if (lineId) search.set('line_id', lineId);
    if (itemId) search.set('item_id', itemId);

    const url = search.toString()
      ? `${API_BASE}/api/debug/item-trace?${search.toString()}`
      : `${API_BASE}/api/debug/item-trace`;

    const res = await fetch(url, {
      headers: getDebugHeaders(),
    });
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
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function getRuntimeLinkMetrics(params = {}) {
  try {
    const search = new URLSearchParams();
    const { siteId, lineId, windowSec } = params || {};

    if (siteId) search.set('site_id', siteId);
    if (lineId) search.set('line_id', lineId);
    if (
      typeof windowSec === 'number' &&
      Number.isFinite(windowSec) &&
      windowSec > 0
    ) {
      search.set('window_sec', String(windowSec));
    }

    const url = search.toString()
      ? `${API_BASE}/api/metrics/runtime/links?${search.toString()}`
      : `${API_BASE}/api/metrics/runtime/links`;

    const res = await fetch(url, {
      headers: getDebugHeaders(),
    });
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
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function getPlcLaneMetrics(params = {}) {
  try {
    const search = new URLSearchParams();
    const { siteId, lineId, windowSec } = params || {};

    if (siteId) search.set('site_id', siteId);
    if (lineId) search.set('line_id', lineId);
    if (
      typeof windowSec === 'number' &&
      Number.isFinite(windowSec) &&
      windowSec > 0
    ) {
      search.set('window_sec', String(windowSec));
    }

    const url = search.toString()
      ? `${API_BASE}/api/metrics/runtime/plc-lanes?${search.toString()}`
      : `${API_BASE}/api/metrics/runtime/plc-lanes`;

    const res = await fetch(url, {
      headers: getDebugHeaders(),
    });
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
    return { ok: false, error: err.message || 'Network error' };
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
    if (options.fresh) {
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

export async function getTelemetrySummaryAgents(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.fresh) params.set('fresh', '1');
    const url = params.toString()
      ? `${API_BASE}/api/telemetry/summary/agents?${params.toString()}`
      : `${API_BASE}/api/telemetry/summary/agents`;

    const res = await fetch(url, { headers: getDebugHeaders() });
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
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function getTelemetrySummaryIncidents(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.fresh) params.set('fresh', '1');
    const url = params.toString()
      ? `${API_BASE}/api/telemetry/summary/incidents?${params.toString()}`
      : `${API_BASE}/api/telemetry/summary/incidents`;

    const res = await fetch(url, { headers: getDebugHeaders() });
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
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function getTelemetryReliabilityAgents(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.fresh) params.set('fresh', '1');
    const url = params.toString()
      ? `${API_BASE}/api/telemetry/reliability/agents?${params.toString()}`
      : `${API_BASE}/api/telemetry/reliability/agents`;

    const res = await fetch(url, { headers: getDebugHeaders() });
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
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function getTelemetryAnalyticsOverview(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.fresh) params.set('fresh', '1');
    const url = params.toString()
      ? `${API_BASE}/api/telemetry/analytics/overview?${params.toString()}`
      : `${API_BASE}/api/telemetry/analytics/overview`;

    const res = await fetch(url, { headers: getDebugHeaders() });
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
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function getTelemetryAnalyticsForAgent(agentId, options = {}) {
  if (!agentId) {
    return { ok: false, error: 'Missing agentId' };
  }

  try {
    const params = new URLSearchParams();
    if (options.fresh) params.set('fresh', '1');

    const url = params.toString()
      ? `${API_BASE}/api/telemetry/analytics/agent/${encodeURIComponent(
          agentId,
        )}?${params.toString()}`
      : `${API_BASE}/api/telemetry/analytics/agent/${encodeURIComponent(agentId)}`;

    const res = await fetch(url, { headers: getDebugHeaders() });
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
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function getRecentRuntimeItems(params = {}) {
  try {
    const search = new URLSearchParams();
    const { siteId, lineId, limit } = params;

    if (siteId) search.set('site_id', siteId);
    if (lineId) search.set('line_id', lineId);
    if (limit && Number.isFinite(Number(limit))) {
      search.set('limit', Number(limit));
    }

    const url = search.toString()
      ? `${API_BASE}/api/runtime/items?${search.toString()}`
      : `${API_BASE}/api/runtime/items`;

    const res = await fetch(url, { headers: getDebugHeaders() });
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
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function postRuntimeLineCommand(params = {}) {
  try {
    const { siteId, lineId, action } = params || {};
    const res = await fetch(`${API_BASE}/api/runtime/line/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getDebugHeaders(),
      },
      body: JSON.stringify({
        site_id: siteId || null,
        line_id: lineId || null,
        action,
      }),
    });
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
    return { ok: false, error: err.message || 'Network error' };
  }
}
