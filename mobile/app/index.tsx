import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { createGame, getGenres } from '../api/client';

const GENRE_LABELS: Record<string, string> = {
  pop: 'Pop',
  rock: 'Rock',
  'hip-hop': 'Hip-Hop',
  'r&b': 'R&B',
  electronic: 'Electronic',
  soul: 'Soul',
  disco: 'Disco',
  funk: 'Funk',
  jazz: 'Jazz',
  folk: 'Folk',
  country: 'Country',
  latin: 'Latin',
  'k-pop': 'K-Pop',
  afrobeats: 'Afrobeats',
};

function genreLabel(g: string) {
  return GENRE_LABELS[g] || g.charAt(0).toUpperCase() + g.slice(1);
}

export default function SetupScreen() {
  const router = useRouter();
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [rounds, setRounds] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [useAllGenres, setUseAllGenres] = useState(true);

  useEffect(() => {
    getGenres()
      .then((res) => setAvailableGenres(res.genres))
      .catch(() => {});
  }, []);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  const addPlayer = () => {
    if (playerNames.length < 8) setPlayerNames([...playerNames, '']);
  };

  const removePlayer = (index: number) => {
    if (playerNames.length > 2) setPlayerNames(playerNames.filter((_, i) => i !== index));
  };

  const updateName = (index: number, name: string) => {
    const updated = [...playerNames];
    updated[index] = name;
    setPlayerNames(updated);
  };

  const startGame = async () => {
    const names = playerNames.map((n) => n.trim()).filter((n) => n.length > 0);
    if (names.length < 2) {
      setError('Need at least 2 players');
      return;
    }
    if (!useAllGenres && selectedGenres.length === 0) {
      setError('Select at least one genre');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const game = await createGame(names, rounds, useAllGenres ? [] : selectedGenres);
      router.push(`/game/${game.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={s.logoWrap}>
            <LinearGradient
              colors={[Colors.primaryLight, Colors.accentLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.logoGradient}
            >
              <Text style={s.logoText}>HITSER</Text>
            </LinearGradient>
            <Text style={s.subtitle}>The Music Timeline Game</Text>
          </View>

          {/* Players */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Players</Text>
            {playerNames.map((name, i) => (
              <View key={i} style={s.playerRow}>
                <Text style={s.playerNum}>{i + 1}.</Text>
                <TextInput
                  style={s.input}
                  placeholder={`Player ${i + 1}`}
                  placeholderTextColor={Colors.textDim}
                  value={name}
                  onChangeText={(t) => updateName(i, t)}
                  maxLength={20}
                />
                {playerNames.length > 2 && (
                  <Pressable onPress={() => removePlayer(i)} hitSlop={8}>
                    <Ionicons name="close" size={20} color={Colors.textDim} />
                  </Pressable>
                )}
              </View>
            ))}
            {playerNames.length < 8 && (
              <Pressable onPress={addPlayer} style={s.addBtn}>
                <Ionicons name="add" size={16} color={Colors.primaryLight} />
                <Text style={s.addText}>Add Player</Text>
              </Pressable>
            )}
          </View>

          {/* Rounds */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Rounds per Player</Text>
            <View style={s.roundsRow}>
              {[10, 15, 20].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRounds(r)}
                  style={[s.roundBtn, rounds === r && s.roundBtnActive]}
                >
                  <Text style={[s.roundText, rounds === r && s.roundTextActive]}>{r}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Genre Selection */}
          {availableGenres.length > 0 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Music Genres</Text>
              <View style={s.roundsRow}>
                <Pressable
                  onPress={() => setUseAllGenres(true)}
                  style={[s.roundBtn, useAllGenres && s.roundBtnActive]}
                >
                  <Text style={[s.roundText, useAllGenres && s.roundTextActive]}>All Songs</Text>
                </Pressable>
                <Pressable
                  onPress={() => setUseAllGenres(false)}
                  style={[s.roundBtn, !useAllGenres && s.roundBtnActive]}
                >
                  <Text style={[s.roundText, !useAllGenres && s.roundTextActive]}>Pick Genres</Text>
                </Pressable>
              </View>
              {!useAllGenres && (
                <View style={s.genreWrap}>
                  {availableGenres.map((genre) => (
                    <Pressable
                      key={genre}
                      onPress={() => toggleGenre(genre)}
                      style={[
                        s.genreChip,
                        selectedGenres.includes(genre) && s.genreChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          s.genreChipText,
                          selectedGenres.includes(genre) && s.genreChipTextActive,
                        ]}
                      >
                        {genreLabel(genre)}
                      </Text>
                    </Pressable>
                  ))}
                  {selectedGenres.length === 0 && (
                    <Text style={s.genreWarn}>Select at least one genre</Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Error */}
          {error !== '' && <Text style={s.error}>{error}</Text>}

          {/* Start */}
          <Pressable onPress={startGame} disabled={loading}>
            <LinearGradient
              colors={[Colors.primary, Colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.startBtn, loading && { opacity: 0.5 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.startText}>Start Game</Text>
              )}
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 40 },
  logoWrap: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  logoGradient: { borderRadius: 8, paddingHorizontal: 4, paddingVertical: 2 },
  logoText: { fontSize: 44, fontWeight: '800', color: 'transparent' },
  subtitle: { color: Colors.textMuted, marginTop: 8, fontSize: 14 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#e5e7eb', marginBottom: 16 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  playerNum: { color: Colors.primaryLight, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, width: 24 },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceLighter,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 15,
  },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  addText: { color: Colors.primaryLight, fontSize: 13 },
  roundsRow: { flexDirection: 'row', gap: 12 },
  roundBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
  },
  roundBtnActive: { backgroundColor: Colors.primary },
  roundText: { color: Colors.textMuted, fontWeight: '500', fontSize: 14 },
  roundTextActive: { color: '#fff' },
  genreWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  genreChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.surfaceLight,
  },
  genreChipActive: { backgroundColor: Colors.accent },
  genreChipText: { fontSize: 13, fontWeight: '500', color: Colors.textMuted },
  genreChipTextActive: { color: '#fff' },
  genreWarn: { color: Colors.yellow, fontSize: 11, marginTop: 4, width: '100%' },
  error: { color: Colors.wrong, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  startBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  startText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
