"use client";

import { useEffect, useRef, useState } from "react";

import { pollOnce } from "./_polling";
import type { Status, Substage } from "./_progress";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_DURATION_MS = 5 * 60 * 1000; // 5 minutos

export type PollState = {
  status: Status | null;
  substage: Substage | null;
  errorMessage: string | null;
  /** Timestamp ISO de la primera vez que se observó el substage actual. */
  substageStartedAt: string | null;
  /** True si el polling fue abortado por timeout (>5 min). */
  timedOut: boolean;
  /** True si el último poll falló por red/HTTP — transient, sigue polling. */
  networkError: boolean;
};

const INITIAL_STATE: PollState = {
  status: null,
  substage: null,
  errorMessage: null,
  substageStartedAt: null,
  timedOut: false,
  networkError: false,
};

/**
 * Hook React que ejecuta `pollOnce` cada 2s contra /api/jobs/[jobId].
 * Toda la lógica de decisión vive en `pollOnce` (función pura, testeada
 * en tests/unit/polling.test.ts). Este hook es solo glue:
 *  - mantiene el state (status, substage, ...) en useState
 *  - mantiene refs para prevSubstage + startedAt (sobreviven re-renders)
 *  - interpreta el PollOutcome y hace setState correspondiente
 *  - cleanup automático: aborta fetch + clearInterval on unmount
 */
export function useJobPolling(jobId: string | null): PollState {
  const [state, setState] = useState<PollState>(INITIAL_STATE);

  const prevSubstageRef = useRef<Substage | null>(null);
  // Init a 0 (no Date.now() en render — react-hooks/purity flagga la
  // impureza). Lo seteamos a Date.now() en la primera corrida del effect.
  const startedAtMsRef = useRef<number>(0);

  useEffect(() => {
    if (!jobId) return;
    console.log("[POLL-B] useEffect ran", { jobId });
    if (startedAtMsRef.current === 0) {
      startedAtMsRef.current = Date.now();
    }

    let mounted = true;
    const abortController = new AbortController();
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function tick() {
      console.log("[POLL-D] tick() started", {
        startedAtMs: startedAtMsRef.current,
      });
      const outcome = await pollOnce({
        jobId: jobId!,
        prevSubstage: prevSubstageRef.current,
        startedAtMs: startedAtMsRef.current,
        fetchFn: (...args) => fetch(...args),
        nowMs: Date.now,
        signal: abortController.signal,
        maxDurationMs: MAX_POLL_DURATION_MS,
      });

      if (!mounted) return false;

      switch (outcome.type) {
        case "transition": {
          if (outcome.substageChanged) {
            prevSubstageRef.current = outcome.substage;
          }
          setState((prev) => ({
            status: outcome.status,
            substage: outcome.substage,
            errorMessage: outcome.errorMessage,
            substageStartedAt: outcome.substageChanged
              ? new Date().toISOString()
              : (prev.substageStartedAt ?? new Date().toISOString()),
            timedOut: false,
            networkError: false,
          }));
          return true;
        }
        case "terminal_done": {
          prevSubstageRef.current = "done";
          setState({
            status: "succeeded",
            substage: "done",
            errorMessage: null,
            substageStartedAt: new Date().toISOString(),
            timedOut: false,
            networkError: false,
          });
          return false;
        }
        case "terminal_failed": {
          prevSubstageRef.current = outcome.substage;
          setState({
            status: "failed",
            substage: outcome.substage,
            errorMessage: outcome.errorMessage,
            substageStartedAt: new Date().toISOString(),
            timedOut: false,
            networkError: false,
          });
          return false;
        }
        case "timeout": {
          setState((s) => ({ ...s, timedOut: true }));
          return false;
        }
        case "network_error": {
          setState((s) => ({ ...s, networkError: true }));
          return true; // transient, keep polling
        }
        case "aborted": {
          return false;
        }
      }
    }

    function stopInterval() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    console.log("[POLL-C] about to call first tick()");
    void tick().then((shouldContinue) => {
      if (!shouldContinue || !mounted) return;
      intervalId = setInterval(async () => {
        const cont = await tick();
        if (!cont) stopInterval();
      }, POLL_INTERVAL_MS);
    });

    return () => {
      console.log("[POLL-CLEANUP] useEffect cleanup running");
      mounted = false;
      abortController.abort();
      stopInterval();
    };
  }, [jobId]);

  return state;
}
