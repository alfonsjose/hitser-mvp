import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Colors } from '../constants/colors';
import type { PlacementResult as PlacementResultType } from '../api/client';

interface Props {
  result: PlacementResultType;
  onContinue: () => void;
}

export default function PlacementResultModal({ result, onContinue }: Props) {
  const { correct, song } = result;

  useEffect(() => {
    Haptics.notificationAsync(
      correct
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    );
  }, [correct]);

  return (
    <Modal transparent animationType="fade">
      <View style={s.overlay}>
        <View style={[s.card, { borderColor: correct ? Colors.correct : Colors.wrong }]}>
          {/* Icon */}
          <View
            style={[
              s.iconCircle,
              { backgroundColor: correct ? Colors.correctDim : Colors.wrongDim },
            ]}
          >
            <Ionicons
              name={correct ? 'checkmark' : 'close'}
              size={32}
              color={correct ? Colors.correct : Colors.wrong}
            />
          </View>

          <Text style={[s.heading, { color: correct ? Colors.correct : Colors.wrong }]}>
            {correct ? 'Correct!' : 'Wrong!'}
          </Text>

          <Text style={s.title}>{song.title}</Text>
          <Text style={s.artist}>{song.artist}</Text>
          <Text style={s.year}>{song.year}</Text>

          {!correct && (
            <Text style={s.hint}>This song won't be added to your timeline</Text>
          )}

          <Pressable onPress={onContinue} style={s.btn}>
            <Text style={s.btnText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 2,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '600', color: Colors.text },
  artist: { fontSize: 14, color: Colors.primaryLight, marginTop: 2 },
  year: { fontSize: 32, fontWeight: '700', color: Colors.accent, marginTop: 8 },
  hint: { color: Colors.textMuted, fontSize: 13, marginTop: 8 },
  btn: {
    marginTop: 24,
    width: '100%',
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
