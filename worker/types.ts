import { Feature, FeatureCollection, Geometry } from 'geojson';

export type Env = {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  S3_BUCKET_NAME: string;
  S3_REGION: string;
  ALLOWED_ORIGIN: string;
  PMTILE_FILENAME: string;
  /**
   * Used in local dev to point the S3 client to the MinIO container (see `compose.yaml`)
   * that points to data on the local filesystem
   * Provided by `dev.sh` for local dev
   */
  AWS_ENDPOINT_URL_S3?: string;
};

export type CityData = {
  city: string;
  boundary: Feature<Geometry>;
  parking: FeatureCollection<Geometry>;
  computedAt: string;
};

export type NominatimResult = {
  place_id: number;
  osm_type: string;
  osm_id: number;
  display_name: string;
  class: string;
  type: string;
  importance: number;
};

export type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
  bounds?: { minlat: number; minlon: number; maxlat: number; maxlon: number };
  members?: Array<{
    type: string;
    role: string;
    geometry?: Array<{ lat: number; lon: number }>;
  }>;
};

export type OverpassResponse = {
  elements: OverpassElement[];
};
