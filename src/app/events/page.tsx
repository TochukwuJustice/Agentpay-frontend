"use client";

import { Spinner } from "@/components/Spinner";
import {
  safeFormatTimestamp,
  safeStringify,
} from "@/lib/format";
import { useApi } from "@/lib/useApi";

type AppEvent = {
  id: string;
  ts: number;
  type: string;
  payload: Record<string, unknown>;
};

export default function EventsPage() {
  const state = useApi<{ items: AppEvent[] }>("/api/v1/events?limit=100");
  const items = state.status === "ok" ? state.data.items : null;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-4xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Event log</h1>
      {state.status === "loading" && <Spinner label="Loading events" />}
      {state.status === "error" && (
        <p role="alert" className="text-sm text-rose-600">
          {state.error}
        </p>
      )}
      {items && items.length === 0 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No events yet.</p>
      )}
      {items && items.length > 0 && (
        <ol className="flex flex-col gap-2 text-sm">
          {items.map((e, i) => (
            <li
              // Combine the position with the (possibly missing) id so that
              // events without an id still get unique React keys.
              key={`${i}-${String(e.id ?? "")}`}
              className="rounded border border-zinc-200 p-3 font-mono text-xs dark:border-zinc-800"
            >
              <div className="flex justify-between gap-4 text-zinc-500">
                <span className="break-all">{String(e.type ?? "")}</span>
                <span className="shrink-0">{safeFormatTimestamp(e.ts)}</span>
              </div>
              <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-words">
                {safeStringify(e.payload)}
              </pre>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
