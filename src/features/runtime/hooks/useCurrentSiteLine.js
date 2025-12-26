import { useCallback, useEffect, useState } from 'react';

const HARD_DEFAULT_SITE_ID = 'SITE_LT_01';
const HARD_DEFAULT_LINE_ID = 'LINE_01';

function getEnvDefault(key, fallback) {
  const value = import.meta.env[key];
  if (!value) return fallback;
  const trimmed = String(value).trim();
  return trimmed || fallback;
}

function readFromLocation() {
  if (typeof window === 'undefined') {
    return {
      siteId: HARD_DEFAULT_SITE_ID,
      lineId: HARD_DEFAULT_LINE_ID,
    };
  }
  const params = new URLSearchParams(window.location.search);
  const siteFromUrl = params.get('site_id') || params.get('siteId');
  const lineFromUrl = params.get('line_id') || params.get('lineId');

  const siteEnvDefault = getEnvDefault('VITE_AKIS_DEFAULT_SITE_ID', HARD_DEFAULT_SITE_ID);
  const lineEnvDefault = getEnvDefault('VITE_AKIS_DEFAULT_LINE_ID', HARD_DEFAULT_LINE_ID);

  return {
    siteId: (siteFromUrl && siteFromUrl.trim()) || siteEnvDefault,
    lineId: (lineFromUrl && lineFromUrl.trim()) || lineEnvDefault,
  };
}

function writeToLocation(nextSiteId, nextLineId) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const params = url.searchParams;

  if (nextSiteId) {
    params.set('site_id', nextSiteId);
  } else {
    params.delete('site_id');
  }

  if (nextLineId) {
    params.set('line_id', nextLineId);
  } else {
    params.delete('line_id');
  }

  url.search = params.toString();
  window.history.replaceState({}, '', url.toString());
}

/**
 * useCurrentSiteLine
 *
 * Phase-0 helper for selecting which site/line the runtime UI is looking at.
 *
 * Priority:
 *   - URL query (?site_id=...&line_id=...)
 *   - VITE_AKIS_DEFAULT_SITE_ID / VITE_AKIS_DEFAULT_LINE_ID
 *   - Hard defaults SITE_LT_01 / LINE_01
 *
 * When setSiteLine is called, it updates both React state and the URL.
 */
export function useCurrentSiteLine() {
  const [state, setState] = useState(() => readFromLocation());

  useEffect(() => {
    // Keep in sync if URL changes via other mechanisms.
    const handlePopState = () => {
      setState(readFromLocation());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePopState);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handlePopState);
      }
    };
  }, []);

  const setSiteLine = useCallback((nextSiteId, nextLineId) => {
    const finalSite = nextSiteId || state.siteId || HARD_DEFAULT_SITE_ID;
    const finalLine = nextLineId || state.lineId || HARD_DEFAULT_LINE_ID;
    setState({ siteId: finalSite, lineId: finalLine });
    writeToLocation(finalSite, finalLine);
  }, [state.siteId, state.lineId]);

  return {
    siteId: state.siteId,
    lineId: state.lineId,
    setSiteLine,
  };
}
