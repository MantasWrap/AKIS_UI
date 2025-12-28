import React from 'react';
import { NavLink } from 'react-router-dom';

export function Sidebar() {
  const navClass = ({ isActive }) =>
    isActive ? 'dev-nav-button active' : 'dev-nav-button';

  return (
    <aside className="dev-sidebar">
      <div className="dev-sidebar-top">
        <div className="dev-sidebar-title-block">
          <div className="dev-sidebar-logo">AKIS Dev</div>
          <div className="dev-sidebar-mode">Developer mode · Phase 0</div>
        </div>
      </div>
      <div className="dev-sidebar-divider" />
      <div className="dev-sidebar-body">
        <div className="dev-sidebar-nav">
          <NavLink to="/" end className={navClass}>
            Status
          </NavLink>
          <NavLink to="/live" className={navClass}>
            Live mode
          </NavLink>
          <NavLink to="/training-studio" className={navClass}>
            Training Studio
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
