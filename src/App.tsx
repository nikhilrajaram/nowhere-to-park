import { useState } from 'react';
import CitySearch from './components/CitySearch';
import Map from './components/Map';
import type { City } from './types';

function App() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
  };

  return (
    <div className="relative h-full w-full">
      <Map selectedCity={selectedCity} />

      <div className="absolute top-3 left-3 z-[1] w-64">
        <CitySearch onCitySelect={handleCitySelect} />
      </div>
    </div>
  );
}

export default App;
