import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, AudioModule } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import type { Song } from '../api/client';

interface AudioPlayerProps {
  song: Song;
  hidden?: boolean;
}

export default function AudioPlayer({ song, hidden }: AudioPlayerProps) {
  const player = useAudioPlayer(song.preview_url ?? '');
  const status = useAudioPlayerStatus(player);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    AudioModule.setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    if (song.preview_url) {
      setAudioError(false);
      try {
        player.play();
      } catch {
        setAudioError(true);
      }
    }
  }, [song.id, player]);

  const togglePlay = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const progress = (status.currentTime ?? 0) / 1000;
  const duration = (status.duration ?? 30000) / 1000;
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <View style={s.container}>
      {/* Song info */}
      <View style={s.infoWrap}>
        {hidden ? (
          <>
            <Text style={s.mystery}>?</Text>
            <Text style={s.hint}>Listen and place this song on your timeline</Text>
          </>
        ) : (
          <>
            <Text style={s.title}>{song.title}</Text>
            <Text style={s.artist}>
              {song.artist} - {song.year}
            </Text>
          </>
        )}
      </View>

      {/* Controls */}
      <View style={s.controls}>
        <Pressable onPress={togglePlay} style={s.playBtn}>
          <Ionicons name={status.playing ? 'pause' : 'play'} size={20} color="#fff" />
        </Pressable>

        <View style={s.barTrack}>
          <View style={[s.barFill, { width: `${progressPercent}%` }]} />
        </View>

        <Text style={s.time}>{Math.floor(progress)}s</Text>
      </View>

      {!song.preview_url && (
        <Text style={s.noPreview}>No audio preview available for this track</Text>
      )}
      {audioError && (
        <Text style={s.noPreview}>Failed to play audio. Try again.</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20 },
  infoWrap: { alignItems: 'center', marginBottom: 16 },
  mystery: { fontSize: 28, color: Colors.text, marginBottom: 4 },
  hint: { color: Colors.textMuted, fontSize: 13 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  artist: { fontSize: 13, color: Colors.primaryLight, marginTop: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  time: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace' as string,
    width: 30,
    textAlign: 'right',
  },
  noPreview: { color: Colors.yellow, fontSize: 11, textAlign: 'center', marginTop: 8 },
});
