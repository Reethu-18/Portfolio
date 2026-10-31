document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const menuToggle = $("#menuToggle");
  const navLinks = $("#navLinks");
  const progress = $("#scrollProgress");
  const backToTop = $("#backToTop");
  const toast = $("#toastNote");
  let toastTimer;

  const notify = (message) => {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  };

  menuToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  $$("a", navLinks).forEach(link => link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }));
  $("#year").textContent = new Date().getFullYear();

  // Scroll progress, back-to-top visibility, and active navigation state.
  const updateScrollUI = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${maxScroll > 0 ? window.scrollY / maxScroll : 0})`;
    backToTop.classList.toggle("visible", window.scrollY > 550);
  };
  window.addEventListener("scroll", updateScrollUI, { passive: true });
  updateScrollUI();
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  const sectionLinks = $$(".nav-links a[href^='#']");
  if ("IntersectionObserver" in window) {
    const activeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          sectionLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: "-28% 0px -60% 0px" });
    $$('main section[id]').forEach(section => activeObserver.observe(section));

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    $$(".reveal, .panel, .section-title, .contact-section > .overline").forEach(item => {
      item.classList.add("motion-ready");
      revealObserver.observe(item);
    });
  } else {
    $$(".reveal, .panel, .section-title").forEach(item => item.classList.add("is-visible"));
  }

  // Animate skill bars only when the toolkit scrolls into view.
  const skillPanel = $(".skills-panel");
  if (skillPanel && "IntersectionObserver" in window) {
    const skillsObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        $$(".skill-track i", skillPanel).forEach((bar, index) => setTimeout(() => bar.classList.add("fill-in"), index * 120));
        skillsObserver.disconnect();
      }
    }), { threshold: 0.25 });
    skillsObserver.observe(skillPanel);
  } else $$(".skill-track i").forEach(bar => bar.classList.add("fill-in"));

  // Lightweight pointer glow and subtle 3D tilt on desktop only.
  const glow = $("#cursorGlow");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (finePointer) {
    window.addEventListener("pointermove", event => {
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
      glow.classList.add("active");
    }, { passive: true });
    $$(".project-card").forEach(card => {
      card.addEventListener("pointermove", event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty("--tilt-x", `${(0.5 - y) * 3}deg`);
        card.style.setProperty("--tilt-y", `${(x - 0.5) * 4}deg`);
        card.classList.add("tilting");
      });
      card.addEventListener("pointerleave", () => {
        card.classList.remove("tilting");
        card.style.removeProperty("--tilt-x");
        card.style.removeProperty("--tilt-y");
      });
    });
  }

  // Theme toggle remembers the visitor's choice for this browser session.
  const themeToggle = $("#themeToggle");
  themeToggle.addEventListener("click", () => {
    const light = document.body.classList.toggle("light-theme");
    themeToggle.textContent = light ? "☾" : "☼";
    themeToggle.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    notify(light ? "Light theme enabled" : "Dark theme enabled");
  });

  // Copy-to-clipboard convenience with a graceful fallback.
  $("#copyEmail").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("rithvik180807@gmail.com");
      notify("Email copied to clipboard");
    } catch {
      window.location.href = "mailto:rithvik180807@gmail.com";
      notify("Opening your email app");
    }
  });

  // Contact form validation: this site prepares an email; it does not store submissions.
  const form = $("#contactForm");
  const status = $("#formStatus");
  const fields = [
    { id: "name", validate: value => value.trim().length >= 2, error: "Enter your name (at least 2 characters)." },
    { id: "email", validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()), error: "Enter a valid email address." },
    { id: "subject", validate: value => value.trim().length >= 3, error: "Enter a subject (at least 3 characters)." },
    { id: "message", validate: value => value.trim().length >= 10, error: "Message should be at least 10 characters." }
  ];
  function checkField(field) {
    const input = $(`#${field.id}`);
    const error = input.parentElement.querySelector(".field-error");
    const valid = field.validate(input.value);
    input.classList.toggle("invalid", !valid);
    input.setAttribute("aria-invalid", String(!valid));
    error.textContent = valid || input.value.length === 0 ? "" : field.error;
    return valid;
  }
  fields.forEach(field => {
    const input = $(`#${field.id}`);
    input.addEventListener("blur", () => { if (input.value.length) checkField(field); });
    input.addEventListener("input", () => {
      if (input.classList.contains("invalid")) checkField(field);
      status.textContent = "";
    });
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!fields.map(checkField).every(Boolean)) {
      status.style.color = "#ff8497";
      status.textContent = "Please fix the highlighted fields.";
      const invalid = $(".invalid", form);
      if (invalid) invalid.focus();
      return;
    }
    const name = $("#name").value.trim();
    const email = $("#email").value.trim();
    const subject = $("#subject").value.trim();
    const message = $("#message").value.trim();
    const body = `From: ${name}\nReply to: ${email}\n\n${message}`;
    status.style.color = "#9de0b5";
    status.textContent = "Opening your email app…";
    window.location.href = `mailto:rithvik180807@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
});
