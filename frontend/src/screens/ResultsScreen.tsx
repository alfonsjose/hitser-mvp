import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGame } from '../api';
import type { GameSummary } from '../api';
import Timeline from '../components/Timeline';

export default function ResultsScreen() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameSummary | null>(null);

  useEffect(() => {
    if (!gameId) return;
    getGame(gameId).then(setGame).catch(() => navigate('/'));
  }, [gameId, navigate]);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading results...</div>
      </div>
    );
  }

  // Sort players by score (highest first)
  const ranked = [...game.players].sort((a, b) => b.score - a.score);
  const winner = ranked[0];

  if (!winner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">No players found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#a78bfa] to-[#67e8f9] bg-clip-text text-transparent mb-2">
            Game Over!
          </h1>
          <div className="mt-4">
            <p className="text-gray-400">Winner</p>
            <p className="text-3xl font-bold text-[#06b6d4]">{winner.name}</p>
            <p className="text-lg text-[#a78bfa]">{winner.score} correct placements</p>
          </div>
        </div>

        {/* Podium */}
        <div className="flex justify-center gap-4 mb-8">
          {ranked.slice(0, 3).map((player, i) => (
            <div
              key={i}
              className={`text-center ${i === 0 ? 'order-2' : i === 1 ? 'order-1' : 'order-3'}`}
            >
              <div
                className={`rounded-xl p-4 ${
                  i === 0
                    ? 'bg-gradient-to-b from-yellow-500/20 to-[#1e1b2e] border-2 border-yellow-500/50'
                    : i === 1
                    ? 'bg-gradient-to-b from-gray-400/20 to-[#1e1b2e] border-2 border-gray-400/50 mt-4'
                    : 'bg-gradient-to-b from-amber-700/20 to-[#1e1b2e] border-2 border-amber-700/50 mt-8'
                }`}
              >
                <div className="text-2xl mb-1">{i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'}</div>
                <p className="font-bold text-white">{player.name}</p>
                <p className="text-2xl font-bold text-[#06b6d4]">{player.score}</p>
                <p className="text-xs text-gray-400">
                  {player.timeline.length} card{player.timeline.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Full Scores */}
        {ranked.length > 3 && (
          <div className="bg-[#1e1b2e] rounded-xl p-4 mb-8">
            {ranked.slice(3).map((player, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#2a2540] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-mono w-6">{i + 4}.</span>
                  <span className="text-white">{player.name}</span>
                </div>
                <span className="text-[#06b6d4] font-bold">{player.score}</span>
              </div>
            ))}
          </div>
        )}

        {/* Each player's timeline */}
        <div className="space-y-6 mb-8">
          {ranked.map((player, i) => (
            <div key={i} className="bg-[#1e1b2e] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">{player.name}'s Timeline</h3>
                <span className="text-sm text-[#a78bfa]">{player.score} pts</span>
              </div>
              <Timeline timeline={player.timeline} />
            </div>
          ))}
        </div>

        {/* Play Again */}
        <div className="text-center pb-8">
          <button
            onClick={() => navigate('/')}
            className="px-12 py-3 bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] rounded-xl font-bold text-lg text-white shadow-lg shadow-[#7c3aed]/25 hover:shadow-[#7c3aed]/40 transition-all"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
