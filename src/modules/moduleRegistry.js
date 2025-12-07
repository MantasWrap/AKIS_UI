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
import OwnerApiDocsPage from '../pages/api/OwnerApiDocsPage.jsx';

import {
  ActivitySquare,
  BarChart3,
  Bell,
  BookOpenText,
  Cog,
  Coins,
  Cpu,
  GraduationCap,
  LayoutDashboard,
  ListOrdered,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
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
 *  | 'apiDocs'
 * } DevModuleKey
 */

/**
 * @typedef {Object} DevModule
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
    label: 'Items',
    component: MockItemsPage,
    icon: ListOrdered,
    pageMeta: {
      title: 'Items',
      subtitle: 'Live and historical items from item_events_log.',
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
      subtitle: 'Runtime status and live telemetry for item flow.',
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
    key: 'aiOsHome',
    label: 'Home',
    component: AiOsHomePage,
    icon: Cpu,
    pageMeta: {
      title: 'AI OS · Home',
      subtitle: 'AI OS 0.1 status, usage, and plan overview.',
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
      title: 'AI OS · Agents',
      subtitle: 'Roster of owner-facing AI collaborators.',
    },
    enabled: resolveEnabled('aiOsAgents', true),
    enabledRoles: ['OWNER'],
    navSection: 'aiOs',
  },
  {
    key: 'aiOsModes',
    label: 'AI modes',
    component: AiOsModesPage,
    icon: Sparkles,
    pageMeta: {
      title: 'AI OS · Modes',
      subtitle: 'Documented communication surfaces and channels.',
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
      subtitle: 'Mocked spend + guardrails for agents.',
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
      title: 'AI OS missions',
      subtitle: 'Mission planning placeholder.',
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
      title: 'Security & access',
      subtitle: 'Roles, guardrails, and access placeholders.',
    },
    enabled: resolveEnabled('aiOsSecurity', true),
    enabledRoles: ['OWNER'],
    navSection: 'aiOs',
  },
  {
    key: 'aiOsSettings',
    label: 'Settings',
    component: AiOsSettingsPage,
    icon: SlidersHorizontal,
    pageMeta: {
      title: 'AI OS settings',
      subtitle: 'Read-only toggles sourced from specs.',
    },
    enabled: resolveEnabled('aiOsSettings', true),
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

const DEFAULT_ROLE = 'OWNER';

export function getNavModules(role = DEFAULT_ROLE) {
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
