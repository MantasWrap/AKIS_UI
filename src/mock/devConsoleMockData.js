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
