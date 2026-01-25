import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCityData } from '../lib/api';
import type { CityData } from '../types';

interface UseCityDataResult {
  data: CityData | null;
  loading: boolean;
  error: string | null;
}

const cache = new Map<string, CityData>();

export function useCityData(slug: string | null): UseCityDataResult {
  const [data, setData] = useState<CityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (slug: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchCityData(slug, abortControllerRef.current!.signal);
      cache.set(slug, result);
      setData(result);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load city data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!slug) {
      setData(null);
      setError(null);
      return;
    }

    const cached = cache.get(slug);
    if (cached) {
      setData(cached);
      setLoading(false);
      setError(null);
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    fetchData(slug);

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchData, slug]);

  return { data, loading, error };
}
