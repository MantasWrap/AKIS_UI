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
    },
    {
      id: 'n2',
      type: 'ai',
      title: 'UI Boss mission suggestion',
      body: 'Consider running “AI OS home polish” before Stage A1.',
      timeAgo: '10m ago',
      severity: 'hint',
    },
    {
      id: 'n3',
      type: 'error',
      title: 'MQTT bridge offline',
      body: 'No events received from MQTT for 5 minutes.',
      timeAgo: '15m ago',
      severity: 'warning',
    },
    {
      id: 'n4',
      type: 'task',
      title: 'CODEx log waiting for summary',
      body: 'Yesterday’s CODEX entry requires QA Scribe review.',
      timeAgo: '1h ago',
      severity: 'task',
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
        { id: 'a1', label: 'AI OS 0.1 – Stage A0 status', path: '/owner/ai-os/pipeline' },
        { id: 'a2', label: 'Agents dashboard', path: '/owner/ai-os/agents' },
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
  },
  {
    id: 'note2',
    title: 'Jetson runtime bring-up',
    body: 'Confirm self-test doctor runs before live conveyor switch.',
    pinned: false,
    color: 'yellow',
    createdAt: 'Yesterday',
  },
  {
    id: 'note3',
    title: 'Docs cleanup sweep',
    body: 'Update Dev Console specs after KPI strip polish.',
    pinned: false,
    color: 'blue',
    createdAt: 'This week',
  },
];
