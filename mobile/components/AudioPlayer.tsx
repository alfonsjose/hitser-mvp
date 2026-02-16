import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import type { Song } from '../api/client';

interface AudioPlayerProps {
  song: Song;
  hidden?: boolean;
}

export default function AudioPlayer({ song, hidden }: AudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(30);

  const onPlaybackUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setProgress((status.positionMillis ?? 0) / 1000);
    if (status.durationMillis) setDuration(status.durationMillis / 1000);
    if (status.didJustFinish) setPlaying(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      // Unload previous
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setPlaying(false);
      setProgress(0);

      if (!song.preview_url) return;

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound } = await Audio.Sound.createAsync(
        { uri: song.preview_url },
        { shouldPlay: true },
        onPlaybackUpdate,
      );
      if (!mounted) {
        await sound.unloadAsync();
        return;
      }
      soundRef.current = sound;
      setPlaying(true);
    }

    load();

    return () => {
      mounted = false;
      soundRef.current?.unloadAsync();
    };
  }, [song.id, onPlaybackUpdate]);

  const togglePlay = async () => {
    const sound = soundRef.current;
    if (!sound) return;
    if (playing) {
      await sound.pauseAsync();
      setPlaying(false);
    } else {
      await sound.playAsync();
      setPlaying(true);
    }
  };

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
          <Ionicons name={playing ? 'pause' : 'play'} size={20} color="#fff" />
        </Pressable>

        <View style={s.barTrack}>
          <View style={[s.barFill, { width: `${progressPercent}%` }]} />
        </View>

        <Text style={s.time}>{Math.floor(progress)}s</Text>
      </View>

      {!song.preview_url && (
        <Text style={s.noPreview}>No audio preview available for this track</Text>
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
