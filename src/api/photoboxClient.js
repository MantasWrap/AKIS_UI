export async function fetchRecentPhotoboxInspections({ limit = 50 } = {}) {
  const res = await fetch(`/api/runtime/photobox/inspections/recent?limit=${encodeURIComponent(limit)}`);
  if (!res.ok) throw new Error(`photobox recent failed: ${res.status}`);
  return res.json();
}

export async function fetchLatestPhotoboxInspection({ photoboxId }) {
  const res = await fetch(
    `/api/runtime/photobox/inspections/latest?photobox_id=${encodeURIComponent(photoboxId)}`
  );
  if (!res.ok) throw new Error(`photobox latest failed: ${res.status}`);
  return res.json();
}

export async function fetchPhotoboxLatestAll({ limit = 200 } = {}) {
  const res = await fetch(
    `/api/runtime/photobox/inspections/recent?limit=${encodeURIComponent(limit)}`
  );
  if (!res.ok) throw new Error(`photobox latest-all failed: ${res.status}`);
  const data = await res.json();
  const events = Array.isArray(data?.events) ? data.events : [];
  const latestByPhotobox = new Map();
  for (const event of events) {
    const key = event?.photobox_id || '';
    if (!key || latestByPhotobox.has(key)) continue;
    latestByPhotobox.set(key, event);
  }
  return { ...data, events: Array.from(latestByPhotobox.values()) };
}
