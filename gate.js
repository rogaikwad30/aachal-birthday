const UNLOCK_AT = 1784140200;

function isUnlocked() {
  return Math.floor(Date.now() / 1000) >= UNLOCK_AT;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function getRemainingSeconds() {
  return Math.max(0, UNLOCK_AT - Math.floor(Date.now() / 1000));
}

function splitTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

function createGateOverlay() {
  const gate = document.createElement("div");
  gate.id = "siteGate";
  gate.className = "site-gate";
  gate.setAttribute("role", "dialog");
  gate.setAttribute("aria-live", "polite");
  gate.setAttribute("aria-label", "Countdown until site unlocks");
  gate.innerHTML = `
    <div class="site-gate-inner">
      <p class="site-gate-eyebrow">Something special is on the way</p>
      <h1 class="site-gate-title">Almost there</h1>
      <p class="site-gate-subtitle">This opens in</p>
      <div class="site-gate-timer">
        <div class="timer-unit">
          <span class="timer-value" id="gateHours">00</span>
          <span class="timer-label">Hours</span>
        </div>
        <span class="timer-sep">:</span>
        <div class="timer-unit">
          <span class="timer-value" id="gateMinutes">00</span>
          <span class="timer-label">Minutes</span>
        </div>
        <span class="timer-sep">:</span>
        <div class="timer-unit">
          <span class="timer-value" id="gateSeconds">00</span>
          <span class="timer-label">Seconds</span>
        </div>
      </div>
      <p class="site-gate-note">Come back when the clock hits zero ✨</p>
      <p class="site-gate-music">Tap anywhere to turn the music on 🎵</p>
    </div>
  `;
  document.body.appendChild(gate);
  return gate;
}

function updateGateDisplay(remaining) {
  const { hours, minutes, seconds } = splitTime(remaining);
  const hoursEl = document.getElementById("gateHours");
  const minutesEl = document.getElementById("gateMinutes");
  const secondsEl = document.getElementById("gateSeconds");

  if (hoursEl) hoursEl.textContent = pad(hours);
  if (minutesEl) minutesEl.textContent = pad(minutes);
  if (secondsEl) secondsEl.textContent = pad(seconds);
}

function unlockSite() {
  if (window._gateInterval) {
    clearInterval(window._gateInterval);
    window._gateInterval = null;
  }

  document.documentElement.classList.remove("site-locked");
  document.body.classList.remove("site-locked");

  const gate = document.getElementById("siteGate");
  if (gate) {
    gate.classList.add("is-hidden");
    setTimeout(() => gate.remove(), 500);
  }

  document.dispatchEvent(new CustomEvent("site-unlocked"));
}

function whenUnlocked(callback) {
  if (isUnlocked()) {
    callback();
  } else {
    document.addEventListener("site-unlocked", callback, { once: true });
  }
}

function startGate() {
  if (isUnlocked()) {
    document.documentElement.classList.remove("site-locked");
    document.dispatchEvent(new CustomEvent("site-unlocked"));
    return;
  }

  document.documentElement.classList.add("site-locked");
  document.body.classList.add("site-locked");
  createGateOverlay();
  updateGateDisplay(getRemainingSeconds());

  const tick = () => {
    const remaining = getRemainingSeconds();

    if (remaining <= 0) {
      unlockSite();
      return;
    }

    updateGateDisplay(remaining);
  };

  tick();
  window._gateInterval = setInterval(tick, 1000);
}

window.SiteGate = { UNLOCK_AT, isUnlocked, whenUnlocked, startGate };

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startGate);
} else {
  startGate();
}
