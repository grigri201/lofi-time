import React, { useEffect, useRef, useState } from "react";

const playlist = [
  { name: "Chill lofi", url: "https://usa9.fastcast4u.com/proxy/jamz?mp=/1" },
];

export const AudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); // 30 second pomodoro
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const playPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimeLeft(30);
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
      setTimeLeft(30);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            audio.pause();
            setIsPlaying(false);
            clearInterval(timerRef.current!);
            timerRef.current = null;
            return 30;
          }
          return t - 1;
        });
      }, 1000);
    }
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
      <button
        className="control-btn pomodoro-btn"
        onClick={playPause}
        aria-label="Pomodoro Timer"
      >
        {isPlaying ? `${timeLeft}s` : "Start"}
      </button>
      <button className="control-btn" onClick={next} aria-label="Next Song">
        <div className="icon-next" />
      </button>
    </div>
  );
};

export default AudioPlayer;
