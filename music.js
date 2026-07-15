(function () {
  const VIDEO_ID = "nDjloeIB3Pc";
  const INITIAL_START = 13;
  const STORAGE_KEY = "aachal-music-state";
  const INTERACTED_KEY = "aachal-music-interacted";
  const DEFAULT_VOLUME = 55;
  const FADE_IN_MS = 1200;
  const FADE_OUT_MS = 450;
  const SAVE_INTERVAL_MS = 400;
  const LOOP_START = INITIAL_START; // 13
    const LOOP_END = 175;             // stop here and restart
    let loopChecker = null;

  let player = null;
  let saveTimer = null;
  let fadeFrame = null;
  let pendingState = null;
  let leavingPage = false;

  function loadState() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { time: INITIAL_START, playing: true, volume: DEFAULT_VOLUME };
      }
      const parsed = JSON.parse(raw);
      let time = typeof parsed.time === "number" ? parsed.time : INITIAL_START;
      const playing = parsed.playing !== false;
      const volume =
        typeof parsed.volume === "number" ? parsed.volume : DEFAULT_VOLUME;

      if (playing && parsed.savedAt) {
        const elapsed = (Date.now() - parsed.savedAt) / 1000;
        time += elapsed;
      }

      return { time, playing, volume };
    } catch {
      return { time: INITIAL_START, playing: true, volume: DEFAULT_VOLUME };
    }
  }

  function saveState(forceTime) {
    if (!player || typeof player.getCurrentTime !== "function") return;

    const time =
      typeof forceTime === "number" ? forceTime : player.getCurrentTime() || 0;
    const playing =
      typeof player.getPlayerState === "function"
        ? player.getPlayerState() === YT.PlayerState.PLAYING
        : true;
    const volume =
      typeof player.getVolume === "function"
        ? player.getVolume()
        : DEFAULT_VOLUME;

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ time, playing, volume, savedAt: Date.now() })
    );
  }

  function hasUserInteracted() {
    return sessionStorage.getItem(INTERACTED_KEY) === "1";
  }

  function markUserInteracted() {
    sessionStorage.setItem(INTERACTED_KEY, "1");
  }

  function cancelFade() {
    if (fadeFrame) {
      cancelAnimationFrame(fadeFrame);
      fadeFrame = null;
    }
  }

  function fadeVolume(toVolume, duration, onDone) {
    if (!player || typeof player.setVolume !== "function") return;

    cancelFade();
    const fromVolume = player.getVolume();
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = fromVolume + (toVolume - fromVolume) * eased;
      player.setVolume(Math.max(0, Math.min(100, next)));

      if (progress < 1) {
        fadeFrame = requestAnimationFrame(step);
      } else {
        fadeFrame = null;
        onDone?.();
      }
    };

    fadeFrame = requestAnimationFrame(step);
  }

  function injectPlayerShell() {
    if (document.getElementById("music-player-wrap")) return;

    const wrap = document.createElement("div");
    wrap.id = "music-player-wrap";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = '<div id="yt-player"></div>';
    document.body.appendChild(wrap);
  }

  function startSaveLoop() {
    if (saveTimer) clearInterval(saveTimer);
    saveTimer = setInterval(() => saveState(), SAVE_INTERVAL_MS);
  }

  function stopSaveLoop() {
    if (saveTimer) {
      clearInterval(saveTimer);
      saveTimer = null;
    }
  }

  function resumeFromSavedState() {
    if (!player || !pendingState) return;

    const { time, playing, volume } = pendingState;
    const resumeTime = Math.max(0, time);

    player.seekTo(resumeTime, true);
    player.setVolume(0);

    if (playing) {
      player.playVideo();
    }

    const startAudio = () => {
      if (hasUserInteracted()) {
        player.unMute();
        fadeVolume(volume, FADE_IN_MS);
      } else {
        player.mute();
        player.setVolume(volume);
      }
    };

    setTimeout(startAudio, 120);
  }

  function onPlayerReady() {
    resumeFromSavedState();
    startSaveLoop();
    startLoopMonitor();
    bindInteractionUnlock();
  }

  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      saveState();
    }
  }

  function createPlayer() {
    pendingState = loadState();

    player = new YT.Player("yt-player", {
      height: "1",
      width: "1",
      videoId: VIDEO_ID,
      playerVars: {
        autoplay: 1,
        loop: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin || window.location.href,
        iv_load_policy: 3,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  }

  function bindInteractionUnlock() {
    if (hasUserInteracted()) return;

    const hint = document.querySelector(".site-gate-music");

    const unlock = () => {
      if (!player || typeof player.unMute !== "function") return;
      markUserInteracted();
      if (hint) hint.style.display = "none";
      player.unMute();
      fadeVolume(pendingState?.volume || DEFAULT_VOLUME, FADE_IN_MS);
    };

    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true, passive: true });
  }

  function handlePageLeave() {
    if (leavingPage || !player) return;
    leavingPage = true;
    stopSaveLoop();
    saveState();

    if (typeof player.setVolume === "function") {
      fadeVolume(0, FADE_OUT_MS);
    }
  }

  function startLoopMonitor() {
    stopLoopMonitor();
  
    loopChecker = setInterval(() => {
      if (!player || typeof player.getCurrentTime !== "function") return;
  
      const current = player.getCurrentTime();
  
      if (current >= LOOP_END) {
        player.seekTo(LOOP_START, true);
        player.playVideo();
      }
    }, 250);
  }
  
  function stopLoopMonitor() {
    if (loopChecker) {
      clearInterval(loopChecker);
      loopChecker = null;
    }
  }

  function loadYouTubeApi() {
    if (window.YT && window.YT.Player) {
      createPlayer();
      return;
    }

    const existing = document.getElementById("youtube-iframe-api");
    if (!existing) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = createPlayer;
  }

  function initMusic() {
    injectPlayerShell();
    loadYouTubeApi();

    window.addEventListener("pagehide", handlePageLeave);
    window.addEventListener("beforeunload", () => saveState());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        saveState();
      }
    });
  }

  if (document.body) {
    initMusic();
  } else {
    document.addEventListener("DOMContentLoaded", initMusic);
  }

  window.SiteMusic = { saveState, loadState };
})();


