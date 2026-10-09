/*
 * Portfolio: Iguegbe Enyiolisa John-Paul
 * Interactive behaviour: navbar, hero typing and ASCII portrait, scroll reveals,
 * the Skills and Off the clock animations, and the contact links.
 * All motion is skipped when the user prefers reduced motion.
 */

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// ===== Navbar =====
const nav = document.querySelector(".site-nav");
const navMenu = document.getElementById("navMenu");
const scrollBar = nav.querySelector(".scroll-progress");

// Shadow once the page is scrolled, plus the scroll-progress bar
function updateNav() {
  nav.classList.toggle("scrolled", window.scrollY > 10);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  scrollBar.style.setProperty(
    "--scroll",
    scrollable > 0 ? window.scrollY / scrollable : 0,
  );
}

updateNav();
window.addEventListener("scroll", updateNav, { passive: true });
window.addEventListener("resize", updateNav);

// Collapse the mobile menu after a link is selected
nav.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    if (navMenu.classList.contains("show")) {
      bootstrap.Collapse.getOrCreateInstance(navMenu, { toggle: false }).hide();
    }
  });
});

// ===== Scroll reveal =====
const revealItems = document.querySelectorAll("[data-reveal]");

if (revealItems.length && !reduceMotion) {
  document.documentElement.classList.add("reveal-ready");

  // Stagger siblings (cards, steps) that reveal together
  revealItems.forEach((item) => {
    const group = [...item.parentElement.children].filter((el) =>
      el.hasAttribute("data-reveal"),
    );
    item.style.setProperty("--reveal-delay", `${group.indexOf(item) * 0.12}s`);
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  revealItems.forEach((item) => revealObserver.observe(item));
}

// ===== Hero: typing effect =====
const typedLines = [
  "Full-Stack Web Developer",
  "Loadout: HTML · CSS · JS · Node · Pyth",
  "Locked and loaded, Let's build!",
  "Zero lags, Clean code, GGs.",
];

const typedEl = document.getElementById("typed");

if (reduceMotion) {
  typedEl.textContent = typedLines[0];
} else {
  let lineIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function typeStep() {
    const line = typedLines[lineIndex];
    charIndex += deleting ? -1 : 1;
    typedEl.textContent = line.slice(0, charIndex);

    let delay = deleting ? 35 : 70;

    if (!deleting && charIndex === line.length) {
      // Line complete: hold, then delete
      deleting = true;
      delay = 1800;
    } else if (deleting && charIndex === 0) {
      // Line cleared: move to the next one
      deleting = false;
      lineIndex = (lineIndex + 1) % typedLines.length;
      delay = 400;
    }

    setTimeout(typeStep, delay);
  }

  setTimeout(typeStep, 800);
}

// ===== Hero: ASCII portrait =====
// Each character of the pre-rendered portrait (portrait-ascii.js) is a particle that
// assembles into place, shimmers, and is pushed away by the pointer.
const portraitCanvas = document.getElementById("portrait");

if (portraitCanvas && typeof PORTRAIT_ASCII !== "undefined") {
  const ctx = portraitCanvas.getContext("2d");
  const { font, colGap, rowGap, chars, rows } = PORTRAIT_ASCII;
  const BASE = 400; // logical size of the drawing space, scaled to the canvas
  const FADE_ROWS = 8; // bottom rows that fade out
  const WHITE = "#ffffff";
  const LIGHT_GREEN = "#b8f0d4";

  const offsetX =
    (BASE - Math.max(...rows.map((row) => row.length)) * colGap) / 2;
  const offsetY = (BASE - rows.length * rowGap) / 2;

  const particles = [];
  rows.forEach((row, r) => {
    [...row].forEach((char, c) => {
      if (char === " ") return;
      const density = chars.indexOf(char) / (chars.length - 1); // 0 light, 1 dense
      const targetX = offsetX + c * colGap + colGap / 2;
      const targetY = offsetY + r * rowGap + rowGap / 2;
      particles.push({
        char,
        targetX,
        targetY,
        x: targetX + (Math.random() - 0.5) * BASE,
        y: targetY + (Math.random() - 0.5) * BASE,
        vx: 0,
        vy: 0,
        alpha:
          (0.35 + density * 0.65) * Math.min(1, (rows.length - r) / FADE_ROWS),
        shown: 0,
        color: density < 0.5 ? LIGHT_GREEN : WHITE,
        delay: Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      });
    });
  });

  // Group by colour so fillStyle changes once per frame
  particles.sort((a, b) =>
    a.color === b.color ? 0 : a.color === LIGHT_GREEN ? -1 : 1,
  );

  let scale = 1;

  function drawPortrait() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, portraitCanvas.width, portraitCanvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.font = `${font}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let currentColor = null;
    for (const p of particles) {
      if (p.shown <= 0) continue;
      if (p.color !== currentColor) {
        currentColor = p.color;
        ctx.fillStyle = currentColor;
      }
      ctx.globalAlpha = Math.min(p.shown, 1);
      ctx.fillText(p.char, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  function resizePortrait() {
    const dpr = window.devicePixelRatio || 1;
    const size = portraitCanvas.clientWidth * dpr;
    portraitCanvas.width = size;
    portraitCanvas.height = size;
    scale = size / BASE;
    drawPortrait();
  }

  resizePortrait();
  window.addEventListener("resize", resizePortrait);

  if (reduceMotion) {
    particles.forEach((p) => {
      p.x = p.targetX;
      p.y = p.targetY;
      p.shown = p.alpha;
    });
    drawPortrait();
  } else {
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };
    let startTime = null;
    let running = false;
    let visible = true;

    function animatePortrait(now) {
      if (!visible) {
        running = false;
        return;
      }
      if (startTime === null) startTime = now;
      const elapsed = (now - startTime) / 1000;

      // Smooth the pointer position
      pointer.x += (pointer.targetX - pointer.x) * 0.15;
      pointer.y += (pointer.targetY - pointer.y) * 0.15;

      const lively = pointer.active || elapsed < 3; // intro or active interaction
      const reach = BASE * 0.2;
      let stillMoving = false;

      for (const p of particles) {
        const t = elapsed - p.delay;
        if (t < 0) {
          stillMoving = true;
          continue;
        }

        const appear = 1 - Math.pow(1 - Math.min(t / 1.5, 1), 2);
        const settle = 1 - Math.pow(1 - Math.min(t / 2.5, 1), 3);
        const shimmer = lively ? Math.sin(elapsed * 2 + p.phase) * 0.1 : 0;
        p.shown = Math.max(0, p.alpha * appear + shimmer);

        // Repel from the pointer
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0 && dist < reach) {
            const force = (1 - dist / reach) * 4;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // Spring back to the target position
        const pull = 0.01 + settle * 0.08;
        p.vx += (p.targetX - p.x) * pull;
        p.vy += (p.targetY - p.y) * pull;

        if (lively) {
          // Ambient drift
          p.vx += Math.sin(elapsed * 0.5 + p.targetY * 0.1) * 0.15;
          p.vy += Math.cos(elapsed * 0.5 + p.targetX * 0.1) * 0.15;
          p.vx *= 0.92;
          p.vy *= 0.92;
        } else {
          p.vx *= 0.85;
          p.vy *= 0.85;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (
          Math.abs(p.targetX - p.x) > 0.05 ||
          Math.abs(p.targetY - p.y) > 0.05
        ) {
          stillMoving = true;
        }
      }

      if (!lively && !stillMoving) {
        // Settled: snap to the targets and stop until the next interaction
        particles.forEach((p) => {
          p.x = p.targetX;
          p.y = p.targetY;
          p.shown = p.alpha;
        });
        drawPortrait();
        running = false;
        return;
      }

      drawPortrait();
      requestAnimationFrame(animatePortrait);
    }

    function startPortrait() {
      if (!running && visible) {
        running = true;
        requestAnimationFrame(animatePortrait);
      }
    }

    function movePointer(e) {
      const rect = portraitCanvas.getBoundingClientRect();
      pointer.targetX = ((e.clientX - rect.left) / rect.width) * BASE;
      pointer.targetY = ((e.clientY - rect.top) / rect.height) * BASE;
      if (!pointer.active) {
        pointer.x = pointer.targetX;
        pointer.y = pointer.targetY;
        pointer.active = true;
      }
      startPortrait();
    }

    function releasePointer() {
      pointer.active = false;
    }

    portraitCanvas.addEventListener("pointermove", movePointer);
    portraitCanvas.addEventListener("pointerdown", movePointer);
    portraitCanvas.addEventListener("pointerleave", releasePointer);
    portraitCanvas.addEventListener("pointerup", releasePointer);
    portraitCanvas.addEventListener("pointercancel", releasePointer);

    // Pause while the hero is off screen
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      startPortrait();
    }).observe(portraitCanvas);
  }
}

// ===== Skills: staggered "equip" animation =====
const loadoutPanels = document.querySelectorAll(".loadout-panel");

if (loadoutPanels.length && !reduceMotion) {
  const equipObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("equipped");
          equipObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25 },
  );

  loadoutPanels.forEach((panel) => {
    // Item index drives the stagger delay in CSS
    panel.querySelectorAll(".equip-item").forEach((item, i) => {
      item.style.setProperty("--i", i);
    });
    panel.classList.add("will-equip");
    equipObserver.observe(panel);
  });
}

// ===== Off the clock: scroll-driven scatter-to-grid =====
// The section becomes a tall scroll track with a sticky stage. Scroll progress through
// it moves each card from a scattered 3D position into its grid slot (and back).
const offClock = document.querySelector(".off-clock");

if (offClock && !reduceMotion) {
  const stage = offClock.querySelector(".off-clock-stage");
  const grid = offClock.querySelector(".clock-grid");
  const cards = [...grid.children];
  const clamp = (value) => Math.min(1, Math.max(0, value));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // Seeded PRNG so the scattered layout is the same on every load
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const throws = cards.map(() => ({
    x: random() - 0.5,
    y: random() - 0.5,
    spin: (random() - 0.5) * 140,
    tiltX: (random() - 0.5) * 160,
    tiltY: (random() - 0.5) * 160,
    scale: 0.7 + random() * 0.9,
  }));

  // Seeded shuffle of the landing order
  const landStep = cards.map((_, i) => i);
  for (let i = landStep.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [landStep[i], landStep[j]] = [landStep[j], landStep[i]];
  }

  let slots = [];
  let stageW = 0;
  let stageH = 0;

  offClock.classList.add("is-scatter");

  // Card size and final grid position for each card
  function layoutClockGrid() {
    stageW = stage.clientWidth;
    stageH = stage.clientHeight;
    const small = stageW < 576;
    const cols = small ? 3 : 4;
    const rows = Math.ceil(cards.length / cols);
    const gap = small ? 8 : 16;
    const ratio = small ? 1 : 0.75; // 1:1 on phones, 4:3 otherwise
    const cardW = Math.min(
      (grid.clientWidth - gap * (cols - 1)) / cols,
      (grid.clientHeight - gap * (rows - 1)) / rows / ratio,
    );
    const cardH = cardW * ratio;
    grid.style.setProperty("--cw", `${cardW}px`);
    grid.style.setProperty("--ch", `${cardH}px`);

    const gridW = cols * cardW + (cols - 1) * gap;
    const gridH = rows * cardH + (rows - 1) * gap;
    slots = cards.map((_, i) => ({
      x: -gridW / 2 + (i % cols) * (cardW + gap) + cardW / 2,
      y: -gridH / 2 + Math.floor(i / cols) * (cardH + gap) + cardH / 2,
    }));
  }

  // progress: 0 = fully scattered, 1 = fully assembled
  function placeCards(progress) {
    cards.forEach((card, i) => {
      const t = easeOut(clamp((progress * 1.55 - landStep[i] * 0.045) / 0.6));
      const from = throws[i];
      const mix = (start, end) => start + (end - start) * t;
      card.style.transform =
        `translate(-50%, -50%) ` +
        `translate(${mix(from.x * stageW * 1.5, slots[i].x)}px, ${mix(from.y * stageH * 1.5, slots[i].y)}px) ` +
        `rotate(${mix(from.spin, 0)}deg) rotateX(${mix(from.tiltX, 0)}deg) ` +
        `rotateY(${mix(from.tiltY, 0)}deg) scale(${mix(from.scale, 1)})`;
      card.style.zIndex = t < 1 ? 2 + Math.round((1 - t) * 50) : 1; // in-flight cards on top
    });
  }

  function scrollProgress() {
    const box = offClock.getBoundingClientRect();
    return clamp(-box.top / (box.height - window.innerHeight));
  }

  let shown = null;
  let onScreen = false;
  let looping = false;

  // Ease toward the scroll position each frame
  function animateClock() {
    const target = scrollProgress();
    shown = shown === null ? target : shown + (target - shown) * 0.12;
    placeCards(shown);
    if (onScreen || Math.abs(target - shown) > 0.001) {
      requestAnimationFrame(animateClock);
    } else {
      looping = false;
    }
  }

  layoutClockGrid();
  placeCards(scrollProgress());

  // Run the loop only while the section is on screen
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen && !looping) {
      looping = true;
      shown = null; // resync to the current scroll position
      requestAnimationFrame(animateClock);
    }
  }).observe(offClock);

  // Switch the images to eager loading shortly before the section is reached
  new IntersectionObserver(
    ([entry], observer) => {
      if (entry.isIntersecting) {
        cards.forEach((card) => (card.querySelector("img").loading = "eager"));
        observer.disconnect();
      }
    },
    { rootMargin: "1500px 0px" },
  ).observe(offClock);

  window.addEventListener("resize", () => {
    layoutClockGrid();
    placeCards(shown ?? scrollProgress());
  });
}

// ===== Contact: pre-filled WhatsApp and email messages =====
const WHATSAPP_NUMBER = "2348146776126";
const EMAIL = "ienyiolisa@gmail.com";
const missionChip = document.querySelector(".mission-chip");

// Point the contact links at a message for the selected service (or a general one)
function setMission(mission) {
  const message = mission
    ? `Hi John-Paul, I'm interested in your ${mission} service.`
    : "Hi John-Paul, I found your portfolio and I'd like to talk about a project.";
  const subject = mission ? `Project enquiry: ${mission}` : "Project enquiry";
  const body = encodeURIComponent(message);
  const su = encodeURIComponent(subject);

  document.querySelectorAll("[data-contact]").forEach((link) => {
    const type = link.dataset.contact;
    if (type === "whatsapp") {
      link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${body}`;
    }
    if (type === "email") {
      link.href = `mailto:${EMAIL}?subject=${su}&body=${body}`;
    }
    if (type === "gmail") {
      link.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}&su=${su}&body=${body}`;
    }
  });

  missionChip.hidden = !mission;
  if (mission) {
    missionChip.querySelector(".mission-chip-name").textContent = mission;
  }
}

// Service buttons select a mission on their way to the Contact section
document.querySelectorAll("[data-mission]").forEach((button) => {
  button.addEventListener("click", () => setMission(button.dataset.mission));
});

missionChip
  .querySelector(".mission-chip-clear")
  .addEventListener("click", () => setMission(null));

// Copy to clipboard, with a fallback when the Clipboard API is unavailable
document.querySelectorAll(".copy-btn").forEach((button) => {
  const label = button.querySelector("span");
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
    } catch {
      const field = document.createElement("textarea");
      field.value = button.dataset.copy;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    button.classList.add("is-copied");
    label.textContent = "Copied!";
    setTimeout(() => {
      button.classList.remove("is-copied");
      label.textContent = "Copy";
    }, 2000);
  });
});

// ===== Footer =====
document.getElementById("year").textContent = new Date().getFullYear();
