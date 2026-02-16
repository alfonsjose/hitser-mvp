import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import type { TimelineCard } from '../api/client';

interface TimelineProps {
  timeline: TimelineCard[];
  onSelectSlot?: (position: number) => void;
  interactive?: boolean;
}

export default function Timeline({ timeline, onSelectSlot, interactive }: TimelineProps) {
  const sorted = [...timeline].sort((a, b) => a.song.year - b.song.year);

  if (sorted.length === 0 && !interactive) {
    return (
      <View style={s.emptyWrap}>
        <Text style={s.emptyText}>No songs yet</Text>
      </View>
    );
  }

  // Build items: interleave drop slots and song cards
  type Item =
    | { type: 'slot'; position: number }
    | { type: 'card'; card: TimelineCard; index: number };

  const items: Item[] = [];
  if (interactive) items.push({ type: 'slot', position: 0 });
  sorted.forEach((card, i) => {
    items.push({ type: 'card', card, index: i });
    if (interactive) items.push({ type: 'slot', position: i + 1 });
  });

  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item, i) =>
        item.type === 'slot' ? `slot-${item.position}` : `card-${item.card.song.id}-${i}`
      }
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.listContent}
      renderItem={({ item }) => {
        if (item.type === 'slot') {
          return (
            <Pressable
              onPress={() => onSelectSlot?.(item.position)}
              style={s.slot}
            >
              <Ionicons name="add" size={16} color={Colors.textDim} />
            </Pressable>
          );
        }
        return <SongCard card={item.card} />;
      }}
    />
  );
}

function SongCard({ card }: { card: TimelineCard }) {
  return (
    <View style={s.card}>
      {/* Vinyl icon */}
      <View style={s.vinylWrap}>
        <View style={s.vinylOuter}>
          <View style={s.vinylDot} />
        </View>
      </View>
      <Text style={s.cardTitle} numberOfLines={1}>
        {card.song.title}
      </Text>
      <Text style={s.cardArtist} numberOfLines={1}>
        {card.song.artist}
      </Text>
      <Text style={s.cardYear}>{card.song.year}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  emptyWrap: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { color: Colors.textDim },
  listContent: { paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' },
  slot: {
    width: 36,
    height: 130,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.surfaceLighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  card: {
    width: 96,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceLighter,
    marginHorizontal: 2,
  },
  vinylWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  vinylOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.surfaceLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vinylDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  cardTitle: { fontSize: 10, fontWeight: '600', color: Colors.text },
  cardArtist: { fontSize: 9, color: Colors.textMuted, marginTop: 1 },
  cardYear: { fontSize: 12, fontWeight: '700', color: Colors.accent, marginTop: 4 },
});
