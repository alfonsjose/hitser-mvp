import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getGame, playSong, placeSong, nextTurn } from '../../api/client';
import type { GameSummary, Song, PlacementResult as PlacementResultType } from '../../api/client';
import AudioPlayer from '../../components/AudioPlayer';
import Timeline from '../../components/Timeline';
import PlacementResultModal from '../../components/PlacementResult';
import PassScreen from '../../components/PassScreen';

type Phase = 'loading' | 'pass' | 'placing' | 'result' | 'auto-placed';

export default function GameScreen() {
  const { id: gameId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [game, setGame] = useState<GameSummary | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [result, setResult] = useState<PlacementResultType | null>(null);
  const [autoPlacedSong, setAutoPlacedSong] = useState<Song | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!gameId) return;
    getGame(gameId)
      .then((g) => {
        setGame(g);
        setPhase('pass');
      })
      .catch(() => router.replace('/'));
  }, [gameId, router]);

  const handleReady = useCallback(async () => {
    if (!gameId) return;
    setError('');
    try {
      const res = await playSong(gameId);
      setGame(res);
      if (res.auto_placed) {
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

  const handlePlace = useCallback(
    async (position: number) => {
      if (!gameId || !currentSong) return;
      try {
        const res = await placeSong(gameId, position);
        setGame(res.game);
        setResult(res.result);
        setPhase('result');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error');
      }
    },
    [gameId, currentSong],
  );

  const handleContinueAfterResult = useCallback(async () => {
    if (!gameId) return;
    try {
      const updated = await nextTurn(gameId);
      setGame(updated);
      setResult(null);
      setCurrentSong(null);
      if (updated.phase === 'finished') {
        router.replace(`/results/${gameId}`);
      } else {
        setPhase('pass');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, [gameId, router]);

  const handleContinueAfterAutoPlace = useCallback(async () => {
    if (!gameId) return;
    setAutoPlacedSong(null);
    try {
      const res = await playSong(gameId);
      setGame(res);
      if (res.auto_placed) {
        setAutoPlacedSong(res.played_song);
        setPhase('auto-placed');
      } else {
        setCurrentSong(res.played_song);
        setPhase('placing');
      }
    } catch {
      try {
        const updated = await nextTurn(gameId);
        setGame(updated);
        if (updated.phase === 'finished') {
          router.replace(`/results/${gameId}`);
        } else {
          setPhase('pass');
        }
      } catch {
        setError('Game error');
      }
    }
  }, [gameId, router]);

  if (!game) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={Colors.primaryLight} size="large" />
        <Text style={s.loadingText}>Loading game...</Text>
      </View>
    );
  }

  const currentPlayer = game.players[game.current_player_index];

  return (
    <View style={s.container}>
      {/* Pass Screen */}
      {phase === 'pass' && <PassScreen nextPlayerName={currentPlayer.name} onReady={handleReady} />}

      {/* Result Modal */}
      {phase === 'result' && result && (
        <PlacementResultModal result={result} onContinue={handleContinueAfterResult} />
      )}

      {/* Auto-placed first card modal */}
      {phase === 'auto-placed' && autoPlacedSong && (
        <Modal transparent animationType="fade">
          <View style={s.modalOverlay}>
            <View style={s.autoCard}>
              <View style={s.autoIconCircle}>
                <Ionicons name="musical-notes" size={32} color={Colors.accentLight} />
              </View>
              <Text style={s.autoHeading}>First Card - Free!</Text>
              <Text style={s.autoTitle}>{autoPlacedSong.title}</Text>
              <Text style={s.autoArtist}>{autoPlacedSong.artist}</Text>
              <Text style={s.autoYear}>{autoPlacedSong.year}</Text>
              <Text style={s.autoHint}>This is your starting card</Text>
              <Pressable onPress={handleContinueAfterAutoPlace} style={s.autoBtn}>
                <Text style={s.autoBtnText}>Continue</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Top Bar */}
      <View style={s.topBar}>
        <View>
          <Text>
            <Text style={s.dimText}>Round </Text>
            <Text style={s.boldText}>{game.current_round}</Text>
            <Text style={s.dimText}> / {game.rounds_per_player}</Text>
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text>
            <Text style={s.playerName}>{currentPlayer.name}</Text>
            <Text style={s.dimText}> ({currentPlayer.score} pts)</Text>
          </Text>
        </View>
      </View>

      {/* Player Scores Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scoreBar}>
        {game.players.map((p, i) => (
          <View
            key={i}
            style={[
              s.scorePill,
              i === game.current_player_index && s.scorePillActive,
            ]}
          >
            <Text
              style={[
                s.scorePillText,
                i === game.current_player_index && s.scorePillTextActive,
              ]}
            >
              {p.name}: {p.score}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Main Content */}
      <View style={s.main}>
        {phase === 'placing' && currentSong && <AudioPlayer song={currentSong} hidden />}

        {error !== '' && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {phase === 'placing' && (
          <View style={s.timelineSection}>
            <Text style={s.timelineLabel}>
              {currentPlayer.name}'s Timeline - Tap a slot to place the song
            </Text>
            <Timeline timeline={currentPlayer.timeline} onSelectSlot={handlePlace} interactive />
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { color: Colors.textMuted, marginTop: 12 },
  topBar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dimText: { color: Colors.textMuted, fontSize: 13 },
  boldText: { color: Colors.text, fontWeight: '700', fontSize: 13 },
  playerName: { color: Colors.primaryLight, fontWeight: '600', fontSize: 13 },
  scoreBar: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  scorePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.surfaceLight,
  },
  scorePillActive: {
    backgroundColor: 'rgba(124,58,237,0.3)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  scorePillText: { fontSize: 11, color: Colors.textMuted },
  scorePillTextActive: { color: Colors.primaryLight },
  main: { flex: 1, padding: 16, gap: 16 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 10,
    padding: 12,
  },
  errorText: { color: Colors.wrong, fontSize: 13, textAlign: 'center' },
  timelineSection: { flex: 1 },
  timelineLabel: { color: Colors.textMuted, fontSize: 13, marginBottom: 8, paddingHorizontal: 4 },
  // Auto-placed modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  autoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  autoIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(6,182,212,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  autoHeading: { fontSize: 20, fontWeight: '700', color: Colors.accentLight, marginBottom: 8 },
  autoTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  autoArtist: { fontSize: 14, color: Colors.primaryLight, marginTop: 2 },
  autoYear: { fontSize: 32, fontWeight: '700', color: Colors.accent, marginTop: 8 },
  autoHint: { color: Colors.textMuted, fontSize: 13, marginTop: 8 },
  autoBtn: {
    marginTop: 24,
    width: '100%',
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  autoBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
