import { useEffect, useMemo, useState } from "react";
import { Content, fetchOneEntry } from "@builder.io/sdk-react";

export default function BuilderPage({ urlPath }) {
  const apiKey = import.meta.env.VITE_BUILDER_API_KEY;
  const path = useMemo(() => urlPath || window.location.pathname || "/", [urlPath]);
  const [content, setContent] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!apiKey) return setContent(null);
      const entry = await fetchOneEntry({
        apiKey,
        model: "page",
        query: { "data.url": path },
      });
      if (!cancelled) setContent(entry || null);
    }
    run();
    return () => { cancelled = true; };
  }, [apiKey, path]);

  if (content === undefined) return null;
  if (!content) return <div style={{ padding: 24 }}>No Builder page for <code>{path}</code></div>;
  return <Content apiKey={apiKey} model="page" content={content} />;
}
