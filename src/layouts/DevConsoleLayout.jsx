import { useEffect, useRef, useState } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import packageJson from '../../package.json';
import { API_BASE } from '../api/client';
import { DESIGN_CONFIG } from '../design/designConfig';
import { MODULES } from '../modules/moduleRegistry.js';

const APP_VERSION = packageJson.version || 'dev';
const DEFAULT_ENV = {
  siteId: 'SITE_LT_01',
  lineId: 'LINE_01',
};

export default function DevConsoleLayout({
  navSections = [],
  futureNavItems = [],
  activeKey,
  onNavigate,
  pageTitle,
  pageSubtitle,
  children,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const profileRef = useRef(null);

  const sidebarBranding = DESIGN_CONFIG.sidebarBranding;
  const brandLogo = sidebarBranding.logoMap[sidebarBranding.mode] || sidebarBranding.logoMap.developer;
  const collapsedLogo =
    (sidebarCollapsed && sidebarBranding.collapsedLogoMap?.[sidebarBranding.mode]) || brandLogo;
  const profileAvatarSrc = '/test/profilePhoto.jpg';

  const environmentChips = [
    { label: 'API', value: API_BASE },
    { label: 'Site', value: DEFAULT_ENV.siteId },
    { label: 'Line', value: DEFAULT_ENV.lineId },
    { label: 'Version', value: APP_VERSION },
  ];

  const profileMenu = ['Manage connections', 'My settings', 'Notifications', 'Security', 'Support', 'Help AI'];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileOpen && profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);

  const iconMap = MODULES.reduce((acc, module) => {
    acc[module.key] = module.icon;
    return acc;
  }, {});

  const toggleSidebar = () => {
    if (!sidebarCollapsed && profileOpen) {
      setProfileOpen(false);
    }
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="dev-layout">
      <aside className={`dev-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="dev-sidebar-top">
          <div className="dev-sidebar-title-block">
            <div className="dev-sidebar-logo">AKIS Dev Console</div>
            <div className="dev-sidebar-mode">Developer mode · Phase 0</div>
          </div>
          <button
            type="button"
            className="dev-sidebar-toggle"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={toggleSidebar}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <div className="dev-sidebar-divider" />

        <div className="dev-sidebar-body">
          <div className="dev-sidebar-nav">
            {navSections.map((section) => (
              <div key={section.key}>
                <div className="dev-nav-section-label">{section.label}</div>
                {section.items.map((item) => {
                  const Icon = iconMap[item.key];
                  return (
                    <button
                      key={item.key}
                      className={`dev-nav-button ${activeKey === item.key ? 'active' : ''}`}
                      onClick={() => onNavigate(item.key)}
                      aria-label={item.label}
                      title={item.label}
                    >
                      {Icon && (
                        <span className="dev-nav-icon" aria-hidden="true">
                          <Icon size={18} />
                        </span>
                      )}
                      <span className="dev-nav-label">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            {futureNavItems?.length ? (
              <div>
                <div className="dev-nav-section-label">Future modules</div>
                {futureNavItems.map((item) => {
                  const Icon = iconMap[item.key];
                  return (
                    <div key={item.key} className="dev-future-entry">
                      {Icon && (
                        <span className="dev-nav-icon future" aria-hidden="true">
                          <Icon size={16} />
                        </span>
                      )}
                      <span className="dev-nav-label">{item.label}</span>
                      <span className="dev-coming-soon">Soon</span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {!profileOpen && <div className="dev-sidebar-divider dev-profile-divider" />}

          <div
            ref={profileRef}
            className={`dev-profile-card ${profileOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}
          >
            {profileOpen && (
              <div className="dev-profile-panel">
                {profileMenu.map((item) => (
                  <button key={item} type="button" className="dev-profile-menu-item">
                    {item}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className="dev-profile-header"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((prev) => !prev)}
            >
              <div className={`dev-profile-stack ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className={`dev-profile-avatar ${sidebarCollapsed ? 'compact' : ''}`}>
                  <img src={profileAvatarSrc} alt="Profile avatar" />
                </div>
                {!sidebarCollapsed && (
                  <div className="dev-profile-meta">
                    <div className="dev-profile-name">Mantas Juozapaitis</div>
                    <div className="dev-profile-role">Owner · Engineer</div>
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>

        <div className="dev-sidebar-footer">
          <div className="dev-sidebar-footer-logo">
            <img src={collapsedLogo} alt="AKIS Dev Console logo" />
          </div>
          <button type="button" className="dev-sidebar-logout" onClick={() => console.log('logout')}>
            {sidebarBranding.logoutLabel}
          </button>
        </div>
      </aside>

      <main className="dev-main">
        <div className="dev-header">
          <div>
            <div className="dev-section-eyebrow">Developer Console · Phase 0</div>
            <h1>{pageTitle}</h1>
            <p style={{ margin: 0, color: 'var(--dev-text-muted)' }}>{pageSubtitle}</p>
          </div>
          <div className="dev-chip-row">
            {environmentChips.map((chip) => (
              <span key={chip.label} className="dev-chip">
                <strong style={{ color: 'var(--dev-text-soft)', marginRight: '0.35rem' }}>{chip.label}:</strong>
                {chip.value}
              </span>
            ))}
          </div>
        </div>

        <div>{children}</div>
      </main>
    </div>
  );
}
