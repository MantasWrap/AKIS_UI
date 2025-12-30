import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function DevDashboardLayout({ children }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const isDev =
    import.meta.env?.DEV ??
    (typeof process !== 'undefined' &&
      process.env &&
      process.env.NODE_ENV !== 'production');

  return (
    <div className="dev-shell">
      <aside className="dev-nav">
        <div className="dev-nav-brand">AKIS Dev</div>
        <nav className="dev-nav-links">
          <Link
            to="/"
            className={isActive('/') ? 'dev-nav-link is-active' : 'dev-nav-link'}
          >
            Status
          </Link>
          <Link
            to="/live"
            className={isActive('/live') ? 'dev-nav-link is-active' : 'dev-nav-link'}
          >
            Live mode
          </Link>
          {isDev && (
            <Link
              to="/operator/line"
              className={
                isActive('/operator/line')
                  ? 'dev-nav-link is-active'
                  : 'dev-nav-link'
              }
            >
              Operator view
            </Link>
          )}
          <Link
            to="/training-studio"
            className={
              location.pathname.startsWith('/training-studio')
                ? 'dev-nav-link is-active'
                : 'dev-nav-link'
            }
          >
            Training Studio
          </Link>
        </nav>
      </aside>
      <main className="dev-main">{children}</main>
    </div>
  );
}
