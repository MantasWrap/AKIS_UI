import React from 'react';

function kindTagClass(kind) {
  switch (kind) {
    case 'SAFETY':
      return 'runtime-events-tag-safety';
    case 'FAULT':
      return 'runtime-events-tag-fault';
    case 'PLC_DEVICE':
      return 'runtime-events-tag-plc-device';
    case 'PLC_CONN':
      return 'runtime-events-tag-plc-conn';
    default:
      return 'runtime-events-tag-default';
  }
}

function renderMessage(evt) {
  if (evt.kind === 'PLC_CONN' && evt.payload) {
    const prev = evt.payload.prev_status || 'none';
    const next = evt.payload.status || 'UNKNOWN';
    return `PLC connection: ${prev} -> ${next}`;
  }
  return evt.message || evt.summary || 'Event';
}

export function RuntimeEventsList({ events }) {
  const list = Array.isArray(events) ? events : [];

  if (list.length === 0) {
    return (
      <p className="runtime-events-empty">
        No runtime events in this window.
      </p>
    );
  }

  return (
    <ul className="runtime-events-list">
      {list.map((evt) => (
        <li key={evt.id || `${evt.kind}-${evt.created_at || Math.random()}`}>
          <span
            className={[
              'runtime-events-tag',
              kindTagClass(evt.kind),
            ].join(' ')}
          >
            {evt.kind}
          </span>
          <span className="runtime-events-message">
            {renderMessage(evt)}
          </span>
          {evt.created_at && (
            <span className="runtime-events-time">
              {new Date(evt.created_at).toLocaleTimeString()}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
