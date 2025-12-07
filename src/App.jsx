import { useEffect, useMemo, useState } from 'react';
import StatusPage from './pages/StatusPage.jsx';
import DevConsoleLayout from './layouts/DevConsoleLayout.jsx';
import {
  getModuleByKey,
  getNavModules,
  getPageMetaMap,
} from './modules/moduleRegistry.js';
import { subscribeNavigation } from './modules/navigationBus.js';

const CURRENT_ROLE = 'OWNER';
const NAV_MODULES = getNavModules(CURRENT_ROLE);
const NAV_SECTION_LABELS = {
  core: 'Core',
  aiOs: 'AI OS',
  api: 'API',
};
const NAV_SECTION_ORDER = ['core', 'aiOs', 'api'];
const NAV_SECTIONS = NAV_SECTION_ORDER.map((sectionKey) => ({
  key: sectionKey,
  label: NAV_SECTION_LABELS[sectionKey] || sectionKey,
  items: NAV_MODULES.filter((module) => module.navSection === sectionKey).map((module) => ({
    key: module.key,
    label: module.label,
  })),
})).filter((section) => section.items.length > 0);

const FUTURE_NAV_ITEMS = [
  { key: 'plc', label: 'PLC / Conveyor' },
  { key: 'training', label: 'Training Studio' },
  { key: 'analytics', label: 'Analytics & Reporting' },
  { key: 'alerts', label: 'Alarms & Alerts' },
];

const PAGE_META = getPageMetaMap();

function App() {
  const [view, setView] = useState('status');
  useEffect(() => {
    const unsubscribe = subscribeNavigation((key) => {
      if (getModuleByKey(key)) {
        setView(key);
      }
    });
    return unsubscribe;
  }, []);
  const activeMeta = useMemo(() => PAGE_META[view] || PAGE_META.status, [view]);

  const page = useMemo(() => {
    const module = getModuleByKey(view) || getModuleByKey('status');
    if (!module) return <StatusPage />;
    const Component = module.component;
    return <Component />;
  }, [view]);

  return (
    <DevConsoleLayout
      navSections={NAV_SECTIONS}
      futureNavItems={FUTURE_NAV_ITEMS}
      activeKey={view}
      onNavigate={setView}
      pageTitle={activeMeta.title}
      pageSubtitle={activeMeta.subtitle}
    >
      {page}
    </DevConsoleLayout>
  );
}

export default App;
