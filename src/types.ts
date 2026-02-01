export interface City {
  name: string;
  slug: string;
  state: string;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}
