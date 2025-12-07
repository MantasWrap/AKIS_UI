export const devNotificationsMock = {
  stats: {
    unreadCount: 4,
    muted: false,
  },
  notifications: [
    {
      id: 'n1',
      type: 'system',
      title: 'Controller & DB healthy',
      body: 'Last health check passed 2 minutes ago.',
      timeAgo: '2m ago',
      severity: 'info',
      targetKey: 'status',
    },
    {
      id: 'n2',
      type: 'ai',
      title: 'UI Boss mission suggestion',
      body: 'Consider running “AI OS home polish” before Stage A1.',
      timeAgo: '10m ago',
      severity: 'hint',
      targetKey: 'aiOsMissions',
    },
    {
      id: 'n3',
      type: 'error',
      title: 'MQTT bridge offline',
      body: 'No events received from MQTT for 5 minutes.',
      timeAgo: '15m ago',
      severity: 'warning',
      targetKey: 'runtimeStatus',
    },
    {
      id: 'n4',
      type: 'task',
      title: 'CODEx log waiting for summary',
      body: 'Yesterday’s CODEX entry requires QA Scribe review.',
      timeAgo: '1h ago',
      severity: 'task',
      targetKey: 'progress',
    },
  ],
};

export const devSearchMock = {
  categories: [
    {
      id: 'tenants',
      label: 'Tenants',
      items: [
        { id: 't1', label: 'Test textile line LT01', path: '/owner/tenants/lt01' },
        { id: 't2', label: 'Pilot conveyor line LV02', path: '/owner/tenants/lv02' },
      ],
    },
    {
      id: 'aios',
      label: 'AI OS',
      items: [
        { id: 'a1', label: 'AI OS Home', path: '/owner/ai-os/home', targetKey: 'aiOsHome' },
        { id: 'a2', label: 'Agents dashboard', path: '/owner/ai-os/agents', targetKey: 'aiOsAgents' },
        { id: 'a3', label: 'AI modes presets', path: '/owner/ai-os/modes', targetKey: 'aiOsModes' },
        { id: 'a4', label: 'Dev pipeline', path: '/owner/ai-os/pipeline', targetKey: 'aiOsPipeline' },
        { id: 'a5', label: 'Missions control', path: '/owner/ai-os/missions', targetKey: 'aiOsMissions' },
        { id: 'a6', label: 'Security cockpit', path: '/owner/ai-os/security', targetKey: 'aiOsSecurity' },
        { id: 'a7', label: 'AI OS settings', path: '/owner/ai-os/settings', targetKey: 'aiOsSettings' },
        { id: 'a8', label: 'Owner API docs', path: '/owner/api/docs', targetKey: 'apiDocs' },
      ],
    },
    {
      id: 'system',
      label: 'System',
      items: [
        { id: 's1', label: 'MQTT bridge status', path: '/owner/status' },
        { id: 's2', label: 'Jetson runtime', path: '/owner/runtime' },
      ],
    },
    {
      id: 'docs',
      label: 'Docs & specs',
      items: [
        { id: 'd1', label: 'Owner_Agents_Dashboard_Spec.md', path: 'docs/EN/FRONTEND/Owner_Agents_Dashboard_Spec.md' },
        { id: 'd2', label: 'AI_Development_Pipeline.md', path: 'docs/EN/AI/AI_Development_Pipeline.md' },
      ],
    },
    {
      id: 'tasks',
      label: 'Missions & tasks',
      items: [
        { id: 'm1', label: 'AI OS home polish mission', path: '/owner/ai-os/missions' },
        { id: 'm2', label: 'PLC wiring checklist', path: '/owner/progress' },
      ],
    },
  ],
};

export const devNotesMock = [
  {
    id: 'note1',
    title: 'AI OS Stage A0 QA notes',
    body: 'Track edge cases for AI OS Home mock data and nav bus.',
    pinned: true,
    color: 'green',
    createdAt: 'Today',
    context: 'aiOsPipeline',
  },
  {
    id: 'note2',
    title: 'Jetson runtime bring-up',
    body: 'Confirm self-test doctor runs before live conveyor switch.',
    pinned: false,
    color: 'yellow',
    createdAt: 'Yesterday',
    context: 'runtimeStatus',
  },
  {
    id: 'note3',
    title: 'Docs cleanup sweep',
    body: 'Update Dev Console specs after KPI strip polish.',
    pinned: false,
    color: 'blue',
    createdAt: 'This week',
    context: 'aiOsMissions',
  },
];

export const devDashboardMock = {
  hero: {
    eyebrow: 'System cockpit · Phase 0 mock',
    body: 'Environment surfaces stay calm until real telemetry connects. Swap in /api/health + /api/health/ready later.',
  },
  systemOverview: [
    {
      id: 'controller',
      label: 'Controller & DB',
      status: 'ok',
      statusLabel: 'Stable',
      description: 'Responding in 210 ms avg latency.',
      meta: 'Last ping 4m ago',
    },
    {
      id: 'jetson',
      label: 'Jetson runtime',
      status: 'waiting',
      statusLabel: 'Waiting',
      description: 'Runner not broadcasting metrics yet.',
      meta: 'Start dev runner to sync',
    },
    {
      id: 'mqtt',
      label: 'MQTT bridge',
      status: 'waiting',
      statusLabel: 'Standby',
      description: 'Listening for conveyor events.',
      meta: 'Bridge idle · port 1883',
    },
    {
      id: 'db',
      label: 'Database',
      status: 'ok',
      statusLabel: 'Ready',
      description: 'Mock schema connected.',
      meta: 'Cockroach mock · read-only',
    },
  ],
  controllerHealth: {
    summary: 'No live controller connected – showing mock telemetry until pipelines wire up.',
    fields: [
      { id: 'controllerHost', label: 'Controller host', value: 'owner-dev-controller.local' },
      { id: 'dbHost', label: 'DB host', value: 'cockroach-mock.ak.is' },
      { id: 'dbName', label: 'DB name', value: 'ak_is_dev' },
      { id: 'uptime', label: 'Uptime', value: '—', placeholder: true },
      { id: 'lastDeploy', label: 'Last deploy', value: '2024-06-12 · Phase 0 shell' },
      { id: 'notes', label: 'Notes', value: 'Phase 0 scaffold only – connect controller doctor later.' },
    ],
    emptyState: 'Real health data appears once /api/health + /api/health/ready return JSON. Until then, keep pilots calm with this summary.',
  },
  endpoints: {
    apiBase: 'https://owner-dev.ak.is',
    list: [
      {
        id: 'healthLive',
        label: 'Health (live)',
        path: '/api/health',
        description: 'Controller heartbeat + DB handshake.',
      },
      {
        id: 'healthReady',
        label: 'Health (ready)',
        path: '/api/health/ready',
        description: 'Jetson + MQTT readiness summary.',
      },
      {
        id: 'runtime',
        label: 'Debug runtime status',
        path: '/api/debug/runtime-status',
        description: 'Counters for controller → Jetson pipeline.',
      },
      {
        id: 'items',
        label: 'Runtime items',
        path: '/api/items',
        description: 'Paged item_events_log view.',
      },
    ],
    docs: [
      {
        id: 'uxSpec',
        label: 'React UX spec',
        description: 'Source of truth for cockpit layouts.',
        path: 'docs/EN/FRONTEND/React_Apps_and_UX_Spec.md',
      },
      {
        id: 'designSystem',
        label: 'Dev Console design system',
        description: 'Tokens + badge semantics.',
        path: 'docs/EN/FRONTEND/DevConsole_Design_System.md',
      },
    ],
  },
};

export const liveModeMock = {
  streamStatus: {
    pill: 'Runtime not connected · mock preview',
    helper: 'Hook up Jetson dev runner + MQTT bridge to see live ingest.',
    detail: 'Console stays in passive mode and shows canned telemetry in Phase 0.',
  },
  signalCards: [
    {
      id: 'controllerHeartbeat',
      label: 'Controller heartbeat',
      status: 'waiting',
      metric: 'No signals yet',
      helper: 'Start `npm run controller:dev`',
    },
    {
      id: 'jetsonRuntime',
      label: 'Jetson runtime',
      status: 'down',
      metric: 'Runner offline',
      helper: 'Jetson mock container sleeping',
    },
    {
      id: 'mqttBridge',
      label: 'MQTT bridge',
      status: 'ok',
      metric: 'Bridge listening',
      helper: 'Port 1883 · no events',
    },
    {
      id: 'lastIngest',
      label: 'Last ingest',
      status: 'waiting',
      metric: '—',
      helper: 'No item payloads received',
    },
  ],
  logEvents: [
    {
      id: 'log1',
      level: 'info',
      time: '10:22:10',
      source: 'console',
      message: 'Live mode shell initialised (mock data).',
    },
    {
      id: 'log2',
      level: 'warn',
      time: '10:22:25',
      source: 'controller',
      message: 'Controller doctor not running. Waiting for heartbeat.',
    },
    {
      id: 'log3',
      level: 'info',
      time: '10:23:03',
      source: 'mqtt',
      message: 'Bridge listening on ws://localhost:9001 (empty queue).',
    },
    {
      id: 'log4',
      level: 'error',
      time: '10:23:45',
      source: 'jetson',
      message: 'Jetson runtime container not detected on dev LAN.',
    },
  ],
};
