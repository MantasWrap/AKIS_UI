import { useMemo, useState } from 'react';
import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

export default function AiOsAgentCostsPage() {
  const { costs } = aiOsMockData;
  const [period, setPeriod] = useState(costs.defaultPeriod);
  const [view, setView] = useState('agent');

  const activePeriod = costs.periods[period] || Object.values(costs.periods)[0];
  const dataset = view === 'agent' ? activePeriod.byAgent : activePeriod.byModel;
  const maxValue = useMemo(() => Math.max(...dataset.map((entry) => entry.value)), [dataset]);

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">Agent costs</h2>
            <p className="aios-card-subtitle">Owner-facing cost dashboard stub.</p>
          </div>
          <span className="aios-tag">Budget ceiling {costs.budgetCeiling}</span>
        </div>

        <div className="aios-chip-group" role="group" aria-label="Cost period">
          {Object.entries(costs.periods).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              className={`aios-chip ${period === key ? 'is-active' : ''}`}
              onClick={() => setPeriod(key)}
              aria-pressed={period === key}
            >
              {meta.label}
            </button>
          ))}
        </div>

        <div className="aios-toggle-group" role="tablist" aria-label="Cost view">
          {['agent', 'model'].map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={view === mode}
              className={`aios-toggle ${view === mode ? 'is-active' : ''}`}
              onClick={() => setView(mode)}
            >
              {mode === 'agent' ? 'By agent' : 'By model'}
            </button>
          ))}
        </div>

        <div className="aios-cost-summary">
          <div>
            <div className="aios-detail-label">Total cost</div>
            <div className="aios-highlight">{activePeriod.total}</div>
          </div>
          <div>
            <div className="aios-detail-label">Δ vs prior</div>
            <div className="aios-highlight-sub">{activePeriod.delta}</div>
          </div>
        </div>

        <div className="aios-cost-list">
          {dataset.map((entry) => (
            <div key={entry.name} className="aios-cost-entry">
              <div>
                <strong>{entry.name}</strong>
              </div>
              <div className="aios-bar">
                <span
                  className="aios-bar-fill"
                  style={{ width: `${Math.max(8, (entry.value / maxValue) * 100)}%` }}
                />
              </div>
              <span className="aios-cost-value">${entry.value}</span>
            </div>
          ))}
        </div>

        {costs.warnings.map((warning) => (
          <div key={warning} className="aios-warning">
            {warning}
          </div>
        ))}

        <div className="aios-card-footnote">
          Real spend will flow from Owner_Agent_Costs_Dashboard_Spec.md once costing API ships.
        </div>
      </div>
    </div>
  );
}
