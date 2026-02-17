import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGame, playSong, placeSong, nextTurn } from '../api';
import type { GameSummary, Song, PlacementResult as PlacementResultType } from '../api';
import AudioPlayer from '../components/AudioPlayer';
import Timeline from '../components/Timeline';
import PlacementResultModal from '../components/PlacementResult';
import PassScreen from '../components/PassScreen';

type Phase = 'loading' | 'pass' | 'playing' | 'placing' | 'result' | 'auto-placed';

export default function GameScreen() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<GameSummary | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [result, setResult] = useState<PlacementResultType | null>(null);
  const [autoPlacedSong, setAutoPlacedSong] = useState<Song | null>(null);
  const [error, setError] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);

  // Load game state initially
  useEffect(() => {
    if (!gameId) return;
    getGame(gameId).then(g => {
      setGame(g);
      // Start with pass screen for first player
      setPhase('pass');
    }).catch(() => navigate('/'));
  }, [gameId, navigate]);

  const handleReady = useCallback(async () => {
    if (!gameId) return;
    setError('');
    try {
      const res = await playSong(gameId);
      setGame(res);
      if (res.auto_placed) {
        // First card was auto-placed
        setAutoPlacedSong(res.played_song);
        setCurrentSong(null);
        setPhase('auto-placed');
      } else {
        setCurrentSong(res.played_song);
        setPhase('placing');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, [gameId]);

  const handlePlace = useCallback(async (position: number) => {
    if (!gameId || !currentSong || isPlacing) return;
    setIsPlacing(true);
    try {
      const res = await placeSong(gameId, position);
      setGame(res.game);
      setResult(res.result);
      setPhase('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setIsPlacing(false);
    }
  }, [gameId, currentSong, isPlacing]);

  const handleContinueAfterResult = useCallback(async () => {
    if (!gameId) return;
    try {
      const updated = await nextTurn(gameId);
      setGame(updated);
      setResult(null);
      setCurrentSong(null);

      if (updated.phase === 'finished') {
        navigate(`/results/${gameId}`);
      } else {
        setPhase('pass');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, [gameId, navigate]);

  const handleContinueAfterAutoPlace = useCallback(async () => {
    if (!gameId) return;
    setAutoPlacedSong(null);
    try {
      // After auto-placing first card, play the next song for this player
      const res = await playSong(gameId);
      setGame(res);
      if (res.auto_placed) {
        // Shouldn't happen, but handle gracefully
        setAutoPlacedSong(res.played_song);
        setPhase('auto-placed');
      } else {
        setCurrentSong(res.played_song);
        setPhase('placing');
      }
    } catch (e) {
      // If no more songs, advance turn
      try {
        const updated = await nextTurn(gameId);
        setGame(updated);
        if (updated.phase === 'finished') {
          navigate(`/results/${gameId}`);
        } else {
          setPhase('pass');
        }
      } catch {
        setError('Game error');
      }
    }
  }, [gameId, navigate]);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading game...</div>
      </div>
    );
  }

  const currentPlayer = game.players[game.current_player_index];

  if (!currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Invalid game state</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Pass Screen */}
      {phase === 'pass' && (
        <PassScreen
          nextPlayerName={currentPlayer.name}
          onReady={handleReady}
        />
      )}

      {/* Result Modal */}
      {phase === 'result' && result && (
        <PlacementResultModal
          result={result}
          onContinue={handleContinueAfterResult}
        />
      )}

      {/* Auto-placed first card modal */}
      {phase === 'auto-placed' && autoPlacedSong && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1b2e] rounded-2xl p-8 max-w-sm w-full text-center border-2 border-[#06b6d4]">
            <div className="w-16 h-16 rounded-full bg-[#06b6d4]/20 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#67e8f9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#67e8f9] mb-2">First Card - Free!</h2>
            <p className="text-white font-semibold text-lg">{autoPlacedSong.title}</p>
            <p className="text-[#a78bfa]">{autoPlacedSong.artist}</p>
            <p className="text-3xl font-bold text-[#06b6d4] mt-2">{autoPlacedSong.year}</p>
            <p className="text-gray-400 text-sm mt-2">This is your starting card</p>
            <button
              onClick={handleContinueAfterAutoPlace}
              className="mt-6 w-full py-2.5 bg-[#7c3aed] rounded-xl font-semibold text-white hover:bg-[#5b21b6] transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-[#1e1b2e] border-b border-[#2a2540] px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <span className="text-gray-400 text-sm">Round </span>
            <span className="text-white font-bold">{game.current_round}</span>
            <span className="text-gray-400 text-sm"> / {game.rounds_per_player}</span>
          </div>
          <div className="text-right">
            <span className="text-[#a78bfa] font-semibold">{currentPlayer.name}</span>
            <span className="text-gray-400 text-sm ml-2">({currentPlayer.score} pts)</span>
          </div>
        </div>
      </div>

      {/* Player Scores Bar */}
      <div className="bg-[#1e1b2e]/50 px-4 py-2 border-b border-[#2a2540]">
        <div className="flex gap-3 justify-center max-w-4xl mx-auto overflow-x-auto">
          {game.players.map((p, i) => (
            <div
              key={i}
              className={`text-xs px-3 py-1 rounded-full flex-shrink-0 ${
                i === game.current_player_index
                  ? 'bg-[#7c3aed]/30 text-[#a78bfa] border border-[#7c3aed]'
                  : 'bg-[#2a2540] text-gray-400'
              }`}
            >
              {p.name}: {p.score}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 gap-4">
        {/* Audio Player */}
        {(phase === 'placing') && currentSong && (
          <AudioPlayer song={currentSong} hidden={true} />
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Timeline */}
        {(phase === 'placing' || phase === 'playing') && (
          <div className="flex-1 flex flex-col">
            <h3 className="text-sm text-gray-400 mb-2 px-4">
              {currentPlayer.name}'s Timeline - Tap a slot to place the song
            </h3>
            <div className="flex-1 flex items-center">
              <Timeline
                timeline={currentPlayer.timeline}
                onSelectSlot={handlePlace}
                interactive={phase === 'placing'}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
