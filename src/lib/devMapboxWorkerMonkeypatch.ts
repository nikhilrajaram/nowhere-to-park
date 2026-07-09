import mapboxgl from 'mapbox-gl';

/**
 * Dev-only workaround for a Vite dep-optimizer bug that breaks PMTiles sources.
 *
 * mapbox-gl builds its Web Worker by stringifying its own chunk functions into a
 * Blob. Vite's import analysis wraps mapbox's dynamic `import()` of the on-demand
 * PMTiles provider plugin in a `__vite__injectQuery(...)` helper call (despite
 * mapbox's own `@vite-ignore` annotation). The helper is bound via a module import
 * at the top of the chunk, which does not survive the stringify-into-Blob trip, so
 * any PMTiles source throws `__vite__injectQuery is not defined` inside the worker
 * and no tiles are ever requested. Prepending a global identity shim to the worker
 * source restores the plugin load. Production builds are untransformed by Vite's
 * dev pipeline and are unaffected.
 *
 * Must run before the first `new mapboxgl.Map(...)` (the worker pool is created
 * lazily on first map construction).
 */
export function devMapboxWorkerMonkeypatch() {
  if (!import.meta.env.DEV) {
    return;
  }

  const originalWorkerUrl = mapboxgl.workerUrl;
  if (!originalWorkerUrl) {
    return;
  }

  const shimmedSource = `globalThis.__vite__injectQuery = (url) => url;\nimportScripts(${JSON.stringify(originalWorkerUrl)});`;
  mapboxgl.workerUrl = URL.createObjectURL(new Blob([shimmedSource], { type: 'text/javascript' }));
}
