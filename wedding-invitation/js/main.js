/* ═════════════════════════════════════════════════════════
   Amee ♥ Ridham — Wedding Invitation
   Lenis smooth scroll + GSAP ScrollTrigger + themed particles
   ═════════════════════════════════════════════════════════ */

(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ─────────────── Loader ─────────────── */

  let onLoaderDone = null; // assigned once the hero timeline exists

  const loader = document.getElementById("loader");
  const hideLoader = () => {
    loader.classList.add("is-done");
    document.body.style.overflow = "";
    if (onLoaderDone) onLoaderDone();
  };
  document.body.style.overflow = "hidden";

  // Hide once the hero media has a first frame (or after a max wait)
  const heroMedia = document.querySelector(".hero__media");
  const minWait = new Promise((r) => setTimeout(r, 1400));
  const mediaReady = new Promise((r) => {
    if (!heroMedia || heroMedia.readyState >= 2) return r();
    heroMedia.addEventListener("loadeddata", r, { once: true });
    heroMedia.addEventListener("error", r, { once: true });
  });
  Promise.race([
    Promise.all([minWait, mediaReady]),
    new Promise((r) => setTimeout(r, 4500)),
  ]).then(hideLoader);

  /* ─────────────── Countdown ─────────────── */

  // counts down to the Lagan — 29 January 2027, 7:00 PM IST
  const target = new Date("2027-01-29T19:00:00+05:30").getTime();
  const cd = {
    d: document.getElementById("cd-d"),
    h: document.getElementById("cd-h"),
    m: document.getElementById("cd-m"),
    s: document.getElementById("cd-s"),
  };

  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    const diff = Math.max(0, target - Date.now());
    cd.d.textContent = pad(Math.floor(diff / 864e5));
    cd.h.textContent = pad(Math.floor(diff / 36e5) % 24);
    cd.m.textContent = pad(Math.floor(diff / 6e4) % 60);
    cd.s.textContent = pad(Math.floor(diff / 1e3) % 60);
  }
  tick();
  setInterval(tick, 1000);

  /* ─────────────── Background music ─────────────── */

  const audio = document.getElementById("melody");
  const musicBtn = document.getElementById("music-btn");
  let musicWanted = true;

  const updateMusicBtn = () => {
    musicBtn.classList.toggle("is-off", !musicWanted);
    musicBtn.classList.toggle("is-playing", !audio.paused);
    musicBtn.setAttribute("aria-pressed", String(musicWanted));
    musicBtn.setAttribute("aria-label", musicWanted ? "Pause music" : "Play music");
  };

  const tryPlayMusic = () => {
    if (!musicWanted) return;
    audio.volume = 0.55;
    audio.play().then(updateMusicBtn).catch(() => {});
  };

  tryPlayMusic(); // browsers may block until first touch — retried below
  ["pointerdown", "touchstart", "keydown", "scroll"].forEach((ev) =>
    window.addEventListener(ev, tryPlayMusic, { once: true, passive: true })
  );

  musicBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    musicWanted = !musicWanted;
    if (musicWanted) tryPlayMusic();
    else audio.pause();
    updateMusicBtn();
  });
  audio.addEventListener("play", updateMusicBtn);
  audio.addEventListener("pause", updateMusicBtn);

  /* ─────────────── GSAP setup (scroll is native CSS snap) ─────────────── */

  if (!window.gsap || !window.ScrollTrigger) {
    // animation libs unavailable — show all content statically
    document.querySelectorAll(".reveal, .anim").forEach((el) => (el.style.opacity = 1));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll(".dots__dot").forEach((dot) => {
    dot.addEventListener("click", (e) => {
      e.preventDefault();
      const el = document.querySelector(dot.getAttribute("href"));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* one wheel gesture = exactly one page (touch flicks already snap natively) */
  const panels = Array.from(document.querySelectorAll(".panel"));
  let paging = false;
  window.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (paging || Math.abs(e.deltaY) < 8) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const idx = Math.round(window.scrollY / window.innerHeight);
      const next = Math.max(0, Math.min(panels.length - 1, idx + dir));
      if (next === idx) return;
      paging = true;
      panels[next].scrollIntoView({ behavior: "smooth" });
      setTimeout(() => (paging = false), 850);
    },
    { passive: false }
  );

  if (prefersReduced) {
    // Show everything statically and stop here.
    document.querySelectorAll(".reveal, .anim").forEach((el) => (el.style.opacity = 1));
    return;
  }

  /* ─────────────── Backdrop gradient crossfade (no hard breaks) ─────────────── */

  const layers = {};
  document.querySelectorAll(".backdrop__layer").forEach((l) => (layers[l.dataset.key] = l));

  // every page has a trigger and they all switch at the 50% line, so the
  // colour changes exactly when a page takes over — identical up or down
  const themes = [
    { sel: "#hero",      key: "hero" },
    { sel: "#blessings", key: "hero" },
    { sel: "#mandvo",    key: "mandvo" },
    { sel: "#haldi",     key: "haldi" },
    { sel: "#sangeet",   key: "sangeet" },
    { sel: "#lagan",     key: "lagan" },
    { sel: "#venue",     key: "venue" },
  ];

  function showLayer(key) {
    Object.entries(layers).forEach(([k, el]) => {
      gsap.to(el, { opacity: k === key ? 1 : 0, duration: 0.9, ease: "power2.out", overwrite: "auto" });
    });
  }

  themes.forEach(({ sel, key }) => {
    ScrollTrigger.create({
      trigger: sel,
      start: "top 50%",
      end: "bottom 50%",
      onEnter: () => showLayer(key),
      onEnterBack: () => showLayer(key),
    });
  });

  /* ─────────────── Active dot tracking ─────────────── */

  const dots = document.querySelectorAll(".dots__dot");
  themes.forEach(({ sel }, i) => {
    ScrollTrigger.create({
      trigger: sel,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (st) => {
        if (st.isActive) {
          dots.forEach((d) => d.classList.remove("is-active"));
          dots[i] && dots[i].classList.add("is-active");
        }
      },
    });
  });

  /* ─────────────── Hero animations ─────────────── */

  // Explicit initial states set immediately — nothing can flash while the
  // loader is up, and the intro only plays once the loader is gone.
  gsap.set(".hero__ganesh, .hero__pre-wrap, .hero__invite, .hero__date-badge, .hero__place, .hero__cd-wrap", { opacity: 0, y: 26 });
  gsap.set(".hero__scroll", { opacity: 0 });
  gsap.set(".hero__name--amee", { opacity: 0, x: -60 });
  gsap.set(".hero__name--ridham", { opacity: 0, x: 60 });
  gsap.set(".hero__amp", { opacity: 0, scale: 0 });
  gsap.set(".hero__corner", { opacity: 0, scale: 0.6 });

  const heroTl = gsap.timeline({ paused: true });
  heroTl
    .to(".hero__corner", { opacity: 0.9, scale: 1, duration: 0.8, stagger: 0.05, ease: "power3.out" })
    .to(".hero__ganesh", { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, "-=0.7")
    .to(".hero__pre-wrap", { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, "-=0.5")
    .to(".hero__name--amee", { x: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, "-=0.45")
    .to(".hero__amp", { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2.5)" }, "-=0.6")
    .to(".hero__name--ridham", { x: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, "-=0.8")
    .to(".hero__invite", { y: 0, opacity: 1, duration: 0.6 }, "-=0.5")
    .to(".hero__date-badge", { y: 0, opacity: 1, duration: 0.6 }, "-=0.4")
    .to(".hero__place", { y: 0, opacity: 1, duration: 0.6 }, "-=0.42")
    .to(".hero__cd-wrap", { y: 0, opacity: 1, duration: 0.7 }, "-=0.42")
    .to(".hero__scroll", { opacity: 1, duration: 0.8 }, "-=0.3");

  onLoaderDone = () => setTimeout(() => heroTl.play(), 250);
  if (loader.classList.contains("is-done")) onLoaderDone();

  // hero parallax: bg drifts slower + zooms out while scrolling away
  gsap.to(".hero__media", {
    yPercent: 14,
    scale: 1.0,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
  gsap.to(".hero__content", {
    yPercent: -18,
    opacity: 0.15,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom 25%", scrub: true },
  });

  /* ─────────────── Generic reveals ─────────────── */

  document.querySelectorAll(".blessings .reveal, .venue .reveal").forEach((el) => {
    gsap.fromTo(
      el,
      { y: 36, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      }
    );
  });

  /* ─────────────── Event sections: splash FIRST, then the content loads ─────────────── */

  document.querySelectorAll(".event").forEach((section) => {
    const key = section.dataset.theme;
    const guj = section.querySelector(".event__guj");
    const sub = section.querySelector(".event__sub");
    const no = section.querySelector(".event__no");
    const letters = section.querySelectorAll(".event__title span");
    const card = section.querySelector(".event__card");
    const img = section.querySelector(".event__media");
    const shine = section.querySelector(".event__card-shine");
    const details = section.querySelectorAll(".detail, .event__desc");

    // hidden until the splash has fired
    gsap.set([guj, sub], { opacity: 0, y: 18 });
    gsap.set(no, { opacity: 0, scale: 1.5 });
    gsap.set(letters, { opacity: 0, y: 40, rotateX: -70 });
    gsap.set(card, { opacity: 0, rotateX: 34, rotateY: -8, z: -240, y: 110, scale: 0.88, transformOrigin: "center 85%" });
    gsap.set(details, { opacity: 0, y: 26 });

    const etl = gsap.timeline({ paused: true });
    etl
      .to(guj, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" })
      .to(letters, { opacity: 1, y: 0, rotateX: 0, stagger: 0.05, duration: 0.7, ease: "back.out(1.8)" }, "-=0.3")
      .to(sub, { opacity: 1, y: 0, duration: 0.5 }, "-=0.4")
      .to(no, { opacity: 0.22, scale: 1, duration: 0.8 }, "-=0.5")
      .to(card, { opacity: 1, rotateX: 0, rotateY: 0, z: 0, y: 0, scale: 1, duration: 0.9, ease: "power3.out" }, "-=0.55")
      .to(shine, { x: "240%", duration: 1.1, ease: "power2.inOut" }, "-=0.35")
      .to(details, { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power3.out" }, "-=1.0");

    let pending = null;
    const enter = () => {
      spawnBurst(key); // splash pops immediately…
      if (pending) pending.kill();
      pending = gsap.delayedCall(0.55, () => etl.restart()); // …then the event loads
    };
    const leave = () => {
      if (pending) pending.kill();
      etl.pause(0); // rewind so re-entering replays splash + content
    };

    ScrollTrigger.create({
      trigger: section,
      start: "top 50%",
      end: "bottom 50%",
      onEnter: enter,
      onEnterBack: enter,
      onLeave: leave,
      onLeaveBack: leave,
    });

    // inner media parallax within the arch frame
    gsap.fromTo(
      img,
      { yPercent: -7 },
      {
        yPercent: 7,
        ease: "none",
        scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });

  /* ─────────────── Ambient video playback (lazy, viewport-aware) ─────────────── */

  const heroVideo = document.querySelector(".hero__media");
  if (heroVideo) heroVideo.play().catch(() => {});

  const eventVideos = document.querySelectorAll(".event__media");
  if ("IntersectionObserver" in window) {
    const vObs = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target: v, isIntersecting }) => {
          if (isIntersecting) {
            if (v.preload === "none") v.preload = "auto";
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      },
      { rootMargin: "60% 0px" } // start a bit before the card scrolls in
    );
    eventVideos.forEach((v) => vObs.observe(v));
  } else {
    eventVideos.forEach((v) => v.play().catch(() => {}));
  }

  /* ═══════════════ BURST ENGINE — natural, hand-drawn particle shapes ═══════════════
     No ambient falling particles: the canvas is only used for the
     entrance splashes, drawn from pre-rendered natural sprites. */

  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");
  let W, H, DPR;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  /* colour helper: shade("#ff9d2e", 0.3) → lighter, negative → darker */
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.max(0, Math.min(255, v + 255 * amt)) | 0;
    return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
  }

  /* sprite painters — drawn once onto offscreen canvases */
  const SHAPES = {
    // single flower petal with vein + light tip
    petal(g, r, color) {
      const grad = g.createLinearGradient(0, -r, 0, r);
      grad.addColorStop(0, shade(color, 0.35));
      grad.addColorStop(1, color);
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(0, -r);
      g.bezierCurveTo(r * 0.68, -r * 0.45, r * 0.72, r * 0.4, 0, r);
      g.bezierCurveTo(-r * 0.72, r * 0.4, -r * 0.68, -r * 0.45, 0, -r);
      g.fill();
      g.strokeStyle = "rgba(255,255,255,0.4)";
      g.lineWidth = r * 0.06;
      g.beginPath();
      g.moveTo(0, -r * 0.65);
      g.quadraticCurveTo(r * 0.1, 0, 0, r * 0.65);
      g.stroke();
    },

    // layered marigold blossom
    blossom(g, r, color) {
      for (let ring = 0; ring < 2; ring++) {
        const pr = r * (ring ? 0.62 : 1);
        const pc = ring ? shade(color, 0.22) : color;
        const petals = 8;
        for (let i = 0; i < petals; i++) {
          g.save();
          g.rotate((Math.PI * 2 * i) / petals + ring * 0.39);
          const grad = g.createLinearGradient(0, 0, 0, -pr);
          grad.addColorStop(0, shade(pc, -0.12));
          grad.addColorStop(1, shade(pc, 0.18));
          g.fillStyle = grad;
          g.beginPath();
          g.ellipse(0, -pr * 0.55, pr * 0.3, pr * 0.5, 0, 0, Math.PI * 2);
          g.fill();
          g.restore();
        }
      }
      g.fillStyle = shade(color, -0.38);
      g.beginPath();
      g.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = shade(color, -0.15);
      g.beginPath();
      g.arc(-r * 0.06, -r * 0.06, r * 0.12, 0, Math.PI * 2);
      g.fill();
    },

    // wide curved rose petal with a highlight curl
    rose(g, r, color) {
      const grad = g.createLinearGradient(0, -r, 0, r);
      grad.addColorStop(0, shade(color, 0.28));
      grad.addColorStop(0.65, color);
      grad.addColorStop(1, shade(color, -0.18));
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(-r * 0.78, -r * 0.05);
      g.bezierCurveTo(-r * 0.85, -r * 0.85, r * 0.85, -r * 0.85, r * 0.78, -r * 0.05);
      g.bezierCurveTo(r * 0.6, r * 0.7, -r * 0.6, r * 0.7, -r * 0.78, -r * 0.05);
      g.fill();
      g.strokeStyle = "rgba(255,255,255,0.35)";
      g.lineWidth = r * 0.07;
      g.beginPath();
      g.moveTo(-r * 0.45, -r * 0.4);
      g.quadraticCurveTo(0, -r * 0.62, r * 0.45, -r * 0.4);
      g.stroke();
    },

    // irregular holi paint splat with satellite droplets
    splat(g, r, color, variant) {
      g.fillStyle = color;
      g.beginPath();
      const pts = 11;
      for (let i = 0; i <= pts; i++) {
        const a = (Math.PI * 2 * i) / pts;
        const wob =
          0.62 +
          0.38 * Math.abs(Math.sin(i * 2.7 + variant * 5.1)) *
          (0.7 + 0.3 * Math.sin(i * 4.3 + variant * 2.4));
        const px = Math.cos(a) * r * wob;
        const py = Math.sin(a) * r * wob;
        if (i === 0) g.moveTo(px, py);
        else g.quadraticCurveTo(
          Math.cos(a - Math.PI / pts) * r * (wob + 0.18),
          Math.sin(a - Math.PI / pts) * r * (wob + 0.18),
          px, py
        );
      }
      g.closePath();
      g.fill();
      for (let d = 0; d < 4; d++) {
        const a = variant * 2.2 + d * 1.7;
        g.beginPath();
        g.arc(Math.cos(a) * r * 1.02, Math.sin(a) * r * 1.02, r * (0.08 + 0.07 * ((d + variant) % 3)), 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = shade(color, 0.25);
      g.beginPath();
      g.arc(-r * 0.18, -r * 0.18, r * 0.3, 0, Math.PI * 2);
      g.fill();
    },

    // four-point firecracker star
    star(g, r, color) {
      g.fillStyle = color;
      g.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i;
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        g.lineTo(Math.cos(a + Math.PI / 4) * r * 0.22, Math.sin(a + Math.PI / 4) * r * 0.22);
      }
      g.closePath();
      g.fill();
      const glow = g.createRadialGradient(0, 0, 0, 0, 0, r);
      glow.addColorStop(0, "rgba(255,255,255,0.9)");
      glow.addColorStop(0.35, shade(color, 0.2) + "");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      g.globalAlpha = 0.7;
      g.fillStyle = glow;
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
    },
  };

  const spriteCache = new Map();
  function sprite(shape, color, variant = 0) {
    const k = shape + color + variant;
    let c = spriteCache.get(k);
    if (c) return c;
    c = document.createElement("canvas");
    c.width = c.height = 96;
    const g = c.getContext("2d");
    g.translate(48, 48);
    SHAPES[shape](g, 42, color, variant);
    spriteCache.set(k, c);
    return c;
  }

  /* burst definitions */
  const MARIGOLD = ["#ff9d2e", "#ffb84d", "#f4c542", "#e8862a"];
  const HOLI = ["#b06ee0", "#f4c542", "#ff6fa5", "#4dd0c4", "#8e4fd1", "#ffd166"];
  const ROSE = ["#e63e57", "#f2657a", "#f298a3", "#fbd9dc"];
  const CRACKER = ["#ffd76e", "#fff3c4", "#ff9d5c", "#ffe9a8"];

  const burstParticles = [];
  const lastBurst = {};
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  function pushShape(o) {
    burstParticles.push(Object.assign({
      delay: 0, g: 0.07, drag: 0.985, rot: rand(0, Math.PI * 2), vr: rand(-0.14, 0.14),
      sway: rand(0, Math.PI * 2), swayS: rand(0.02, 0.05), swayA: rand(0.2, 0.8),
      life: 1, decay: 0.007, scale: 1, scaleV: 0, trail: null,
    }, o));
  }

  function spawnBurst(key) {
    const now = Date.now();
    if (lastBurst[key] && now - lastBurst[key] < 1500) return;
    lastBurst[key] = now;

    const cx = W / 2;
    const cy = H * 0.38;

    if (key === "mandvo") {
      // marigold shower: whole blossoms + loose petals
      for (let i = 0; i < 16; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(2, 6.5);
        pushShape({
          img: sprite("blossom", pick(MARIGOLD)),
          x: cx + rand(-60, 60), y: cy + rand(-50, 50),
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2,
          size: rand(20, 34), decay: rand(0.006, 0.01), delay: rand(0, 140),
        });
      }
      for (let i = 0; i < 26; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(3, 8);
        pushShape({
          img: sprite("petal", pick(MARIGOLD)),
          x: cx + rand(-70, 70), y: cy + rand(-60, 60),
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2.4,
          size: rand(10, 18), g: 0.06, decay: rand(0.006, 0.011), delay: rand(0, 200),
        });
      }
    } else if (key === "haldi") {
      // holi: paint splats burst out and powder clouds bloom
      for (let i = 0; i < 24; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(3, 9);
        pushShape({
          img: sprite("splat", pick(HOLI), (Math.random() * 4) | 0),
          x: cx + rand(-50, 50), y: cy + rand(-40, 40),
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.6,
          size: rand(12, 26), g: 0.085, drag: 0.978,
          decay: rand(0.008, 0.013), delay: rand(0, 160),
        });
      }
      for (let i = 0; i < 9; i++) {
        pushShape({
          kind: "puff", color: pick(HOLI),
          x: cx + rand(-100, 100), y: cy + rand(-70, 70),
          vx: rand(-1.2, 1.2), vy: rand(-1.6, 0.3),
          size: rand(26, 44), scaleV: rand(0.015, 0.03),
          g: -0.004, drag: 0.985, decay: rand(0.011, 0.016), delay: rand(0, 220),
        });
      }
    } else if (key === "sangeet") {
      // firecrackers: rockets rise then explode into star sparks
      for (let s = 0; s < 3; s++) {
        pushShape({
          kind: "rocket", color: pick(CRACKER),
          x: W * rand(0.25, 0.75), y: H + 12,
          vx: rand(-0.7, 0.7), vy: rand(-13.5, -11),
          targetY: H * rand(0.18, 0.4),
          g: 0.12, drag: 1, decay: 0.0001, delay: s * 380, trail: [],
        });
      }
    } else if (key === "lagan") {
      // rose petal shower
      for (let i = 0; i < 34; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(2.5, 7.5);
        pushShape({
          img: sprite("rose", pick(ROSE)),
          x: cx + rand(-70, 70), y: cy + rand(-60, 60),
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2.2,
          size: rand(12, 22), g: 0.055, decay: rand(0.005, 0.009), delay: rand(0, 220),
        });
      }
    }
  }

  function explodeRocket(p) {
    for (let i = 0; i < 26; i++) {
      const a = (Math.PI * 2 * i) / 26 + rand(-0.12, 0.12);
      const sp = rand(2.2, 6.2);
      pushShape({
        kind: "spark", img: sprite("star", pick(CRACKER)),
        x: p.x, y: p.y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        size: rand(7, 13), g: 0.05, drag: 0.972,
        decay: rand(0.009, 0.015), tw: rand(0, Math.PI * 2), trail: [],
      });
    }
  }

  let rafPaused = document.hidden;
  document.addEventListener("visibilitychange", () => {
    rafPaused = document.hidden;
    if (!rafPaused) requestAnimationFrame(frame);
  });

  function frame() {
    if (rafPaused) return;
    ctx.clearRect(0, 0, W, H);

    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const p = burstParticles[i];
      if (p.delay > 0) { p.delay -= 16.7; continue; }

      p.sway += p.swayS || 0;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.g;
      p.x += p.vx + (p.swayA ? Math.sin(p.sway) * p.swayA * 0.35 : 0);
      p.y += p.vy;
      p.rot += p.vr;
      p.scale += p.scaleV;
      p.life -= p.decay;

      if (p.kind === "rocket" && (p.y <= p.targetY || p.vy > -1)) {
        explodeRocket(p);
        burstParticles.splice(i, 1);
        continue;
      }
      if (p.life <= 0 || p.y > H + 60) { burstParticles.splice(i, 1); continue; }

      if (p.trail) {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 6) p.trail.shift();
        ctx.strokeStyle = p.color || "#ffd76e";
        ctx.lineCap = "round";
        for (let t = 1; t < p.trail.length; t++) {
          ctx.globalAlpha = (t / p.trail.length) * 0.4 * Math.max(0, p.life);
          ctx.lineWidth = t * 0.5;
          ctx.beginPath();
          ctx.moveTo(p.trail[t - 1].x, p.trail[t - 1].y);
          ctx.lineTo(p.trail[t].x, p.trail[t].y);
          ctx.stroke();
        }
      }

      if (p.kind === "rocket") {
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = "#fff3c4";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === "puff") {
        const r = p.size * p.scale;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, p.color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = Math.max(0, p.life * 0.5);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const twinkle = p.kind === "spark" ? 0.65 + 0.35 * Math.sin((p.tw += 0.3)) : 1;
        const s = p.size * p.scale;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.15)) * twinkle;
        ctx.drawImage(p.img, -s / 2, -s / 2, s, s);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
