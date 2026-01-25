import { createContext } from 'react';

export const STYLE_DARK = 'mapbox://styles/mapbox/dark-v11';
export const STYLE_SATELLITE = 'mapbox://styles/mapbox/satellite-streets-v12';

interface MapContextType {
  mapStyle: string;
  isSatellite: boolean;
  toggleMapStyle: () => void;
}

export const MapContext = createContext<MapContextType | undefined>(undefined);
