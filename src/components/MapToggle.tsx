import { useMap } from '@/hooks/useMap';

export default function MapToggle() {
  const { isSatellite, toggleMapStyle } = useMap();

  return (
    <button
      onClick={toggleMapStyle}
      className="absolute right-12 bottom-8 z-10 h-16 w-16 overflow-hidden rounded-lg border-2 border-white shadow-lg transition-transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:outline-none md:right-14 md:bottom-8"
      title={isSatellite ? 'Switch to Map view' : 'Switch to Satellite view'}
      aria-label={isSatellite ? 'Switch to Map view' : 'Switch to Satellite view'}
      style={{
        backgroundImage: `url(${isSatellite ? '/map-toggle/default.png' : '/map-toggle/satellite.png'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex h-full w-full items-center justify-center bg-black/20">
        <span className="text-xs font-bold text-white drop-shadow-md">
          {isSatellite ? 'Map' : 'Satellite'}
        </span>
      </div>
    </button>
  );
}
