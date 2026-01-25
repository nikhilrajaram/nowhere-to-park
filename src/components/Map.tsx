import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContext, STYLE_DARK, STYLE_SATELLITE } from '../context/MapContext';
import { useMap } from '../hooks/useMap';
import type { City, CityData } from '../types';
import MapToggle from './MapToggle';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface MapProps {
  cityData: CityData | null;
  selectedCity: City | null;
}

const PARKING_SOURCE_ID = 'parking-data';
const PARKING_LAYER_ID = 'parking-layer';
const BOUNDARY_SOURCE_ID = 'boundary-data';
const BOUNDARY_LAYER_ID = 'boundary-layer';

// TODO: add legend
function MapView({ cityData, selectedCity }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  // maintain internal mapLoaded state to avoid race conditions

  const { mapStyle } = useMap();

  /**
   * Set parking and city boundary sources data
   */
  const updateSources = useCallback((data: CityData | null) => {
    if (!map.current) {
      return;
    }

    const parkingSource = map.current.getSource<mapboxgl.GeoJSONSource>(PARKING_SOURCE_ID);
    const boundarySource = map.current.getSource<mapboxgl.GeoJSONSource>(BOUNDARY_SOURCE_ID);

    if (parkingSource && boundarySource) {
      if (data) {
        parkingSource.setData(data.parking);
        boundarySource.setData({
          type: 'FeatureCollection',
          features: [data.boundary],
        });
      } else {
        parkingSource.setData({ type: 'FeatureCollection', features: [] });
        boundarySource.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  }, []);

  /**
   * Ensure map layers and reset data
   */
  const onStyleLoad = useCallback(() => {
    if (!map.current) {
      return;
    }

    if (!map.current.getSource(PARKING_SOURCE_ID)) {
      map.current.addSource(PARKING_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }
    if (!map.current.getSource(BOUNDARY_SOURCE_ID)) {
      map.current.addSource(BOUNDARY_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (!map.current.getLayer(BOUNDARY_LAYER_ID)) {
      map.current.addLayer({
        id: BOUNDARY_LAYER_ID,
        type: 'line',
        source: BOUNDARY_SOURCE_ID,
        paint: {
          'line-color': '#c9c9c9',
          'line-width': 1,
          'line-opacity': 0.8,
          'line-dasharray': [2, 2],
        },
      });
    }

    if (!map.current.getLayer(PARKING_LAYER_ID)) {
      map.current.addLayer({
        id: PARKING_LAYER_ID,
        type: 'fill',
        source: PARKING_SOURCE_ID,
        paint: {
          'fill-color': '#fbbf24',
          'fill-opacity': 0.7,
        },
      });
    }

    if (!map.current.getLayer(`${PARKING_LAYER_ID}-outline`)) {
      map.current.addLayer({
        id: `${PARKING_LAYER_ID}-outline`,
        type: 'line',
        source: PARKING_SOURCE_ID,
        paint: {
          'line-color': '#d97706',
          'line-width': 1,
        },
      });
    }

    updateSources(cityData);
  }, [cityData, updateSources]);

  // base map load effect
  useEffect(() => {
    if (!mapContainer.current || map.current) {
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle || STYLE_DARK,
      center: [-98.5795, 39.8283],
      zoom: 3,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
    // intentionally excluding `mapStyle` to avoid re-initialization and drive
    // style changes via separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // attach style load handler
  useEffect(() => {
    if (!map.current) {
      return;
    }

    map.current.on('style.load', onStyleLoad);

    // handle race condition if style already loaded before handler was attached
    if (map.current.isStyleLoaded()) {
      onStyleLoad();
    }

    return () => {
      map.current?.off('style.load', onStyleLoad);
    };
  }, [onStyleLoad]);

  // map style change effect
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(mapStyle);
    }
  }, [mapStyle]);

  useEffect(() => {
    if (!map.current) {
      return;
    }
    updateSources(cityData);
  }, [cityData, updateSources, map]);

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

  return <div ref={mapContainer} className="h-full w-full" />;
}

export default function Map(props: MapProps) {
  const [mapStyle, setMapStyle] = useState(STYLE_DARK);

  const toggleMapStyle = () => {
    setMapStyle((prev) => (prev === STYLE_DARK ? STYLE_SATELLITE : STYLE_DARK));
  };

  const isSatellite = mapStyle === STYLE_SATELLITE;

  return (
    <MapContext.Provider value={{ mapStyle, isSatellite, toggleMapStyle }}>
      <div className="relative h-full w-full">
        <MapView {...props} />
        <MapToggle />
      </div>
    </MapContext.Provider>
  );
}
