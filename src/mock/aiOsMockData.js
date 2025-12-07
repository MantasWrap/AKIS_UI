export const aiOsMockData = {
  status: {
    version: 'AI OS 0.1',
    stage: 'Stage A0',
    build: 'Owner preview · build 1462',
    highlights: [
      'UI Boss assistant online for owner UI decisions.',
      'Nav + shell stabilized for AI OS Home.',
      'Security policies mirrored from docs/EN specs.',
    ],
    readiness: 62,
  },
  usage: {
    window: 'Last 30 days',
    tokens: '1.2M tokens',
    cost: '$482',
    delta: '+18%',
    miniChart: [42, 55, 48, 61, 72, 78, 74],
    breakdown: [
      { label: 'Tokens', value: '1.2M' },
      { label: 'Runtime hours', value: '76h' },
      { label: 'Missions launched', value: '14' },
    ],
  },
  plan: {
    plan: 'Owner Alpha plan',
    budget: '$2k / month',
    burn: '24% used',
    status: 'Within limits',
  },
  agents: {
    total: 7,
    highlight: 'UI Boss',
    activeThisWeek: 4,
    roster: [
      {
        name: 'UI Boss',
        role: 'Owner-facing UX brain',
        focus: 'Design reviews & Codex automation',
        status: 'Primary',
        cost: '$182 / mo',
        actions: 42,
      },
      {
        name: 'QA Scribe',
        role: 'Log summariser',
        focus: 'CODEX progress + testing notes',
        status: 'Supporting',
        cost: '$88 / mo',
        actions: 18,
      },
      {
        name: 'Pipeline Scout',
        role: 'Pipeline observer',
        focus: 'AI dev pipeline + readiness flags',
        status: 'In training',
        cost: '$44 / mo',
        actions: 9,
      },
    ],
  },
  modes: {
    total: 3,
    featured: 'CHAT&CODEX UI v1',
    list: [
      {
        name: 'CHAT&CODEX UI v1',
        channel: 'Owner console',
        latency: '~1.2s',
        usage: 'Primary comms link',
        status: 'Stable',
      },
      {
        name: 'AI Ops voice (alpha)',
        channel: 'Hands-free voice',
        latency: '~2.8s',
        usage: 'Limited lab preview',
        status: 'Preview',
      },
      {
        name: 'Mission-only agent',
        channel: 'Programmatic',
        latency: '~900ms',
        usage: 'Used for scripted missions',
        status: 'Internal',
      },
    ],
  },
  pipeline: {
    stage: 'A0',
    status: 'AI OS scaffold live for owners',
    next: 'A1 · Operations QA handshake',
    eta: 'Next 2 sprints',
    readiness: 68,
    stages: [
      { id: 'A0', label: 'Scaffold', state: 'done', summary: 'Owner shell + nav ready.' },
      { id: 'A1', label: 'Ops QA', state: 'in_progress', summary: 'QA + human-in-loop instrumentation.' },
      { id: 'A2', label: 'Multi-mission', state: 'up_next', summary: 'Mission orchestration flows.' },
      { id: 'A3', label: 'Tenant-ready', state: 'future', summary: 'Tenant packaging + billing.' },
    ],
  },
  costs: {
    monthly: '$482',
    delta: '+12% vs last month',
    topAgent: 'UI Boss',
    topAgentCost: '$182',
    budgetCeiling: '$2k',
    warnings: ['Add guardrails before enabling tenant agents.'],
    breakdown: [
      { label: 'Owner coaching', value: '$220' },
      { label: 'Missions', value: '$140' },
      { label: 'R&D sandbox', value: '$122' },
    ],
  },
  missions: {
    note: 'Missions run as read-only previews until backend hooks land.',
    items: [
      {
        name: 'Owner onboarding funnel',
        status: 'Shaping',
        eta: 'A0 sprint 3',
        description: 'Mocking the UI for new owner login + token setup.',
      },
      {
        name: 'AI OS home polish',
        status: 'In review',
        eta: 'A0 sprint 2',
        description: 'Refine status + usage cards with live data hooks.',
      },
      {
        name: 'Security posture export',
        status: 'Planned',
        eta: 'A1 kickoff',
        description: 'Generate audit-ready OS security snapshots.',
      },
    ],
  },
  security: {
    roles: [
      { name: 'Owner', scope: 'Full AI OS control', focus: 'Home, agents, costs, security' },
      { name: 'Engineer', scope: 'Runtime + logs', focus: 'Status, items, PLC telemetry' },
      { name: 'Tenant dev (future)', scope: 'Scoped API surface', focus: 'Per-tenant missions & read-only data' },
    ],
    guardrails: [
      'All API calls gated by OS security contexts.',
      'Agent cost approvals required above $500 new monthly spend.',
      'Missions restricted to mock data until PLC hardware is online.',
    ],
  },
  settings: {
    note: 'Settings are mock-only until OS security service is wired.',
    toggles: [
      { id: 'notifications', label: 'Owner notifications', helper: 'Send weekly AI OS summaries to owner inbox.', enabled: true },
      { id: 'missionPreviews', label: 'Mission previews', helper: 'Allow UI Boss to share mission demos in Dev Console.', enabled: true },
      { id: 'tenantSandbox', label: 'Tenant sandbox access', helper: 'Expose AI OS nav to tenant observers.', enabled: false },
      { id: 'costAlerts', label: 'Cost guardrails', helper: 'Alert when AI spend exceeds 80% of plan.', enabled: true },
    ],
  },
  api: {
    release: 'First doc bundle targeting AI OS A1.',
    sections: [
      {
        title: 'Owner-facing API',
        body: 'Control AI OS components (agents, missions, pipelines) via authenticated owner tokens. Enforced by OS Security.',
      },
      {
        title: 'Tenant developer API',
        body: 'Scoped endpoints for per-tenant integrations covering mission submission, pipeline telemetry, and cost reporting.',
      },
      {
        title: 'AI OS roles & scopes',
        body: 'Roles map to OS Security: Owner, Engineer, Tenant Dev. Each scope will ship with its own OpenAPI section.',
      },
    ],
  },
};
