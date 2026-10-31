document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Toast ---------- */
  const toast = $("#toast");
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  /* ---------- Typing effect ---------- */
  const typedEl = $("#typed");
  const phrases = [
    "responsive web pages",
    "Angular storefronts",
    "tiny tools that help",
    "things that surprise my friends"
  ];
  let typingStarted = false;
  function startTyping() {
    if (!typedEl || typingStarted || reduceMotion) return;
    typingStarted = true;
    let p = 0, c = phrases[0].length, deleting = true;
    const tick = () => {
      const word = phrases[p];
      if (!deleting) {
        c++;
        typedEl.textContent = word.slice(0, c);
        if (c === word.length) { deleting = true; return setTimeout(tick, 1900); }
        return setTimeout(tick, 55);
      }
      c--;
      typedEl.textContent = word.slice(0, c);
      if (c === 0) { deleting = false; p = (p + 1) % phrases.length; return setTimeout(tick, 350); }
      setTimeout(tick, 28);
    };
    setTimeout(tick, 2200);
  }

  /* ---------- Page loader ---------- */
  const loader = $("#loader");
  let isReady = false;
  function ready() {
    if (isReady) return;
    isReady = true;
    document.body.classList.add("ready");
    if (loader) {
      loader.classList.add("done");
      setTimeout(() => loader.remove(), 800);
    }
    startTyping();
  }
  const minWait = new Promise((r) => setTimeout(r, reduceMotion ? 0 : 900));
  const pageLoaded = new Promise((r) => {
    if (document.readyState === "complete") r();
    else window.addEventListener("load", r, { once: true });
  });
  Promise.all([minWait, pageLoaded]).then(ready);
  setTimeout(ready, 3000); // safety net

  /* ---------- Mobile menu ---------- */
  const menuToggle = $("#menuToggle");
  const navLinks = $("#navLinks");
  function closeMenu() {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });
  navLinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".floating-nav")) closeMenu();
  });

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Reveal on scroll + counters ---------- */
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
    const duration = 1500;
    const start = performance.now();
    const step = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const revealItems = $$(".reveal");
  if ("IntersectionObserver" in window) {
    $$("[data-count]").forEach((el) => {
      el.textContent = (0).toFixed(parseInt(el.dataset.decimals || "0", 10));
    });
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("is-visible");
        $$("[data-count]", el).forEach(countUp);
        obs.unobserve(el);
        // Drop the stagger delay afterwards so hover effects stay snappy.
        setTimeout(() => el.style.setProperty("--d", "0s"), 1400);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ---------- Scroll effects: progress, nav, back-to-top, scrollspy, parallax ---------- */
  const bar = $("#scrollProgress");
  const nav = $(".floating-nav");
  const backTop = $("#backTop");
  const ring = $(".ring", backTop);
  const ambients = $$(".ambient");
  const spyLinks = $$(".nav-links a").filter((a) =>
    ["#projects", "#about", "#contact"].includes(a.getAttribute("href")));
  const spyTargets = spyLinks.map((a) => ({ a, el: $(a.getAttribute("href")) }));
  const RING_LENGTH = 125.66;
  let ticking = false;

  function onScroll() {
    ticking = false;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? clamp(y / max, 0, 1) : 0;
    bar.style.transform = `scaleX(${p})`;
    nav.classList.toggle("scrolled", y > 20);
    backTop.classList.toggle("show", y > 500);
    ring.style.strokeDashoffset = String(RING_LENGTH * (1 - p));
    if (!reduceMotion) {
      ambients.forEach((a, i) => { a.style.translate = `0 ${y * (i ? -0.08 : 0.12)}px`; });
    }
    const line = window.innerHeight * 0.4;
    let current = null;
    spyTargets.forEach(({ a, el }) => { if (el && el.getBoundingClientRect().top <= line) current = a; });
    spyLinks.forEach((a) => a.classList.toggle("active", a === current));
  }
  const requestScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll);
  onScroll();

  backTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------- Pointer-driven effects (desktop only) ---------- */
  if (finePointer) {
    // Spotlight on cards and tilt on project mockups.
    $$(".project-card, .panel, .stat").forEach((card) => {
      const isProject = card.classList.contains("project-card");
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        card.style.setProperty("--mx", x + "px");
        card.style.setProperty("--my", y + "px");
        if (isProject && !reduceMotion) {
          card.style.setProperty("--ry", ((x / r.width - 0.5) * 8).toFixed(2) + "deg");
          card.style.setProperty("--rx", (-(y / r.height - 0.5) * 6).toFixed(2) + "deg");
        }
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });

    if (!reduceMotion) {
      // Magnetic buttons.
      $$(".pill-button, .round-arrow, .nav-mark, .back-top, .footer-logo").forEach((el) => {
        el.addEventListener("pointermove", (e) => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - (r.left + r.width / 2);
          const y = e.clientY - (r.top + r.height / 2);
          el.style.translate = `${x * 0.25}px ${y * 0.3}px`;
        });
        el.addEventListener("pointerleave", () => { el.style.translate = ""; });
      });

      // Parallax on the initials illustration.
      const art = $(".profile-art");
      if (art) {
        art.addEventListener("pointermove", (e) => {
          const r = art.getBoundingClientRect();
          art.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5) * 2);
          art.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5) * 2);
        });
        art.addEventListener("pointerleave", () => {
          art.style.setProperty("--px", 0);
          art.style.setProperty("--py", 0);
        });
      }

      // Soft glow that follows the cursor.
      const glow = $("#cursorGlow");
      if (glow) {
        let tx = 0, ty = 0, x = 0, y = 0, running = false;
        const loop = () => {
          x += (tx - x) * 0.12;
          y += (ty - y) * 0.12;
          glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) requestAnimationFrame(loop);
          else running = false;
        };
        window.addEventListener("pointermove", (e) => {
          if (!glow.classList.contains("on")) { x = e.clientX; y = e.clientY; glow.classList.add("on"); }
          tx = e.clientX; ty = e.clientY;
          if (!running) { running = true; requestAnimationFrame(loop); }
        });
        document.documentElement.addEventListener("mouseleave", () => glow.classList.remove("on"));
      }
    }
  }

  /* ---------- Interactive to-do mockup ---------- */
  const taskLines = $$(".task-line");
  const taskCount = $("#taskCount");
  const allChecked = () => taskLines.every((l) => l.querySelector("i").classList.contains("checked"));
  taskLines.forEach((line) => {
    const box = line.querySelector("i");
    line.tabIndex = 0;
    line.setAttribute("role", "checkbox");
    line.setAttribute("aria-checked", String(box.classList.contains("checked")));
    const toggle = () => {
      const on = box.classList.toggle("checked");
      box.textContent = on ? "✓" : "";
      line.setAttribute("aria-checked", String(on));
      const count = taskLines.filter((l) => l.querySelector("i").classList.contains("checked")).length;
      taskCount.textContent = String(count).padStart(2, "0");
      if (allChecked()) showToast("All tasks done — nice work ✨");
    };
    line.addEventListener("click", toggle);
    line.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });

  /* ---------- Copy email ---------- */
  const copyBtn = $("#copyEmail");
  const EMAIL = "rithvik180807@gmail.com";
  copyBtn.addEventListener("click", async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(EMAIL);
      ok = true;
    } catch (err) {
      const ta = document.createElement("textarea");
      ta.value = EMAIL;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      ta.remove();
    }
    if (ok) {
      copyBtn.textContent = "COPIED ✓";
      copyBtn.classList.add("copied");
      showToast("Email address copied");
      setTimeout(() => { copyBtn.textContent = "COPY"; copyBtn.classList.remove("copied"); }, 2000);
    } else {
      showToast("Couldn't copy — please select the address manually");
    }
  });

  /* ---------- Contact form ---------- */
  const form = $("#contactForm");
  const status = $("#formStatus");
  const submitBtn = $("button[type=submit]", form);
  const charCount = $("#charCount");
  const fields = [
    { id: "name", validate: (v) => v.trim().length >= 2, error: "Enter your name (at least 2 characters)." },
    { id: "email", validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), error: "Enter a valid email address." },
    { id: "subject", validate: (v) => v.trim().length >= 3, error: "Enter a subject (at least 3 characters)." },
    { id: "message", validate: (v) => v.trim().length >= 10, error: "Message should be at least 10 characters." }
  ];

  function checkField(item) {
    const input = document.getElementById(item.id);
    const error = input.parentElement.querySelector(".field-error");
    const valid = item.validate(input.value);
    input.classList.remove("invalid");
    if (!valid) void input.offsetWidth; // restart the shake animation
    input.classList.toggle("invalid", !valid);
    input.classList.toggle("valid", valid);
    error.textContent = valid || input.value.length === 0 ? "" : item.error;
    return valid;
  }

  fields.forEach((item) => {
    const input = document.getElementById(item.id);
    input.addEventListener("blur", () => { if (input.value.length) checkField(item); });
    input.addEventListener("input", () => {
      if (input.classList.contains("invalid")) checkField(item);
      status.textContent = "";
      if (item.id === "message") {
        const len = input.value.trim().length;
        charCount.textContent = len >= 10 ? `${len} characters ✓` : `${len} / 10 minimum`;
        charCount.classList.toggle("ok", len >= 10);
      }
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const valid = fields.map(checkField).every(Boolean);
    if (!valid) {
      status.style.color = "#ff8497";
      status.textContent = "Please fix the highlighted fields.";
      const firstInvalid = form.querySelector(".invalid");
      if (firstInvalid) firstInvalid.focus();
      return;
    }
    status.style.color = "#9de0b5";
    status.textContent = "Opening your email app…";
    submitBtn.classList.add("loading");
    submitBtn.querySelector("span").textContent = "✓";
    setTimeout(() => {
      submitBtn.classList.remove("loading");
      submitBtn.querySelector("span").textContent = "↗";
    }, 2500);
    showToast("Opening your email app…");
    const senderName = document.getElementById("name").value.trim();
    const senderEmail = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();
    const body = `From: ${senderName}\nReply to: ${senderEmail}\n\n${message}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
});
