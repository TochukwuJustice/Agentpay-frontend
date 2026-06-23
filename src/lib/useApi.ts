"use client";

import { useEffect, useReducer } from "react";
import { apiGet } from "./apiClient";

type State<T> =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ok"; data: T };

type Action<T> =
  | { type: "loading" }
  | { type: "error"; error: string }
  | { type: "ok"; data: T };

function reducer<T>(_state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case "loading":
      return { status: "loading" };
    case "error":
      return { status: "error", error: action.error };
    case "ok":
      return { status: "ok", data: action.data };
  }
}

/**
 * Fetch JSON from the AgentPay backend and react to path changes.
 *
 * @example
 * const state = useApi<{ items: AppEvent[] }>("/api/v1/events?limit=100");
 * if (state.status === "loading") return <Spinner label="Loading events" />;
 * if (state.status === "error") return <p role="alert">{state.error}</p>;
 * return <EventList items={state.data.items} />;
 */
export function useApi<T>(path: string | null): State<T> {
  const [state, dispatch] = useReducer(reducer<T>, { status: "loading" });

  useEffect(() => {
    if (path === null) return;
    let cancelled = false;
    dispatch({ type: "loading" });
    apiGet<T>(path)
      .then((data) => !cancelled && dispatch({ type: "ok", data }))
      .catch(
        (e) =>
          !cancelled &&
          dispatch({
            type: "error",
            error: (e as Error).message ?? "failed to load",
          })
      );
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}
