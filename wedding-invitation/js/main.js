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

  /* ─────────────── Smooth scroll (Lenis) ─────────────── */

  let lenis = null;
  if (!prefersReduced && window.Lenis) {
    lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: true,
      touchMultiplier: 1.6,
    });
  }

  /* ─────────────── GSAP setup ─────────────── */

  if (!window.gsap || !window.ScrollTrigger) {
    // animation libs unavailable — show all content statically
    document.querySelectorAll(".reveal, .anim").forEach((el) => (el.style.opacity = 1));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  if (lenis) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* dot navigation clicks through Lenis */
  document.querySelectorAll(".dots__dot").forEach((dot) => {
    dot.addEventListener("click", (e) => {
      e.preventDefault();
      const el = document.querySelector(dot.getAttribute("href"));
      if (!el) return;
      if (lenis) lenis.scrollTo(el, { duration: 1.6 });
      else el.scrollIntoView({ behavior: "smooth" });
    });
  });

  if (prefersReduced) {
    // Show everything statically and stop here.
    document.querySelectorAll(".reveal, .anim").forEach((el) => (el.style.opacity = 1));
    return;
  }

  /* ─────────────── Backdrop gradient crossfade (no hard breaks) ─────────────── */

  const layers = {};
  document.querySelectorAll(".backdrop__layer").forEach((l) => (layers[l.dataset.key] = l));

  const themes = [
    { sel: "#hero",    key: "hero" },
    { sel: "#mandvo",  key: "mandvo" },
    { sel: "#haldi",   key: "haldi" },
    { sel: "#sangeet", key: "sangeet" },
    { sel: "#lagan",   key: "lagan" },
    { sel: "#venue",   key: "venue" },
  ];

  function showLayer(key) {
    Object.entries(layers).forEach(([k, el]) => {
      gsap.to(el, { opacity: k === key ? 1 : 0, duration: 1.2, ease: "power2.out", overwrite: "auto" });
    });
  }

  themes.forEach(({ sel, key }) => {
    ScrollTrigger.create({
      trigger: sel,
      start: "top 70%",
      end: "bottom 70%",
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

  document.querySelectorAll(".intro .reveal, .family .reveal, .venue .reveal").forEach((el) => {
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

  /* ─────────────── Event sections: 3D scroll choreography ─────────────── */

  document.querySelectorAll(".event").forEach((section) => {
    const head = section.querySelector(".event__head");
    const guj = section.querySelector(".event__guj");
    const sub = section.querySelector(".event__sub");
    const no = section.querySelector(".event__no");
    const letters = section.querySelectorAll(".event__title span");
    const card = section.querySelector(".event__card");
    const img = section.querySelector(".event__media");
    const shine = section.querySelector(".event__card-shine");
    const details = section.querySelectorAll(".detail, .event__desc");

    // heading letters cascade in
    const tl = gsap.timeline({
      scrollTrigger: { trigger: head, start: "top 82%" },
    });
    tl.from(guj, { y: 20, opacity: 0, duration: 0.7, ease: "power3.out" })
      .from(
        letters,
        { y: 46, opacity: 0, rotateX: -75, stagger: 0.06, duration: 0.9, ease: "back.out(1.8)" },
        "-=0.4"
      )
      .from(sub, { y: 16, opacity: 0, duration: 0.7 }, "-=0.5")
      .from(no, { opacity: 0, scale: 1.6, duration: 1 }, "-=0.8");

    // card: deep 3D sweep from perspective as it scrolls in, then shine sweep
    gsap.fromTo(
      card,
      { rotateX: 38, rotateY: -10, z: -260, y: 130, scale: 0.86, opacity: 0, transformOrigin: "center 85%" },
      {
        rotateX: 0,
        rotateY: 0,
        z: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        ease: "power2.out",
        scrollTrigger: { trigger: card, start: "top 98%", end: "top 40%", scrub: 0.6 },
      }
    );

    ScrollTrigger.create({
      trigger: card,
      start: "top 55%",
      once: true,
      onEnter: () =>
        gsap.to(shine, { x: "240%", duration: 1.4, ease: "power2.inOut", delay: 0.15 }),
    });

    // inner image parallax within the arch frame
    gsap.fromTo(
      img,
      { yPercent: -7 },
      {
        yPercent: 7,
        ease: "none",
        scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true },
      }
    );

    // details rise in a stagger
    gsap.from(details, {
      y: 30,
      opacity: 0,
      stagger: 0.14,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: section.querySelector(".event__details"), start: "top 88%" },
    });

    // whole section gently floats out as you leave (keeps flow continuous)
    gsap.to(section.querySelector(".event__inner"), {
      yPercent: -3,
      opacity: 0.6,
      ease: "none",
      scrollTrigger: { trigger: section, start: "bottom 45%", end: "bottom 8%", scrub: true },
    });
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

  /* ═══════════════ PARTICLES — themed per section ═══════════════ */

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

  /*  Each theme: colours + motion style
      petal  — drifting flower petals (ellipse with rotation)
      spark  — floating glowing bokeh dots
  */
  const PARTICLE_THEMES = {
    hero:    { kind: "petal", colors: ["#e8a63d", "#f0c979", "#d97f2e"], count: 26 }, // marigold
    mandvo:  { kind: "petal", colors: ["#ffffff", "#eef7ee", "#cfe8d2"], count: 26 }, // white flowers
    haldi:   { kind: "petal", colors: ["#c9a0ef", "#a86fd6", "#e9d3fb", "#f4c542"], count: 28 }, // purple + turmeric
    sangeet: { kind: "spark", colors: ["#f5d78e", "#e8c268", "#fff2c4"], count: 46 }, // golden bokeh
    lagan:   { kind: "petal", colors: ["#f2a0a8", "#e86a76", "#fbd9dc", "#fff5f0"], count: 32 }, // rose petals
    venue:   { kind: "spark", colors: ["#d4a959", "#f0e0b8"], count: 22 },
  };

  let currentTheme = PARTICLE_THEMES.hero;
  let particles = [];

  function makeParticle(theme, spawnAnywhere) {
    const c = theme.colors[(Math.random() * theme.colors.length) | 0];
    if (theme.kind === "spark") {
      return {
        kind: "spark",
        x: Math.random() * W,
        y: spawnAnywhere ? Math.random() * H : H + 10,
        r: 1 + Math.random() * 2.6,
        vy: -(0.15 + Math.random() * 0.45),
        vx: (Math.random() - 0.5) * 0.2,
        tw: Math.random() * Math.PI * 2,
        tws: 0.02 + Math.random() * 0.04,
        color: c,
        alpha: 0.25 + Math.random() * 0.55,
      };
    }
    return {
      kind: "petal",
      x: Math.random() * W,
      y: spawnAnywhere ? Math.random() * H : -20,
      w: 5 + Math.random() * 7,
      h: 3 + Math.random() * 4,
      vy: 0.35 + Math.random() * 0.75,
      vx: (Math.random() - 0.5) * 0.4,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.03,
      sway: Math.random() * Math.PI * 2,
      swayS: 0.008 + Math.random() * 0.015,
      swayA: 0.5 + Math.random() * 0.9,
      color: c,
      alpha: 0.5 + Math.random() * 0.45,
    };
  }

  function setTheme(theme) {
    if (theme === currentTheme) return;
    currentTheme = theme;
    // replace gradually: mark old ones to fade out
    particles.forEach((p) => (p.dying = true));
    for (let i = 0; i < theme.count; i++) particles.push(makeParticle(theme, true));
  }

  for (let i = 0; i < currentTheme.count; i++) particles.push(makeParticle(currentTheme, true));

  const sectionThemeMap = [
    { sel: "#hero", key: "hero" },
    { sel: "#mandvo", key: "mandvo" },
    { sel: "#haldi", key: "haldi" },
    { sel: "#sangeet", key: "sangeet" },
    { sel: "#lagan", key: "lagan" },
    { sel: "#venue", key: "venue" },
  ];

  sectionThemeMap.forEach(({ sel, key }) => {
    ScrollTrigger.create({
      trigger: sel,
      start: "top 70%",
      end: "bottom 70%",
      onEnter: () => setTheme(PARTICLE_THEMES[key]),
      onEnterBack: () => setTheme(PARTICLE_THEMES[key]),
    });
  });

  let rafPaused = document.hidden;
  document.addEventListener("visibilitychange", () => {
    rafPaused = document.hidden;
    if (!rafPaused) requestAnimationFrame(frame);
  });

  function frame() {
    if (rafPaused) return;
    ctx.clearRect(0, 0, W, H);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      if (p.dying) {
        p.alpha -= 0.012;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
      }

      if (p.kind === "spark") {
        p.tw += p.tws;
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -12 && !p.dying) Object.assign(p, makeParticle(currentTheme));
        const a = p.alpha * (0.55 + 0.45 * Math.sin(p.tw));
        ctx.beginPath();
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0, p.color);
        g.addColorStop(1, "transparent");
        ctx.globalAlpha = a;
        ctx.fillStyle = g;
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        p.sway += p.swayS;
        p.rot += p.vr;
        p.x += p.vx + Math.sin(p.sway) * p.swayA * 0.4;
        p.y += p.vy;
        if (p.y > H + 24 && !p.dying) Object.assign(p, makeParticle(currentTheme));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot + Math.sin(p.sway) * 0.4);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.w, p.h, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
