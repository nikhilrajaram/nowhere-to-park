import './polyfills';

import { computeCityData } from './osm';
import { getFromS3 } from './s3';
import { Env } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    const citySlug = url.searchParams.get('city');

    if (!citySlug || !/^[a-z0-9-]+$/.test(citySlug)) {
      return new Response('Invalid city parameter', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const cachedData = await getFromS3(env, `parking/${citySlug}.json`);
    if (cachedData) {
      return new Response(JSON.stringify(cachedData), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    try {
      const result = await computeCityData(citySlug, env);

      return new Response(JSON.stringify(result), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.error('Error computing city data:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      return new Response(`Error: ${message}`, {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};
