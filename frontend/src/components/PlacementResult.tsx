import type { PlacementResult as PlacementResultType } from '../api';

interface Props {
  result: PlacementResultType;
  onContinue: () => void;
}

export default function PlacementResult({ result, onContinue }: Props) {
  const { correct, song } = result;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-[#1e1b2e] rounded-2xl p-8 max-w-sm w-full text-center border-2 ${
          correct ? 'border-green-500' : 'border-red-500'
        } animate-[fadeIn_0.3s_ease-out]`}
      >
        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            correct ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}
        >
          {correct ? (
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        {/* Result text */}
        <h2 className={`text-2xl font-bold mb-2 ${correct ? 'text-green-400' : 'text-red-400'}`}>
          {correct ? 'Correct!' : 'Wrong!'}
        </h2>

        {/* Song info */}
        <p className="text-white font-semibold text-lg">{song.title}</p>
        <p className="text-[#a78bfa]">{song.artist}</p>
        <p className="text-3xl font-bold text-[#06b6d4] mt-2">{song.year}</p>

        {!correct && (
          <p className="text-gray-400 text-sm mt-2">This song won't be added to your timeline</p>
        )}

        {/* Continue button */}
        <button
          onClick={onContinue}
          className="mt-6 w-full py-2.5 bg-[#7c3aed] rounded-xl font-semibold text-white hover:bg-[#5b21b6] transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
