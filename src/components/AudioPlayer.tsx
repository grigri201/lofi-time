import React, { useEffect, useRef, useState } from "react";

const playlist = [
  { name: "Chill lofi", url: "https://usa9.fastcast4u.com/proxy/jamz?mp=/1" },
];

const INITIAL_TIME = 30; // 30 second pomodoro

export const AudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startTimer = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().catch(() => {});
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          audio.pause();
          setIsPlaying(false);
          setTimeout(() => setTimeLeft(INITIAL_TIME), 300);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setTimeout(() => setTimeLeft(INITIAL_TIME), 300);
  };

  const playPause = () => {
    if (isPlaying) {
      stopTimer();
    } else {
      setIsPlaying(true);
      setTimeout(startTimer, 300);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = playlist[0].url;
  }, []);

  return (
    <>
      <audio ref={audioRef} preload="metadata" />
      <button
        className={`pomodoro-btn ${isPlaying ? "running" : ""}`}
        onClick={playPause}
        aria-label="Pomodoro Timer"
      >
        {isPlaying ? formatTime(timeLeft) : "Start"}
      </button>
    </>
  );
};

export default AudioPlayer;
