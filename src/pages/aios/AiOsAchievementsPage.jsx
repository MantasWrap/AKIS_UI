import { useMemo, useState } from 'react';
import '../../styles/aios.css';
import { useAiOsMockData } from '../../hooks/useAiOsMockData';

function AchievementCard({ entry }) {
  return (
    <div className={`aios-achievement-card ${entry.highlight ? 'aios-achievement-card--highlight' : ''}`}>
      <div className="aios-achievement-header">
        <div>
          <p className="aios-card-eyebrow">{entry.date}</p>
          <h3 className="aios-card-title">{entry.title}</h3>
          <p className="aios-card-subtitle">{entry.description}</p>
        </div>
        <span className="aios-tag">{entry.category}</span>
      </div>
      <div className="aios-achievement-meta">
        <div>
          <div className="aios-detail-label">Agents</div>
          <p className="aios-detail-value">{entry.agents.join(', ')}</p>
        </div>
        <div>
          <div className="aios-detail-label">Author</div>
          <p className="aios-detail-value">{entry.author}</p>
        </div>
        <div>
          <div className="aios-detail-label">Impact</div>
          <p className="aios-detail-value">{entry.impact}</p>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="aios-filter-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export default function AiOsAchievementsPage() {
  const { achievements } = useAiOsMockData();
  const entries = useMemo(() => achievements?.entries || [], [achievements]);
  const categories = useMemo(() => achievements?.filters?.categories || [], [achievements]);
  const agentFilters = useMemo(() => achievements?.filters?.agents || [], [achievements]);

  const [agentFilter, setAgentFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredEntries = useMemo(() => entries.filter((entry) => {
    const matchesAgent = agentFilter === 'all' || entry.agents.includes(agentFilter);
    const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter;
    return matchesAgent && matchesCategory;
  }), [entries, agentFilter, categoryFilter]);

  return (
    <div className="aios-page aios-achievements-page">
      <div className="dev-card aios-card">
        <h2 className="aios-card-title">Achievements & milestones</h2>
        <p className="aios-card-subtitle">
          Pulls directly from <code>docs/EN/CORE/Achievements_Log.md</code>. Filters mirror the future API contract so MJZ can slice by agent or category.
        </p>
        <div className="aios-filter-bar">
          <FilterSelect
            label="Agent"
            value={agentFilter}
            options={agentFilters}
            onChange={setAgentFilter}
          />
          <FilterSelect
            label="Category"
            value={categoryFilter}
            options={categories}
            onChange={setCategoryFilter}
          />
        </div>
      </div>

      <div className="dev-card aios-card aios-achievement-timeline">
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="aios-achievement-row">
            <div className="aios-achievement-node" />
            <AchievementCard entry={entry} />
          </div>
        ))}
        {!filteredEntries.length && (
          <p className="aios-card-subtitle">No achievements match the selected filters.</p>
        )}
      </div>

      <div className="dev-card aios-card">
        <h3 className="aios-card-title">Developer notes</h3>
        <ul className="aios-list">
          <li>
            Backend endpoint suggestion: <code>/api/owner/ai-os/achievements?agent=&lt;id&gt;&amp;category=&lt;tag&gt;</code>.
          </li>
          <li>
            Entry schema mirrors <code>docs/EN/CORE/Achievements_Log.md</code> (id, date, title, agents, author, impact, category, highlight).
          </li>
          <li>
            Highlight flag should drive the featured styling and timeline emphasis for milestones like UIBossAgent v1.
          </li>
        </ul>
      </div>
    </div>
  );
}
