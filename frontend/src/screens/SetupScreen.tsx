import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame } from '../api';

export default function SetupScreen() {
  const navigate = useNavigate();
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [rounds, setRounds] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addPlayer = () => {
    if (playerNames.length < 8) {
      setPlayerNames([...playerNames, '']);
    }
  };

  const removePlayer = (index: number) => {
    if (playerNames.length > 2) {
      setPlayerNames(playerNames.filter((_, i) => i !== index));
    }
  };

  const updateName = (index: number, name: string) => {
    const updated = [...playerNames];
    updated[index] = name;
    setPlayerNames(updated);
  };

  const startGame = async () => {
    const names = playerNames.map(n => n.trim()).filter(n => n.length > 0);
    if (names.length < 2) {
      setError('Need at least 2 players');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const game = await createGame(names, rounds);
      navigate(`/game/${game.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[#a78bfa] to-[#67e8f9] bg-clip-text text-transparent">
            HITSER
          </h1>
          <p className="text-gray-400 mt-2">The Music Timeline Game</p>
        </div>

        {/* Player Names */}
        <div className="bg-[#1e1b2e] rounded-2xl p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">Players</h2>
          <div className="space-y-3">
            {playerNames.map((name, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[#a78bfa] font-mono text-sm w-6">{i + 1}.</span>
                <input
                  type="text"
                  placeholder={`Player ${i + 1}`}
                  value={name}
                  onChange={e => updateName(i, e.target.value)}
                  className="flex-1 bg-[#2a2540] border border-[#3a3455] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] transition-colors"
                  maxLength={20}
                />
                {playerNames.length > 2 && (
                  <button
                    onClick={() => removePlayer(i)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {playerNames.length < 8 && (
            <button
              onClick={addPlayer}
              className="mt-3 text-sm text-[#a78bfa] hover:text-[#7c3aed] transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Player
            </button>
          )}
        </div>

        {/* Rounds */}
        <div className="bg-[#1e1b2e] rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">Rounds per Player</h2>
          <div className="flex gap-3">
            {[10, 15, 20].map(r => (
              <button
                key={r}
                onClick={() => setRounds(r)}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  rounds === r
                    ? 'bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/25'
                    : 'bg-[#2a2540] text-gray-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        <button
          onClick={startGame}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] rounded-xl font-bold text-lg text-white shadow-lg shadow-[#7c3aed]/25 hover:shadow-[#7c3aed]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Game...' : 'Start Game'}
        </button>
      </div>
    </div>
  );
}
