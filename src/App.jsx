import { useCallback, useEffect, useMemo, useState } from 'react';
import StatusPage from './pages/StatusPage.jsx';
import DevConsoleLayout from './layouts/DevConsoleLayout.jsx';
import {
  getModuleByKey,
  getNavModules,
  getPageMetaMap,
  DEFAULT_MODULE_KEY,
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
const DEFAULT_VIEW = DEFAULT_MODULE_KEY;

function App() {
  const [view, setView] = useState(DEFAULT_VIEW);

  const handleNavigate = useCallback((nextKey) => {
    if (!nextKey) return;
    const module = getModuleByKey(nextKey);
    if (!module) {
      console.warn(`[App] Attempted to navigate to unknown module key: ${nextKey}`);
      setView(DEFAULT_VIEW);
      return;
    }
    setView(nextKey);
  }, [setView]);

  useEffect(() => {
    const unsubscribe = subscribeNavigation((key) => {
      if (key) {
        handleNavigate(key);
      }
    });
    return unsubscribe;
  }, [handleNavigate]);

  const moduleFromView = useMemo(() => getModuleByKey(view), [view]);
  const activeModule = moduleFromView || getModuleByKey(DEFAULT_VIEW);

  const activeMeta = useMemo(
    () => activeModule?.pageMeta || PAGE_META[DEFAULT_VIEW],
    [activeModule],
  );

  const page = useMemo(() => {
    const Component = activeModule?.component || StatusPage;
    return <Component />;
  }, [activeModule]);

  return (
    <DevConsoleLayout
      navSections={NAV_SECTIONS}
      futureNavItems={FUTURE_NAV_ITEMS}
      activeKey={activeModule?.key || DEFAULT_VIEW}
      onNavigate={handleNavigate}
      pageTitle={activeMeta.title}
      pageSubtitle={activeMeta.subtitle}
    >
      {page}
    </DevConsoleLayout>
  );
}

export default App;
