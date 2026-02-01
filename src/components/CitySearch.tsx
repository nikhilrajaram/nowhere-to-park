import { useCallback, useEffect, useState } from 'react';
import type { City } from '../types';

interface CitySearchProps {
  onCitySelect: (city: City) => void;
}

interface PhotonFeature {
  properties: {
    name: string;
    state?: string;
    city?: string;
    extent?: [number, number, number, number];
    osm_id?: number;
    osm_type?: string;
  };
}

export default function CitySearch({ onCitySelect }: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // bias towards US: bbox=-161.7,18.9,-66.1,54.7 (roughly)
        // limit=8
        // osm_tag=place:city&osm_tag=place:town&osm_tag=place:village filters for populated places
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&bbox=-161.7,18.9,-66.1,54.7&lang=en&osm_tag=place:city&osm_tag=place:town&osm_tag=place:village`
        );
        const data = await response.json();

        const cities: City[] = (data.features as PhotonFeature[])
          .filter((f) => f.properties.extent) // only results with bounding boxes
          .map((f) => ({
            name: `${f.properties.name}${f.properties.state ? `, ${f.properties.state}` : ''}`,
            slug: `${f.properties.osm_type}-${f.properties.osm_id}`, // unique ID
            state: f.properties.state || '',
            bbox: f.properties.extent!,
          }));

        setResults(cities);
      } catch (err) {
        console.error('Geocoding failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback(
    (city: City) => {
      setQuery(city.name);
      setIsOpen(false);
      onCitySelect(city);
    },
    [onCitySelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // delay hiding so click event can register
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white/95 shadow-lg backdrop-blur-sm">
      <input
        type="text"
        className="w-full bg-transparent px-3 py-2 text-base outline-none placeholder:text-gray-400"
        placeholder="Search places..."
        value={query}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
      />

      {isOpen && (results.length > 0 || loading) && (
        <div className="max-h-64 overflow-y-auto border-t border-gray-100">
          {loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-400">Loading...</div>
          )}
          {results.map((city) => (
            <div
              key={city.slug}
              className="flex cursor-pointer flex-col px-3 py-2 text-sm transition-colors hover:bg-gray-100"
              onClick={() => handleSelect(city)}
            >
              <span className="font-medium text-gray-800">{city.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
