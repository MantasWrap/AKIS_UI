import { useEffect, useMemo, useState } from 'react';
import { Content, fetchOneEntry } from '@builder.io/sdk-react';

function normalizePath(path) {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

export default function BuilderPage({ urlPath }) {
  const apiKey = import.meta.env.VITE_BUILDER_API_KEY;

  const path = useMemo(() => {
    return normalizePath(urlPath || window.location.pathname || '/');
  }, [urlPath]);

  const [content, setContent] = useState(undefined);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!apiKey) {
        console.error('Missing VITE_BUILDER_API_KEY in .env.local');
        setContent(null);
        return;
      }

      const entry = await fetchOneEntry({
        apiKey,
        model: 'page',
        query: { 'data.url': path },
      });

      if (!cancelled) setContent(entry || null);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [apiKey, path]);

  if (content === undefined) return null;

  if (!content) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui' }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          No Builder page found
        </div>
        <div>
          Path: <code>{path}</code>
        </div>
        <div style={{ marginTop: 12 }}>
          Create a <b>Page</b> in Builder with URL = <code>{path}</code> and publish it.
        </div>
      </div>
    );
  }

  return <Content apiKey={apiKey} model="page" content={content} />;
}
