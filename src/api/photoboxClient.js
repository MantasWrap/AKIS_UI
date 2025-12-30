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
