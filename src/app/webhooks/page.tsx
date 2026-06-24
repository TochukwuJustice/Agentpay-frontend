"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/apiClient";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TextField } from "@/components/TextField";

type Webhook = { id: string; url: string; events: string[]; createdAt: number };

// Only https:// targets are accepted — rejects http:// (cleartext) and
// non-network schemes like javascript: outright.
function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

// Trims each entry, drops empties (so "a,,b," and "" don't produce blank
// event names), and de-duplicates while preserving first-seen order.
function normaliseEvents(csv: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of csv.split(",")) {
    const trimmed = raw.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

export default function WebhooksPage() {
  const [items, setItems] = useState<Webhook[] | null>(null);
  const [url, setUrl] = useState("");
  const [eventsCsv, setEventsCsv] = useState("usage.recorded,usage.settled");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<Webhook | null>(null);

  const load = () =>
    apiGet<{ items: Webhook[] }>("/api/v1/webhooks")
      .then((b) => setItems(b.items))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const events = normaliseEvents(eventsCsv);
    const nextUrlError = isHttpsUrl(url)
      ? null
      : "Enter a valid https:// URL.";
    const nextEventsError =
      events.length === 0 ? "Enter at least one event name." : null;
    setUrlError(nextUrlError);
    setEventsError(nextEventsError);
    if (nextUrlError || nextEventsError) return;

    try {
      await apiPost("/api/v1/webhooks", { url, events });
      setUrl("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await apiDelete(`/api/v1/webhooks/${id}`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <ConfirmDialog
        open={pendingRemove !== null}
        title="Remove webhook?"
        description={`Deliveries to "${pendingRemove?.url}" will stop immediately.`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (pendingRemove) onDelete(pendingRemove.id);
          setPendingRemove(null);
        }}
        onCancel={() => setPendingRemove(null)}
      />
      <h1 className="text-3xl font-semibold tracking-tight">Webhooks</h1>
      <form onSubmit={onCreate} className="flex flex-col gap-3">
        <TextField
          label="URL"
          required
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (urlError) setUrlError(null);
          }}
          placeholder="https://example.com/agentpay-hook"
          error={urlError ?? undefined}
          description={urlError ? undefined : "Must be an https:// URL."}
        />
        <TextField
          label="Events (comma-separated)"
          required
          value={eventsCsv}
          onChange={(e) => {
            setEventsCsv(e.target.value);
            if (eventsError) setEventsError(null);
          }}
          error={eventsError ?? undefined}
        />
        <button
          type="submit"
          className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Register
        </button>
        {error && (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        )}
      </form>
      {items && (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-2 py-3">
              <div>
                <p className="text-sm font-medium break-all">{w.url}</p>
                <p className="text-xs text-zinc-500">{w.events.join(", ")}</p>
              </div>
              <button
                type="button"
                onClick={() => setPendingRemove(w)}
                className="rounded border border-zinc-300 px-3 py-1 text-xs hover:border-rose-500 hover:text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
