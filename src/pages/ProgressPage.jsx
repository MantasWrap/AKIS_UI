import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  getProgressSummary,
  getProgressTimeline,
} from '../api/client';
import { useAiOsMockData } from '../hooks/useAiOsMockData';
import { emitNavigation } from '../modules/navigationBus';
import '../styles/progress.css';

const PHASE_PILLS = [
  { id: 'phase_0', label: '0' },
  { id: 'phase_1', label: '1' },
  { id: 'phase_2', label: '2' },
  { id: 'phase_3', label: '3' },
  { id: 'phase_4', label: '4' },
];

const PHASE_DETAILS_COPY = {
  phase_0: 'Phase 0 builds the fake hardware and integration scaffolding so Plug & Play is a simple migration step.',
  phase_1: 'Phase 1 validates the conveyor + PLC wiring and gets the first real items flowing through.',
  phase_2: 'Phase 2 hardens the PLC integration for stable production operation.',
  phase_3: 'Phase 3 expands the AI model to multiclass garment detection and routing.',
  phase_4: 'Phase 4 focuses on scaling and subscription-ready deployments.',
};

const FALLBACK_PHASE_COPY = 'Phase details coming soon.';

function CardHeader({ title, subtitle, onToggleDevInfo, devInfoOpen, children }) {
  return (
    <div
      className="dev-card-header"
      style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}
    >
      <div>
        <h3 className="dev-card-title" style={{ marginBottom: subtitle ? '0.15rem' : 0 }}>
          {title}
        </h3>
        {subtitle && (
          <div style={{ fontSize: '0.8rem', color: 'var(--dev-text-muted)' }}>{subtitle}</div>
        )}
        {children}
      </div>
      {onToggleDevInfo && (
        <button
          type="button"
          onClick={onToggleDevInfo}
          className="dev-devinfo-button"
          aria-pressed={devInfoOpen}
          aria-expanded={devInfoOpen}
          style={{
            fontSize: '0.75rem',
            color: 'var(--dev-text-muted)',
            border: 'none',
            background: 'transparent',
            textDecoration: 'none',
            borderBottom: '1px dotted var(--dev-text-muted)',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          Dev info
        </button>
      )}
    </div>
  );
}

function PhaseDonutKPI({ percentComplete, label }) {
  const safePercent = Number.isFinite(percentComplete) ? Math.min(100, Math.max(0, percentComplete)) : 0;
  const radius = 38;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const offset = circumference * (1 - safePercent / 100);

  return (
    <div className="progress-donut">
      <svg
        className="progress-donut__svg"
        width={(radius + strokeWidth) * 2}
        height={(radius + strokeWidth) * 2}
      >
        <circle
          className="progress-donut__bg"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
        />
        <circle
          className="progress-donut__fg"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="progress-donut__center">
        <div className="progress-donut__value">
          {Number.isFinite(percentComplete) ? `${Math.round(Math.max(0, 100 - safePercent))}%` : '—'}
        </div>
        <div className="progress-donut__label">left</div>
      </div>
      <div className="progress-donut__caption">{label}</div>
    </div>
  );
}

function PhaseTimeline({
  phases,
  currentPhaseId,
  inspectedPhaseId,
  lockedPhaseId,
  onPreviewPhase,
  onSelectPhase,
}) {
  const currentIndex = phases.findIndex((p) => p.id === currentPhaseId);

  return (
    <div className="progress-phase-track progress-phase-track--compact">
      <div className="progress-phase-row" role="tablist" aria-label="AI deployment phases">
        {phases.map((pill, index) => {
          const isCurrent = index === currentIndex;
          const isPast = currentIndex !== -1 && index < currentIndex;
          const isFuture = currentIndex !== -1 && index > currentIndex;
          const isInspected = pill.id === inspectedPhaseId;
          const isLocked = pill.id === lockedPhaseId;

          return (
            <Fragment key={pill.id}>
              <button
                type="button"
                className={[
                  'progress-phase-node',
                  isCurrent ? 'is-current' : '',
                  isPast ? 'is-past' : '',
                  isFuture ? 'is-future' : '',
                  isInspected ? 'is-inspected' : '',
                  isLocked ? 'is-locked' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => onPreviewPhase?.(pill.id)}
                onFocus={() => onPreviewPhase?.(pill.id)}
                onMouseLeave={() => onPreviewPhase?.(null)}
                onBlur={() => onPreviewPhase?.(null)}
                onClick={() => onSelectPhase?.(pill.id)}
                aria-pressed={isLocked}
                aria-current={isCurrent ? 'step' : undefined}
                role="tab"
                aria-selected={isInspected}
              >
                <div className="progress-phase-node__circle">{pill.label}</div>
                <div className="progress-phase-node__label">Phase {pill.label}</div>
                {isCurrent && <span className="progress-phase-node__now">Now</span>}
              </button>
              {index < phases.length - 1 && (
                <div
                  className={[
                    'progress-phase-connector',
                    isPast ? 'is-past' : '',
                    isFuture ? 'is-future' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function mapTopicToLabelAndClass(topic) {
  switch (topic) {
    case 'backend':
      return { label: 'Backend / API', chipClass: 'dev-chip' };
    case 'frontend':
      return { label: 'Dev Console & UI', chipClass: 'dev-chip' };
    case 'plc':
      return { label: 'PLC & conveyor', chipClass: 'dev-chip' };
    case 'jetson-runtime':
      return { label: 'Jetson runtime', chipClass: 'dev-chip' };
    case 'devops':
      return { label: 'DevOps / tooling', chipClass: 'dev-chip' };
    case 'docs/system':
      return { label: 'Docs & system', chipClass: 'dev-chip' };
    default:
      return { label: 'General', chipClass: 'dev-chip' };
  }
}

function getLast7dShare(devPace) {
  const last = devPace?.entriesLast7d ?? 0;
  const prev = devPace?.entriesPrev7d ?? 0;
  const total = last + prev;
  if (total <= 0) return 50;
  return Math.round((last / total) * 100);
}

function formatLastLog(daysSinceLast) {
  if (daysSinceLast === null || Number.isNaN(daysSinceLast)) {
    return 'Last log: unknown';
  }
  if (daysSinceLast < 0.5) return 'Last log: today';
  if (daysSinceLast < 1.5) return 'Last log: yesterday';

  const daysRounded = Math.round(daysSinceLast);
  return `Last log: ${daysRounded} day${daysRounded === 1 ? '' : 's'} ago`;
}

function computeDevPace(timeline) {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    return {
      label: 'Not active',
      badgeClass: 'dev-badge dev-badge--warn',
      entriesLast7d: 0,
      entriesPrev7d: 0,
      daysSinceLast: null,
      mostActiveDev: null,
    };
  }

  const now = new Date();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  let entriesLast7d = 0;
  let entriesPrev7d = 0;
  let daysSinceLast = null;
  const devCounts = {};

  for (const entry of timeline) {
    if (!entry || !entry.date) continue;
    const d = new Date(entry.date);
    if (Number.isNaN(d.getTime())) continue;

    const diffDays = (now - d) / MS_PER_DAY;
    if (diffDays < 0) continue;

    if (daysSinceLast === null || diffDays < daysSinceLast) {
      daysSinceLast = diffDays;
    }

    if (diffDays <= 7) {
      entriesLast7d += 1;
    } else if (diffDays <= 14) {
      entriesPrev7d += 1;
    }

    const devKey = entry.dev || 'Unknown';
    devCounts[devKey] = (devCounts[devKey] || 0) + 1;
  }

  let label = 'Not active';
  let badgeClass = 'dev-badge dev-badge--warn';

  if (entriesLast7d >= 5 && daysSinceLast !== null && daysSinceLast <= 2) {
    label = 'On fire';
    badgeClass = 'dev-badge dev-badge--ok';
  } else if (entriesLast7d >= 3 && daysSinceLast !== null && daysSinceLast <= 3) {
    label = 'Very good';
    badgeClass = 'dev-badge dev-badge--ok';
  } else if (entriesLast7d >= 1) {
    label = 'Steady';
    badgeClass = 'dev-badge dev-badge--muted';
  } else if (entriesLast7d === 0 && entriesPrev7d >= 1) {
    label = 'Slowing down';
    badgeClass = 'dev-badge dev-badge--warn';
  }

  let mostActiveDev = null;
  let maxCount = 0;
  for (const [dev, count] of Object.entries(devCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostActiveDev = dev;
    }
  }

  return {
    label,
    badgeClass,
    entriesLast7d,
    entriesPrev7d,
    daysSinceLast,
    mostActiveDev,
  };
}

const TOPICS = ['backend', 'frontend', 'plc', 'jetson-runtime', 'devops', 'docs/system'];

const TOPIC_LABELS = {
  backend: 'Backend / API',
  frontend: 'Dev Console & UI',
  plc: 'PLC & conveyor',
  'jetson-runtime': 'Jetson runtime',
  devops: 'DevOps / tooling',
  'docs/system': 'Docs & system',
};

export default function ProgressPage() {
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTopic, setActiveTopic] = useState('all');
  const [devInfoOpen, setDevInfoOpen] = useState({
    currentPhase: false,
    phase0Checklist: false,
    roadmaps: false,
    nextSteps: false,
  });
  const [expandedNextStep, setExpandedNextStep] = useState(null);
  const [lockedPhaseId, setLockedPhaseId] = useState('phase_0');
  const [hoveredPhaseId, setHoveredPhaseId] = useState(null);
  const { overview: aiOsOverview, pipeline: aiOsPipeline } = useAiOsMockData();
  const aiOsBadgeLabel = aiOsOverview?.badgeLabel
    || [aiOsOverview?.version, aiOsOverview?.stage].filter(Boolean).join(' · ')
    || null;
  const aiOsStageList = aiOsPipeline?.stages || [];
  const aiOsCurrentStage =
    aiOsStageList.find((stage) => stage.id === aiOsPipeline?.currentStageId) || aiOsStageList[0] || null;
  const aiOsStageStateCopy = {
    done: 'Complete',
    in_progress: 'In progress',
    up_next: 'Planned',
    future: 'Future',
  };
  const aiOsPipelineSubtitle = aiOsPipeline?.status || 'Stage-by-stage AI OS delivery tracker.';
  const aiOsPipelineCurrentSummary =
    aiOsCurrentStage?.summary || aiOsCurrentStage?.description || 'AI OS pipeline mock data loading.';
  const aiOsPipelineNextLine = aiOsPipeline?.next
    ? `Next: ${aiOsPipeline.next}${aiOsPipeline?.eta ? ` · ${aiOsPipeline.eta}` : ''}`
    : null;

  useEffect(() => {
    loadData({ fresh: false, topic: activeTopic });
  }, [activeTopic]);

  const phase0 = useMemo(() => {
    if (!summary || !Array.isArray(summary.phases)) return null;
    return summary.phases.find((phase) => phase.phaseId === 'phase_0') || null;
  }, [summary]);

  const docsGapsCount = useMemo(() => {
    if (!summary || !Array.isArray(summary.phases)) return 0;
    return summary.phases.filter((phase) => phase.roadmapStatus === 'missing').length;
  }, [summary]);

  const latestEntry = timeline && timeline.length > 0 ? timeline[0] : null;
  const topicCounts = summary && summary.topicBreakdown ? summary.topicBreakdown : {};
  const devPace = useMemo(() => computeDevPace(timeline), [timeline]);
  const nextSteps = Array.isArray(summary?.nextSteps) ? summary.nextSteps : [];
  const stepsToShow = nextSteps.slice(0, 3);
  const timelineEntryByTitle = useMemo(() => {
    if (!Array.isArray(timeline)) return {};
    return timeline.reduce((acc, entry) => {
      if (entry?.title) {
        acc[entry.title] = entry;
      }
      return acc;
    }, {});
  }, [timeline]);
  const phase0Snapshot = phase0;
  const hasPhase0Milestones =
    !!phase0Snapshot && Array.isArray(phase0Snapshot.milestones) && phase0Snapshot.milestones.length > 0;
  const checklist = phase0?.checklist || null;
  const percent = checklist && typeof checklist.percent === 'number'
    ? Math.round(checklist.percent)
    : null;
  let roadmapBadgeText = '';
  let roadmapSummaryText = '';
  if (docsGapsCount > 0) {
    roadmapBadgeText = `Roadmaps TODO · ${docsGapsCount} phase${docsGapsCount === 1 ? '' : 's'}`;
    if (hasPhase0Milestones) {
      roadmapSummaryText = 'Phase 0 milestones drafted · later phases to be authored.';
    } else {
      roadmapSummaryText = 'Roadmaps for later phases still need to be authored.';
    }
  } else {
    roadmapBadgeText = 'All phase roadmaps documented';
    roadmapSummaryText = hasPhase0Milestones
      ? 'Phase 0–4 have milestones and roadmap tasks documented.'
      : 'All phases have roadmap files; milestones may still evolve.';
  }

  async function loadData({ fresh, topic }) {
    setLoading(true);
    setError(null);
    try {
      const params = {
        limit: 20,
        fresh: !!fresh,
      };
      if (topic && topic !== 'all') {
        params.topic = topic;
      }

      const [summaryResult, timelineResult] = await Promise.all([
        getProgressSummary({ fresh }),
        getProgressTimeline(params),
      ]);

      if (summaryResult && summaryResult.ok === false) {
        setError((prev) => prev || `Could not load progress summary: ${summaryResult.error}`);
      } else if (summaryResult && summaryResult.data) {
        setSummary(summaryResult.data);
      }

      if (timelineResult && timelineResult.ok === false) {
        setError((prev) => prev || `Could not load timeline: ${timelineResult.error}`);
      } else if (timelineResult && Array.isArray(timelineResult.entries)) {
        setTimeline(timelineResult.entries);
      }
    } catch {
      setError('Failed to load progress data.');
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = () => {
    loadData({ fresh: true, topic: activeTopic });
  };
  const navigateToAiOsPipeline = () => {
    emitNavigation('aiOsPipeline');
  };

  const activePhaseRaw = summary?.activePhase || 'Phase 0';
  const currentPhaseId =
    summary?.activePhaseId ||
    (activePhaseRaw.includes('0') ? 'phase_0' :
      activePhaseRaw.includes('1') ? 'phase_1' :
      activePhaseRaw.includes('2') ? 'phase_2' :
      activePhaseRaw.includes('3') ? 'phase_3' :
      activePhaseRaw.includes('4') ? 'phase_4' :
      'phase_0');
  const phaseSnapshotsById = useMemo(() => {
    const map = {};
    if (Array.isArray(summary?.phases)) {
      summary.phases.forEach((phaseSnapshot) => {
        if (phaseSnapshot?.phaseId) {
          map[phaseSnapshot.phaseId] = phaseSnapshot;
        }
      });
    }
    return map;
  }, [summary]);
  const CURRENT_PHASE_ID = currentPhaseId;
  const currentPhaseSnapshot =
    Array.isArray(summary?.phases)
      ? summary.phases.find((p) => p.phaseId === currentPhaseId)
      : null;
  const currentPhaseLabel =
    currentPhaseSnapshot?.name
      ? `Phase ${
        (currentPhaseSnapshot?.phaseId || currentPhaseId).replace('phase_', '')
      } – ${currentPhaseSnapshot.name}`
      : activePhaseRaw || 'Current phase';
  const currentPhasePercentComplete =
    typeof currentPhaseSnapshot?.checklist?.percent === 'number'
      ? currentPhaseSnapshot.checklist.percent
      : null;
  let focusText = null;
  if (typeof activePhaseRaw === 'string' && activePhaseRaw.includes('1')) {
    focusText = 'Current focus: bridge to Phase 1 (PLC & conveyor integration)';
  }
  const plugPlayMeta = summary?.plugPlay || null;
  const plugPlayPercent =
    typeof plugPlayMeta?.percent === 'number' ? plugPlayMeta.percent : null;
  const plugPlayEtaLabel = plugPlayMeta?.eta
    ? `ETA · ${plugPlayMeta.eta}`
    : 'ETA · not enough data yet';
  const plugPlayStatusBadge = plugPlayMeta?.status || null;
  const plugPlayStatusText =
    plugPlayStatusBadge === 'on_track'
      ? 'On track'
      : plugPlayStatusBadge === 'at_risk'
        ? 'At risk'
        : plugPlayStatusBadge === 'late'
          ? 'Late'
          : null;
  useEffect(() => {
    setLockedPhaseId((prev) => {
      if (prev && phaseSnapshotsById[prev]) {
        return prev;
      }
      return currentPhaseId;
    });
    setHoveredPhaseId(null);
  }, [currentPhaseId, phaseSnapshotsById]);

  const currentPhaseSubtitle = currentPhaseLabel;
  const lastUpdateText = latestEntry
    ? `Last update · ${latestEntry.date} – ${latestEntry.title}`
    : 'No updates recorded yet in CODEX_Progress_Log.md';
  const inspectedPhaseId = hoveredPhaseId || lockedPhaseId || currentPhaseId;
  const fallbackInspectedPhase = inspectedPhaseId
    ? {
        phaseId: inspectedPhaseId,
        name: `Phase ${(inspectedPhaseId || '').replace('phase_', '')}`,
      }
    : null;
  const inspectedPhase =
    phaseSnapshotsById[inspectedPhaseId] || fallbackInspectedPhase || currentPhaseSnapshot || null;
  const inspectedPhaseIndexRaw = PHASE_PILLS.findIndex((p) => p.id === inspectedPhaseId);
  const inspectedPhaseIndex = inspectedPhaseIndexRaw >= 0 ? inspectedPhaseIndexRaw : 0;
  const inspectedPhaseCopy =
    (inspectedPhase && PHASE_DETAILS_COPY[inspectedPhase.phaseId]) || FALLBACK_PHASE_COPY;

  const handlePhasePreview = (phaseId) => {
    if (!phaseId) {
      setHoveredPhaseId(null);
      return;
    }
    setHoveredPhaseId(phaseId);
  };

  const handlePhaseLock = (phaseId) => {
    if (phaseId) {
      setLockedPhaseId(phaseId);
      setHoveredPhaseId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="dev-card">
        <div className="progress-header-row">
          <div className="progress-header-text">
            <h2 className="dev-card-title" style={{ margin: 0 }}>Progress &amp; roadmap</h2>
            <p className="dev-card-subtitle" style={{ margin: 0 }}>
              Live readiness from CODEX progress log and phase checklists.
            </p>
          </div>
          <div className="progress-header-actions">
            {aiOsBadgeLabel && (
              <button
                type="button"
                className="progress-aios-badge"
                onClick={navigateToAiOsPipeline}
                title="View AI OS development pipeline"
              >
                {aiOsBadgeLabel}
              </button>
            )}
            <button
              type="button"
              className={`dev-pill-button ${loading ? '' : 'active'}`}
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>
        {error && (
          <p style={{ marginTop: '0.75rem', color: 'var(--dev-text-muted)' }}>{error}</p>
        )}
      </div>

      <div className="progress-layout">
        <div className="progress-row progress-row--single">
          <div className="dev-card progress-kpi-card progress-kpi-card--accent-primary">
            <CardHeader
              title="Current phase"
              subtitle={currentPhaseSubtitle}
              onToggleDevInfo={() =>
                setDevInfoOpen((prev) => ({
                  ...prev,
                  currentPhase: !prev.currentPhase,
                }))
              }
              devInfoOpen={devInfoOpen.currentPhase}
            />
            <div className="progress-card-body progress-card-body--current-phase">
              <div className="progress-current-phase__left">
                <div className="progress-current-phase__panel">
                  <div className="progress-current-phase__panel-accent" />
                  <div className="progress-current-phase__content">
                    <div className="progress-primary-title">{currentPhaseLabel}</div>
                    {focusText && (
                      <div className="progress-focus-line">{focusText}</div>
                    )}
                    <div className="progress-micro-muted">{lastUpdateText}</div>
                  </div>
                </div>
                <div className="progress-plugplay-strip">
                  <div className="progress-plugplay-strip__label">Plug &amp; Play readiness</div>
                  <div className="progress-plugplay-strip__values">
                    <span className="progress-plugplay-strip__percent">
                      {plugPlayPercent != null ? `${plugPlayPercent}%` : '—'}
                    </span>
                    <span className="progress-plugplay-strip__eta">
                      {plugPlayEtaLabel}
                    </span>
                    {plugPlayStatusBadge && plugPlayStatusText && (
                      <span
                        className={`progress-plugplay-strip__badge progress-plugplay-strip__badge--${plugPlayStatusBadge}`}
                      >
                        {plugPlayStatusText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="progress-current-phase__right">
                <PhaseDonutKPI percentComplete={currentPhasePercentComplete} label="Phase completion" />
                <div className="progress-current-phase__legend">
                  <div className="progress-current-phase__legend-row">
                    <span className="progress-current-phase__legend-swatch progress-current-phase__legend-swatch--done" />
                    <span>Done</span>
                    <span className="progress-current-phase__legend-value">
                      {Number.isFinite(currentPhasePercentComplete) ? `${currentPhasePercentComplete}%` : '—'}
                    </span>
                  </div>
                  <div className="progress-current-phase__legend-row">
                    <span className="progress-current-phase__legend-swatch progress-current-phase__legend-swatch--left" />
                    <span>Left</span>
                    <span className="progress-current-phase__legend-value">
                      {Number.isFinite(currentPhasePercentComplete)
                        ? `${Math.max(0, 100 - currentPhasePercentComplete)}%`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="progress-current-phase__timeline">
              <PhaseTimeline
                phases={PHASE_PILLS}
                currentPhaseId={CURRENT_PHASE_ID}
                inspectedPhaseId={inspectedPhaseId}
                lockedPhaseId={lockedPhaseId}
                onPreviewPhase={handlePhasePreview}
                onSelectPhase={handlePhaseLock}
              />
              {inspectedPhase && (
                <div
                  className="progress-phase-details"
                  style={{
                    '--phase-index': inspectedPhaseIndex,
                    '--phase-segments': Math.max(1, PHASE_PILLS.length - 1),
                  }}
                >
                  <div className="progress-phase-details__header">
                    <span className="progress-phase-details__pill">
                      {(inspectedPhase.phaseId || '').replace('phase_', 'Phase ')} · {inspectedPhase.name || '—'}
                    </span>
                    {typeof inspectedPhase.checklist?.percent === 'number' && (
                      <span className="progress-phase-details__metric">
                        {inspectedPhase.checklist.percent}% checklist
                      </span>
                    )}
                    {inspectedPhase.roadmapStatus && (
                      <span
                        className={`progress-phase-details__badge progress-phase-details__badge--${inspectedPhase.roadmapStatus}`}
                      >
                        {inspectedPhase.roadmapStatus === 'documented'
                          ? 'Roadmap documented'
                          : 'Roadmap missing'}
                      </span>
                    )}
                  </div>
                  <div className="progress-phase-details__body">
                    <p className="progress-phase-details__copy">
                      {inspectedPhaseCopy}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {devInfoOpen.currentPhase && (
              <div className="progress-devinfo-panel">
                <div className="progress-devinfo-panel__title">Data sources</div>
                <ul className="progress-devinfo-panel__list">
                  <li>docs/EN/PHASES/Phase0_Integration_Checklist.md</li>
                  <li>docs/EN/CODEX/CODEX_Progress_Log.md</li>
                  {/* Add Plug&Play doc reference later if you create one */}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="progress-row progress-row--split progress-row--aios-split">
          <div className="dev-card progress-kpi-card progress-kpi-card--accent-success">
            <CardHeader
              title="Phase 0 checklist"
              subtitle={
                phase0 && phase0.checklist
                  ? `${phase0.checklist.total} steps to launch · ${phase0.checklist.completed} done`
                  : 'Checklist status'
              }
              onToggleDevInfo={() =>
                setDevInfoOpen((prev) => ({
                  ...prev,
                  phase0Checklist: !prev.phase0Checklist,
                }))
              }
              devInfoOpen={devInfoOpen.phase0Checklist}
            />
            <div className="progress-card-body">
              {checklist ? (
                <>
                  <div>
                    <div className="progress-metric-strong">
                      {checklist.completed} of {checklist.total} items complete
                    </div>
                    {typeof checklist.percent === 'number' && (
                      <div className="progress-metric-sub">~{percent}% done</div>
                    )}
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.max(0, Math.min(100, percent || 0))}%` }}
                    />
                  </div>
                  <div className="progress-pace-row">
                    <div className="progress-micro-muted">Pace</div>

                    <div className="progress-pace-meta">
                      <span className={devPace.badgeClass}>{devPace.label}</span>
                      <div>
                        {devPace.entriesLast7d > 0
                          ? `${devPace.entriesLast7d} log entr${
                              devPace.entriesLast7d === 1 ? 'y' : 'ies'
                            } in last 7 days`
                          : 'No log entries in last 7 days'}
                      </div>
                    </div>

                    <div className="progress-pace-activity">
                      <div
                        className={`progress-pace-activity-bar${
                          devPace.entriesLast7d + (devPace.entriesPrev7d || 0) === 0
                            ? ' is-empty'
                            : ''
                        }`}
                      >
                        <div
                          className="progress-pace-activity-segment progress-pace-activity-segment--recent"
                          style={{ width: `${getLast7dShare(devPace)}%` }}
                        />
                        <div
                          className="progress-pace-activity-segment progress-pace-activity-segment--prev"
                          style={{ width: `${100 - getLast7dShare(devPace)}%` }}
                        />
                      </div>
                      <div className="progress-pace-activity-labels">
                        <span>Last 7d: {devPace.entriesLast7d}</span>
                        <span>Prev 7d: {devPace.entriesPrev7d ?? 0}</span>
                      </div>
                    </div>

                    {devPace.mostActiveDev && (
                      <div className="progress-micro-muted">
                        {formatLastLog(devPace.daysSinceLast)} · Most active: {devPace.mostActiveDev}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.9rem', color: 'var(--dev-text-soft)' }}>
                  Checklist data is not available yet.
                </div>
              )}
            </div>
            {devInfoOpen.phase0Checklist && (
              <div className="progress-devinfo-panel">
                <div className="progress-devinfo-panel__title">Data sources</div>
                <ul className="progress-devinfo-panel__list">
                  <li>docs/EN/PHASES/Phase0_Integration_Checklist.md</li>
                  <li>docs/EN/CODEX/CODEX_Progress_Log.md</li>
                </ul>
              </div>
            )}
          </div>

          <div
            className={`dev-card progress-kpi-card ${
              docsGapsCount > 0 ? 'progress-kpi-card--accent-warn' : 'progress-kpi-card--accent-success'
            }`}
          >
            <CardHeader
              title="Roadmaps & planning"
              subtitle="Phase roadmaps & tasks"
              onToggleDevInfo={() =>
                setDevInfoOpen((prev) => ({
                  ...prev,
                  roadmaps: !prev.roadmaps,
                }))
              }
              devInfoOpen={devInfoOpen.roadmaps}
            />
            <div className="progress-card-body">
              <div>
                <span className={docsGapsCount > 0 ? 'dev-badge dev-badge--warn' : 'dev-badge dev-badge--ok'}>
                  {roadmapBadgeText}
                </span>
              </div>
              <div className="progress-roadmap-summary">{roadmapSummaryText}</div>
              {summary?.phases?.length ? (
                <div className="progress-roadmap-pillrow">
                  {summary.phases.map((phase) => {
                    const isMissing = phase.roadmapStatus === 'missing';
                    return (
                    <div
                      key={phase.phaseId}
                      className={`progress-roadmap-pill ${isMissing ? '' : 'is-documented'}`}
                    >
                      {(phase.name || phase.phaseId).replace(/_/g, ' ')} {isMissing ? 'TODO' : 'Doc’d'}
                    </div>
                  );
                })}
              </div>
              ) : null}
            </div>
            {devInfoOpen.roadmaps && (
              <div className="progress-devinfo-panel">
                <div className="progress-devinfo-panel__title">Data sources</div>
                <ul className="progress-devinfo-panel__list">
                  <li>docs/EN/PHASES/Phase_0_PreLaunch/Phase_0_Technical_Workplan.md</li>
                  <li>docs/EN/PHASES/Phase_0_PreLaunch/Roadmap.md</li>
                  <li>docs/EN/PHASES/Phase_1_Vision_POC/Roadmap.md</li>
                  <li>docs/EN/PHASES/Phase_2_PLC_Integration/Roadmap.md</li>
                  <li>docs/EN/PHASES/Phase_3_Multiclass_Training_Expansion/Roadmap.md</li>
                  <li>docs/EN/PHASES/Phase_4_Scaling_Subscription/Roadmap.md</li>
                </ul>
              </div>
            )}
          </div>

          <div
            className="dev-card progress-kpi-card progress-kpi-card--accent-neutral progress-aios-pipeline-card"
            role="button"
            tabIndex={0}
            onClick={navigateToAiOsPipeline}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigateToAiOsPipeline();
              }
            }}
            aria-label="Open AI OS development pipeline"
          >
            <CardHeader
              title="AI OS – Development pipeline"
              subtitle={aiOsPipelineSubtitle}
            >
              {aiOsBadgeLabel && (
                <span className="progress-aios-badge progress-aios-badge--static">
                  {aiOsBadgeLabel}
                </span>
              )}
            </CardHeader>
            <div className="progress-card-body progress-card-body--aios">
              <div className="progress-aios-pipeline-strip">
                {aiOsStageList.length > 0 ? (
                  aiOsStageList.map((stage) => {
                    const displayCode = stage.label ? stage.label.replace('Stage ', '') : stage.id;
                    const stageStatusLabel = aiOsStageStateCopy[stage.state] || stage.statusTag || 'Planned';
                    const isCurrent = stage.id === aiOsCurrentStage?.id;
                    return (
                      <div
                        key={stage.id}
                        className={[
                          'progress-aios-stage-pill',
                          isCurrent ? 'progress-aios-stage-pill--current' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <span className="progress-aios-stage-pill-code">{displayCode}</span>
                        <span className="progress-aios-stage-pill-status">{stageStatusLabel}</span>
                      </div>
                    );
                  })
                ) : (
                  <span className="progress-aios-stage-pill progress-aios-stage-pill--empty">
                    Pipeline data coming soon.
                  </span>
                )}
              </div>
              <div className="progress-aios-stage-summary">
                <div className="progress-aios-stage-summary__eyebrow">Current stage</div>
                <div className="progress-aios-stage-summary__title">
                  {aiOsCurrentStage ? `${aiOsCurrentStage.label} · ${aiOsCurrentStage.name}` : 'Pipeline pending'}
                </div>
                <p className="progress-aios-stage-summary__copy">{aiOsPipelineCurrentSummary}</p>
                {aiOsPipelineNextLine && (
                  <p className="progress-aios-stage-summary__next">
                    {aiOsPipelineNextLine}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="progress-row progress-row--single">
          <div className="dev-card progress-kpi-card progress-kpi-card--accent-neutral">
            <CardHeader
              title="Next up from CODEX"
              subtitle="Most recent next_steps"
              onToggleDevInfo={() =>
                setDevInfoOpen((prev) => ({
                  ...prev,
                  nextSteps: !prev.nextSteps,
                }))
              }
              devInfoOpen={devInfoOpen.nextSteps}
            />
            <div className="progress-card-body">
              {stepsToShow.length > 0 ? (
                <div className="progress-nextsteps-stack">
                  {stepsToShow.map((step, idx) => {
                    const { label: topicLabel, chipClass } = mapTopicToLabelAndClass(step.topic);
                    const stepKey = `${step.sourceEntry || step.topic || 'step'}-${idx}`;
                    const linkedEntry = step.sourceEntry ? timelineEntryByTitle[step.sourceEntry] : null;
                    const isExpanded = expandedNextStep === stepKey;
                    const handleToggle = () => {
                      setExpandedNextStep((prev) => (prev === stepKey ? null : stepKey));
                    };
                    const handleKeyToggle = (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleToggle();
                      }
                    };
                    return (
                      <div
                        key={stepKey}
                        className={`progress-nextstep-card ${isExpanded ? 'is-expanded' : ''}`}
                        role="button"
                        tabIndex={0}
                        onClick={handleToggle}
                        onKeyDown={handleKeyToggle}
                      >
                        <div className="progress-nextstep-chiprow">
                          <span className={`${chipClass} progress-topic-chip`}>{topicLabel}</span>
                        </div>
                        <div className="progress-nextstep-text">{step.text}</div>
                        {step.sourceEntry && (
                          <div className="progress-nextstep-source">From: {step.sourceEntry}</div>
                        )}
                        {isExpanded && (
                          <div className="progress-nextstep-detail">
                            {linkedEntry ? (
                              <>
                                <div>
                                  {linkedEntry.date} · {linkedEntry.dev || 'Unknown'} · Phase {linkedEntry.phase || '—'}
                                </div>
                                {linkedEntry.summary && (
                                  <div>{linkedEntry.summary}</div>
                                )}
                                {linkedEntry.topics?.length ? (
                                  <div className="progress-nextstep-detail__topics">
                                    {linkedEntry.topics.map((topic) => (
                                      <span key={`${stepKey}-${topic}`} className="progress-nextstep-detail__topic">
                                        {TOPIC_LABELS[topic] || topic}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                                {linkedEntry.files?.length ? (
                                  <div className="progress-nextstep-detail__topics">
                                    {linkedEntry.files.slice(0, 3).map((file) => (
                                      <span key={`${stepKey}-${file}`} className="progress-nextstep-detail__topic">
                                        {file}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                              </>
                            ) : (
                              <div>Full log entry not found in latest timeline.</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="progress-empty-state">
                  No upcoming tasks recorded yet. Add `next_steps` to the latest entry in CODEX_Progress_Log.md.
                </div>
              )}
            </div>
            {devInfoOpen.nextSteps && (
              <div className="progress-devinfo-panel">
                <div className="progress-devinfo-panel__title">Data sources</div>
                <ul className="progress-devinfo-panel__list">
                  <li>docs/EN/CODEX/CODEX_Progress_Log.md</li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="progress-row progress-row--split progress-row--secondary">
          <div className="dev-card">
            <CardHeader title="Phase board" subtitle="High-level readiness per phase" />
            <div className="progress-card-body progress-card-body--list">
              {summary?.phases?.length ? (
                <div className="progress-phase-list">
                  {summary.phases.map((phase) => (
                    <div key={phase.phaseId} className="progress-phase-list__item">
                      <div className="progress-phase-list__info">
                        <div className="progress-phase-list__title">{phase.name}</div>
                        <div className="progress-phase-list__meta">
                          {phase.checklist && typeof phase.checklist.percent === 'number'
                            ? `${phase.checklist.percent.toFixed(0)}% checklist`
                            : 'Checklist progress: n/a'}
                        </div>
                      </div>
                      <span
                        className={
                          phase.roadmapStatus === 'documented'
                            ? 'dev-badge dev-badge--ok'
                            : 'dev-badge dev-badge--warn'
                        }
                      >
                        {phase.roadmapStatus === 'documented' ? 'Roadmap documented' : 'Roadmap TODO'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="progress-card-note">Phase information unavailable.</div>
              )}
            </div>
          </div>

          <div className="dev-card">
            <CardHeader
              title="Phase 0 – open checklist items"
              subtitle="Phase0_Integration_Checklist.md"
            />
            <div className="progress-card-body progress-card-body--list">
              {phase0?.checklist?.openItems?.length ? (
                <ul className="progress-open-items">
                  {phase0.checklist.openItems.slice(0, 6).map((item, idx) => (
                    <li key={`${item.section}-${idx}`}>
                      <span className="progress-open-items__section">{item.section}:</span> {item.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="progress-card-note">
                  All checklist items are complete (or not parsed).
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="dev-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="dev-card-title" style={{ margin: 0 }}>Timeline</h2>
          <p className="dev-card-subtitle" style={{ margin: 0 }}>
              Recent work from CODEX_Progress_Log.md
            </p>
          </div>
          <div className="dev-chip-row">
            <button
              type="button"
              className={`dev-pill-button ${activeTopic === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTopic('all')}
            >
              All topics
            </button>
            {TOPICS.map((topic) => {
              const count = topicCounts[topic] || 0;
              if (!count) return null;
              return (
                <button
                  key={topic}
                  type="button"
                  className={`dev-pill-button ${activeTopic === topic ? 'active' : ''}`}
                  onClick={() => setActiveTopic(topic)}
                >
                  {TOPIC_LABELS[topic]} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {timeline && timeline.length ? (
          <div style={{ marginTop: '1rem' }}>
            {timeline.map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: '0.75rem 0',
                  borderTop: '1px solid var(--dev-border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--dev-text-muted)' }}>
                      {entry.date} · {entry.dev || 'Unknown'}
                    </div>
                    <div style={{ fontWeight: 500 }}>{entry.title}</div>
                  </div>
                  {entry.phase && (
                    <span className="dev-badge dev-badge--muted">
                      Phase {entry.phase}
                    </span>
                  )}
                </div>
                {entry.summary && (
                  <div style={{ fontSize: '0.9rem', color: 'var(--dev-text-soft)' }}>{entry.summary}</div>
                )}
                <div className="dev-chip-row">
                  {entry.topics?.map((topic) => (
                    <span key={`${entry.id}-${topic}`} className="dev-chip">
                      {TOPIC_LABELS[topic] || topic}
                    </span>
                  ))}
                  {entry.files?.slice(0, 3).map((file) => (
                    <span key={`${entry.id}-${file}`} className="dev-chip">
                      {file}
                    </span>
                  ))}
                </div>
                {entry.nextSteps && entry.nextSteps.length > 0 && (
                  <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.1rem', fontSize: '0.85rem' }}>
                    {entry.nextSteps.slice(0, 2).map((next, idx) => (
                      <li key={`${entry.id}-ns-${idx}`}>{next}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: '1rem', color: 'var(--dev-text-muted)' }}>
            Timeline is empty. Once CODEX sessions are logged, entries will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
