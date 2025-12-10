import React from 'react';
import '../../styles/progress.css';

/**
 * High-level AKIS build roadmap for the Core / Progress screen.
 * UI-only implementation with mock KPIs; real data can be wired later.
 */

const ROADMAP_STEPS = [
  {
    id: 'pre_launch_mocking',
    title: 'Pre-launch mocking',
    items: [
      'Core idea',
      'Dev console',
      'UI/UX interface',
      'AI OS',
      'AI OS → agents',
    ],
  },
  {
    id: 'simulations',
    title: 'Simulations',
    items: [
      'Hardware',
      'Jetson runtime',
      'Conveyor PLC controllers',
      'Dev console',
      'Backend binding',
      'Agent development',
      'AI OS beta',
      'Server-side construction',
      'Analytics',
      'Logs',
      'Debugging',
    ],
  },
  {
    id: 'tenant_access',
    title: 'Tenant access & training',
    items: [
      'Tenant access',
      'Authentication',
      'DB handling',
      'UI/UX + backend binding',
      'Training Studio',
      'AI OS developments',
    ],
  },
  {
    id: 'merge_hardware',
    title: 'Merge to hardware',
    items: [
      'NVIDIA AGX',
      'Controller PC',
      'PLC controllers',
      'Conveyor line',
      'Training Studio tests',
      'Live runs',
      'Calibration',
      'Debugging',
      'Logs',
    ],
  },
  {
    id: 'tenant_platform',
    title: 'Tenant & support platform',
    items: [
      'Tenant platform',
      'Support platform',
      'HELP AI assistant',
      'Train Training Studio',
      'UI/UX improvements',
    ],
  },
  {
    id: 'pilot_mode_live',
    title: 'PILOT MODE LIVE',
    items: [
      'Dev platform',
      'Tenant platform',
      'Marketing platform',
      'Analytics',
    ],
  },
];

// Mock KPI completion per roadmap step (0–100).
// Later this should come from backend / checklists / runtime data.
const ROADMAP_KPI_PERCENT = {
  pre_launch_mocking: 80,
  simulations: 60,
  tenant_access: 0,
  merge_hardware: 0,
  tenant_platform: 0,
  pilot_mode_live: 0,
};

// 0-based index of the "current" roadmap step. This is mock-only for now.
const CURRENT_STEP_INDEX = 1;

function clampPercent(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function ProgressRoadmapStrip() {
  const currentIndex = Math.min(
    Math.max(CURRENT_STEP_INDEX, 0),
    ROADMAP_STEPS.length - 1,
  );

  return (
    <section className="progress-roadmap" aria-label="AKIS roadmap to pilot mode">
      <header className="progress-roadmap-header">
        <div>
          <p className="progress-eyebrow">AKIS build roadmap</p>
          <h2 className="progress-roadmap-title">Roadmap to reality</h2>
          <p className="progress-roadmap-subtitle">
            From mocked DEV console to live pilot and tenant platforms.
          </p>
        </div>
        <div className="progress-roadmap-legend" aria-hidden="true">
          <span className="progress-roadmap-legend-chip progress-roadmap-legend-chip--done">
            Done
          </span>
          <span className="progress-roadmap-legend-chip progress-roadmap-legend-chip--active">
            Now
          </span>
          <span className="progress-roadmap-legend-chip progress-roadmap-legend-chip--todo">
            Next
          </span>
        </div>
      </header>

      <div className="progress-roadmap-track">
        {ROADMAP_STEPS.map((step, index) => {
          let status = 'todo';
          if (index < currentIndex) status = 'done';
          else if (index === currentIndex) status = 'active';

          const clamped = clampPercent(ROADMAP_KPI_PERCENT[step.id]);

          return (
            <article
              key={step.id}
              className={`progress-roadmap-step progress-roadmap-step--${status}`}
              aria-label={step.title}
            >
              <div className="progress-roadmap-node">
                <div className="progress-roadmap-node-index">{index + 1}</div>
              </div>

              <div className="progress-roadmap-card">
                <h3 className="progress-roadmap-card-title">{step.title}</h3>

                <ul className="progress-roadmap-tag-list">
                  {step.items.map((item) => (
                    <li key={item} className="progress-roadmap-tag">
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="progress-roadmap-kpi">
                  <span className="progress-roadmap-kpi-label">KPI</span>
                  <span className="progress-roadmap-kpi-value">
                    {clamped != null ? `${clamped}%` : '—%'}
                  </span>
                </div>
                {clamped != null && (
                  <div className="progress-roadmap-kpi-bar" aria-hidden="true">
                    <div
                      className="progress-roadmap-kpi-bar-fill"
                      style={{ width: `${clamped}%` }}
                    />
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CurrentPhaseCard() {
  const currentStep = ROADMAP_STEPS[CURRENT_STEP_INDEX] ?? ROADMAP_STEPS[0];
  const clamped = clampPercent(ROADMAP_KPI_PERCENT[currentStep.id]);

  return (
    <section className="progress-current-phase">
      <header className="progress-current-phase-header">
        <p className="progress-eyebrow">Current phase</p>
        <h2 className="progress-current-phase-title">{currentStep.title}</h2>
      </header>
      <p className="progress-current-phase-subtitle">
        This is the step we are actively pushing right now. Later this card can be
        bound to real phase data, logs and KPIs.
      </p>

      {clamped != null && (
        <div className="progress-current-phase-kpi">
          <span className="progress-current-phase-kpi-label">
            Phase completeness
          </span>
          <span className="progress-current-phase-kpi-value">
            {clamped}%
          </span>
        </div>
      )}

      <ul className="progress-current-phase-list">
        {currentStep.items.map((item) => (
          <li key={item} className="progress-current-phase-list-item">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProgressPlaceholderGrid() {
  return (
    <section className="progress-placeholder-grid">
      <div className="progress-card">
        <h3 className="progress-card-title">Logs</h3>
        <p className="progress-card-body">
          TODO: bind build and runtime logs for each phase and roadmap step.
        </p>
      </div>
      <div className="progress-card">
        <h3 className="progress-card-title">Checklists</h3>
        <p className="progress-card-body">
          TODO: connect structured checklists and completion ratios.
        </p>
      </div>
      <div className="progress-card">
        <h3 className="progress-card-title">KPIs</h3>
        <p className="progress-card-body">
          TODO: surface core KPIs per phase (retention, stability, throughput, etc.).
        </p>
      </div>
    </section>
  );
}

export default function ProgressPage() {
  return (
    <div className="progress-page">
      <header className="progress-page-header">
        <div>
          <p className="progress-eyebrow">Core / Progress</p>
          <h1 className="progress-page-title">Progress roadmap</h1>
          <p className="progress-page-subtitle">
            High-level view of where AKIS is on the road to live pilot mode and
            stable tenant platforms.
          </p>
        </div>
      </header>

      {/* Roadmap strip above the "Current phase" container */}
      <ProgressRoadmapStrip />

      <main className="progress-page-main">
        <div className="progress-page-column">
          <CurrentPhaseCard />
          <ProgressPlaceholderGrid />
        </div>
      </main>
    </div>
  );
}
