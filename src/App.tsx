import { Info } from 'lucide-react';
import { useState } from 'react';

import CitySearch from '@/components/CitySearch';
import IntroPanel from '@/components/IntroPanel';
import Map from '@/components/Map';
import { useIsEmbed } from '@/hooks/useIsEmbed';
import type { City } from '@/types';

const INTRO_STORAGE_KEY = 'ntp-intro-seen';

function App() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem(INTRO_STORAGE_KEY));

  const isEmbed = useIsEmbed();

  const handleDismissIntro = () => {
    localStorage.setItem(INTRO_STORAGE_KEY, '1');
    setShowIntro(false);
  };

  return (
    <div className="relative h-full w-full">
      <Map selectedCity={selectedCity} />

      {!isEmbed && (
        <>
          <div className="absolute top-3 left-3 z-[1] w-64">
            <CitySearch onCitySelect={setSelectedCity} />
          </div>

          <button
            onClick={() => setShowIntro(true)}
            className="absolute top-3 right-3 z-[5] rounded-lg border border-white/10 bg-black/60 p-2 text-white/50 backdrop-blur-sm transition-colors hover:text-white"
            aria-label="About this map"
            title="About this map"
          >
            <Info size={16} />
          </button>

          {showIntro && <IntroPanel onDismiss={handleDismissIntro} />}
        </>
      )}

      {isEmbed && (
        <a
          href="https://nowhere-to-park.nikhilrajaram.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-s absolute top-2 left-2 z-10 rounded px-2 py-1 text-white/75 backdrop-blur-sm transition-colors hover:text-white/90"
        >
          nowhere to park ↗
        </a>
      )}
    </div>
  );
}

export default App;
