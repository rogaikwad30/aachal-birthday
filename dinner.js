const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");
const yearEl = document.getElementById("year");
const dinnerYes = document.getElementById("dinnerYes");
const dinnerNo = document.getElementById("dinnerNo");
const dinnerButtons = document.getElementById("dinnerButtons");
const dinnerInvite = document.getElementById("dinnerInvite");
const dinnerResponse = document.getElementById("dinnerResponse");

let particles = [];
let animationId = null;

function dodgeNoButton() {
  if (!dinnerNo || !dinnerButtons) return;

  const containerRect = dinnerButtons.getBoundingClientRect();
  const btnRect = dinnerNo.getBoundingClientRect();

  if (!dinnerNo.classList.contains("is-dodging")) {
    dinnerNo.classList.add("is-dodging");
    dinnerNo.style.left = `${btnRect.left - containerRect.left}px`;
    dinnerNo.style.top = `${btnRect.top - containerRect.top}px`;
  }

  const padding = 10;
  const maxX = Math.max(padding, containerRect.width - btnRect.width - padding);
  const maxY = Math.max(padding, containerRect.height - btnRect.height - padding);

  let nextX;
  let nextY;
  let attempts = 0;
  const currentLeft = parseFloat(dinnerNo.style.left) || 0;
  const currentTop = parseFloat(dinnerNo.style.top) || 0;

  do {
    nextX = padding + Math.random() * maxX;
    nextY = padding + Math.random() * maxY;
    attempts += 1;
  } while (
    attempts < 10 &&
    Math.abs(nextX - currentLeft) < 50 &&
    Math.abs(nextY - currentTop) < 24
  );

  dinnerNo.style.left = `${nextX}px`;
  dinnerNo.style.top = `${nextY}px`;
}

function acceptDinner() {
  dinnerInvite.classList.add("is-accepted");
  dinnerResponse.classList.remove("hidden");
  dinnerResponse.textContent =
    "Yay! 🎉 Can't wait. Tomorrow, 9 PM — it's a date.";
  launchConfetti(180);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

const colors = ["#f8b4c4", "#e8c872", "#c9a0e8", "#ffd6a5", "#ff8fc7", "#ffffff"];

function createParticle(x, y) {
  return {
    x,
    y,
    size: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedX: (Math.random() - 0.5) * 6,
    speedY: Math.random() * -8 - 4,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
    shape: Math.random() > 0.5 ? "rect" : "circle",
    gravity: 0.18,
    opacity: 1,
  };
}

function burst(count, originX, originY) {
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(originX, originY));
  }
}

function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter((p) => p.opacity > 0.02 && p.y < canvas.height + 20);

  for (const p of particles) {
    p.x += p.speedX;
    p.y += p.speedY;
    p.speedY += p.gravity;
    p.rotation += p.rotationSpeed;
    p.opacity *= 0.992;

    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;

    if (p.shape === "rect") {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  if (particles.length > 0) {
    animationId = requestAnimationFrame(animateConfetti);
  } else {
    animationId = null;
  }
}

function launchConfetti(intensity = 120) {
  const cx = canvas.width / 2;
  const cy = canvas.height * 0.4;

  burst(intensity, cx, cy);
  burst(Math.floor(intensity * 0.4), cx * 0.3, cy);
  burst(Math.floor(intensity * 0.4), cx * 1.7, cy);

  if (!animationId) {
    animateConfetti();
  }
}

function initDinnerPage() {
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (dinnerNo) {
    dinnerNo.addEventListener("mouseenter", dodgeNoButton);
    dinnerNo.addEventListener(
      "touchstart",
      (event) => {
        event.preventDefault();
        dodgeNoButton();
      },
      { passive: false }
    );
  }

  if (dinnerYes) {
    dinnerYes.addEventListener("click", acceptDinner);
  }

  resizeCanvas();
}

SiteGate.whenUnlocked(initDinnerPage);
window.addEventListener("resize", resizeCanvas);
