import { useMemo, useState } from 'react';
import StatusPage from './pages/StatusPage.jsx';
import DevConsoleLayout from './layouts/DevConsoleLayout.jsx';
import {
  getModuleByKey,
  getNavModules,
  getPageMetaMap,
} from './modules/moduleRegistry.js';

const CURRENT_ROLE = 'OWNER';
const NAV_MODULES = getNavModules(CURRENT_ROLE);
const NAV_ITEMS = NAV_MODULES.map((module) => ({ key: module.key, label: module.label }));

const FUTURE_NAV_ITEMS = [
  { key: 'plc', label: 'PLC / Conveyor' },
  { key: 'training', label: 'Training Studio' },
  { key: 'analytics', label: 'Analytics & Reporting' },
  { key: 'alerts', label: 'Alarms & Alerts' },
];

const PAGE_META = getPageMetaMap();

function App() {
  const [view, setView] = useState('status');
  const activeMeta = useMemo(() => PAGE_META[view] || PAGE_META.status, [view]);

  const page = useMemo(() => {
    const module = getModuleByKey(view) || getModuleByKey('status');
    if (!module) return <StatusPage />;
    const Component = module.component;
    return <Component />;
  }, [view]);

  return (
    <DevConsoleLayout
      navItems={NAV_ITEMS}
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
