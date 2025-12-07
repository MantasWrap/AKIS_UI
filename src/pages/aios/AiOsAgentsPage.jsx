import { useMemo, useState } from 'react';
import '../../styles/aios.css';
import { aiOsMockData } from '../../mock/aiOsMockData';

export default function AiOsAgentsPage() {
  const { agents } = aiOsMockData;
  const filterOptions = agents.filters || [{ id: 'all', label: 'All agents' }];
  const [filter, setFilter] = useState(filterOptions[0]?.id || 'all');
  const [expandedAgentId, setExpandedAgentId] = useState(null);

  const filteredAgents = useMemo(() => {
    if (filter === 'all') return agents.roster;
    return agents.roster.filter((agent) => agent.type === filter);
  }, [agents.roster, filter]);

  const toggleAgent = (agentId) => {
    setExpandedAgentId((prev) => (prev === agentId ? null : agentId));
  };

  const handleRowKey = (event, agentId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleAgent(agentId);
    }
  };

  return (
    <div className="aios-page">
      <div className="dev-card aios-card">
        <div className="aios-card-header">
          <div>
            <h2 className="aios-card-title">AI OS · Agents</h2>
            <p className="aios-card-subtitle">Owner-level AI collaborators pulled from docs specs.</p>
          </div>
          <span className="aios-tag">{agents.total} total</span>
        </div>

        <div className="aios-chip-group" role="group" aria-label="Agent type filter">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`aios-chip ${filter === option.id ? 'is-active' : ''}`}
              onClick={() => setFilter(option.id)}
              aria-pressed={filter === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="aios-table">
          <div className="aios-table-row aios-table-row--head">
            <span>Agent</span>
            <span>Focus</span>
            <span>Status</span>
            <span>Cost</span>
          </div>
          {filteredAgents.map((agent) => {
            const isOpen = expandedAgentId === agent.id;
            return (
              <div key={agent.id} className="aios-table-entry">
                <button
                  type="button"
                  className={`aios-table-row aios-table-row--interactive ${isOpen ? 'is-open' : ''}`}
                  onClick={() => toggleAgent(agent.id)}
                  onKeyDown={(event) => handleRowKey(event, agent.id)}
                  aria-expanded={isOpen}
                >
                  <span>
                    <strong>{agent.name}</strong>
                    <div className="aios-table-subline">{agent.role}</div>
                  </span>
                  <span>{agent.focus}</span>
                  <span>
                    <span className="aios-pill">{agent.status}</span>
                  </span>
                  <span>
                    {agent.cost}
                    <div className="aios-table-subline">{agent.actions} actions</div>
                  </span>
                </button>
                {isOpen && (
                  <div className="aios-agent-details">
                    <div>
                      <div className="aios-detail-label">Conversation profile</div>
                      <div>{agent.conversationProfile}</div>
                    </div>
                    <div>
                      <div className="aios-detail-label">Permissions</div>
                      <div>{agent.permissionProfile}</div>
                    </div>
                    <div>
                      <div className="aios-detail-label">Primary mode</div>
                      <div>{agent.primaryMode}</div>
                    </div>
                    <div>
                      <div className="aios-detail-label">Monthly cost</div>
                      <div>${agent.monthlyCost}</div>
                    </div>
                    <div>
                      <div className="aios-detail-label">Token usage</div>
                      <div>{agent.tokenUsage}</div>
                    </div>
                    <div>
                      <div className="aios-detail-label">Notes</div>
                      <div>{agent.notes}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="aios-card-footnote">
          Mocked from Owner_Agents_Dashboard_Spec.md — backend wiring to come with AI OS pipelines.
        </div>
      </div>
    </div>
  );
}
