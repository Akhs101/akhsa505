(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  document.body.classList.add("loading");

  /* ---------- Loader ---------- */
  const loader = $("#loader");
  const loaderBar = $(".loader-bar i");
  const loaderCount = $("#loaderCount");
  let progress = 0;
  let pageLoaded = false;
  window.addEventListener("load", () => (pageLoaded = true));

  function finishLoading() {
    loader?.classList.add("hide");
    document.body.classList.remove("loading");
    document.body.classList.add("ready");
    startCounters();
  }

  if (reduceMotion || !loader) {
    finishLoading();
  } else {
    const tick = () => {
      const target = pageLoaded ? 100 : 86;
      progress += Math.max(0.6, (target - progress) * 0.08);
      if (progress > target) progress = target;
      if (loaderBar) loaderBar.style.transform = `scaleX(${progress / 100})`;
      if (loaderCount) loaderCount.textContent = Math.round(progress);
      if (progress >= 100) setTimeout(finishLoading, 250);
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // Safety net in case "load" never fires (slow fonts/images)
    setTimeout(() => (pageLoaded = true), 3500);
  }

  /* ---------- Year & clock ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  const clock = $("#clock");
  if (clock) {
    const fmt = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false, timeZone: "Asia/Jakarta",
    });
    const update = () => (clock.textContent = fmt.format(new Date()).replace(/\./g, ":"));
    update();
    setInterval(update, 1000);
  }

  const latency = $("#latency");
  if (latency) {
    setInterval(() => {
      latency.textContent = 8 + Math.round(Math.random() * 14) + "ms";
    }, 2200);
  }

  /* ---------- Typing eyebrow ---------- */
  const typing = $("#typing");
  if (typing) {
    const words = ["welcome to my portfolio", "web developer in progress", "tkj · web · network", "ping 192.168.5.05 — ok"];
    if (reduceMotion) {
      typing.textContent = words[0];
    } else {
      let wi = 0, ci = 0, del = false;
      const type = () => {
        const w = words[wi];
        ci += del ? -1 : 1;
        typing.textContent = w.slice(0, ci);
        let delay = del ? 35 : 70 + Math.random() * 40;
        if (!del && ci === w.length) { del = true; delay = 1600; }
        else if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; delay = 350; }
        setTimeout(type, delay);
      };
      setTimeout(type, 900);
    }
  }

  /* ---------- Counters ---------- */
  function startCounters() {
    $$("[data-count]").forEach((el) => {
      const end = parseInt(el.dataset.count, 10) || 0;
      const pad = (n) => String(n).padStart(2, "0");
      if (reduceMotion) { el.textContent = pad(end); return; }
      const dur = 1400;
      const t0 = performance.now() + 900;
      const step = (t) => {
        const p = Math.min(1, Math.max(0, (t - t0) / dur));
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = pad(Math.round(end * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- Navbar: scrolled / hide on scroll down / progress ---------- */
  const navbar = $("#navbar");
  const bar = $("#scrollProgress");
  const nav = $("#navMenu");
  const menu = $("#menuToggle");
  let lastY = scrollY;

  const onScroll = () => {
    const y = scrollY;
    navbar?.classList.toggle("scrolled", y > 30);
    const menuOpen = nav?.classList.contains("open");
    navbar?.classList.toggle("hidden", !menuOpen && y > lastY && y > 500);
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const setMenu = (open) => {
    nav?.classList.toggle("open", open);
    menu?.setAttribute("aria-expanded", String(open));
    menu?.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  };
  menu?.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  $$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

  /* ---------- Active nav link ---------- */
  const links = $$(".nav-link");
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("main section[id]").forEach((s) => spy.observe(s));

  /* ---------- Reveal on scroll (with stagger for siblings) ---------- */
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("visible");
        revealObs.unobserve(e.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => {
    const siblings = $$(":scope > .reveal", el.parentElement);
    const i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty("--rd", Math.min(i, 4) * 0.1 + "s");
    revealObs.observe(el);
  });

  /* ---------- Custom cursor ---------- */
  const dot = $("#cursorDot");
  const ring = $("#cursorRing");
  if (finePointer && dot && ring && !reduceMotion) {
    let mx = -100, my = -100, rx = mx, ry = my;
    document.addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      document.body.classList.add("has-cursor");
    }, { passive: true });
    document.addEventListener("pointerleave", () => document.body.classList.remove("has-cursor"));
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    };
    loop();
    $$("a, button, input, textarea, .tilt").forEach((el) => {
      el.addEventListener("pointerenter", () => ring.classList.add("hover"));
      el.addEventListener("pointerleave", () => ring.classList.remove("hover"));
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });

    /* ---------- 3D tilt ---------- */
    $$(".tilt").forEach((el) => {
      const max = el.id === "nodeCard" ? 10 : 4;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = "transform .1s linear";
        el.style.transform = `perspective(900px) rotateX(${-py * max}deg) rotateY(${px * max}deg)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "";
        el.style.transform = "";
      });
    });
  }

  /* ---------- Network canvas background ---------- */
  const canvas = $("#network");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let w, h, nodes = [], packets = [];
    const mouse = { x: -9999, y: -9999 };
    const LINK = 150;

    const resize = () => {
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      const count = Math.round(Math.min(70, (innerWidth * innerHeight) / 22000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25 * dpr,
        vy: (Math.random() - 0.5) * 0.25 * dpr,
        r: (Math.random() * 1.2 + 0.8) * dpr,
      }));
      packets = [];
    };
    resize();
    let resizeT;
    addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(resize, 150); });
    addEventListener("pointermove", (e) => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; }, { passive: true });

    let running = true;
    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
      if (running) requestAnimationFrame(draw);
    });

    const linkDist = LINK * dpr;
    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 120 * dpr && d > 0) { n.x += (dx / d) * 0.6; n.y += (dy / d) * 0.6; }
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < linkDist) {
            ctx.strokeStyle = `rgba(237,231,218,${(1 - d / linkDist) * 0.11})`;
            ctx.lineWidth = dpr * 0.7;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            if (packets.length < 6 && Math.random() < 0.0006) packets.push({ a, b, t: 0 });
          }
        }
      }

      for (const n of nodes) {
        ctx.fillStyle = "rgba(237,231,218,.35)";
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }

      packets = packets.filter((p) => (p.t += 0.012) < 1);
      for (const p of packets) {
        const x = p.a.x + (p.b.x - p.a.x) * p.t;
        const y = p.a.y + (p.b.y - p.a.y) * p.t;
        ctx.fillStyle = "rgba(232,100,58,.9)";
        ctx.beginPath(); ctx.arc(x, y, 2.2 * dpr, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ---------- Contact form (Netlify Forms via AJAX) ---------- */
  const form = $("#contactForm");
  if (form) {
    const status = $("#formStatus");
    const btn = $(".btn-send", form);
    const label = $(".send-label", form);
    const msg = $("#f-message");
    const count = $("#charCount");
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    msg?.addEventListener("input", () => { if (count) count.textContent = `${msg.value.length} / 600`; });

    const checks = {
      name: (v) => v.trim().length > 0,
      email: (v) => emailRe.test(v.trim()),
      message: (v) => v.trim().length >= 10,
    };
    const validate = (field) => {
      const ok = checks[field.name](field.value);
      field.closest(".field").classList.toggle("invalid", !ok);
      field.setAttribute("aria-invalid", String(!ok));
      return ok;
    };
    Object.keys(checks).forEach((name) => {
      const f = form.elements[name];
      f.addEventListener("blur", () => f.value && validate(f));
      f.addEventListener("input", () => f.closest(".field").classList.contains("invalid") && validate(f));
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fields = Object.keys(checks).map((n) => form.elements[n]);
      const results = fields.map(validate);
      if (results.includes(false)) {
        fields[results.indexOf(false)].focus();
        status.className = "form-status mono bad";
        status.textContent = "Periksa kembali isian yang ditandai.";
        return;
      }

      btn.disabled = true;
      btn.classList.add("sending");
      label.textContent = "Mengirim";
      status.className = "form-status mono";
      status.textContent = "";

      try {
        const res = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        if (!res.ok) throw new Error(res.status);
        form.classList.add("sent");
        label.textContent = "Terkirim";
        status.className = "form-status mono ok";
        status.textContent = "Pesan terkirim — terima kasih! Saya akan segera membalas.";
        setTimeout(() => {
          form.reset();
          form.classList.remove("sent");
          if (count) count.textContent = "0 / 600";
          label.textContent = "Kirim Pesan";
          btn.disabled = false;
        }, 4500);
      } catch {
        label.textContent = "Kirim Pesan";
        btn.disabled = false;
        status.className = "form-status mono bad";
        status.textContent = "Gagal mengirim. Coba lagi sebentar, atau hubungi lewat Instagram.";
      } finally {
        btn.classList.remove("sending");
      }
    });
  }
})();
