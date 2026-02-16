import type { TimelineCard } from '../api';

interface TimelineProps {
  timeline: TimelineCard[];
  onSelectSlot?: (position: number) => void;
  interactive?: boolean;
  highlightPosition?: number | null;
}

export default function Timeline({ timeline, onSelectSlot, interactive, highlightPosition }: TimelineProps) {
  const sorted = [...timeline].sort((a, b) => a.song.year - b.song.year);

  if (sorted.length === 0 && !interactive) {
    return (
      <div className="text-center text-gray-500 py-8">
        No songs yet
      </div>
    );
  }

  return (
    <div className="timeline-scroll overflow-x-auto pb-2">
      <div className="flex items-center gap-1 min-w-max px-4 py-2">
        {/* Drop zone at the beginning */}
        {interactive && (
          <DropSlot
            position={0}
            onSelect={() => onSelectSlot?.(0)}
            highlighted={highlightPosition === 0}
          />
        )}

        {sorted.map((card, index) => (
          <div key={card.song.id + index} className="flex items-center gap-1">
            <SongCard card={card} />
            {/* Drop zone after each card */}
            {interactive && (
              <DropSlot
                position={index + 1}
                onSelect={() => onSelectSlot?.(index + 1)}
                highlighted={highlightPosition === index + 1}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SongCard({ card }: { card: TimelineCard }) {
  return (
    <div className="flex-shrink-0 w-24 sm:w-28 bg-[#2a2540] rounded-xl p-2.5 border border-[#3a3455]">
      {/* Vinyl icon */}
      <div className="w-full aspect-square bg-[#1e1b2e] rounded-lg flex items-center justify-center mb-2">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-[#3a3455] flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#7c3aed]" />
        </div>
      </div>
      <p className="text-[10px] sm:text-xs font-semibold text-white truncate">{card.song.title}</p>
      <p className="text-[9px] sm:text-[10px] text-gray-400 truncate">{card.song.artist}</p>
      <p className="text-xs font-bold text-[#06b6d4] mt-1">{card.song.year}</p>
    </div>
  );
}

function DropSlot({ position, onSelect, highlighted }: { position: number; onSelect: () => void; highlighted?: boolean }) {
  return (
    <button
      onClick={onSelect}
      className={`flex-shrink-0 w-8 sm:w-10 h-28 sm:h-36 rounded-lg border-2 border-dashed transition-all flex items-center justify-center ${
        highlighted
          ? 'border-[#06b6d4] bg-[#06b6d4]/10 scale-110'
          : 'border-[#3a3455] hover:border-[#7c3aed] hover:bg-[#7c3aed]/10'
      }`}
      title={`Place here (position ${position})`}
    >
      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
}
