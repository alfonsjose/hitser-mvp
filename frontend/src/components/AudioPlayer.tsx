import { useRef, useState, useEffect } from 'react';
import type { Song } from '../api';

interface AudioPlayerProps {
  song: Song;
  hidden?: boolean;
}

export default function AudioPlayer({ song, hidden }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset state for new song
    setPlaying(false);
    setProgress(0);
    audio.currentTime = 0;

    if (song.preview_url) {
      audio.src = song.preview_url;
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [song.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 30);
    const onEnded = () => setPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="bg-[#1e1b2e] rounded-2xl p-5">
      <audio ref={audioRef} preload="auto" />

      {/* Song info - hidden until revealed */}
      <div className="text-center mb-4">
        {hidden ? (
          <>
            <div className="text-2xl mb-1">?</div>
            <p className="text-gray-400 text-sm">Listen and place this song on your timeline</p>
          </>
        ) : (
          <>
            <p className="text-lg font-bold text-white">{song.title}</p>
            <p className="text-[#a78bfa] text-sm">{song.artist} - {song.year}</p>
          </>
        )}
      </div>

      {/* Play/Pause + Progress */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-[#7c3aed] flex items-center justify-center hover:bg-[#5b21b6] transition-colors flex-shrink-0"
        >
          {playing ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <div className="h-1.5 bg-[#2a2540] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] rounded-full transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <span className="text-xs text-gray-400 font-mono w-10 text-right">
          {Math.floor(progress)}s
        </span>
      </div>

      {!song.preview_url && (
        <p className="text-yellow-400/70 text-xs text-center mt-2">
          No audio preview available for this track
        </p>
      )}
    </div>
  );
}
