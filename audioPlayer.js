document.addEventListener('DOMContentLoaded', () => {
  // Audio Player Code
  const audio = document.getElementById('myAudio');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const iconContainer = document.getElementById('iconContainer');
  const playedProgress = document.getElementById('playedProgress');
  const progressThumb = document.getElementById('progressThumb');
  const totalTimeDisplay = document.getElementById('totalTimeDisplay');
  const songTitleDisplay = document.getElementById('songTitleDisplay');
  const nextBtn = document.getElementById('nextBtn'); // Get the next button

  const playlist = [
    { name: 'Chill lofi', url: 'http://usa9.fastcast4u.com/proxy/jamz?mp=/1' },
    { name: 'Sovietwave', url: 'https://station.waveradio.org/soviet.mp3' },
    { name: 'Psyndora Chillout', url: 'http://cast.magicstreams.gr:9125/stream' },
    { name: 'Classic Vinyl', url: 'https://icecast.walmradio.com:8443/classic' },
    { name: 'Adroit Jazz Underground', url: 'https://icecast.walmradio.com:8443/jazz' },
    { name: 'Intense Radio - We love Dance', url: 'http://secure.live-streams.nl/flac.ogg' },
    { name: 'progressive techno', url: 'https://0n-techno.radionetz.de/0n-techno.mp3' },
    { name: 'Dance', url: 'https://mixtapes.superstreams.de' },
    { name: 'Anima Amoris Minimal Deep Techno', url: 'https://amoris.sknt.ru/minimal.mp3' },
    { name: 'CoreTime.FM', url: 'https://listen.coretime.fm/aac-hd.pls' },
    { name: 'acid', url: 'https://streams.rautemusik.fm/techno/mp3-192' },
    { name: 'Trancetechnic Radio', url: 'https://s11.ssl-stream.com/ssl/trancete?mp=/stream' },
    { name: 'Chillsky Beats', url: 'https://lfhh.radioca.st/stream' }
  ];
  let currentTrackIndex = 0;

  // Function to load and play a track
  function loadTrack(trackIndex) {
    if (trackIndex >= 0 && trackIndex < playlist.length) {
      audio.src = playlist[trackIndex].url;
      audio.load(); // Important to load the new source
      // Attempt to play if isPlaying was true, or if user clicks play next
      if (isPlaying) {
        audio.play().catch(error => console.error("Error playing audio:", error));
      }
      currentTrackIndex = trackIndex;
      // Update title display when track is loaded
      updateSongTitleDisplay();
    } else {
      // End of playlist or invalid index
      isPlaying = false;
      updatePlayPauseIcon();
      // Optionally, reset to first track or stop
      // currentTrackIndex = 0; 
      // audio.src = playlist[currentTrackIndex].url;
    }
  }

  // Set initial track
  if (playlist.length > 0) {
    audio.src = playlist[currentTrackIndex].url;
  }

  audio.addEventListener('loadedmetadata', () => {
    console.log('Audio Metadata Loaded:');
    console.log('Duration:', audio.duration);
    console.log('Title:', audio.title); // Note: MP3 title metadata might not always be available directly
    console.log('Artist:', audio.artist); // Note: MP3 artist metadata might not always be available directly
    console.log('Album:', audio.album); // Note: MP3 album metadata might not always be available directly
    // For more detailed metadata, you might need a library like jsmediatags
    console.log('Current Source:', audio.currentSrc);
    updateSongTitleDisplay(); // Update title display when metadata is loaded
  });

  // Handle audio errors by trying the next track
  audio.addEventListener('error', (e) => {
    console.error("Audio Error:", e);
    console.log("Attempting to play next track due to error.");
    currentTrackIndex++;
    if (currentTrackIndex >= playlist.length) {
      currentTrackIndex = 0; // Loop back to the first track
    }
    // Preserve the previous playing state
    const wasPlaying = isPlaying;
    loadTrack(currentTrackIndex);
    if (wasPlaying) {
      // Ensure playback attempts if it was previously playing
      // loadTrack might already attempt to play if isPlaying is true,
      // but this ensures it if loadTrack's internal play was conditional
      // or if isPlaying was modified by the error or loadTrack itself.
      audio.play().catch(error => console.error("Error attempting to play next track after an error:", error));
    }
    // No need to update isPlaying or icon here, as loadTrack and play() will handle it
    // or it remains paused if it was paused.
  });

  let isPlaying = false;
  let isDraggingThumb = false;

  // Helper function to format time (MM:SS)
  function formatTime(seconds) {
    const roundedSeconds = Math.round(seconds);
    const minutes = Math.floor(roundedSeconds / 60);
    const secs = roundedSeconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Helper function to update the song title display
  function updateSongTitleDisplay() {
    if (!audio.currentSrc || currentTrackIndex < 0 || currentTrackIndex >= playlist.length) return; // Do nothing if no source or invalid index

    let displayName = playlist[currentTrackIndex].name;
    if (!displayName || displayName.trim() === "") {
      // Fallback if name is empty, though it shouldn't be with the new structure
      const pathParts = audio.currentSrc.split('/');
      displayName = pathParts[pathParts.length - 1]; // Get filename from path
    }
    songTitleDisplay.textContent = displayName;
  }

  // Update Play/Pause button icon
  function updatePlayPauseIcon() {
    if (isPlaying) {
      iconContainer.className = 'icon-pause';
      playPauseBtn.setAttribute('aria-label', 'Pause');
    } else {
      iconContainer.className = 'icon-play';
      playPauseBtn.setAttribute('aria-label', 'Play'); // Corrected aria-label for play state
    }
  }

  // Play/Pause functionality
  playPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
      audio.pause();
    } else {
      // If changing track or starting for the first time, ensure src is set
      if (audio.currentSrc !== playlist[currentTrackIndex].url && playlist.length > 0) {
        audio.src = playlist[currentTrackIndex].url;
        audio.load();
      }
      audio.play().catch(error => console.error("Error attempting to play audio:", error));
    }
    isPlaying = !isPlaying;
    updatePlayPauseIcon();
  });

  // Handle audio end
  audio.addEventListener('ended', () => {
    // Play next track
    currentTrackIndex++;
    if (currentTrackIndex >= playlist.length) { // Loop back to the first track
      currentTrackIndex = 0;
    }
    loadTrack(currentTrackIndex);
    // Ensure playback continues if it was playing
    isPlaying = true; // loadTrack might try to play if isPlaying is true
    audio.play().catch(error => console.error("Error playing next track:", error));
    updatePlayPauseIcon(); // Update icon if needed
  });

  // Next button functionality
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentTrackIndex++;
      if (currentTrackIndex >= playlist.length) {
        currentTrackIndex = 0; // Loop back to the first track
      }
      loadTrack(currentTrackIndex);
      // If music was playing, keep it playing. If paused, it should load but not auto-play.
      if (isPlaying) {
        audio.play().catch(error => console.error("Error playing next track:", error));
      }
      // updatePlayPauseIcon(); // Icon should remain as it was unless explicitly changed by play/pause
    });
  }

  // Initial icon state (if audio might be pre-set to play or paused by browser)
  isPlaying = !audio.paused;
  updatePlayPauseIcon();

  // Ensure total time is displayed if metadata is already loaded (e.g. page refresh)
  if (audio.readyState >= 1) { // HAVE_METADATA or more
    totalTimeDisplay.textContent = formatTime(audio.duration);
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    playedProgress.style.width = `${progressPercent}%`;
    progressThumb.style.left = `${progressPercent}%`;
    updateSongTitleDisplay(); // Also update title on initial load if metadata ready
  }
}); 