/* =========================================================
   Mohamed Anter — Portfolio scripts
   ========================================================= */

const CONFIG = {
    // Paste your n8n *Production* webhook URL here (Webhook node, method POST).
    // While this is empty, the form falls back to opening the visitor's email app.
    webhookUrl: "",
    fallbackEmail: "mohamed3nter7@gmail.com",
    typedWords: ["AI Automation Developer", "n8n Developer", "AI Agent Builder", "Web Developer"],
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Footer year ---------- */
$("#year").textContent = new Date().getFullYear();

/* ---------- Hero photo fallback (shows initials if main.jpg is missing) ---------- */
(function heroImageFallback() {
    const img = $(".home-img img");
    if (!img) return;

    const showFallback = () => {
        const box = document.createElement("div");
        box.className = "img-fallback";
        box.setAttribute("role", "img");
        box.setAttribute("aria-label", "Mohamed Anter");
        box.textContent = "MA";
        img.replaceWith(box);
    };

    if (img.complete && img.naturalWidth === 0) showFallback();
    else img.addEventListener("error", showFallback, { once: true });
})();

/* ---------- Typewriter ---------- */
(function typewriter() {
    const target = $("#typed");
    const words = CONFIG.typedWords;
    if (!target || !words.length) return;

    if (prefersReducedMotion) {
        target.textContent = words[0];
        return;
    }

    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
        const word = words[wordIndex];
        target.textContent = word.slice(0, charIndex);

        if (!deleting && charIndex === word.length) {
            deleting = true;
            return setTimeout(tick, 1600);
        }
        if (deleting && charIndex === 0) {
            deleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            return setTimeout(tick, 300);
        }

        charIndex += deleting ? -1 : 1;
        setTimeout(tick, deleting ? 45 : 90);
    }

    tick();
})();

/* ---------- Mobile menu ---------- */
(function mobileMenu() {
    const toggle = $("#menuToggle");
    const nav = $("#nav");
    const icon = $("i", toggle);

    const setOpen = (open) => {
        nav.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", String(open));
        icon.className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
    };

    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
    $$("a", nav).forEach((link) => link.addEventListener("click", () => setOpen(false)));

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") setOpen(false);
    });
    document.addEventListener("click", (e) => {
        if (!nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
})();

/* ---------- Header state + back-to-top ---------- */
(function scrollUi() {
    const header = $("#header");
    const toTop = $("#toTop");

    const update = () => {
        const y = window.scrollY;
        header.classList.toggle("scrolled", y > 40);
        toTop.classList.toggle("show", y > 600);
    };

    window.addEventListener("scroll", update, { passive: true });
    update();

    toTop.addEventListener("click", () =>
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })
    );
})();

/* ---------- Active nav link (scrollspy) ---------- */
(function scrollSpy() {
    const links = $$("#nav a");
    const sections = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                links.forEach((a) =>
                    a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`)
                );
            });
        },
        { rootMargin: "-40% 0px -55% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
})();

/* ---------- Reveal on scroll ---------- */
(function revealOnScroll() {
    const items = $$(".reveal");

    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
        items.forEach((el) => el.classList.add("visible"));
        return;
    }

    // Stagger siblings that share a parent (cards in a grid)
    items.forEach((el) => {
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
        el.style.transitionDelay = `${(siblings.indexOf(el) % 3) * 90}ms`;
    });

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                el.classList.add("visible");
                obs.unobserve(el);
                // clear the stagger delay afterwards so hover effects respond instantly
                setTimeout(() => (el.style.transitionDelay = ""), 1200);
            });
        },
        { threshold: 0.12 }
    );

    items.forEach((el) => observer.observe(el));
})();

/* ---------- Contact form ---------- */
(function contactForm() {
    const form = $("#contactForm");
    const button = $("#sendBtn");
    const status = $("#formStatus");
    const label = $("span", button);
    const icon = $("i", button);

    const setStatus = (message, type = "") => {
        status.textContent = message;
        status.className = `form-status ${type}`.trim();
    };

    const setLoading = (loading) => {
        button.disabled = loading;
        label.textContent = loading ? "Sending..." : "Send Message";
        icon.className = loading ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-paper-plane";
    };

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Honeypot: real visitors never fill this field
        if (form.elements.website.value) return;

        const payload = {
            name: form.elements.name.value.trim(),
            email: form.elements.email.value.trim(),
            subject: form.elements.subject.value.trim(),
            message: form.elements.message.value.trim(),
            source: "portfolio-website",
            sentAt: new Date().toISOString(),
        };

        // No webhook configured yet -> open the visitor's email client instead
        if (!CONFIG.webhookUrl) {
            const body = `${payload.message}\n\n— ${payload.name} (${payload.email})`;
            window.location.href =
                `mailto:${CONFIG.fallbackEmail}` +
                `?subject=${encodeURIComponent(payload.subject)}` +
                `&body=${encodeURIComponent(body)}`;
            setStatus("Opening your email app to send the message...", "success");
            return;
        }

        setLoading(true);
        setStatus("");

        try {
            const response = await fetch(CONFIG.webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error(`Request failed: ${response.status}`);

            form.reset();
            setStatus("Thanks! Your message was sent. I'll get back to you soon.", "success");
        } catch (error) {
            console.error(error);
            setStatus(`Something went wrong. Please email me directly at ${CONFIG.fallbackEmail}.`, "error");
        } finally {
            setLoading(false);
        }
    });
})();