import React from 'react';
import { useCurrentSiteLine } from '../hooks/useCurrentSiteLine.js';

/**
 * SiteLineSelectorDebug
 *
 * Dev-only selector for current site/line.
 * Phase-0: two lines on SITE_LT_01.
 */
export function SiteLineSelectorDebug() {
  const { siteId, lineId, setSiteLine } = useCurrentSiteLine();

  const options = [
    { value: 'SITE_LT_01::LINE_01', label: 'SITE_LT_01 / LINE_01 (main dev line)' },
    { value: 'SITE_LT_01::LINE_02', label: 'SITE_LT_01 / LINE_02 (second dev line)' },
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
    <div className="site-line-selector">
      <div className="site-line-selector-row">
        <div>
          <p className="site-line-selector-label">Target line</p>
          <p className="site-line-selector-note">
            Applies to debug panels and PLC calls on this page.
          </p>
        </div>
        <span className="runtime-alerts-pill is-unknown">
          {siteId} / {lineId}
        </span>
      </div>
      <div className="site-line-selector-controls">
        <label className="runtime-alerts-label" htmlFor="site-line-select">
          Select
        </label>
        <select
          id="site-line-select"
          className="dev-select site-line-selector-select"
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
