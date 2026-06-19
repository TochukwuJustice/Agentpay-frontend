"use client";

import { useState } from "react";
import { resolveApiBase } from "@/lib/resolveApiBase";

type QueryResult = {
  agent: string;
  serviceId: string;
  total: number;
} | null;

const API_BASE = resolveApiBase();

export default function UsagePage() {
  const [agent, setAgent] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [requests, setRequests] = useState("");
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "ok"; total: number } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [queryAgent, setQueryAgent] = useState("");
  const [queryService, setQueryService] = useState("");
  const [queryResult, setQueryResult] = useState<QueryResult>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const onRecord = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requestsNum = Number(requests);
    if (!Number.isInteger(requestsNum) || requestsNum <= 0) {
      setStatus({ kind: "error", message: "requests must be a positive integer" });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/usage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, serviceId, requests: requestsNum }),
      });
      const body = await res.json();
      if (!res.ok) {
        setStatus({ kind: "error", message: body?.message ?? "request failed" });
        return;
      }
      setStatus({ kind: "ok", total: body.total });
    } catch (err) {
      const message = err instanceof Error ? err.message : "network error";
      setStatus({ kind: "error", message });
    }
  };

  const onQuery = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQueryError(null);
    try {
      const url = `${API_BASE}/api/v1/usage/${encodeURIComponent(queryAgent)}/${encodeURIComponent(queryService)}`;
      const res = await fetch(url);
      const body = await res.json();
      if (!res.ok) {
        setQueryError(body?.message ?? "query failed");
        setQueryResult(null);
        return;
      }
      setQueryResult(body);
    } catch (err) {
      const message = err instanceof Error ? err.message : "network error";
      setQueryError(message);
      setQueryResult(null);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-screen max-w-2xl flex-col gap-12 p-8 focus:outline-none"
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Usage metering</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Record per-request usage for an agent and query the running total.
        </p>
      </header>

      <section aria-labelledby="record-heading" className="flex flex-col gap-4">
        <h2 id="record-heading" className="text-xl font-medium">
          Record usage
        </h2>
        <form onSubmit={onRecord} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>Agent</span>
            <input
              required
              name="agent"
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Service ID</span>
            <input
              required
              name="serviceId"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Requests</span>
            <input
              required
              type="number"
              min="1"
              name="requests"
              value={requests}
              onChange={(e) => setRequests(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <button
            type="submit"
            className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-white dark:text-black"
          >
            Record
          </button>
        </form>
        {status.kind === "ok" && (
          <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
            Recorded. New total: {status.total}.
          </p>
        )}
        {status.kind === "error" && (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-400">
            {status.message}
          </p>
        )}
      </section>

      <section aria-labelledby="query-heading" className="flex flex-col gap-4">
        <h2 id="query-heading" className="text-xl font-medium">
          Query usage
        </h2>
        <form onSubmit={onQuery} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>Agent</span>
            <input
              required
              name="queryAgent"
              value={queryAgent}
              onChange={(e) => setQueryAgent(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Service ID</span>
            <input
              required
              name="queryServiceId"
              value={queryService}
              onChange={(e) => setQueryService(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <button
            type="submit"
            className="self-start rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700"
          >
            Query
          </button>
        </form>
        {queryResult && (
          <p role="status" className="text-sm">
            {queryResult.agent} / {queryResult.serviceId}: <strong>{queryResult.total}</strong>{" "}
            request(s).
          </p>
        )}
        {queryError && (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-400">
            {queryError}
          </p>
        )}
      </section>
    </main>
  );
}
