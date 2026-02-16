import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface PassScreenProps {
  nextPlayerName: string;
  onReady: () => void;
}

export default function PassScreen({ nextPlayerName, onReady }: PassScreenProps) {
  return (
    <Modal animationType="fade">
      <View style={s.container}>
        <View style={s.content}>
          {/* Avatar circle */}
          <View style={s.avatar}>
            <Ionicons name="person" size={40} color={Colors.primaryLight} />
          </View>

          <Text style={s.label}>Pass the device to</Text>
          <Text style={s.name}>{nextPlayerName}</Text>

          <Pressable onPress={onReady}>
            <LinearGradient
              colors={[Colors.primary, Colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.btn}
            >
              <Text style={s.btnText}>I'm Ready!</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: { alignItems: 'center' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124,58,237,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  label: { color: Colors.textMuted, fontSize: 18, marginBottom: 8 },
  name: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.accentLight,
    marginBottom: 40,
  },
  btn: { borderRadius: 14, paddingVertical: 16, paddingHorizontal: 48 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
