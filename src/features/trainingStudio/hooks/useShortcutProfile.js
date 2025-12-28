import { useEffect, useState } from 'react';
import { API_BASE } from '../../api/client.js';

function isEditableTarget(target) {
  if (!target) return false;
  const tag = target.tagName ? target.tagName.toLowerCase() : '';
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    return true;
  }
  return Boolean(target.isContentEditable);
}

export function useShortcutProfile() {
  const [bindings, setBindings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/training-studio/shortcut-profiles`,
        );
        const body = await res.json();
        if (!res.ok || body.status !== 'ok') {
          throw new Error(body.error || 'Failed to load shortcuts');
        }
        if (!cancelled) {
          setBindings(body.bindings || []);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('Failed to load shortcut profile', e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  function findActionForEvent(evt) {
    if (loading || !bindings.length || isEditableTarget(evt.target)) return null;

    const parts = [];
    if (evt.shiftKey) parts.push('Shift');
    if (evt.altKey) parts.push('Alt');
    if (evt.ctrlKey) parts.push('Control');
    parts.push(evt.code);
    const combo = parts.join('+');

    const match = bindings.find((binding) => binding.key_combo === combo);
    return match ? match.action : null;
  }

  return { bindings, loading, findActionForEvent };
}
