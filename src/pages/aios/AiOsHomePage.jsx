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

  const usageRanges = usage?.ranges || {};
  const usageKeys = Object.keys(usageRanges);
  const defaultUsageRange = (usage?.defaultRange && usageRanges[usage.defaultRange])
    ? usage.defaultRange
    : usageKeys[0] || null;
  const [range, setRange] = useState(defaultUsageRange);
  const resolvedUsageKey = (range && usageRanges[range])
    ? range
    : (defaultUsageRange && usageRanges[defaultUsageRange])
      ? defaultUsageRange
      : usageKeys[0] || null;
  const activeUsage = resolvedUsageKey ? usageRanges[resolvedUsageKey] || {} : {};

  const heroHighlights = overview?.highlights || [];
  const heroBadgeLabel = overview?.badgeLabel
    || [overview?.version, overview?.stage].filter(Boolean).join(' · ')
    || 'AI OS mock';
  const readinessValue = typeof overview?.readiness === 'number' ? `${overview.readiness}%` : '—';
  const heroBuild = overview?.build || 'AI OS mock readiness preview';
  const agentRoster = agents?.roster || [];
  const modesList = modes?.list || [];
  const pipelineStages = pipeline?.stages || [];
  const pipelineCardTag = pipeline?.stage ? `Stage ${pipeline.stage}` : 'Stage status';
  const pipelineStatusSubtitle = pipeline?.status || 'AI OS pipeline status';
  const pipelineReadiness = typeof pipeline?.readiness === 'number'
    ? Math.min(100, Math.max(0, pipeline.readiness))
    : 0;

  const costPeriod = useMemo(() => {
    if (!costs || !costs.periods) return null;
    if (costs.defaultPeriod && costs.periods[costs.defaultPeriod]) {
      return costs.periods[costs.defaultPeriod];
    }
    const entries = Object.values(costs.periods);
    return entries.length ? entries[0] : null;
  }, [costs]);
  const costByAgent = costPeriod?.byAgent || [];
  const costByModel = costPeriod?.byModel || [];
  const topAgent = costByAgent[0] || null;
  const formatCurrency = (value) => {
    if (typeof value === 'number') return `$${value}`;
    return value || '—';
  };
  const costBreakdown = [
    topAgent ? { label: topAgent.name, value: formatCurrency(topAgent.value) } : null,
    costPeriod?.total ? { label: 'Total', value: costPeriod.total } : null,
    costs?.budgetCeiling ? { label: 'Budget ceiling', value: costs.budgetCeiling } : null,
  ].filter(Boolean);

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
    () => (activeUsage?.miniChart || []).map((value) => Math.min(100, Math.max(18, value))),
    [activeUsage?.miniChart],
  );

  if (!overview) {
    return (
      <div className="aios-page aios-home aios-home--error">
        <div className="dev-card aios-card aios-home-error-card">
          <h2 className="aios-card-title">AI OS Home unavailable</h2>
          <p className="aios-card-subtitle">
            Mock data for the AI OS overview is missing. Check <code>aiOsMockData.js</code> and{' '}
            <code>useAiOsMockData</code>.
          </p>
        </div>
      </div>
    );
  }

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
                <div className="aios-highlight-sub">{activeUsage?.cost || '—'}</div>
              </div>
              <div>
                <div className="aios-detail-label">Tokens</div>
                <div className="aios-highlight-sub">{activeUsage?.tokens || '—'}</div>
              </div>
            </div>
            <div className="aios-breakdown aios-breakdown--compact">
              {(activeUsage?.breakdown || []).map((item) => (
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
            <span className="aios-tag">
              {typeof agents?.total === 'number' ? `${agents.total} agents` : 'Agents'}
            </span>
          </div>
          <div className="aios-highlight-sub">
            {agents?.activeThisWeek != null ? `${agents.activeThisWeek} active this week` : 'Active roster'} · spotlight {agents?.highlight || 'UI Boss'}
          </div>
          <ul className="aios-list">
            {agentRoster.map((agent) => (
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
            <span className="aios-tag">
              {typeof modes?.total === 'number' ? `${modes.total} modes` : 'Modes'}
            </span>
          </div>
          <div className="aios-highlight-sub">Featured: {modes?.featured || 'CHAT&CODEX UI v1'}</div>
          <ul className="aios-list">
            {modesList.map((mode) => (
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
              <p className="aios-card-subtitle">{pipelineStatusSubtitle}</p>
            </div>
            <span className="aios-tag">{pipelineCardTag}</span>
          </div>
          <div className="aios-progress" aria-hidden="true">
            <div
              className="aios-progress-fill"
              style={{ width: `${pipelineReadiness}%` }}
            />
          </div>
          <div className="aios-highlight-sub">
            {pipeline?.next ? `Next: ${pipeline.next}` : 'Next stage TBD'}
            {pipeline?.eta ? ` · ${pipeline.eta}` : ''}
          </div>
          <div className="aios-stage-list">
            {pipelineStages.slice(0, 3).map((stage) => (
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
            <span className="aios-tag">{costPeriod?.delta || 'Stable'}</span>
          </div>
          <div className="aios-home-costs">
            <div>
              <div className="aios-highlight">{costPeriod?.total || '—'}</div>
              <div className="aios-highlight-sub">
                {costs?.budgetCeiling ? `Monthly · ceiling ${costs.budgetCeiling}` : 'Budget mock only'}
              </div>
            </div>
            <div className="aios-warning">
              Top agent: {topAgent ? `${topAgent.name} (${formatCurrency(topAgent.value)})` : 'Data coming soon'}
            </div>
          </div>
          <div className="aios-breakdown">
            {costBreakdown.map((entry) => (
              <div key={entry.label} className="aios-breakdown-item">
                <div className="aios-card-subtitle" style={{ marginTop: 0 }}>{entry.label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>{entry.value}</div>
              </div>
            ))}
          </div>
          <div className="aios-cost-lists">
            <div>
              <div className="aios-detail-label">By agent</div>
              <ul className="aios-list">
                {costByAgent.slice(0, 3).map((item) => (
                  <li key={item.name}>
                    <span className="aios-dot" />
                    {item.name} – {formatCurrency(item.value)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="aios-detail-label">By model</div>
              <ul className="aios-list">
                {costByModel.slice(0, 3).map((item) => (
                  <li key={item.name}>
                    <span className="aios-dot" />
                    {item.name} – {formatCurrency(item.value)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
