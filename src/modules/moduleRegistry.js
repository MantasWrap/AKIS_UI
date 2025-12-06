import StatusPage from '../pages/StatusPage.jsx';
import MockItemsPage from '../pages/MockItemsPage.jsx';
import RuntimeStatusPage from '../pages/RuntimeStatusPage.jsx';
import ProgressPage from '../pages/ProgressPage.jsx';

import {
  ActivitySquare,
  BarChart3,
  Bell,
  Cog,
  GraduationCap,
  LayoutDashboard,
  ListOrdered,
} from 'lucide-react';
import { DESIGN_CONFIG } from '../design/designConfig.js';

/**
 * @typedef {'OWNER' | 'ENGINEER' | 'TENANT' | 'CLIENT'} DevRole
 */

/**
 * @typedef {'core' | 'future'} NavSection
 */

/**
 * @typedef {'status' | 'items' | 'runtimeStatus' | 'progress' | 'plc' | 'training' | 'analytics' | 'alerts'} DevModuleKey
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
