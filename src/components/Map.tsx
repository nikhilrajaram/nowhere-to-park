import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContext, STYLE_DARK, STYLE_SATELLITE } from '../context/MapContext';
import { useMap } from '../hooks/useMap';
import type { City } from '../types';
import MapToggle from './MapToggle';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface MapProps {
  selectedCity: City | null;
}

const PMTILES_SOURCE_ID = 'parking-pmtiles';
const PMTILES_LAYER_ID = 'parking-pmtiles-layer';

const WORKER_URL = import.meta.env.VITE_WORKER_URL.replace(/\/$/, '');
const MVT_TILES_URL = `${WORKER_URL}/tiles/{z}/{x}/{y}.mvt`;

function MapView({ selectedCity }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const { mapStyle } = useMap();

  /**
   * Ensure map layers
   */
  const onStyleLoad = useCallback(() => {
    if (!map.current) {
      console.warn('Map: onStyleLoad called but map.current is null');
      return;
    }
    console.log('Map: onStyleLoad firing. Is style loaded?', map.current.isStyleLoaded());

    if (!map.current.getSource(PMTILES_SOURCE_ID)) {
      console.log('Map: Adding PMTiles source...');
      try {
        map.current.addSource(PMTILES_SOURCE_ID, {
          type: 'vector',
          tiles: [MVT_TILES_URL],
          minzoom: 0,
          maxzoom: 13, // data limit (tippecanoe generated up to z13). Mapbox will overzoom beyond this.
        });
        console.log('Map: PMTiles source added.');
      } catch (err) {
        console.error('Map: Failed to add source:', err);
      }
    } else {
      console.log('Map: PMTiles source already exists.');
    }

    if (!map.current.getLayer(PMTILES_LAYER_ID)) {
      console.log('Map: Adding layers...');
      try {
        map.current.addLayer({
          id: PMTILES_LAYER_ID,
          source: PMTILES_SOURCE_ID,
          'source-layer': 'parking', // must match the layer name in tippecanoe (-l parking)
          type: 'fill',
          paint: {
            'fill-color': '#fbbf24',
            'fill-opacity': 0.5,
          },
        });

        map.current.addLayer({
          id: `${PMTILES_LAYER_ID}-outline`,
          source: PMTILES_SOURCE_ID,
          'source-layer': 'parking',
          type: 'line',
          paint: {
            'line-color': '#d97706',
            'line-width': 0.5,
            'line-opacity': 0.5,
          },
        });
        console.log('Map: Layers added.');
      } catch (err) {
        console.error('Map: Failed to add layers:', err);
      }
    }
  }, []);

  // base map load effect
  useEffect(() => {
    if (!mapContainer.current || map.current) {
      return;
    }

    console.log('Map: Initializing Mapbox GL...');
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle || STYLE_DARK,
      center: [-98.5795, 39.8283], // center of USA
      zoom: 3,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    map.current.on('load', () => {
      console.log('Map: load event fired.');
      onStyleLoad();
    });

    return () => {
      console.log('Map: Removing map instance.');
      map.current?.remove();
      map.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // selected city change effect (fly to city)
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
        duration: 2000,
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
