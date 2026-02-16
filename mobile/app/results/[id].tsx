import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { getGame } from '../../api/client';
import type { GameSummary } from '../../api/client';
import Timeline from '../../components/Timeline';

const PODIUM_COLORS = [
  { from: 'rgba(234,179,8,0.2)', border: 'rgba(234,179,8,0.5)' },  // gold
  { from: 'rgba(156,163,175,0.2)', border: 'rgba(156,163,175,0.5)' }, // silver
  { from: 'rgba(180,83,9,0.2)', border: 'rgba(180,83,9,0.5)' },  // bronze
];

export default function ResultsScreen() {
  const { id: gameId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<GameSummary | null>(null);

  useEffect(() => {
    if (!gameId) return;
    getGame(gameId)
      .then(setGame)
      .catch(() => router.replace('/'));
  }, [gameId, router]);

  if (!game) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={Colors.primaryLight} size="large" />
        <Text style={s.loadingText}>Loading results...</Text>
      </View>
    );
  }

  const ranked = [...game.players].sort((a, b) => b.score - a.score);
  const winner = ranked[0];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.gameOver}>Game Over!</Text>
          <Text style={s.winnerLabel}>Winner</Text>
          <Text style={s.winnerName}>{winner.name}</Text>
          <Text style={s.winnerScore}>{winner.score} correct placements</Text>
        </View>

        {/* Podium — displayed as 2nd, 1st, 3rd */}
        <View style={s.podiumRow}>
          {[1, 0, 2].map((rank) => {
            const player = ranked[rank];
            if (!player) return null;
            return (
              <View
                key={rank}
                style={[
                  s.podiumItem,
                  rank === 1 && { marginTop: 16 },
                  rank === 2 && { marginTop: 32 },
                ]}
              >
                <View
                  style={[
                    s.podiumCard,
                    {
                      backgroundColor: PODIUM_COLORS[rank].from,
                      borderColor: PODIUM_COLORS[rank].border,
                    },
                  ]}
                >
                  <Text style={s.podiumPlace}>
                    {rank === 0 ? '1st' : rank === 1 ? '2nd' : '3rd'}
                  </Text>
                  <Text style={s.podiumName}>{player.name}</Text>
                  <Text style={s.podiumScore}>{player.score}</Text>
                  <Text style={s.podiumCards}>
                    {player.timeline.length} card{player.timeline.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Full scores (4th+) */}
        {ranked.length > 3 && (
          <View style={s.extraScores}>
            {ranked.slice(3).map((player, i) => (
              <View key={i} style={s.extraRow}>
                <View style={s.extraLeft}>
                  <Text style={s.extraRank}>{i + 4}.</Text>
                  <Text style={s.extraName}>{player.name}</Text>
                </View>
                <Text style={s.extraScore}>{player.score}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Player timelines */}
        {ranked.map((player, i) => (
          <View key={i} style={s.timelineCard}>
            <View style={s.timelineHeader}>
              <Text style={s.timelineName}>{player.name}'s Timeline</Text>
              <Text style={s.timelinePts}>{player.score} pts</Text>
            </View>
            <Timeline timeline={player.timeline} />
          </View>
        ))}

        {/* Play Again */}
        <View style={s.playAgainWrap}>
          <Pressable onPress={() => router.replace('/')}>
            <LinearGradient
              colors={[Colors.primary, Colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.playAgainBtn}
            >
              <Text style={s.playAgainText}>Play Again</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { color: Colors.textMuted, marginTop: 12 },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24, marginTop: 16 },
  gameOver: { fontSize: 36, fontWeight: '800', color: Colors.accentLight, marginBottom: 8 },
  winnerLabel: { color: Colors.textMuted, fontSize: 14, marginTop: 8 },
  winnerName: { fontSize: 28, fontWeight: '700', color: Colors.accent },
  winnerScore: { fontSize: 16, color: Colors.primaryLight, marginTop: 4 },
  podiumRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 },
  podiumItem: { flex: 1, maxWidth: 120 },
  podiumCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  podiumPlace: { fontSize: 20, color: Colors.text, marginBottom: 4 },
  podiumName: { fontWeight: '700', color: Colors.text, fontSize: 14 },
  podiumScore: { fontSize: 24, fontWeight: '700', color: Colors.accent, marginTop: 4 },
  podiumCards: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  extraScores: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 24 },
  extraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLight,
  },
  extraLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  extraRank: { color: Colors.textDim, fontFamily: 'monospace', width: 24 },
  extraName: { color: Colors.text },
  extraScore: { color: Colors.accent, fontWeight: '700' },
  timelineCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  timelineName: { fontWeight: '600', color: Colors.text },
  timelinePts: { fontSize: 13, color: Colors.primaryLight },
  playAgainWrap: { alignItems: 'center', paddingVertical: 16 },
  playAgainBtn: { borderRadius: 14, paddingVertical: 16, paddingHorizontal: 48 },
  playAgainText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
