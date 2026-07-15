const yearEl = document.getElementById("year");
yearEl.textContent = new Date().getFullYear();

document.querySelectorAll(".photo-frame img").forEach((img) => {
  const frame = img.closest(".photo-frame");

  img.addEventListener("error", () => frame.classList.add("is-placeholder"));
  img.addEventListener("load", () => {
    if (img.naturalWidth > 0) frame.classList.remove("is-placeholder");
  });

  if (img.complete && img.naturalWidth === 0) {
    frame.classList.add("is-placeholder");
  }
});

const revealEls = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);

revealEls.forEach((el) => observer.observe(el));
