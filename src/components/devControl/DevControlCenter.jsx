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

const PANEL_IDS = ['notifications', 'search', 'notes'];

function NotificationsPanel({ onClose }) {
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
    <div className="dev-ctrl-panel">
      <div className="dev-ctrl-panel-header">
        <div>
          <h3>Notifications</h3>
          <p>{filteredItems.length} visible · {items.length} total</p>
        </div>
        <button type="button" className="dev-ctrl-panel-close" onClick={onClose} aria-label="Close notifications">
          ✕
        </button>
      </div>

      <div className="dev-ctrl-panel-actions">
        <button type="button" onClick={() => setIsMuted((prev) => !prev)} className="dev-ctrl-ghost-btn">
          {isMuted ? 'Resume alerts' : 'Silence alerts'}
        </button>
        <button type="button" onClick={() => setItems([])} className="dev-ctrl-ghost-btn">
          Clear all
        </button>
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
            </div>
          ))
        )}
      </div>

      <div className="dev-ctrl-panel-footer">
        <button type="button" className="dev-ctrl-link">View all notifications</button>
      </div>
    </div>
  );
}

function SearchPanel({ onClose }) {
  const [query, setQuery] = useState('');

  const filteredCategories = useMemo(() => devSearchMock.categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
    }))
    .filter((category) => category.items.length > 0), [query]);

  const handleNavigate = (path) => {
    console.log('Mock navigate:', path);
    onClose();
  };

  return (
    <div className="dev-ctrl-panel">
      <div className="dev-ctrl-panel-header">
        <div>
          <h3>Command palette</h3>
          <p>Type to jump across Dev Console</p>
        </div>
        <button type="button" className="dev-ctrl-panel-close" onClick={onClose} aria-label="Close search panel">
          ✕
        </button>
      </div>

      <div className="dev-ctrl-search-bar">
        <SearchIcon size={16} aria-hidden="true" />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tenants, AI OS, docs…"
        />
      </div>

      <div className="dev-ctrl-panel-scroll">
        {filteredCategories.length === 0 ? (
          <div className="dev-ctrl-empty">No matches yet. Try another keyword.</div>
        ) : (
          filteredCategories.map((category) => (
            <section key={category.id} className="dev-ctrl-search-section">
              <header>{category.label}</header>
              <ul>
                {category.items.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => handleNavigate(item.path)}>
                      <span>{item.label}</span>
                      <span className="dev-ctrl-search-path">{item.path}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
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
      },
      ...prev,
    ]);
    setNewNote({ title: '', body: '', color: 'green' });
  };

  return (
    <div className="dev-ctrl-panel">
      <div className="dev-ctrl-panel-header">
        <div>
          <h3>Notes & tasks</h3>
          <p>Lightweight scratchpad synced to nothing (yet)</p>
        </div>
        <button type="button" className="dev-ctrl-panel-close" onClick={onClose} aria-label="Close notes panel">
          ✕
        </button>
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

      <div className="dev-ctrl-panel-scroll dev-ctrl-notes-scroll">
        {filteredNotes.length === 0 ? (
          <div className="dev-ctrl-empty">No notes in this filter.</div>
        ) : (
          filteredNotes.map((note) => (
            <article key={note.id} className={`dev-ctrl-note dev-ctrl-note--${note.color}`}>
              <header>
                <span>{note.title}</span>
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
            onClick={() => setActivePanel(null)}
          />
          <div className="dev-ctrl-panel-container">
            {activePanel === 'notifications' && <NotificationsPanel onClose={() => setActivePanel(null)} />}
            {activePanel === 'search' && <SearchPanel onClose={() => setActivePanel(null)} />}
            {activePanel === 'notes' && <NotesPanel onClose={() => setActivePanel(null)} />}
          </div>
        </>
      )}
    </div>
  );
}
