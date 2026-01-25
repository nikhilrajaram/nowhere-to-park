import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';

export interface City {
  name: string;
  slug: string;
  state: string;
  population: number;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export interface ParkingFeatureProperties {
  osm_id: number;
  parking: string;
  type?: 'lot' | 'space' | 'street';
  lanes?: number;
}

export interface CityData {
  city: string;
  boundary: Feature<MultiPolygon | Polygon>;
  parking: FeatureCollection<Polygon, ParkingFeatureProperties>;
  computedAt: string;
}
