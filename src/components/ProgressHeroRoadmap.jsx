import '../styles/progressRoadmapHero.css';

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

export default function ProgressHeroRoadmap() {
  const currentIndex = Math.min(
    Math.max(CURRENT_STEP_INDEX, 0),
    ROADMAP_STEPS.length - 1,
  );

  return (
    <section
      className="dev-card progress-roadmap-hero"
      aria-label="AKIS roadmap to pilot mode"
    >
      <header className="progress-roadmap-hero__header">
        <div>
          <p className="dev-card-eyebrow">AKIS build roadmap</p>
          <h2 className="dev-card-title">Roadmap to reality</h2>
          <p className="dev-card-subtitle">
            From mocked DEV console to live pilot and tenant platforms.
          </p>
        </div>
        <div className="progress-roadmap-hero__legend" aria-hidden="true">
          <span className="progress-roadmap-hero__legend-chip progress-roadmap-hero__legend-chip--done">
            Done
          </span>
          <span className="progress-roadmap-hero__legend-chip progress-roadmap-hero__legend-chip--now">
            Now
          </span>
          <span className="progress-roadmap-hero__legend-chip progress-roadmap-hero__legend-chip--next">
            Next
          </span>
        </div>
      </header>

      <div className="progress-roadmap-hero__body">
        <div className="progress-roadmap-hero__road" aria-hidden="true" />
        <div className="progress-roadmap-hero__steps">
          {ROADMAP_STEPS.map((step, index) => {
            let status = 'next';
            if (index < currentIndex) status = 'done';
            else if (index === currentIndex) status = 'now';

            const clamped = clampPercent(ROADMAP_KPI_PERCENT[step.id]);

            return (
              <article
                key={step.id}
                className={`progress-roadmap-hero__step progress-roadmap-hero__step--${status}`}
                aria-label={step.title}
              >
                <div className="progress-roadmap-hero__card">
                  <h3 className="progress-roadmap-hero__card-title">
                    {step.title}
                  </h3>

                  <ul className="progress-roadmap-hero__tags">
                    {step.items.map((item) => (
                      <li
                        key={item}
                        className="progress-roadmap-hero__tag"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="progress-roadmap-hero__kpi-row">
                    <span className="progress-roadmap-hero__kpi-label">
                      KPI
                    </span>
                    <span className="progress-roadmap-hero__kpi-value">
                      {clamped != null ? `${clamped}%` : '—%'}
                    </span>
                  </div>
                  {clamped != null && (
                    <div
                      className="progress-roadmap-hero__kpi-bar"
                      aria-hidden="true"
                    >
                      <div
                        className="progress-roadmap-hero__kpi-bar-fill"
                        style={{ width: `${clamped}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="progress-roadmap-hero__step-index">
                  <span>{index + 1}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
