import { useState } from 'react';
import CitySearch from './components/CitySearch';
import Map from './components/Map';
import { useCityData } from './hooks/useCityData';
import type { City } from './types';

function App() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const { data, loading, error } = useCityData(selectedCity?.slug ?? null);

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
  };

  return (
    <div className="relative h-full w-full">
      <Map cityData={data} selectedCity={selectedCity} />

      <div className="absolute top-3 left-3 z-[1] w-64">
        <CitySearch onCitySelect={handleCitySelect} />
        {error && (
          <div className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-amber-400" />
        </div>
      )}
    </div>
  );
}

export default App;
