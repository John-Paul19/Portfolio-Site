// ===== Navbar =====
const nav = document.querySelector(".site-nav");
const navMenu = document.getElementById("navMenu");

// Soft shadow under the navbar once the page is scrolled
function updateNavShadow() {
  nav.classList.toggle("scrolled", window.scrollY > 10);
}

updateNavShadow();
window.addEventListener("scroll", updateNavShadow, { passive: true });

// On phones, close the dropdown menu after a link is tapped
nav.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    if (navMenu.classList.contains("show")) {
      bootstrap.Collapse.getOrCreateInstance(navMenu, { toggle: false }).hide();
    }
  });
});

// ===== Hero typing effect =====
const typedLines = [
  "Full-Stack Web Developer",
  "Loadout: HTML · CSS · JS · Node · Pyth",
  "Locked and loaded, Let's build!",
  "Zero lags, Clean code, GGs.",
];

const typedEl = document.getElementById("typed");
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (reduceMotion) {
  // No animation: just show the first line
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
      // Finished typing: hold the line, then start deleting
      deleting = true;
      delay = 1800;
    } else if (deleting && charIndex === 0) {
      // Finished deleting: move to the next line
      deleting = false;
      lineIndex = (lineIndex + 1) % typedLines.length;
      delay = 400;
    }

    setTimeout(typeStep, delay);
  }

  setTimeout(typeStep, 800);
}

// ===== Hero ASCII portrait =====
// The photo is stored as rows of characters in portrait-ascii.js. Every character is a
// particle: they fly in and form the portrait, shimmer, and scatter away from the cursor.
const portraitCanvas = document.getElementById("portrait");

if (portraitCanvas && typeof PORTRAIT_ASCII !== "undefined") {
  const ctx = portraitCanvas.getContext("2d");
  const { font, colGap, rowGap, chars, rows } = PORTRAIT_ASCII;
  const BASE = 400; // particles live in a 400 x 400 space, scaled to the canvas size
  const FADE_ROWS = 8; // the bottom rows fade out instead of ending in a hard line
  const WHITE = "#ffffff";
  const LIGHT_GREEN = "#b8f0d4";

  // Centre the portrait in the 400 x 400 space
  const offsetX =
    (BASE - Math.max(...rows.map((row) => row.length)) * colGap) / 2;
  const offsetY = (BASE - rows.length * rowGap) / 2;

  const particles = [];
  rows.forEach((row, r) => {
    [...row].forEach((char, c) => {
      if (char === " ") return;
      const density = chars.indexOf(char) / (chars.length - 1); // 0 = light, 1 = dense
      const targetX = offsetX + c * colGap + colGap / 2;
      const targetY = offsetY + r * rowGap + rowGap / 2;
      particles.push({
        char,
        targetX,
        targetY,
        x: targetX + (Math.random() - 0.5) * BASE, // start scattered
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

  // Draw light-green characters first, then white, so the colour only switches once
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
    // No animation: show the finished portrait
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

      // Ease the pointer so the scatter follows it smoothly
      pointer.x += (pointer.targetX - pointer.x) * 0.15;
      pointer.y += (pointer.targetY - pointer.y) * 0.15;

      const lively = pointer.active || elapsed < 3; // shimmer during the intro and while touched
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

        // Push away from the pointer
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

        // Pull back towards its place in the portrait
        const pull = 0.01 + settle * 0.08;
        p.vx += (p.targetX - p.x) * pull;
        p.vy += (p.targetY - p.y) * pull;

        if (lively) {
          // Gentle drift, like breathing
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
        // Everything has settled: snap into place and stop until the pointer comes back
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

    // Pause when the hero is scrolled out of view
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      startPortrait();
    }).observe(portraitCanvas);
  }
}

// ===== Skills: "equip" each loadout panel when it scrolls into view =====
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
    // Number the items so they equip one after another
    panel.querySelectorAll(".equip-item").forEach((item, i) => {
      item.style.setProperty("--i", i);
    });
    panel.classList.add("will-equip");
    equipObserver.observe(panel);
  });
}

// ===== Off the clock: thrown photos fly into a grid as you scroll =====
// The section is a few screens tall and its stage sticks in place, so scrolling through
// it plays the animation (and scrolling back up rewinds it).
const offClock = document.querySelector(".off-clock");

if (offClock && !reduceMotion) {
  const stage = offClock.querySelector(".off-clock-stage");
  const grid = offClock.querySelector(".clock-grid");
  const cards = [...grid.children];
  const clamp = (value) => Math.min(1, Math.max(0, value));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // A fixed "random" throw for every photo, the same on every visit
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

  // Shuffle the order the photos land in
  const landStep = cards.map((_, i) => i);
  for (let i = landStep.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [landStep[i], landStep[j]] = [landStep[j], landStep[i]];
  }

  let slots = [];
  let stageW = 0;
  let stageH = 0;

  offClock.classList.add("is-scatter");

  // Size the cards and work out each one's place in the finished grid
  function layoutClockGrid() {
    stageW = stage.clientWidth;
    stageH = stage.clientHeight;
    const small = stageW < 576;
    const cols = small ? 3 : 4;
    const rows = Math.ceil(cards.length / cols);
    const gap = small ? 8 : 16;
    const ratio = small ? 1 : 0.75; // square cards on phones, 4:3 on bigger screens
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

  // progress 0 = every photo thrown and tumbling, 1 = all of them in the grid
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
      card.style.zIndex = t < 1 ? 2 + Math.round((1 - t) * 50) : 1; // flying cards pass over landed ones
    });
  }

  function scrollProgress() {
    const box = offClock.getBoundingClientRect();
    return clamp(-box.top / (box.height - window.innerHeight));
  }

  let shown = null;
  let onScreen = false;
  let looping = false;

  // Ease towards the scroll position every frame, so the motion glides
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

  // Only animate while the section is on screen
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen && !looping) {
      looping = true;
      shown = null; // start from wherever the scroll is now
      requestAnimationFrame(animateClock);
    }
  }).observe(offClock);

  // Load the photos a little early, so none of them are blank while they fly in
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
