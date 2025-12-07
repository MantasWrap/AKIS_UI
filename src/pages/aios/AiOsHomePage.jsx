import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

export default function AiOsHomePage() {
  const { status, usage, plan, agents, modes, pipeline, costs } = aiOsMockData;

  return (
    <div className="aios-page">
      <div className="aios-grid aios-grid--two">
        <div className="dev-card aios-card">
          <div className="aios-card-header">
            <div>
              <h2 className="aios-card-title">AI OS status</h2>
              <p className="aios-card-subtitle">{status.build}</p>
            </div>
            <span className="aios-tag">{`${status.version} · ${status.stage}`}</span>
          </div>
          <div>
            <div className="aios-highlight">{status.readiness}%</div>
            <div className="aios-highlight-sub">overall readiness</div>
          </div>
          <ul className="aios-list">
            {status.highlights.map((highlight) => (
              <li key={highlight}>
                <span className="aios-dot" />
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        <div className="dev-card aios-card">
          <div className="aios-card-header">
            <div>
              <h2 className="aios-card-title">Usage overview</h2>
              <p className="aios-card-subtitle">{usage.window}</p>
            </div>
            <span className="aios-tag">{usage.delta}</span>
          </div>
          <div className="aios-mini-chart">
            {usage.miniChart.map((value, index) => (
              <span key={`usage-bar-${index}`} style={{ height: `${Math.min(100, Math.max(18, value))}%` }} />
            ))}
          </div>
          <div className="aios-breakdown">
            {usage.breakdown.map((item) => (
              <div key={item.label} className="aios-breakdown-item">
                <div className="aios-card-subtitle" style={{ marginTop: 0 }}>{item.label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="aios-grid aios-grid--three">
        <div className="dev-card aios-card">
          <div className="aios-card-header">
            <div>
              <h3 className="aios-card-title">Limits &amp; plan</h3>
              <p className="aios-card-subtitle">{plan.plan}</p>
            </div>
            <span className="aios-tag">{plan.status}</span>
          </div>
          <div className="aios-highlight">{plan.budget}</div>
          <div className="aios-highlight-sub">{plan.burn}</div>
        </div>

        <div className="dev-card aios-card">
          <div className="aios-card-header">
            <div>
              <h3 className="aios-card-title">Agents</h3>
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

        <div className="dev-card aios-card">
          <div className="aios-card-header">
            <div>
              <h3 className="aios-card-title">Modes</h3>
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

      <div className="aios-grid aios-grid--two">
          <div className="dev-card aios-card">
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

        <div className="dev-card aios-card">
          <div className="aios-card-header">
            <div>
              <h3 className="aios-card-title">Agent costs</h3>
              <p className="aios-card-subtitle">Mock-only spending preview</p>
            </div>
            <span className="aios-tag">{costs.delta}</span>
          </div>
          <div>
            <div className="aios-highlight">{costs.monthly}</div>
            <div className="aios-highlight-sub">monthly, ceiling {costs.budgetCeiling}</div>
          </div>
          <div className="aios-breakdown">
            {costs.breakdown.map((entry) => (
              <div key={entry.label} className="aios-breakdown-item">
                <div className="aios-card-subtitle" style={{ marginTop: 0 }}>{entry.label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>{entry.value}</div>
              </div>
            ))}
          </div>
          <div className="aios-warning">
            Top agent: {costs.topAgent} ({costs.topAgentCost})
          </div>
        </div>
      </div>
    </div>
  );
}
