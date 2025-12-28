import React from 'react';
import { Link, useInRouterContext } from 'react-router-dom';

function StudioAction({ inRouter, onNavigate, to, targetKey, children }) {
  if (inRouter) {
    return (
      <Link className="ts-btn" to={to}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className="ts-btn"
      type="button"
      onClick={() => onNavigate?.(targetKey)}
      disabled={!onNavigate}
    >
      {children}
    </button>
  );
}

export function TrainingStudioHomePage({ onNavigate }) {
  const inRouter = useInRouterContext();

  return (
    <section className="ts-card-grid">
      <section className="ts-card">
        <header className="ts-card-header">
          <h2>Items</h2>
          <p>Review and improve labels for live and manual items.</p>
        </header>
        <div className="ts-card-body">
          <p>
            Use <strong>Live Items</strong> to correct items captured on the real
            conveyor, and <strong>Manual Items</strong> to label objects from
            imported video or images.
          </p>
          <StudioAction
            inRouter={inRouter}
            onNavigate={onNavigate}
            to="/training-studio/items"
            targetKey="items"
          >
            Open Items
          </StudioAction>
        </div>
      </section>

      <section className="ts-card">
        <header className="ts-card-header">
          <h2>Datasets &amp; Media</h2>
          <p>Organize imported video and image sets for training.</p>
        </header>
        <div className="ts-card-body">
          <p>
            Register media folders as datasets, link them to site/line/camera, and
            prepare them for labeling and training.
          </p>
          <StudioAction
            inRouter={inRouter}
            onNavigate={onNavigate}
            to="/training-studio/datasets"
            targetKey="datasets"
          >
            View datasets
          </StudioAction>
        </div>
      </section>

      <section className="ts-card">
        <header className="ts-card-header">
          <h2>Models &amp; Jobs</h2>
          <p>Track model training runs and deployments.</p>
        </header>
        <div className="ts-card-body">
          <p>
            See which models are trained on which datasets, monitor training jobs,
            and manage deployable artifacts for Jetson.
          </p>
          <StudioAction
            inRouter={inRouter}
            onNavigate={onNavigate}
            to="/training-studio/models"
            targetKey="models"
          >
            View models
          </StudioAction>
        </div>
      </section>

      <section className="ts-card">
        <header className="ts-card-header">
          <h2>Live Camera</h2>
          <p>Watch the conveyor and see what AI sees.</p>
        </header>
        <div className="ts-card-body">
          <p>
            Open a TV-like view of a camera feed with AI overlays showing
            detections and classes in near real time.
          </p>
          <StudioAction
            inRouter={inRouter}
            onNavigate={onNavigate}
            to="/training-studio/live-camera"
            targetKey="live-camera"
          >
            Open Live Camera
          </StudioAction>
        </div>
      </section>
    </section>
  );
}
