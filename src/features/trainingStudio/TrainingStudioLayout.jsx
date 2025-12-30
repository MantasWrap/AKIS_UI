import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useInRouterContext } from 'react-router-dom';
import { TrainingStudioHomePage } from './TrainingStudioHomePage.jsx';
import TrainingStudioItemsPage from './TrainingStudioItemsPage.jsx';
import { TrainingStudioDatasetsPage } from './TrainingStudioDatasetsPage.jsx';
import { TrainingStudioModelsPage } from './TrainingStudioModelsPage.jsx';
import { TrainingStudioLiveCameraPage } from './TrainingStudioLiveCameraPage.jsx';
import TrainingStudioPhotoboxItemsPage from './TrainingStudioPhotoboxItemsPage.jsx';
import './trainingStudio.css';

const NAV_ITEMS = [
  {
    key: 'home',
    label: 'Home',
    path: '/training-studio',
    component: TrainingStudioHomePage,
  },
  {
    key: 'items',
    label: 'Items',
    path: '/training-studio/items',
    component: TrainingStudioItemsPage,
  },
  {
    key: 'photobox',
    label: 'Photobox Items',
    path: '/training-studio/photobox',
    component: TrainingStudioPhotoboxItemsPage,
  },
  {
    key: 'datasets',
    label: 'Datasets & Media',
    path: '/training-studio/datasets',
    component: TrainingStudioDatasetsPage,
  },
  {
    key: 'models',
    label: 'Models & Jobs',
    path: '/training-studio/models',
    component: TrainingStudioModelsPage,
  },
  {
    key: 'live-camera',
    label: 'Live Camera',
    path: '/training-studio/live-camera',
    component: TrainingStudioLiveCameraPage,
  },
];

export function TrainingStudioLayout() {
  const inRouter = useInRouterContext();
  const [activeKey, setActiveKey] = useState('home');

  const activeItem = useMemo(
    () => NAV_ITEMS.find((item) => item.key === activeKey) || NAV_ITEMS[0],
    [activeKey],
  );

  const ActiveComponent = activeItem.component;

  return (
    <div className="ts-layout">
      <header className="ts-header">
        <div>
          <p className="ts-eyebrow">AKIS</p>
          <h1>Training Studio</h1>
          <p className="ts-subtitle">
            Manual and live item training for NVIDIA object recognition.
          </p>
        </div>
      </header>

      <div className="ts-body">
        <aside className="ts-nav">
          <nav>
            <ul>
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  {inRouter ? (
                    <NavLink
                      to={item.path}
                      end={item.key === 'home'}
                      className={({ isActive }) =>
                        isActive ? 'ts-nav-link is-active' : 'ts-nav-link'
                      }
                    >
                      {item.label}
                    </NavLink>
                  ) : (
                    <button
                      type="button"
                      className={
                        item.key === activeKey
                          ? 'ts-nav-link is-active'
                          : 'ts-nav-link'
                      }
                      onClick={() => setActiveKey(item.key)}
                    >
                      {item.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="ts-main">
          {inRouter ? <Outlet /> : <ActiveComponent onNavigate={setActiveKey} />}
        </main>
      </div>
    </div>
  );
}
