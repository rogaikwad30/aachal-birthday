const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");
const celebrateBtn = document.getElementById("celebrateBtn");
const yearEl = document.getElementById("year");
const nameDisplay = document.getElementById("nameDisplay");
const pageLoader = document.getElementById("pageLoader");
const pageContent = document.getElementById("pageContent");
const loaderBarFill = document.getElementById("loaderBarFill");

yearEl.textContent = new Date().getFullYear();

const NAME = "Aachal";
const LETTER_STAGGER_S = 0.12;
const LOADER_DURATION_MS = 4000;

function animateName() {
  if (!nameDisplay) return;

  NAME.split("").forEach((letter, index) => {
    const span = document.createElement("span");
    span.className = "name-letter";
    span.textContent = letter;
    span.style.animationDelay = `${index * LETTER_STAGGER_S}s`;
    nameDisplay.appendChild(span);
  });
}

function showPage() {
  pageLoader.classList.add("is-hidden");
  pageContent.classList.remove("hidden");
  pageLoader.setAttribute("aria-busy", "false");

  setTimeout(() => {
    pageLoader.remove();
    animateName();
    setTimeout(() => launchConfetti(100), 600);
  }, 500);
}

function startLoader() {
  if (!pageLoader || !loaderBarFill) {
    pageContent.classList.remove("hidden");
    animateName();
    return;
  }

  loaderBarFill.style.transition = `width ${LOADER_DURATION_MS}ms linear`;
  requestAnimationFrame(() => {
    loaderBarFill.style.width = "100%";
  });

  setTimeout(showPage, LOADER_DURATION_MS);
}

let particles = [];
let animationId = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const colors = ["#f8b4c4", "#e8c872", "#c9a0e8", "#a8e6cf", "#ffd6a5", "#ff8fc7", "#ffffff"];

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
  const cy = canvas.height * 0.35;

  burst(intensity, cx, cy);
  burst(Math.floor(intensity * 0.4), cx * 0.3, cy);
  burst(Math.floor(intensity * 0.4), cx * 1.7, cy);

  if (!animationId) {
    animateConfetti();
  }
}

if (celebrateBtn) {
  celebrateBtn.addEventListener("click", () => {
    launchConfetti(160);
    celebrateBtn.textContent = "Yay! 🎂";
    setTimeout(() => {
      celebrateBtn.textContent = "Celebrate! 🎉";
    }, 2000);
  });
}

window.addEventListener("load", () => {
  SiteGate.whenUnlocked(startLoader);
});
