import Fuse from 'fuse.js';
import { useCallback, useMemo, useState } from 'react';
import cities from '../data/cities.json';
import type { City } from '../types';

interface CitySearchProps {
  onCitySelect: (city: City) => void;
}

const fuseOptions = {
  keys: ['name', 'state'],
  threshold: 0.3,
  includeScore: true,
  shouldSort: true,
};

export default function CitySearch({ onCitySelect }: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const fuse = useMemo(() => new Fuse(cities as City[], fuseOptions), []);

  const results = useMemo(() => {
    if (!query.trim()) {
      return (cities as City[]).sort((a, b) => b.population - a.population);
    }
    return fuse.search(query).map((result) => result.item);
  }, [fuse, query]);

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
    setTimeout(() => setIsOpen(false), 150);
  };

  const formatPopulation = (pop: number): string => {
    if (pop >= 1_000_000) {
      return `${(pop / 1_000_000).toFixed(1)}M`;
    }
    return `${(pop / 1_000).toFixed(0)}K`;
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white/95 shadow-lg backdrop-blur-sm">
      <input
        type="text"
        className="w-full bg-transparent px-3 py-2 text-base outline-none placeholder:text-gray-400"
        placeholder="Search city..."
        value={query}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
      />

      {isOpen && results.length > 0 && (
        <div className="max-h-48 overflow-y-auto border-t border-gray-100">
          {results.map((city) => (
            <div
              key={city.slug}
              className="cursor-pointer px-3 py-1.5 text-sm transition-colors hover:bg-gray-100"
              onClick={() => handleSelect(city)}
            >
              <span className="font-medium text-gray-800">{city.name}</span>
              <span className="ml-2 text-xs text-gray-400">
                {formatPopulation(city.population)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
