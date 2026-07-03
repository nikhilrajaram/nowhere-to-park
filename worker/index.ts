import { PMTiles } from 'pmtiles';
import { S3Source } from './pmtiles-source';
import './polyfills';
import { Env } from './types';

/**
 * PMTiles client singleton for reuse across warm invocations
 */
let pmTilesClient: PMTiles | null = null;

function getPMTilesInstance(env: Env): PMTiles {
  if (pmTilesClient) {
    return pmTilesClient;
  }

  const source = new S3Source(env, env.PMTILE_FILENAME || 'parking.pmtiles');
  pmTilesClient = new PMTiles(source);
  return pmTilesClient;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigins = env.ALLOWED_ORIGIN.split(',').map((o) => o.trim());
    const requestOrigin = request.headers.get('Origin') ?? '';
    // also allow any Cloudflare Pages preview deployment (*.pages.dev subdomains)
    const isPagesPreview = /^https:\/\/[^.]+\.nowhere-to-park\.pages\.dev$/.test(requestOrigin);
    const origin =
      allowedOrigins.includes(requestOrigin) || isPagesPreview ? requestOrigin : allowedOrigins[0];
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, If-None-Match',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, ETag',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);

    // server-side PMTiles decoding: /tiles/{z}/{x}/{y}.mvt
    // e.g. /tiles/parking/{z}/{x}/{y}.mvt
    const tileMatch = url.pathname.match(/^\/tiles\/(\d+)\/(\d+)\/(\d+)\.mvt$/);

    if (tileMatch) {
      const z = parseInt(tileMatch[1], 10);
      const x = parseInt(tileMatch[2], 10);
      const y = parseInt(tileMatch[3], 10);

      const fetchTile = async (retry = false): Promise<Response> => {
        try {
          const pmtiles = getPMTilesInstance(env);
          const tileResult = await pmtiles.getZxy(z, x, y);

          if (!tileResult) {
            return new Response(null, { status: 404, headers: corsHeaders });
          }

          const headers = new Headers(corsHeaders);
          headers.set('Content-Type', 'application/x-protobuf');
          headers.set('Content-Length', tileResult.data.byteLength.toString());
          if (tileResult.etag) {
            headers.set('ETag', tileResult.etag);
          }
          headers.set('Cache-Control', 'public, max-age=2592000, immutable'); // Cache tiles for 30 days

          return new Response(tileResult.data, {
            status: 200,
            headers,
          });
        } catch (err: any) {
          // handle 412 Precondition Failed (ETag mismatch) - File changed on S3
          if (
            !retry &&
            (err.name === 'PreconditionFailed' || err['$metadata']?.httpStatusCode === 412)
          ) {
            console.warn('PMTiles ETag mismatch, invalidating cache and retrying...');
            pmTilesClient = null;
            return fetchTile(true);
          }
          console.error('Tile Error:', err);
          return new Response('Internal Error', { status: 500, headers: corsHeaders });
        }
      };

      return fetchTile();
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};
