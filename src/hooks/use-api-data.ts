"use client";

import { useEffect, useRef, useState } from "react";

interface UseApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

interface AsyncResult<T> {
  tick: number;
  data: T | null;
  error: string | null;
}

export function useApiData<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown> = []
): UseApiDataResult<T> {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState<AsyncResult<T> | null>(null);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let active = true;
    fetcherRef.current()
      .then((data) => {
        if (active) setResult({ tick, data, error: null });
      })
      .catch((err: unknown) => {
        if (active) {
          setResult({ tick, data: null, error: err instanceof Error ? err.message : "Something went wrong" });
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return {
    data: result?.error === null && result.tick === tick ? result.data : null,
    loading: !result || result.tick !== tick,
    error: result && result.tick === tick ? result.error : null,
    reload: () => setTick((t) => t + 1),
  };
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
