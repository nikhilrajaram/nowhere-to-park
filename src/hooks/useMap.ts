import { useContext } from 'react';

import { MapContext } from '@/context/MapContext';

export function useMap() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}
