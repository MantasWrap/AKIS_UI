import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Search as SearchIcon,
  NotebookPen,
  Filter,
  Pin,
  PinOff,
} from 'lucide-react';
import { devNotificationsMock, devSearchMock, devNotesMock } from '../../mock/devConsoleMockData';
import { emitNavigation } from '../../modules/navigationBus';

const CONTEXT_LABELS = {
  status: 'System · Status',
  runtimeStatus: 'System · Live mode',
  progress: 'Project · Progress',
  aiOsHome: 'AI OS · Home',
  aiOsAgents: 'AI OS · Agents',
  aiOsModes: 'AI OS · Modes',
  aiOsPipeline: 'AI OS · Pipeline',
  aiOsMissions: 'AI OS · Missions',
  aiOsSecurity: 'AI OS · Security',
  aiOsSettings: 'AI OS · Settings',
  apiDocs: 'API · Owner hub',
};

function NotificationsPanel({ onClose, onNavigate }) {
  const [filter, setFilter] = useState('all');
  const [isMuted, setIsMuted] = useState(devNotificationsMock.stats.muted);
  const [items, setItems] = useState(devNotificationsMock.notifications);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'system', label: 'System' },
    { id: 'ai', label: 'AI' },
    { id: 'warning', label: 'Warnings' },
    { id: 'task', label: 'Tasks' },
  ];

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'warning') {
      return items.filter((item) => item.severity === 'warning' || item.severity === 'error');
    }
    return items.filter((item) => item.type === filter || item.severity === filter);
  }, [items, filter]);

  const severityClass = (severity) => {
    switch (severity) {
      case 'warning':
      case 'error':
        return 'dev-ctrl-notification--warning';
      case 'task':
        return 'dev-ctrl-notification--task';
      case 'hint':
        return 'dev-ctrl-notification--hint';
      default:
        return 'dev-ctrl-notification--info';
    }
  };

  return (
    <div className="dev-ctrl-panel" role="dialog" aria-modal="true" aria-label="Notifications center">
      <div className="dev-ctrl-panel-header">
        <div>
          <h3>Notifications</h3>
          <p>{filteredItems.length} visible · {items.length} total</p>
        </div>
        <button type="button" className="dev-ctrl-panel-close" onClick={onClose} aria-label="Close notifications">
          ✕
        </button>
      </div>

      <section className="dev-ctrl-panel-section" aria-label="Notification controls">
        <div className="dev-ctrl-panel-actions">
          <button type="button" onClick={() => setIsMuted((prev) => !prev)} className="dev-ctrl-ghost-btn">
            {isMuted ? 'Resume alerts' : 'Silence alerts'}
          </button>
          <button type="button" onClick={() => setItems([])} className="dev-ctrl-ghost-btn">
            Clear all
          </button>
        </div>
        <div className="dev-ctrl-panel-subhead">
          <Filter size={12} aria-hidden="true" />
          <span>Filter feed</span>
        </div>
        <div className="dev-ctrl-chip-row">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`dev-ctrl-chip ${filter === id ? 'is-active' : ''}`}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="dev-ctrl-panel-section dev-ctrl-panel-section--scroll" aria-label="Notification feed">
        <div className="dev-ctrl-panel-scroll">
          {filteredItems.length === 0 ? (
            <div className="dev-ctrl-empty">No notifications in this filter.</div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className={`dev-ctrl-notification ${severityClass(item.severity)}`}>
                <div className="dev-ctrl-notification-head">
                  <span>{item.title}</span>
                  <time>{item.timeAgo}</time>
                </div>
                <p>{item.body}</p>
                {item.targetKey && (
                  <div className="dev-ctrl-notification-actions">
                    <button
                      type="button"
                      className="dev-ctrl-link"
                      onClick={() => onNavigate(item.targetKey)}
                    >
                      Go to module
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <footer className="dev-ctrl-panel-footer">
        <button type="button" className="dev-ctrl-link">View all notifications</button>
      </footer>
    </div>
  );
}

function SearchPanel({ onClose, onNavigate }) {
  const [query, setQuery] = useState('');

  const filteredCategories = useMemo(() => devSearchMock.categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
    }))
    .filter((category) => category.items.length > 0), [query]);

  return (
    <div className="dev-ctrl-panel" role="dialog" aria-modal="true" aria-label="Search command palette">
      <div className="dev-ctrl-panel-header">
        <div>
          <h3>Command palette</h3>
          <p>Type to jump across Dev Console</p>
        </div>
        <button type="button" className="dev-ctrl-panel-close" onClick={onClose} aria-label="Close search panel">
          ✕
        </button>
      </div>

      <section className="dev-ctrl-panel-section" aria-label="Search input">
        <div className="dev-ctrl-search-bar">
          <SearchIcon size={16} aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tenants, AI OS, docs…"
          />
        </div>
      </section>

      <section className="dev-ctrl-panel-section dev-ctrl-panel-section--scroll" aria-label="Search results">
        <div className="dev-ctrl-panel-scroll">
          {filteredCategories.length === 0 ? (
            <div className="dev-ctrl-empty">No matches yet. Try another keyword.</div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id} className="dev-ctrl-search-section">
                <header>{category.label}</header>
                <ul>
                  {category.items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.targetKey) {
                            onNavigate(item.targetKey);
                          } else {
                            console.log('Mock navigate:', item.path);
                            onClose();
                          }
                        }}
                      >
                        <span>{item.label}</span>
                        <span className="dev-ctrl-search-path">{item.path}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function NotesPanel({ onClose }) {
  const [notes, setNotes] = useState(devNotesMock);
  const [filter, setFilter] = useState('all');
  const [newNote, setNewNote] = useState({ title: '', body: '', color: 'green' });

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'pinned', label: 'Pinned' },
    { id: 'today', label: 'Today' },
  ];

  const filteredNotes = useMemo(() => notes.filter((note) => {
    if (filter === 'pinned') return note.pinned;
    if (filter === 'today') return note.createdAt === 'Today';
    return true;
  }), [notes, filter]);

  const handleTogglePinned = (id) => {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note)));
  };

  const handleAddNote = () => {
    if (!newNote.title.trim()) return;
    setNotes((prev) => [
      {
        id: `note-${Date.now()}`,
        title: newNote.title,
        body: newNote.body,
        pinned: false,
        color: newNote.color,
        createdAt: 'Today',
        context: 'notes',
      },
      ...prev,
    ]);
    setNewNote({ title: '', body: '', color: 'green' });
  };

  return (
    <div className="dev-ctrl-panel" role="dialog" aria-modal="true" aria-label="Notes and tasks panel">
      <div className="dev-ctrl-panel-header">
        <div>
          <h3>Notes & tasks</h3>
          <p>Lightweight scratchpad synced to nothing (yet)</p>
        </div>
        <button type="button" className="dev-ctrl-panel-close" onClick={onClose} aria-label="Close notes panel">
          ✕
        </button>
      </div>

      <section className="dev-ctrl-panel-section" aria-label="Note filters">
        <div className="dev-ctrl-panel-subhead">
          <Filter size={12} aria-hidden="true" />
          <span>Show</span>
        </div>
        <div className="dev-ctrl-chip-row">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`dev-ctrl-chip ${filter === id ? 'is-active' : ''}`}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="dev-ctrl-panel-section dev-ctrl-panel-section--scroll" aria-label="Notes list">
        <div className="dev-ctrl-panel-scroll dev-ctrl-notes-scroll">
          {filteredNotes.length === 0 ? (
            <div className="dev-ctrl-empty">No notes in this filter.</div>
          ) : (
            filteredNotes.map((note) => (
              <article key={note.id} className={`dev-ctrl-note dev-ctrl-note--${note.color}`}>
                <header>
                  <div>
                    <span>{note.title}</span>
                    {note.context && (
                      <span className="dev-ctrl-note-context">
                        {CONTEXT_LABELS[note.context] || note.context}
                      </span>
                    )}
                  </div>
                  <button type="button" onClick={() => handleTogglePinned(note.id)} aria-label="Toggle pin">
                    {note.pinned ? <Pin size={14} /> : <PinOff size={14} />}
                  </button>
                </header>
                <p>{note.body}</p>
                <footer>{note.createdAt}</footer>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="dev-ctrl-panel-section" aria-label="Compose note">
        <div className="dev-ctrl-note-form">
          <input
            placeholder="Title"
            value={newNote.title}
            onChange={(event) => setNewNote((prev) => ({ ...prev, title: event.target.value }))}
          />
          <textarea
            placeholder="Details"
            value={newNote.body}
            onChange={(event) => setNewNote((prev) => ({ ...prev, body: event.target.value }))}
          />
          <div className="dev-ctrl-note-form-actions">
            <div className="dev-ctrl-note-color">
              {['green', 'yellow', 'blue'].map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`dev-ctrl-color-dot ${newNote.color === color ? 'is-active' : ''}`}
                  onClick={() => setNewNote((prev) => ({ ...prev, color }))}
                >
                  <span />
                </button>
              ))}
            </div>
            <button type="button" className="dev-ctrl-primary-btn" onClick={handleAddNote}>
              Add note
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DevControlCenter() {
  const [activePanel, setActivePanel] = useState(null);

  const togglePanel = (panel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  useEffect(() => {
    if (!activePanel) return;
    const handler = (event) => {
      if (event.key === 'Escape') {
        setActivePanel(null);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activePanel]);

  const handleNavigate = (targetKey) => {
    if (!targetKey) return;
    emitNavigation(targetKey);
    setActivePanel(null);
  };

  return (
    <div className="dev-ctrl-wrapper">
      <div className="dev-ctrl-center" role="toolbar" aria-label="Dev control center">
        <button
          type="button"
          className={`dev-ctrl-icon ${activePanel === 'notifications' ? 'is-active' : ''}`}
          aria-label="Notifications"
          onClick={() => togglePanel('notifications')}
        >
          <Bell size={16} />
        </button>
        <button
          type="button"
          className={`dev-ctrl-icon ${activePanel === 'search' ? 'is-active' : ''}`}
          aria-label="Search"
          onClick={() => togglePanel('search')}
        >
          <SearchIcon size={16} />
        </button>
        <button
          type="button"
          className={`dev-ctrl-icon ${activePanel === 'notes' ? 'is-active' : ''}`}
          aria-label="Notes and tasks"
          onClick={() => togglePanel('notes')}
        >
          <NotebookPen size={16} />
        </button>
      </div>

      {activePanel && (
        <>
          <div
            className="dev-ctrl-overlay"
            role="presentation"
            aria-hidden="true"
            onClick={() => setActivePanel(null)}
          />
          <div className="dev-ctrl-panel-container">
            {activePanel === 'notifications' && (
              <NotificationsPanel onClose={() => setActivePanel(null)} onNavigate={handleNavigate} />
            )}
            {activePanel === 'search' && (
              <SearchPanel onClose={() => setActivePanel(null)} onNavigate={handleNavigate} />
            )}
            {activePanel === 'notes' && <NotesPanel onClose={() => setActivePanel(null)} />}
          </div>
        </>
      )}
    </div>
  );
}
