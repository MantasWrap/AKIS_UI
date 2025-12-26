import React from 'react';
import { useCurrentSiteLine } from '../hooks/useCurrentSiteLine.js';

/**
 * SiteLineSelectorDebug
 *
 * Tiny dev-only selector for current site/line.
 * Right now it renders a single option (SITE_LT_01 / LINE_01), but the
 * structure allows adding more in the future.
 *
 * It also shows the active site/line so you always know what the
 * runtime UI is targeting.
 */
export function SiteLineSelectorDebug() {
  const { siteId, lineId, setSiteLine } = useCurrentSiteLine();

  // For now we just expose a single option, but we keep the shape ready
  // for more sites/lines.
  const options = [
    { value: 'SITE_LT_01::LINE_01', label: 'SITE_LT_01 / LINE_01' },
    // Future example:
    // { value: 'SITE_LT_01::LINE_02', label: 'SITE_LT_01 / LINE_02' },
  ];

  const currentValue =
    options.find((opt) => {
      const [s, l] = opt.value.split('::');
      return s === siteId && l === lineId;
    })?.value || options[0].value;

  const handleChange = (event) => {
    const value = event.target.value;
    const [s, l] = value.split('::');
    setSiteLine(s, l);
  };

  return (
    <div className="mb-3 flex flex-col gap-1 rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-100">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold tracking-wide">
          Site / line (dev debug)
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-700 px-2 py-0.5 text-[11px] uppercase tracking-wide">
          {siteId} · {lineId}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[11px] text-slate-300" htmlFor="site-line-select">
          Target line
        </label>
        <select
          id="site-line-select"
          className="flex-1 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-[11px] text-slate-50"
          value={currentValue}
          onChange={handleChange}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
