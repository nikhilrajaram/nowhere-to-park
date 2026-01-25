import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import osmtogeojson from 'osmtogeojson';
import { uploadToS3 } from './s3';
import { CityData, Env, NominatimResult, OverpassResponse } from './types';

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

/**
 * Get OSM relation ID for a city using Nominatim
 */
async function resolveCity(cityName: string, state: string): Promise<number | null> {
  const query = `${cityName}, ${state}, USA`;
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    featuretype: 'city',
  });
  const headers = {
    'User-Agent': 'ParkingMap/1.0',
  };

  const response = await fetch(`${NOMINATIM_ENDPOINT}?${params}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.status}`);
  }

  const results: NominatimResult[] = await response.json();

  // prefer relations (boundaries) over nodes
  for (const result of results) {
    if (result.osm_type === 'relation') {
      return result.osm_id;
    }
  }

  // fallback to 'settlement' featuretype
  const fallbackParams = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    featuretype: 'settlement',
  });

  const fallbackResponse = await fetch(`${NOMINATIM_ENDPOINT}?${fallbackParams}`, {
    headers,
  });

  if (fallbackResponse.ok) {
    const fallbackResults: NominatimResult[] = await fallbackResponse.json();
    for (const result of fallbackResults) {
      if (result.osm_type === 'relation') {
        return result.osm_id;
      }
    }
  }

  return null;
}

export async function computeCityData(citySlug: string, env: Env): Promise<CityData> {
  // slug => city name (ex. "new-york-ny" -> "New York" + "NY")
  const parts = citySlug.split('-');
  const state = parts.pop()?.toUpperCase() || '';
  const cityName = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

  // get OSM relation ID via Nominatim
  const osmId = await resolveCity(cityName, state);
  if (!osmId) {
    throw new Error(`Could not resolve ${cityName}, ${state} to an OSM relation`);
  }

  console.log(`Resolved ${cityName}, ${state} to OSM relation ${osmId}`);

  // query Overpass for parking data and city boundary
  // exempt underground/rooftop parking
  const overpassQuery = `
    [out:json][timeout:180];
    relation(${osmId});
    out geom;
    map_to_area ->.searchArea;
    (
      way["amenity"="parking"]["parking"!~"underground|rooftop"](area.searchArea);
      relation["amenity"="parking"]["parking"!~"underground|rooftop"](area.searchArea);
    );
    out geom;
  `.trim();
  const osmData = await queryOverpass(overpassQuery);
  const { boundary, parking } = parseOverpassResponse(osmData);

  if (!boundary) {
    throw new Error(`Could not find boundary for relation ${osmId}`);
  }

  const result: CityData = {
    city: citySlug,
    boundary,
    parking,
    computedAt: new Date().toISOString(),
  };

  await uploadToS3(env, `parking/${citySlug}.json`, result);

  return result;
}

async function queryOverpass(query: string): Promise<OverpassResponse> {
  let lastError: Error | null = null;
  const maxAttempts = 8;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length];

    try {
      console.log(
        `Querying Overpass (attempt ${attempt + 1}/${maxAttempts}) using endpoint ${endpoint}...`
      );
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (response.status === 429 || response.status === 504) {
        throw new Error(`Rate limited or timeout: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.warn(`Attempt ${attempt + 1} failed on ${endpoint}:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));

      if (
        attempt % OVERPASS_ENDPOINTS.length === OVERPASS_ENDPOINTS.length - 1 &&
        attempt < maxAttempts - 1
      ) {
        const backoffMs = Math.pow(2, Math.floor(attempt / OVERPASS_ENDPOINTS.length) + 1) * 1000;
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }

  throw lastError || new Error('All Overpass endpoints failed');
}

function parseOverpassResponse(data: OverpassResponse): {
  boundary: Feature<Geometry, GeoJsonProperties> | null;
  parking: FeatureCollection<Geometry>;
} {
  const osmtogeojsonData = osmtogeojson(data);

  let boundary: Feature<Geometry, GeoJsonProperties> | null = null;
  const parkingFeatures: Feature<Geometry, GeoJsonProperties>[] = [];

  for (const feature of osmtogeojsonData.features) {
    if (feature.properties?.boundary === 'administrative') {
      boundary = feature;
    } else if (
      ['Polygon', 'MultiPolygon', 'LineString'].includes(feature.geometry.type) &&
      feature.properties &&
      feature.properties.amenity === 'parking'
    ) {
      parkingFeatures.push(feature);
    } else {
      console.warn('Ignoring unsupported feature:', feature);
    }
  }

  return {
    boundary,
    parking: {
      type: 'FeatureCollection',
      features: parkingFeatures,
    },
  };
}
