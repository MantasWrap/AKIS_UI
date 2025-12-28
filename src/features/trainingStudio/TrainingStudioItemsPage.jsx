import React from 'react';

export function TrainingStudioItemsPage() {
  return (
    <section className="ts-page">
      <header className="ts-page-header">
        <div>
          <h2>Items</h2>
          <p>Live and manual items review (Phase B+ placeholder).</p>
        </div>
      </header>

      <div className="ts-tab-strip">
        <button className="ts-tab is-active" type="button">
          Live Items
        </button>
        <button className="ts-tab" type="button">
          Manual Items
        </button>
      </div>

      <p className="ts-helper">
        Items review flows (one-item-at-a-time, Save -> Next, back navigation)
        will be implemented in Phase B and Phase E.
      </p>
    </section>
  );
}
