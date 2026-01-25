import type { CityData } from '../types';

const CDN_BASE_URL = import.meta.env.VITE_CDN_URL || '';
const WORKER_URL = import.meta.env.VITE_WORKER_URL || '';

export async function fetchCityData(slug: string, signal?: AbortSignal): Promise<CityData> {
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('Invalid city slug');
  }

  // try fetching from CDN first
  if (CDN_BASE_URL) {
    try {
      const cdnResponse = await fetch(`${CDN_BASE_URL}/parking/${slug}.json`, { signal });

      if (cdnResponse.ok) {
        return await cdnResponse.json();
      }

      if (cdnResponse.status !== 404) {
        console.warn(`CDN returned ${cdnResponse.status} for ${slug}`);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw err;
      }
      console.warn('CDN fetch failed, trying worker:', err);
    }
  }

  // fall back to worker if cache miss
  if (WORKER_URL) {
    const workerResponse = await fetch(`${WORKER_URL}?city=${slug}`, { signal });

    if (workerResponse.status === 202) {
      // computing in progress - poll until ready
      return pollCityData(slug, signal);
    }

    if (!workerResponse.ok) {
      const errorText = await workerResponse.text();
      throw new Error(errorText || `Worker error: ${workerResponse.status}`);
    }

    return await workerResponse.json();
  }

  throw new Error('No CDN or Worker URL configured');
}

async function pollCityData(
  slug: string,
  signal?: AbortSignal,
  maxAttempts = 30,
  intervalMs = 1000
): Promise<CityData> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    if (signal?.aborted) {
      throw new Error('Aborted');
    }

    try {
      const response = await fetch(`${CDN_BASE_URL}/parking/${slug}.json`, { signal });

      if (response.ok) {
        return await response.json();
      }

      if (response.status !== 404) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw err;
      }
      console.warn(`Poll attempt ${attempt + 1} failed:`, err);
    }
  }

  throw new Error('Timed out waiting for city data to be computed');
}
