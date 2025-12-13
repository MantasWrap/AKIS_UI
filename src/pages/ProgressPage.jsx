import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  getProgressSummary,
  getProgressTimeline,
} from '../api/client';
import { useAiOsMockData } from '../hooks/useAiOsMockData';
import { emitNavigation } from '../modules/navigationBus';
import ProgressHeroRoadmap from '../components/ProgressHeroRoadmap';
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
  phase_2: 'Phase 2 is about accuracy and throughput on the live line, turning the prototype into something operators trust.',
  phase_3: 'Phase 3 adds multi-class handling, advanced retraining, and makes the system robust against real-world mess.',
  phase_4: 'Phase 4 is about scaling across tenants, billing it correctly, and making upgrades boring.',
};

const FALLBACK_PHASE_COPY = 'This phase description is still being drafted. Check progress.log and docs/EN/PHASES for details.';

const INITIAL_DEVINFO_STATE = {
  currentPhase: false,
  phaseRoadmap: false,
  phase0Checklist: false,
  timeline: false,
  roadmaps: false,
  nextSteps: false,
};

function mapTimelineToSteps(timeline) {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    return [];
  }

  const topicFirstById = {};
  const topicEntryCounts = {};
  for (const entry of timeline) {
    const topic = entry.topic || 'unknown';
    if (!topicFirstById[topic]) {
      topicFirstById[topic] = entry;
    }
    topicEntryCounts[topic] = (topicEntryCounts[topic] || 0) + 1;
  }

  const steps = [];
  const sortedTopics = Object.keys(topicFirstById).sort((a, b) => {
    const countA = topicEntryCounts[a] || 0;
    const countB = topicEntryCounts[b] || 0;
    return countB - countA;
  });

  for (const topic of sortedTopics) {
    const sourceEntry = topicFirstById[topic];
    steps.push({
      topic,
      title: sourceEntry.title || sourceEntry.sourceEntry || 'Work item',
      text: sourceEntry.summary || sourceEntry.text || '',
      sourceEntry: sourceEntry.sourceEntry || null,
      date: sourceEntry.date || null,
      priority: sourceEntry.priority || 'Normal',
    });
  }

  return steps;
}

function CardHeader({ title, subtitle, onToggleDevInfo, devInfoOpen, children }) {
  return (
    <div className="dev-card-header progress-card-header">
      <div>
        <h3 className="dev-card-title">{title}</h3>
        {subtitle && <div className="progress-card-subhead">{subtitle}</div>}
        {children}
      </div>
      {onToggleDevInfo && (
        <button
          type="button"
          onClick={onToggleDevInfo}
          className="progress-dev-info-link"
          aria-pressed={devInfoOpen}
          aria-expanded={devInfoOpen}
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
      return {
        label: 'Backend / API',
        className: 'dev-badge dev-badge--primary',
      };
    case 'frontend':
      return {
        label: 'Dev console & UI',
        className: 'dev-badge dev-badge--secondary',
      };
    case 'plc':
      return {
        label: 'PLC & conveyor',
        className: 'dev-badge dev-badge--plc',
      };
    case 'jetson-runtime':
      return {
        label: 'Jetson runtime',
        className: 'dev-badge dev-badge--jetson',
      };
    case 'devops':
      return {
        label: 'DevOps / tooling',
        className: 'dev-badge dev-badge--devops',
      };
    case 'docs/system':
      return {
        label: 'Docs / system',
        className: 'dev-badge dev-badge--docs',
      };
    default:
      return {
        label: 'Other',
        className: 'dev-badge dev-badge--default',
      };
  }
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
  'docs/system': 'Docs / system',
};

const TIMELINE_TIME_WINDOWS = [
  { id: 'last7d', label: 'Last 7 days' },
  { id: 'last30d', label: 'Last 30 days' },
  { id: 'last90d', label: 'Last 90 days' },
];

const TIMELINE_DEFAULT_WINDOW_ID = 'last30d';

export default function ProgressPage() {
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timelineWindow, setTimelineWindow] = useState(TIMELINE_DEFAULT_WINDOW_ID);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [devInfoOpen, setDevInfoOpen] = useState(INITIAL_DEVINFO_STATE);
  const [hoveredPhaseId, setHoveredPhaseId] = useState(null);
  const [lockedPhaseId, setLockedPhaseId] = useState('phase_0');
  const [inspectedPhaseId, setInspectedPhaseId] = useState('phase_0');
  const [timelineTopicFilters, setTimelineTopicFilters] = useState(() => new Set(TOPICS));
  const [timelineTopicMode, setTimelineTopicMode] = useState('all');
  const [timelineSource, setTimelineSource] = useState('codex');
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineTimeWindowId, setTimelineTimeWindowId] = useState(TIMELINE_DEFAULT_WINDOW_ID);
  const [refreshKey, setRefreshKey] = useState(0);
  const aiOsData = useAiOsMockData();
  const aiOsOverview = aiOsData?.overview;
  const aiOsPipeline = aiOsData?.pipeline;
  const aiOsStageList = aiOsPipeline?.stages || [];
  const aiOsCurrentStage =
    aiOsStageList.find((stage) => stage.id === aiOsPipeline?.currentStageId) || aiOsStageList[0] || null;
  const aiOsCompletedStages = aiOsStageList.filter((stage) => stage.state === 'done').length;
  const aiOsInProgressStages = aiOsStageList.filter((stage) => stage.state === 'in_progress').length;
  const aiOsNextStage =
    aiOsStageList.find((stage) => stage.state === 'in_progress')
    || aiOsStageList.find((stage) => stage.state === 'up_next')
    || null;
  const aiOsTotalStages = aiOsStageList.length;
  const aiOsBadgeLabel = aiOsOverview?.badgeLabel
    || `AI OS ${aiOsOverview?.version || '0.1'} · Stage ${aiOsCurrentStage?.label?.split(' ')[1] || 'A0'}`;
  const aiOsPipelineSubtitle = aiOsPipeline?.status || 'Stage-by-stage AI OS delivery tracker.';
  const aiOsPipelineCurrentSummary =
    aiOsCurrentStage?.summary || aiOsCurrentStage?.description || 'AI OS pipeline mock data loading.';
  const aiOsPipelineNextLine = aiOsNextStage
    ? `Next: ${aiOsNextStage.label} – ${aiOsNextStage.summary}`
    : aiOsPipeline?.next
      ? `Next: ${aiOsPipeline.next}${aiOsPipeline?.eta ? ` · ${aiOsPipeline.eta}` : ''}`
      : null;

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const requestOptions = refreshKey > 0 ? { fresh: true } : undefined;
        const [summaryData, timelineData] = await Promise.all([
          getProgressSummary(requestOptions || {}),
          getProgressTimeline(requestOptions || {}),
        ]);

        if (isCancelled) {
          return;
        }

        if (summaryData && summaryData.ok === false) {
          setError((prev) => prev || `Could not load progress summary: ${summaryData.error}`);
        } else if (summaryData) {
          setSummary(summaryData.data || summaryData);
        }

        if (timelineData && timelineData.ok === false) {
          setError((prev) => prev || `Could not load timeline: ${timelineData.error}`);
        } else if (timelineData) {
          const entries = Array.isArray(timelineData.entries)
            ? timelineData.entries
            : Array.isArray(timelineData)
              ? timelineData
              : [];
          setTimeline(entries);
        }
      } catch (err) {
        console.error('Failed to load progress data', err);
        if (!isCancelled) {
          setError('Failed to load progress data. Check console or try again later.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [refreshKey]);

  const latestEntry = timeline && timeline.length > 0 ? timeline[0] : null;
  const devPace = useMemo(() => computeDevPace(timeline), [timeline]);
  const topicCounts = summary?.topicBreakdown || {};
  const devPaceLast7d = devPace?.entriesLast7d ?? 0;
  const devPacePrev7d = devPace?.entriesPrev7d ?? 0;
  const devPaceLastLogLabel = formatLastLog(devPace.daysSinceLast);
  const lastUpdateText = latestEntry
    ? `Last update · ${latestEntry.date} – ${latestEntry.title}`
    : 'No updates recorded yet in CODEX_Progress_Log.md';

  const phaseSnapshots = useMemo(() => summary?.phases || [], [summary]);
  const phaseSnapshotsById = useMemo(() => {
    const map = {};
    phaseSnapshots.forEach((phase) => {
      if (phase?.phaseId) {
        map[phase.phaseId] = phase;
      }
    });
    return map;
  }, [phaseSnapshots]);

  const derivedPhaseId = useMemo(() => {
    if (summary?.currentPhaseId) return summary.currentPhaseId;
    if (summary?.activePhaseId) return summary.activePhaseId;
    if (typeof summary?.activePhase === 'string') {
      if (summary.activePhase.includes('1')) return 'phase_1';
      if (summary.activePhase.includes('2')) return 'phase_2';
      if (summary.activePhase.includes('3')) return 'phase_3';
      if (summary.activePhase.includes('4')) return 'phase_4';
    }
    return 'phase_0';
  }, [summary]);

  const currentPhaseId = derivedPhaseId;
  const currentPhaseSnapshot = phaseSnapshotsById[currentPhaseId] || null;

  const currentPhaseIndexRaw = PHASE_PILLS.findIndex((p) => p.id === currentPhaseId);
  const currentPhaseIndex = currentPhaseIndexRaw >= 0 ? currentPhaseIndexRaw : 0;
  const currentPhasePill = PHASE_PILLS[currentPhaseIndex] || PHASE_PILLS[0];
  const activePhaseRaw = currentPhaseSnapshot?.phaseId || currentPhasePill.id;
  const activePhaseSubtitle = PHASE_DETAILS_COPY[activePhaseRaw] || FALLBACK_PHASE_COPY;
  const currentPhaseLabel = currentPhaseSnapshot?.name
    ? `Phase ${(currentPhaseSnapshot?.phaseId || currentPhaseId).replace('phase_', '')} – ${currentPhaseSnapshot.name}`
    : `Phase ${(currentPhaseId || 'phase_0').replace('phase_', '')}`;

  const currentPhaseChecklist = currentPhaseSnapshot?.checklist || null;
  const currentPhaseChecklistPercent =
    currentPhaseChecklist && typeof currentPhaseChecklist.percent === 'number'
      ? Math.round(currentPhaseChecklist.percent)
      : null;
  const currentPhasePercentComplete =
    typeof currentPhaseSnapshot?.percent === 'number'
      ? currentPhaseSnapshot.percent
      : currentPhaseChecklistPercent ?? 0;

  let focusText = null;
  if (typeof summary?.currentFocus === 'string' && summary.currentFocus.trim()) {
    focusText = summary.currentFocus.trim();
  } else if (activePhaseRaw === 'phase_1') {
    focusText = 'Current focus: bridge to Phase 1 (PLC & conveyor integration)';
  }

  const plugPlayMeta = summary?.plugPlay || {};
  const plugPlayStatus = summary?.plugPlayStatus || plugPlayMeta.status || 'unknown';
  const plugPlayEta = summary?.plugPlayEta || plugPlayMeta.eta || null;
  const plugPlayEtaLabel = plugPlayEta || 'ETA TBD';
  const plugPlayPercent =
    typeof summary?.plugPlayPercent === 'number'
      ? Math.round(summary.plugPlayPercent)
      : typeof plugPlayMeta.percent === 'number'
        ? Math.round(plugPlayMeta.percent)
        : null;
  const plugPlayStatusBadge =
    plugPlayStatus === 'ready'
      ? 'ok'
      : plugPlayStatus === 'at_risk'
        ? 'warn'
        : plugPlayStatus === 'blocked'
          ? 'error'
          : 'idle';
  const plugPlayStatusText =
    plugPlayStatus === 'ready'
      ? 'Ready for Plug & Play migration'
      : plugPlayStatus === 'at_risk'
        ? 'At risk · needs attention'
        : plugPlayStatus === 'blocked'
          ? 'Blocked · address issues before migration'
          : plugPlayStatus === 'unknown'
            ? 'Status unknown · log progress'
            : null;

  const roadmapDraftedCount = phaseSnapshots.filter((phase) => phase.roadmapStatus === 'documented').length;
  const roadmapMissingCount = Math.max(0, phaseSnapshots.length - roadmapDraftedCount);
  const roadmapCoverageMeta = phaseSnapshots.length
    ? `${phaseSnapshots.length} phases · ${roadmapDraftedCount} drafted · ${roadmapMissingCount} missing`
    : 'Roadmap coverage pending';
  const docsGapsCount = useMemo(() => {
    if (!phaseSnapshots.length) return 0;
    return phaseSnapshots.filter((phase) => phase.roadmapStatus === 'missing').length;
  }, [phaseSnapshots]);

  const nextSteps = useMemo(() => mapTimelineToSteps(timeline), [timeline]);
  const stepsToShow = useMemo(() => {
    const showAllTopics = timelineTopicFilters.size === TOPICS.length;
    const filtered = nextSteps.filter((step) =>
      showAllTopics ? true : timelineTopicFilters.has(step.topic),
    );
    return filtered.slice(0, 4);
  }, [nextSteps, timelineTopicFilters]);
  const timelineEntryByTitle = useMemo(() => {
    if (!Array.isArray(timeline)) return {};
    return timeline.reduce((acc, entry) => {
      if (entry?.sourceEntry) {
        acc[entry.sourceEntry] = entry;
      }
      return acc;
    }, {});
  }, [timeline]);
  const latestNextStep = stepsToShow[0] || null;
  const latestNextStepMeta = latestNextStep ? mapTopicToLabelAndClass(latestNextStep.topic) : null;
  const latestNextStepEntry = latestNextStep?.sourceEntry ? timelineEntryByTitle[latestNextStep.sourceEntry] : null;
  const latestNextStepLoggedDate = latestNextStepEntry?.date || latestNextStep?.date || 'Unknown';
  const latestNextStepPriority = (latestNextStep?.priority || 'Normal').toUpperCase();
  const latestNextStepTitle = latestNextStep?.title || latestNextStep?.sourceEntry || 'Next action';
  const latestNextStepBody = latestNextStep?.text || latestNextStepEntry?.summary || 'No next steps recorded yet.';
  const filteredTimelineEntries = useMemo(() => {
    if (!Array.isArray(timeline)) return [];
    const searchTerm = timelineSearch.trim().toLowerCase();
    const windowLookup = {
      last7d: 7,
      last30d: 30,
      last90d: 90,
    };
    const daysWindow = windowLookup[timelineTimeWindowId] || null;
    const threshold =
      daysWindow != null ? Date.now() - daysWindow * 24 * 60 * 60 * 1000 : null;

    return timeline.filter((entry) => {
      if (!entry) return false;

      if (timelineSource !== 'all') {
        const entrySource = entry.source || 'codex';
        if (entrySource !== timelineSource) {
          return false;
        }
      }

      if (threshold && entry.date) {
        const entryDate = new Date(entry.date);
        if (!Number.isNaN(entryDate.getTime()) && entryDate.getTime() < threshold) {
          return false;
        }
      }

      if (timelineTopicFilters.size && timelineTopicFilters.size !== TOPICS.length) {
        const entryTopics = Array.isArray(entry.topics) && entry.topics.length
          ? entry.topics
          : entry.topic
            ? [entry.topic]
            : [];
        if (entryTopics.length) {
          const matchesTopic = entryTopics.some((topic) => timelineTopicFilters.has(topic));
          if (!matchesTopic) {
            return false;
          }
        }
      }

      if (searchTerm) {
        const haystack = `${entry.title || ''} ${entry.summary || ''} ${entry.text || ''}`.toLowerCase();
        if (!haystack.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }, [timeline, timelineTopicFilters, timelineSource, timelineSearch, timelineTimeWindowId]);

  const phase0 = phaseSnapshotsById.phase_0 || null;
  const phase0Snapshot = phase0;
  const hasPhase0Milestones =
    !!phase0Snapshot && Array.isArray(phase0Snapshot.milestones) && phase0Snapshot.milestones.length > 0;
  const checklist = phase0?.checklist || null;
  const percent = checklist && typeof checklist.percent === 'number'
    ? Math.round(checklist.percent)
    : null;
  const checklistTotal = typeof checklist?.total === 'number' ? checklist.total : null;
  const checklistCompleted = typeof checklist?.completed === 'number' ? checklist.completed : null;
  const checklistLeft = checklistTotal != null && checklistCompleted != null
    ? Math.max(0, checklistTotal - checklistCompleted)
    : null;
  const checklistMetaLine = checklistTotal != null && checklistCompleted != null && checklistLeft != null
    ? `${checklistTotal} steps · ${checklistCompleted} done · ${checklistLeft} left`
    : 'Checklist status';
  const defaultPhase0RoadmapChips = [
    'PreLaunch TODO',
    'Hardware stubs',
    'Mock PLC connectors',
    'Dev console scaffolding',
    'AI OS training hooks',
    'Runtime simulator',
  ];
  const phase0RoadmapChips = Array.isArray(phase0?.roadmap?.sections) && phase0.roadmap.sections.length
    ? phase0.roadmap.sections
    : (phase0?.checklist?.openItems?.slice(0, 5).map((item) => item.section || item.label) || defaultPhase0RoadmapChips);
  const currentRoadmapSummary = hasPhase0Milestones
    ? 'Phase 0 milestones drafted – later phases to be authored.'
    : 'Phase 0 roadmap is still being authored.';
  const roadmapFutureSummary = 'Next phases: roadmaps to be authored for Phase 1–4.';

  const inspectionsAvailable = phaseSnapshots.length > 0;
  const fallbackInspectedPhase = inspectionsAvailable ? phaseSnapshots[0] : null;
  const inspectedPhase =
    phaseSnapshotsById[inspectedPhaseId] || fallbackInspectedPhase || currentPhaseSnapshot || null;
  const inspectedPhaseIndexRaw = PHASE_PILLS.findIndex((p) => p.id === inspectedPhaseId);
  const inspectedPhaseIndex = inspectedPhaseIndexRaw >= 0 ? inspectedPhaseIndexRaw : 0;
  const inspectedPhaseCopy =
    (inspectedPhase && PHASE_DETAILS_COPY[inspectedPhase.phaseId]) || FALLBACK_PHASE_COPY;


  const handleRefresh = () => {
    if (!loading) {
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleTimelineTopicsAll = () => {
    setTimelineTopicFilters(new Set(TOPICS));
    setTimelineTopicMode('all');
  };

  const handleTimelineTopicToggle = (topic) => {
    setTimelineTopicFilters((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) {
        next.delete(topic);
      } else {
        next.add(topic);
      }
      setTimelineTopicMode(next.size === TOPICS.length ? 'all' : 'custom');
      return next;
    });
  };

  const handleTimelineWindowChange = (windowId) => {
    setTimelineWindow(windowId);
    setTimelineTimeWindowId(windowId);
  };

  const handleTimelineSourceChange = (sourceId) => {
    setTimelineSource(sourceId);
  };

  const navigateToAiOsPipeline = () => {
    emitNavigation({ type: 'NAVIGATE', payload: { path: '/aios/pipeline' } });
  };


  const handlePhasePreview = (phaseId) => {
    if (!phaseId) {
      setHoveredPhaseId(null);
      setInspectedPhaseId((prev) => {
        const fallbackId = phaseSnapshotsById[lockedPhaseId] ? lockedPhaseId : currentPhaseId;
        return prev === fallbackId ? prev : fallbackId;
      });
    } else {
      setHoveredPhaseId(phaseId);
      setInspectedPhaseId(phaseId);
    }
  };

  const handlePhaseLock = (phaseId) => {
    if (phaseId) {
      setLockedPhaseId(phaseId);
      setHoveredPhaseId(null);
      setInspectedPhaseId(phaseId);
    }
  };

  useEffect(() => {
    if (hoveredPhaseId) {
      return;
    }
    const fallbackId = phaseSnapshotsById[lockedPhaseId] ? lockedPhaseId : currentPhaseId;
    setInspectedPhaseId((prev) => (prev === fallbackId ? prev : fallbackId));
  }, [hoveredPhaseId, lockedPhaseId, currentPhaseId, phaseSnapshotsById]);

  useEffect(() => {
    if (lockedPhaseId && !phaseSnapshotsById[lockedPhaseId]) {
      setLockedPhaseId(currentPhaseId);
    }
  }, [lockedPhaseId, currentPhaseId, phaseSnapshotsById]);

  return (
    <div className="progress-page">
      <div className="progress-page-header">
        <div>
          <h1 className="progress-page-title">Project progress</h1>
          <p className="progress-page-subtitle">Live readiness from CODEX progress log and phase checklists.</p>
        </div>
        <div className="progress-header-actions">
          <div className="progress-env-pills">
            <span className="progress-env-pill">API: dev</span>
            <span className="progress-env-pill">Site: HQ</span>
            <span className="progress-env-pill">Line: A</span>
            <span className="progress-env-pill">Version: v0.1</span>
          </div>
          <button
            type="button"
            className={`dev-pill-button ${loading ? '' : 'active'}`}
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Loading progress …' : 'Refresh data'}
          </button>
        </div>
      </div>
      <div className="progress-intro-strip">
        <div>
          <h2 className="dev-card-title">Progress &amp; roadmap</h2>
          <p className="dev-card-subtitle">CODEX checklist integration, roadmap coverage, and AI OS status.</p>
        </div>
        {aiOsBadgeLabel && (
          <button
            type="button"
            className="progress-aios-badge progress-aios-badge--clickable"
            onClick={navigateToAiOsPipeline}
            title="View AI OS development pipeline"
          >
            {aiOsBadgeLabel}
          </button>
        )}
      </div>
      {error && (
        <p style={{ marginTop: '0.75rem', color: 'var(--dev-text-muted)' }}>{error}</p>
      )}

      <ProgressHeroRoadmap />

      <div className="progress-layout">
        <div className="progress-row progress-row--single">
          <div className="dev-card progress-kpi-card progress-kpi-card--accent-primary">
            <CardHeader
              title="Current phase"
              subtitle={activePhaseSubtitle}
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
                currentPhaseId={currentPhaseId}
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
              subtitle={checklistMetaLine}
              onToggleDevInfo={() =>
                setDevInfoOpen((prev) => ({
                  ...prev,
                  phase0Checklist: !prev.phase0Checklist,
                }))
              }
              devInfoOpen={devInfoOpen.phase0Checklist}
            />
            <div className="progress-card-body progress-card-body--checklist">
              {checklist ? (
                <>
                  <div className="progress-checklist-completion">
                    <div className="progress-checklist-percent">
                      {Number.isFinite(percent) ? `${percent}%` : '—'}
                    </div>
                    <div className="progress-checklist-details">
                      <div className="progress-checklist-label">Checklist completion</div>
                      <div className="progress-checklist-sub">
                        {checklistCompleted != null && checklistTotal != null
                          ? `${checklistCompleted} of ${checklistTotal} items complete`
                          : 'Checklist data pending'}
                      </div>
                    </div>
                  </div>
                  <div className="progress-bar progress-bar--checklist">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.max(0, Math.min(100, percent || 0))}%` }}
                    />
                  </div>
                  <div className="progress-checklist-activity">
                    <div className="progress-checklist-activity-top">
                      <span className="progress-checklist-activity-label">Pace</span>
                      <span className={devPace.badgeClass}>{devPace.label}</span>
                      <span className="progress-checklist-activity-text">
                        {devPaceLast7d > 0
                          ? `${devPaceLast7d} log entr${devPaceLast7d === 1 ? 'y' : 'ies'} in last 7 days`
                          : 'No log entries in last 7 days'}
                      </span>
                    </div>
                    <div className="progress-checklist-activity-bar">
                      <span>Last 7 days vs prior: {devPaceLast7d} · {devPacePrev7d}</span>
                    </div>
                    <div className="progress-checklist-activity-meta">
                      <span>Last log: {devPaceLastLogLabel}</span>
                      {devPace.mostActiveDev && (
                        <span> · Most active: {devPace.mostActiveDev}</span>
                      )}
                    </div>
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
              subtitle="Roadmap coverage"
              onToggleDevInfo={() =>
                setDevInfoOpen((prev) => ({
                  ...prev,
                  roadmaps: !prev.roadmaps,
                }))
              }
              devInfoOpen={devInfoOpen.roadmaps}
            />
            <div className="progress-card-body progress-card-body--roadmaps">
              <div className="progress-roadmaps-meta">{roadmapCoverageMeta}</div>
              {phaseSnapshots.length ? (
                <div className="progress-roadmaps-bar">
                  {phaseSnapshots.map((phase) => (
                    <div
                      key={phase.phaseId || phase.name}
                      className={[
                        'progress-roadmaps-bar-segment',
                        phase.roadmapStatus === 'documented' ? 'progress-roadmaps-bar-segment--active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    />
                  ))}
                </div>
              ) : (
                <div className="progress-card-note">Roadmap coverage data unavailable.</div>
              )}

              <div className="progress-roadmaps-section">
                <div className="progress-roadmaps-section-label">Current phase roadmap</div>
                <div className="progress-roadmaps-section-copy">{currentRoadmapSummary}</div>
                <div className="progress-roadmaps-chip-grid">
                  {phase0RoadmapChips.map((chip, index) => (
                    <span key={`roadmap-chip-${index}`} className="progress-roadmaps-chip">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="progress-roadmaps-section">
                <div className="progress-roadmaps-section-label">Next phases</div>
                <div className="progress-roadmaps-section-copy">{roadmapFutureSummary}</div>
              </div>
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
            <div className="progress-card-body progress-card-body--aios">
              <div className="progress-aios-card-header">
                <div>
                  <h3 className="progress-card-title">AI OS – Development pipeline</h3>
                  <p className="progress-card-subtitle">{aiOsPipelineSubtitle}</p>
                </div>
                {aiOsBadgeLabel && (
                  <span className="progress-aios-badge">{aiOsBadgeLabel}</span>
                )}
              </div>
              <div className="progress-aios-stepbar" aria-hidden="true">
                {aiOsStageList.map((stage) => (
                  <span
                    key={stage.id}
                    className={[
                      'progress-aios-stepbar-segment',
                      stage.state === 'done' ? 'progress-aios-stepbar-segment--complete' : '',
                      stage.id === aiOsCurrentStage?.id ? 'progress-aios-stepbar-segment--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                ))}
              </div>
              <div className="progress-aios-meta">
                <span>{aiOsCompletedStages} of {aiOsTotalStages} stages complete</span>
                {aiOsInProgressStages > 0 && (
                  <span> · {aiOsInProgressStages} in progress</span>
                )}
              </div>
              <div className="progress-aios-current">
                <div className="progress-aios-current-label">Current stage</div>
                <div className="progress-aios-current-title">
                  {aiOsCurrentStage ? `${aiOsCurrentStage.label} – ${aiOsCurrentStage.name}` : 'Pipeline pending'}
                </div>
                <p className="progress-aios-current-summary">{aiOsPipelineCurrentSummary}</p>
                {aiOsPipelineNextLine && (
                  <p className="progress-aios-next">
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
              subtitle="Most recent next_steps entry from CODEX progress log."
              onToggleDevInfo={() =>
                setDevInfoOpen((prev) => ({
                  ...prev,
                  nextSteps: !prev.nextSteps,
                }))
              }
              devInfoOpen={devInfoOpen.nextSteps}
            >
              <div className="progress-section-label">Next steps</div>
            </CardHeader>
            <div className="progress-card-body progress-card-body--next">
              {latestNextStep ? (
                <>
                  <div className="progress-next-meta">
                    <span className={`progress-next-pill ${latestNextStepMeta?.className || 'dev-badge dev-badge--default'}`}>
                      {latestNextStepMeta?.label || 'General'}
                    </span>
                    <span className="progress-next-meta-item">Logged: {latestNextStepLoggedDate}</span>
                    <span className="progress-next-priority">
                      Priority: {latestNextStepPriority}
                    </span>
                  </div>
                  <div className="progress-next-body">
                    <div className="progress-next-title">{latestNextStepTitle}</div>
                    <p className="progress-next-text">{latestNextStepBody}</p>
                  </div>
                  <div className="progress-next-actions">
                    <button type="button" className="progress-link-button">Open in progress log</button>
                    <button type="button" className="progress-link-button">View related items</button>
                  </div>
                </>
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
            {TIMELINE_TIME_WINDOWS.map((window) => (
              <button
                key={window.id}
                type="button"
                className={`dev-pill-button ${timelineWindow === window.id ? 'active' : ''}`}
                onClick={() => handleTimelineWindowChange(window.id)}
              >
                {window.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '0.75rem' }}>
          <div className="dev-chip-row" style={{ flexWrap: 'wrap', gap: '0.35rem' }}>
            <button
              type="button"
              className={`dev-pill-button ${timelineTopicMode === 'all' ? 'active' : ''}`}
              onClick={handleTimelineTopicsAll}
            >
              All topics
            </button>
            {TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                className={`dev-pill-button ${timelineTopicFilters.has(topic) ? 'active' : ''}`}
                onClick={() => handleTimelineTopicToggle(topic)}
              >
                {TOPIC_LABELS[topic]}
                {topicCounts[topic] ? ` (${topicCounts[topic]})` : ''}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="dev-chip-row">
              <button
                type="button"
                className={`dev-pill-button ${timelineSource === 'codex' ? 'active' : ''}`}
                onClick={() => handleTimelineSourceChange('codex')}
              >
                CODEX log
              </button>
              <button
                type="button"
                className={`dev-pill-button ${timelineSource === 'all' ? 'active' : ''}`}
                onClick={() => handleTimelineSourceChange('all')}
              >
                All sources
              </button>
            </div>
            <div style={{ flex: '1 1 220px', minWidth: '220px' }}>
              <input
                type="search"
                placeholder="Search timeline"
                value={timelineSearch}
                onChange={(event) => setTimelineSearch(event.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.6rem',
                  borderRadius: 'var(--dev-radius-md)',
                  border: '1px solid var(--dev-border-subtle)',
                  background: 'var(--dev-bg-soft)',
                  color: 'var(--dev-text-primary)',
                }}
              />
            </div>
          </div>
        </div>

        {filteredTimelineEntries.length ? (
          <div style={{ marginTop: '1rem' }}>
            {filteredTimelineEntries.map((entry) => (
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
                      {entry.date || 'Unknown'} · {entry.dev || 'Unknown'}
                    </div>
                    <div style={{ fontWeight: 500 }}>{entry.title || entry.sourceEntry || 'Timeline entry'}</div>
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
            No timeline entries match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
