const root = document.documentElement;
const body = document.body;
const progress = document.querySelector(".scroll-progress");
const header = document.querySelector("#siteHeader");
const modeToggle = document.querySelector(".mode-toggle");
const filterButtons = document.querySelectorAll(".filter-button");
const skillCards = document.querySelectorAll(".skill-card");
const copyTargets = document.querySelectorAll("[data-copy]");
const navLinks = document.querySelectorAll(".primary-nav a");
const sections = [...document.querySelectorAll("main section[id]")];

function updateProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const width = max > 0 ? (scrollTop / max) * 100 : 0;
  progress.style.width = `${width}%`;
  header.classList.toggle("scrolled", scrollTop > 16);
}

window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
    });
  });
}, { rootMargin: "-38% 0px -52% 0px", threshold: 0.01 });

sections.forEach((section) => navObserver.observe(section));

modeToggle.addEventListener("click", () => {
  const isSoft = body.classList.toggle("soft-mode");
  modeToggle.setAttribute("aria-pressed", String(isSoft));
  modeToggle.querySelector(".toggle-text").textContent = isSoft ? "Soft" : "Glow";
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    skillCards.forEach((card) => {
      const match = filter === "all" || card.dataset.skill.split(" ").includes(filter);
      card.classList.toggle("hidden", !match);
    });
  });
});

copyTargets.forEach((target) => {
  target.addEventListener("click", async (event) => {
    const value = target.dataset.copy;
    if (!value) return;

    if (target.tagName === "BUTTON") {
      event.preventDefault();
    }

    try {
      await navigator.clipboard.writeText(value);
      flashCopied(target);
    } catch {
      flashCopied(target, "Copy ready");
    }
  });
});

function flashCopied(target, message = "Copied") {
  const label = target.querySelector("span");
  if (!label) return;
  const original = label.textContent;
  label.textContent = message;
  window.setTimeout(() => {
    label.textContent = original;
  }, 1300);
}

document.querySelectorAll("[data-tilt]").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rx = ((y / rect.height) - 0.5) * -7;
    const ry = ((x / rect.width) - 0.5) * 7;
    card.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
    card.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  });
});

const canvas = document.querySelector("#signalCanvas");
const ctx = canvas.getContext("2d");
let width = 0;
let height = 0;
let points = [];
let rafId = null;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.max(34, Math.min(88, Math.floor(width / 18)));
  points = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.34,
    vy: (Math.random() - 0.5) * 0.34,
    size: Math.random() > 0.7 ? 3 : 2
  }));
}

function drawCanvas() {
  ctx.clearRect(0, 0, width, height);
  const soft = body.classList.contains("soft-mode");
  ctx.lineWidth = 1;

  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < -10) p.x = width + 10;
    if (p.x > width + 10) p.x = -10;
    if (p.y < -10) p.y = height + 10;
    if (p.y > height + 10) p.y = -10;

    ctx.fillStyle = soft ? "rgba(12, 18, 22, 0.36)" : "rgba(81, 243, 255, 0.46)";
    ctx.fillRect(p.x, p.y, p.size, p.size);

    for (let j = i + 1; j < points.length; j += 1) {
      const q = points[j];
      const dx = p.x - q.x;
      const dy = p.y - q.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 118) {
        const alpha = (1 - distance / 118) * (soft ? 0.16 : 0.22);
        ctx.strokeStyle = soft ? `rgba(0, 0, 0, ${alpha})` : `rgba(81, 243, 255, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(p.x + 1, p.y + 1);
        ctx.lineTo(q.x + 1, q.y + 1);
        ctx.stroke();
      }
    }
  }

  rafId = window.requestAnimationFrame(drawCanvas);
}

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  resizeCanvas();
  drawCanvas();
  window.addEventListener("resize", () => {
    window.cancelAnimationFrame(rafId);
    resizeCanvas();
    drawCanvas();
  });
}
