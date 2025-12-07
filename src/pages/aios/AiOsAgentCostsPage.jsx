import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

export default function AiOsAgentCostsPage() {
  const { costs, plan } = aiOsMockData;

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">Agent costs</h2>
            <p className="aios-card-subtitle">Owner-facing cost dashboard stub.</p>
          </div>
          <span className="aios-tag">{plan.plan}</span>
        </div>

        <div>
          <div className="aios-highlight">{costs.monthly}</div>
          <div className="aios-highlight-sub">{costs.delta}</div>
        </div>

        <div className="aios-breakdown">
          {costs.breakdown.map((entry) => (
            <div key={entry.label} className="aios-breakdown-item">
              <div className="aios-card-subtitle" style={{ marginTop: 0 }}>{entry.label}</div>
              <div style={{ fontWeight: 600 }}>{entry.value}</div>
            </div>
          ))}
        </div>

        <div className="aios-warning">
          Top agent: {costs.topAgent} ({costs.topAgentCost}) · Budget ceiling {costs.budgetCeiling}
        </div>

        {costs.warnings.map((warning) => (
          <div key={warning} className="aios-placeholder">
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
