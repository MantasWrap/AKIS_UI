import { useCallback, useMemo, useState } from 'react';
import '../../styles/aios.css';
import { useAiOsMockData } from '../../hooks/useAiOsMockData';
import { emitNavigation } from '../../modules/navigationBus';

export default function AiOsHomePage() {
  const {
    overview,
    usage,
    agents,
    modes,
    pipeline,
    costs,
  } = useAiOsMockData();
  const heroHighlights = overview?.highlights || [];
  const heroBadgeLabel = overview?.badgeLabel
    || [overview?.version, overview?.stage].filter(Boolean).join(' · ')
    || 'AI OS mock';
  const readinessValue = typeof overview?.readiness === 'number' ? `${overview.readiness}%` : '—';
  const heroBuild = overview?.build || 'AI OS mock readiness preview';
  const usageRanges = usage?.ranges || {};
  const initialRange = usage?.defaultRange && usageRanges[usage.defaultRange]
    ? usage.defaultRange
    : Object.keys(usageRanges)[0];
  const [range, setRange] = useState(initialRange);

  const activeUsage = usageRanges[range] || usageRanges[initialRange] || {};
  const usageKeys = Object.keys(usageRanges);

  const handleRangeChange = (nextRange) => {
    setRange(nextRange);
  };

  const navCardProps = useCallback((targetKey) => ({
    role: 'button',
    tabIndex: 0,
    onClick: () => emitNavigation(targetKey),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        emitNavigation(targetKey);
      }
    },
  }), []);

  const miniChartHeights = useMemo(
    () => (activeUsage.miniChart || []).map((value) => Math.min(100, Math.max(18, value))),
    [activeUsage.miniChart],
  );

  return (
    <div className="aios-page aios-home">
      <div className="dev-card aios-card aios-hero-card">
        <div className="aios-hero-header">
          <div>
            <p className="aios-card-subtitle">AI OS status</p>
            <h2 className="aios-card-title">{heroBuild}</h2>
          </div>
          <span className="aios-tag">{heroBadgeLabel}</span>
        </div>
        <div className="aios-hero-body">
          <div className="aios-hero-status">
            <div>
              <div className="aios-highlight">{readinessValue}</div>
              <div className="aios-highlight-sub">Overall readiness</div>
            </div>
            <ul className="aios-list aios-hero-list">
              {heroHighlights.map((highlight) => (
                <li key={highlight}>
                  <span className="aios-dot" />
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
          <div className="aios-hero-usage">
            <div className="aios-hero-usage-head">
              <div>
                <p className="aios-card-subtitle">{activeUsage.window}</p>
                <div className="aios-highlight-sub">Range change reflects mock data</div>
              </div>
              <span className="aios-tag">{activeUsage.delta}</span>
            </div>
            <div className="aios-chip-group" role="group" aria-label="Usage time range">
              {usageKeys.map((key) => {
                const rangeMeta = usageRanges[key];
                return (
                  <button
                    key={key}
                    type="button"
                    className={`aios-chip ${range === key ? 'is-active' : ''}`}
                    onClick={() => handleRangeChange(key)}
                    aria-pressed={range === key}
                  >
                    {rangeMeta.label || key}
                  </button>
                );
              })}
            </div>
            <div className="aios-mini-chart aios-mini-chart--calm">
              {miniChartHeights.map((height, index) => (
                <span key={`usage-bar-${index}`} style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="aios-usage-metrics">
              <div>
                <div className="aios-detail-label">Cost</div>
                <div className="aios-highlight-sub">{activeUsage.cost}</div>
              </div>
              <div>
                <div className="aios-detail-label">Tokens</div>
                <div className="aios-highlight-sub">{activeUsage.tokens}</div>
              </div>
            </div>
            <div className="aios-breakdown aios-breakdown--compact">
              {(activeUsage.breakdown || []).map((item) => (
                <div key={item.label} className="aios-breakdown-item">
                  <div className="aios-card-subtitle" style={{ marginTop: 0 }}>{item.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="aios-grid aios-grid--two aios-home-row">
        <div className="dev-card aios-card aios-card--interactive" {...navCardProps('aiOsAgents')}>
          <div className="aios-card-header">
            <div>
              <h3 className="aios-card-title">Agents overview</h3>
              <p className="aios-card-subtitle">UI Boss leads owner UX</p>
            </div>
            <span className="aios-tag">{agents.total} agents</span>
          </div>
          <div className="aios-highlight-sub">
            {agents.activeThisWeek} active this week · spotlight {agents.highlight}
          </div>
          <ul className="aios-list">
            {agents.roster.map((agent) => (
              <li key={agent.name}>
                <span className="aios-dot" />
                <span>
                  <strong>{agent.name}</strong> · {agent.focus}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="dev-card aios-card aios-card--interactive" {...navCardProps('aiOsModes')}>
          <div className="aios-card-header">
            <div>
              <h3 className="aios-card-title">AI modes</h3>
              <p className="aios-card-subtitle">Communication surfaces</p>
            </div>
            <span className="aios-tag">{modes.total} modes</span>
          </div>
          <div className="aios-highlight-sub">Featured: {modes.featured}</div>
          <ul className="aios-list">
            {modes.list.map((mode) => (
              <li key={mode.name}>
                <span className="aios-dot" />
                <span>
                  <strong>{mode.name}</strong> · {mode.usage}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="aios-grid aios-grid--two aios-home-row">
        <div className="dev-card aios-card aios-card--interactive" {...navCardProps('aiOsPipeline')}>
          <div className="aios-card-header">
            <div>
              <h3 className="aios-card-title">AI dev pipeline</h3>
              <p className="aios-card-subtitle">{pipeline.status}</p>
            </div>
            <span className="aios-tag">{`Stage ${pipeline.stage}`}</span>
          </div>
          <div className="aios-progress" aria-hidden="true">
            <div
              className="aios-progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, pipeline.readiness))}%` }}
            />
          </div>
          <div className="aios-highlight-sub">
            Next: {pipeline.next} · {pipeline.eta}
          </div>
          <div className="aios-stage-list">
            {pipeline.stages.slice(0, 3).map((stage) => (
              <div key={stage.id} className="aios-stage-item">
                <strong>{stage.label}</strong>
                <span>{stage.summary}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dev-card aios-card aios-card--interactive" {...navCardProps('aiOsAgentCosts')}>
          <div className="aios-card-header">
            <div>
              <h3 className="aios-card-title">Agent costs</h3>
              <p className="aios-card-subtitle">Mock-only spending preview</p>
            </div>
            <span className="aios-tag">{costs.delta}</span>
          </div>
          <div className="aios-home-costs">
            <div>
              <div className="aios-highlight">{costs.monthly}</div>
              <div className="aios-highlight-sub">Monthly · ceiling {costs.budgetCeiling}</div>
            </div>
            <div className="aios-warning">
              Top agent: {costs.topAgent} ({costs.topAgentCost})
            </div>
          </div>
          <div className="aios-breakdown">
            {costs.breakdown.map((entry) => (
              <div key={entry.label} className="aios-breakdown-item">
                <div className="aios-card-subtitle" style={{ marginTop: 0 }}>{entry.label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>{entry.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
