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
  const fadeAnimRef = useRef<number | null>(null);

  const fadeVolume = (from: number, to: number, duration = 200) => {
    const audio = audioRef.current;
    if (!audio) return Promise.resolve();
    if (fadeAnimRef.current !== null) {
      cancelAnimationFrame(fadeAnimRef.current);
      fadeAnimRef.current = null;
    }
    return new Promise<void>((resolve) => {
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const nextVol = from + (to - from) * progress;
        // Clamp the volume to avoid out-of-range errors due to timing glitches
        audio.volume = Math.min(1, Math.max(0, nextVol));
        if (progress < 1) {
          fadeAnimRef.current = requestAnimationFrame(step);
        } else {
          fadeAnimRef.current = null;
          resolve();
        }
      };
      fadeAnimRef.current = requestAnimationFrame(step);
    });
  };

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
    audio.volume = 0;
    audio.play().catch(() => {});
    fadeVolume(0, 1).catch(() => {});
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          fadeVolume(audio.volume, 0)
            .then(() => audio.pause())
            .catch(() => {});
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
    fadeVolume(audio.volume, 0)
      .then(() => audio.pause())
      .catch(() => {});
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
