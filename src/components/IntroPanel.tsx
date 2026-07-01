import { X } from 'lucide-react';

interface IntroPanelProps {
  onDismiss: () => void;
}

export default function IntroPanel({ onDismiss }: IntroPanelProps) {
  return (
    <div className="absolute inset-0 z-[20] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-black/85 p-6 text-white backdrop-blur-md">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight">nowhere to park!</h1>
          <button
            onClick={onDismiss}
            className="shrink-0 rounded p-1 text-white/40 transition-colors hover:text-white/80"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mb-3 text-sm leading-relaxed text-white/80">
          Each highlighted polygon on this map is land wholly dedicated to storing cars — surface
          lots, garages, and parking structures across the United States.
        </p>

        <p className="mb-3 text-sm leading-relaxed text-white/80">
          Data is sourced from{' '}
          <a
            href="https://www.openstreetmap.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-white"
          >
            OpenStreetMap
          </a>
          , a community-edited map of the world.
        </p>
        <p className="mb-3 text-sm leading-relaxed text-white/80">
          This map is inspired by Henry Grabar's{' '}
          <a
            href="https://www.penguinrandomhouse.com/books/634461/paved-paradise-by-henry-grabar/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-white"
          >
            <em>Paved Paradise</em>
          </a>{' '}
          and the excellent work by the folks at the{' '}
          <a
            href="https://parkingreform.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-white"
          >
            Parking Reform Network
          </a>
          .
        </p>

        <p className="mb-5 text-sm leading-relaxed text-white/50">
          OSM coverage and accuracy vary — you may spot inaccuracies. If you do, consider{' '}
          <a
            href="https://www.openstreetmap.org/fixthemap"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-white/70"
          >
            fixing them in OSM
          </a>{' '}
          .
        </p>

        <button
          onClick={onDismiss}
          className="w-full rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-300 active:bg-amber-500"
        >
          Explore the map
        </button>
      </div>
    </div>
  );
}
