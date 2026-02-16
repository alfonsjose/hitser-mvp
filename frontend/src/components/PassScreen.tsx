interface PassScreenProps {
  nextPlayerName: string;
  onReady: () => void;
}

export default function PassScreen({ nextPlayerName, onReady }: PassScreenProps) {
  return (
    <div className="fixed inset-0 bg-[#0f0d1a] flex items-center justify-center z-50 p-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-[#7c3aed]/20 mx-auto mb-6 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#a78bfa]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <p className="text-gray-400 text-lg mb-2">Pass the device to</p>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-[#a78bfa] to-[#67e8f9] bg-clip-text text-transparent mb-8">
          {nextPlayerName}
        </h2>

        <button
          onClick={onReady}
          className="px-12 py-3 bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] rounded-xl font-bold text-lg text-white shadow-lg shadow-[#7c3aed]/25 hover:shadow-[#7c3aed]/40 transition-all"
        >
          I'm Ready!
        </button>
      </div>
    </div>
  );
}
