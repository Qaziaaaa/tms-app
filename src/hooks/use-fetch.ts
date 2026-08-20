"use client";

import { useState, useEffect, useCallback } from "react";

interface UseFetchOptions {
  immediate?: boolean;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFetch<T>(url: string, options?: UseFetchOptions): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(options?.immediate !== false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || "Failed to fetch data");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (options?.immediate !== false) {
      fetchData();
    }
  }, [fetchData, options?.immediate]);

  return { data, loading, error, refetch: fetchData };
}

export function useMutation<TBody, TResult = unknown>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (url: string, method: string, body?: TBody): Promise<TResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, {
          method,
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });
        const json = await res.json();
        if (json.success) {
          return json.data;
        }
        setError(json.message || "Operation failed");
        return null;
      } catch {
        setError("Network error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { mutate, loading, error };
}
