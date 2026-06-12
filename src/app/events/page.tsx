"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";

type AppEvent = {
  id: string;
  ts: number;
  type: string;
  payload: Record<string, unknown>;
};

export default function EventsPage() {
  const [items, setItems] = useState<AppEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ items: AppEvent[] }>("/api/v1/events?limit=100")
      .then((b) => setItems(b.items))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-4xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Event log</h1>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {!items && !error && <p>Loading…</p>}
      {items && items.length === 0 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No events yet.</p>
      )}
      {items && items.length > 0 && (
        <ol className="flex flex-col gap-2 text-sm">
          {items.map((e) => (
            <li
              key={e.id}
              className="rounded border border-zinc-200 p-3 font-mono text-xs dark:border-zinc-800"
            >
              <div className="flex justify-between text-zinc-500">
                <span>{e.type}</span>
                <span>{new Date(e.ts).toISOString()}</span>
              </div>
              <pre className="mt-2 whitespace-pre-wrap break-words">
                {JSON.stringify(e.payload, null, 2)}
              </pre>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
