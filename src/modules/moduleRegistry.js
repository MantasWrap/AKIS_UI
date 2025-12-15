import StatusPage from '../pages/StatusPage.jsx';
import MockItemsPage from '../pages/MockItemsPage.jsx';
import RuntimeStatusPage from '../pages/RuntimeStatusPage.jsx';
import ProgressPage from '../pages/ProgressPage.jsx';
import AiOsHomePage from '../pages/aios/AiOsHomePage.jsx';
import AiOsAgentsPage from '../pages/aios/AiOsAgentsPage.jsx';
import AiOsModesPage from '../pages/aios/AiOsModesPage.jsx';
import AiOsPipelinePage from '../pages/aios/AiOsPipelinePage.jsx';
import AiOsAgentCostsPage from '../pages/aios/AiOsAgentCostsPage.jsx';
import AiOsMissionsPage from '../pages/aios/AiOsMissionsPage.jsx';
import AiOsSecurityPage from '../pages/aios/AiOsSecurityPage.jsx';
import AiOsSettingsPage from '../pages/aios/AiOsSettingsPage.jsx';
import AiOsAgentSettingsV2Page from '../pages/aios/AiOsAgentSettingsV2Page.jsx';
import AiOsAchievementsPage from '../pages/aios/AiOsAchievementsPage.jsx';
import AiOsCoreLogsPage from '../pages/aios/AiOsCoreLogsPage.jsx';
import AiOsAboutUpdatesPage from '../pages/aios/AiOsAboutUpdatesPage.jsx';
import OwnerApiDocsPage from '../pages/api/OwnerApiDocsPage.jsx';
import AiOsTelemetryPage from '../pages/aios/AiOsTelemetryPage.jsx';

import {
  ActivitySquare,
  BarChart3,
  Bell,
  BookOpenText,
  Cog,
  Coins,
  Cpu,
  GraduationCap,
  LineChart,
  Info,
  LayoutDashboard,
  ListOrdered,
  Rocket,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Users2,
  Workflow,
} from 'lucide-react';
import { DESIGN_CONFIG } from '../design/designConfig.js';

/**
 * @typedef {'OWNER' | 'ENGINEER' | 'TENANT' | 'CLIENT'} DevRole
 */

/**
 * @typedef {'core' | 'aiOs' | 'api' | 'future'} NavSection
 */

/**
 * @typedef {
 *  | 'status'
 *  | 'items'
 *  | 'runtimeStatus'
 *  | 'progress'
 *  | 'plc'
 *  | 'training'
 *  | 'analytics'
 *  | 'alerts'
 *  | 'aiOsHome'
 *  | 'aiOsAgents'
 *  | 'aiOsModes'
 *  | 'aiOsPipeline'
 *  | 'aiOsAgentCosts'
 *  | 'aiOsMissions'
 *  | 'aiOsSecurity'
 *  | 'aiOsSettings'
 *  | 'aiOsAgentSettingsV2'
 *  | 'aiOsAchievements'
 *  | 'aiOsCoreLogs'
 *  | 'aiOsAbout'
 *  | 'aiOsTelemetry'
 *  | 'apiDocs'
 * } DevModuleKey
 */

/**
 * @typedef DevModule
 * @property {DevModuleKey} key
 * @property {string} label
 * @property {React.ComponentType} component
 * @property {React.ComponentType} icon
 * @property {{ title: string, subtitle: string }} pageMeta
 * @property {boolean} enabled
 * @property {DevRole[]} enabledRoles
 * @property {NavSection} navSection
 */

export const DEFAULT_MODULE_KEY = 'status';

const MODULE_FLAGS = (DESIGN_CONFIG && DESIGN_CONFIG.modules) || {};

function resolveEnabled(key, defaultValue = true) {
  const entry = MODULE_FLAGS[key];
  if (!entry || typeof entry.enabled !== 'boolean') return defaultValue;
  return entry.enabled;
}

/** @type {DevModule[]} */
export const MODULES = [
  {
    key: 'status',
    label: 'Dev Dashboard',
    component: StatusPage,
    icon: LayoutDashboard,
    pageMeta: {
      title: 'Developer dashboard',
      subtitle: 'Environment, runtime and recent activity overview.',
    },
    enabled: resolveEnabled('status', true),
    enabledRoles: ['OWNER', 'ENGINEER'],
    navSection: 'core',
  },
  {
    key: 'items',
    label: 'Simulation items',
    component: MockItemsPage,
    icon: ListOrdered,
    pageMeta: {
      title: 'Simulation items',
      subtitle: 'Simulation/mock items for UX testing – not live production data.',
    },
    enabled: resolveEnabled('items', true),
    enabledRoles: ['OWNER', 'ENGINEER'],
    navSection: 'core',
  },
  {
    key: 'runtimeStatus',
    label: 'Live mode',
    component: RuntimeStatusPage,
    icon: ActivitySquare,
    pageMeta: {
      title: 'Live mode',
      subtitle: 'Jetson runtime, blowers and conveyor view (mock scaffold).',
    },
    enabled: resolveEnabled('runtimeStatus', true),
    enabledRoles: ['OWNER', 'ENGINEER'],
    navSection: 'core',
  },
  {
    key: 'progress',
    label: 'Progress',
    component: ProgressPage,
    icon: BarChart3,
    pageMeta: {
      title: 'Project progress',
      subtitle: 'Live readiness from CODEX progress log and phase checklists.',
    },
    enabled: resolveEnabled('progress', true),
    enabledRoles: ['OWNER', 'ENGINEER'],
    navSection: 'core',
  },
  {
    key: 'plc',
    label: 'PLC',
    component: RuntimeStatusPage,
    icon: Cpu,
    pageMeta: {
      title: 'PLC',
      subtitle: 'PLC mapping, IOs and conveyor line overview (future).',
    },
    enabled: resolveEnabled('plc', false),
    enabledRoles: ['OWNER', 'ENGINEER'],
    navSection: 'core',
  },
  {
    key: 'training',
    label: 'Training',
    component: RuntimeStatusPage,
    icon: GraduationCap,
    pageMeta: {
      title: 'Training',
      subtitle: 'Operator and engineer training modules (future).',
    },
    enabled: resolveEnabled('training', false),
    enabledRoles: ['OWNER', 'ENGINEER'],
    navSection: 'core',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    component: RuntimeStatusPage,
    icon: LineChart,
    pageMeta: {
      title: 'Analytics',
      subtitle: 'Yield, throughput and quality analytics (future).',
    },
    enabled: resolveEnabled('analytics', false),
    enabledRoles: ['OWNER', 'ENGINEER'],
    navSection: 'core',
  },
  {
    key: 'alerts',
    label: 'Alerts',
    component: RuntimeStatusPage,
    icon: Bell,
    pageMeta: {
      title: 'Alerts',
      subtitle: 'Notifications and alert rules (future).',
    },
    enabled: resolveEnabled('alerts', false),
    enabledRoles: ['OWNER', 'ENGINEER'],
    navSection: 'core',
  },
  {
    key: 'aiOsHome',
    label: 'Home',
    component: AiOsHomePage,
    icon: Sparkles,
    pageMeta: {
      title: 'AI OS Home',
      subtitle: 'High-level AI OS cockpit.',
    },
    enabled: resolveEnabled('aiOsHome', true),
    enabledRoles: ['OWNER'],
    navSection: 'aiOs',
  },
  {
    key: 'aiOsAgents',
    label: 'Agents',
    component: AiOsAgentsPage,
    icon: Users2,
    pageMeta: {
      title: 'Agents dashboard',
      subtitle: 'AI agents, their roles and current status.',
    },
    enabled: resolveEnabled('aiOsAgents', true),
    enabledRoles: ['OWNER'],
    navSection: 'aiOs',
  },
  {
    key: 'aiOsModes',
    label: 'Modes',
    component: AiOsModesPage,
    icon: SlidersHorizontal,
    pageMeta: {
      title: 'AI modes',
      subtitle: 'Presets for AI behaviour and safety.',
    },
    enabled: resolveEnabled('aiOsModes', true),
    enabledRoles: ['OWNER'],
    navSection: 'aiOs',
  },
  {
    key: 'aiOsPipeline',
    label: 'Dev pipeline',
    component: AiOsPipelinePage,
    icon: Workflow,
    pageMeta: {
      title: 'AI dev pipeline',
      subtitle: 'Stage-by-stage AI OS delivery tracker.',
    },
    enabled: resolveEnabled('aiOsPipeline', true),
    enabledRoles: ['OWNER'],
    navSection: 'aiOs',
  },
  {
    key: 'aiOsAgentCosts',
    label: 'Agent costs',
    component: AiOsAgentCostsPage,
    icon: Coins,
    pageMeta: {
      title: 'Agent costs',
      subtitle: 'Rough cost-per-action and per-mission estimates.',
    },
    enabled: resolveEnabled('aiOsAgentCosts', true),
    enabledRoles: ['OWNER'],
    navSection: 'aiOs',
  },
  {
    key: 'aiOsMissions',
    label: 'Missions',
    component: AiOsMissionsPage,
    icon: Rocket,
    pageMeta: {
      title: 'Missions control',
      subtitle: 'Mission queue, statuses and handoffs.',
    },
    enabled: resolveEnabled('aiOsMissions', true),
    enabledRoles: ['OWNER'],
    navSection: 'aiOs',
  },
  {
    key: 'aiOsSecurity',
    label: 'Security',
    component: AiOsSecurityPage,
    icon: ShieldCheck,
    pageMeta: {
      title: 'Security cockpit',
      subtitle: 'Access, roles and data boundaries.',
    },
    enabled: resolveEnabled('aiOsSecurity', true),
    enabledRoles: ['OWNER'],
    navSection: 'aiOs',
  },
  {
    key: 'aiOsSettings',
    label: 'Settings',
    component: AiOsSettingsPage,
    icon: Cog,
    pageMeta: {
      title: 'AI OS settings',
      subtitle: 'Config for AI OS, tenants and environments.',
    },
    enabled: resolveEnabled('aiOsSettings', true),
    enabledRoles: ['OWNER'],
    navSection: 'aiOs',
  },
  {
    key: 'aiOsAgentSettingsV2',
    label: 'Agent config',
    component: AiOsAgentSettingsV2Page,
    icon: ScrollText,
    pageMeta: {
      title: 'Agent configuration',
      subtitle: 'Detailed tuning for individual agents.',
    },
    enabled: resolveEnabled('aiOsAgentSettingsV2', true),
    enabledRoles: ['OWNER'],
    navSection: 'aiOs',
  },
  {
    key: 'aiOsAchievements',
    label: 'Achievements',
    component: AiOsAchievementsPage,
    icon: Trophy,
    pageMeta: {
      title: 'AI OS achievements',
      subtitle: 'Badges and milestones for deployments.',
    },
    enabled: resolveEnabled('aiOsAchievements', true),
    enabledRoles: ['OWNER'],
    navSection: 'aiOs',
  },
  {
    key: 'aiOsCoreLogs',
    label: 'Logs & pipeline',
    component: AiOsCoreLogsPage,
    icon: ListOrdered,
    pageMeta: {
      title: 'Core logs & pipeline',
      subtitle: 'Raw event logs and pipeline traces.',
    },
    enabled: resolveEnabled('aiOsCoreLogs', true),
    enabledRoles: ['OWNER'],
    navSection: 'aiOs',
  },
  {
    key: 'aiOsAbout',
    label: 'About / updates',
    component: AiOsAboutUpdatesPage,
    icon: Info,
    pageMeta: {
      title: 'AI OS · About',
      subtitle: 'Version metadata and release links.',
    },
    enabled: resolveEnabled('aiOsAbout', true),
    enabledRoles: ['OWNER'],
    navSection: 'aiOs',
  },
  {
    key: 'aiOsTelemetry',
    label: 'Telemetry & Behaviour',
    component: AiOsTelemetryPage,
    icon: LineChart,
    pageMeta: {
      title: 'Telemetry & Behaviour',
      subtitle: 'Agent metrics, incidents, and timelines.',
    },
    enabled: resolveEnabled('aiOsTelemetry', true),
    enabledRoles: ['OWNER'],
    navSection: 'aiOs',
  },
  {
    key: 'apiDocs',
    label: 'Owner API docs',
    component: OwnerApiDocsPage,
    icon: BookOpenText,
    pageMeta: {
      title: 'API documentation',
      subtitle: 'Owner & developer API overview stub.',
    },
    enabled: resolveEnabled('apiDocs', true),
    enabledRoles: ['OWNER'],
    navSection: 'api',
  },
  // Future modules will be appended here with navSection: 'future'.
];

export function getNavModules(role) {
  return MODULES.filter((module) => module.enabled && module.enabledRoles.includes(role));
}

export function getPageMetaMap() {
  const map = {};
  for (const module of MODULES) {
    map[module.key] = module.pageMeta;
  }
  return map;
}

export function getModuleByKey(key) {
  return MODULES.find((module) => module.key === key) || null;
}
