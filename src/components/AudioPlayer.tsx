import React, { useEffect, useRef, useState } from 'react';

const playlist = [
  { name: 'Chill lofi', url: 'http://usa9.fastcast4u.com/proxy/jamz?mp=/1' },
  { name: 'Sovietwave', url: 'https://station.waveradio.org/soviet.mp3' },
  { name: 'Psyndora Chillout', url: 'http://cast.magicstreams.gr:9125/stream' }
];

export const AudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);

  const playPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = playlist[trackIndex].url;
  }, [trackIndex]);

  const next = () => {
    setTrackIndex((i) => (i + 1) % playlist.length);
  };

  return (
    <div className="audio-container">
      <audio ref={audioRef} preload="metadata" />
      <div className="song-title">{playlist[trackIndex].name}</div>
      <button className="control-btn" onClick={playPause} aria-label="Play/Pause">
        <div className={isPlaying ? 'icon-pause' : 'icon-play'} />
      </button>
      <button className="control-btn" onClick={next} aria-label="Next Song">
        <div className="icon-next" />
      </button>
    </div>
  );
};

export default AudioPlayer;
