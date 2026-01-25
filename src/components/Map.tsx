import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';
import type { City, CityData } from '../types';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface MapProps {
  cityData: CityData | null;
  selectedCity: City | null;
}

const PARKING_SOURCE_ID = 'parking-data';
const PARKING_LAYER_ID = 'parking-layer';
const BOUNDARY_SOURCE_ID = 'boundary-data';
const BOUNDARY_LAYER_ID = 'boundary-layer';

// TODO: add configurable layer type
// TODO: add legend
export default function Map({ cityData, selectedCity }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  // maintain internal mapLoaded state to avoid race conditions
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // base map load effect
  useEffect(() => {
    if (!mapContainer.current || map.current) {
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-98.5795, 39.8283],
      zoom: 3,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    map.current.on('load', () => {
      map
        .current!.addSource(PARKING_SOURCE_ID, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })
        .addSource(BOUNDARY_SOURCE_ID, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })
        .addLayer({
          id: BOUNDARY_LAYER_ID,
          type: 'line',
          source: BOUNDARY_SOURCE_ID,
          paint: {
            'line-color': '#c9c9c9',
            'line-width': 1,
            'line-opacity': 0.8,
            'line-dasharray': [2, 2],
          },
        })
        .addLayer({
          id: PARKING_LAYER_ID,
          type: 'fill',
          source: PARKING_SOURCE_ID,
          paint: {
            'fill-color': '#fbbf24',
            'fill-opacity': 0.7,
          },
        })
        .addLayer({
          id: `${PARKING_LAYER_ID}-outline`,
          type: 'line',
          source: PARKING_SOURCE_ID,
          paint: {
            'line-color': '#d97706',
            'line-width': 1,
          },
        });

      setIsMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // selected city change effect
  useEffect(() => {
    if (!map.current || !selectedCity) {
      return;
    }

    const [minLng, minLat, maxLng, maxLat] = selectedCity.bbox;
    map.current.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: 50,
        duration: 1000,
      }
    );
  }, [selectedCity]);

  // map data update effect
  useEffect(() => {
    if (!map.current || !isMapLoaded) {
      return;
    }

    const parkingSource = map.current.getSource<mapboxgl.GeoJSONSource>(PARKING_SOURCE_ID);
    const boundarySource = map.current.getSource<mapboxgl.GeoJSONSource>(BOUNDARY_SOURCE_ID);

    if (cityData) {
      parkingSource?.setData(cityData.parking);
      boundarySource?.setData({
        type: 'FeatureCollection',
        features: [cityData.boundary],
      });
    } else {
      parkingSource?.setData({ type: 'FeatureCollection', features: [] });
      boundarySource?.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [cityData, isMapLoaded]);

  return <div ref={mapContainer} className="h-full w-full" />;
}
