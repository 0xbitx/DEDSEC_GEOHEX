(() => {
    "use strict";

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    const year = $("#year");
    if (year) {
        year.textContent = String(new Date().getFullYear());
    }

    const nav = $(".nav");
    const updateNav = () => {
        if (nav) {
            nav.classList.toggle("is-scrolled", window.scrollY > 8);
        }
    };
    updateNav();
    window.addEventListener("scroll", updateNav, { passive: true });

    const navToggle = $("#navToggle");
    const navLinks = $("#navLinks");

    const closeNav = () => {
        if (!navToggle || !navLinks) return;
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open menu");
    };

    if (navToggle && navLinks) {
        navToggle.addEventListener("click", () => {
            const open = navLinks.classList.toggle("is-open");
            navToggle.setAttribute("aria-expanded", String(open));
            navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        });

        navLinks.addEventListener("click", (event) => {
            if (event.target.closest("a")) {
                closeNav();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeNav();
            }
        });

        document.addEventListener("click", (event) => {
            if (!navLinks.classList.contains("is-open")) return;
            if (navLinks.contains(event.target) || navToggle.contains(event.target)) return;
            closeNav();
        });
    }


    const navAnchors = $$('.nav-links a[href^="#"]');
    const spySections = navAnchors
        .map((anchor) => {
            const id = anchor.getAttribute("href");
            return id && id.length > 1 ? document.querySelector(id) : null;
        })
        .filter(Boolean);

    if (spySections.length) {
        const updateSpy = () => {
            const marker = window.scrollY + 150;
            let activeId = "";

            spySections.forEach((section) => {
                const top = section.getBoundingClientRect().top + window.scrollY;
                if (top <= marker) {
                    activeId = section.id;
                }
            });

            navAnchors.forEach((anchor) => {
                anchor.classList.toggle("is-active", anchor.getAttribute("href") === `#${activeId}`);
            });
        };

        updateSpy();
        window.addEventListener("scroll", updateSpy, { passive: true });
    }


    $$(".term-tabs").forEach((tabs) => {
        const term = tabs.closest(".term");
        if (!term) return;

        const panes = $$(".term-pane", term);
        const tabButtons = $$(".term-tab", tabs);

        const activate = (tab) => {
            tabButtons.forEach((button) => {
                const active = button === tab;
                button.classList.toggle("is-active", active);
                button.setAttribute("aria-selected", String(active));
                button.tabIndex = active ? 0 : -1;
            });

            panes.forEach((pane) => {
                pane.classList.toggle("is-active", pane.dataset.pane === tab.dataset.term);
            });
        };

        tabs.addEventListener("click", (event) => {
            const tab = event.target.closest(".term-tab");
            if (tab) {
                activate(tab);
            }
        });

        tabs.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

            const index = tabButtons.indexOf(document.activeElement);
            if (index === -1) return;

            event.preventDefault();
            const nextIndex = event.key === "ArrowRight"
                ? (index + 1) % tabButtons.length
                : (index - 1 + tabButtons.length) % tabButtons.length;

            tabButtons[nextIndex].focus();
            activate(tabButtons[nextIndex]);
        });
    });


    const toast = $("#toast");
    let toastTimer = 0;

    const showToast = (message) => {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("show");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            toast.classList.remove("show");
        }, 1800);
    };

    const cleanCommands = (element) => element.innerText
        .split("\n")
        .map((line) => line.replace(/^\s*\$\s?/, "").trimEnd())
        .join("\n")
        .trim();

    const fallbackCopy = (text) => {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.top = "-1000px";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();

        let copied = false;
        try {
            copied = document.execCommand("copy");
        } catch {
            copied = false;
        }

        document.body.removeChild(area);
        return copied;
    };

    const copyText = async (text) => {
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch {
            }
        }
        return fallbackCopy(text);
    };

    const flashButton = (button, label) => {
        if (!button) return;
        if (!button.dataset.label) {
            button.dataset.label = button.textContent;
        }
        button.textContent = label;
        window.setTimeout(() => {
            button.textContent = button.dataset.label;
        }, 1400);
    };

    $$("[data-copy-target]").forEach((button) => {
        button.addEventListener("click", async () => {
            const target = document.querySelector(button.dataset.copyTarget);
            if (!target) return;

            const copied = await copyText(cleanCommands(target));
            flashButton(button, copied ? "Copied" : "Copy failed");
            showToast(copied ? "Install commands copied" : "Copy failed, select the text manually");
        });
    });

    $$("[data-copy-term]").forEach((button) => {
        button.addEventListener("click", async () => {
            const term = button.closest(".term");
            const pane = term ? $(".term-pane.is-active", term) : null;
            if (!pane) return;

            const copied = await copyText(cleanCommands(pane));
            flashButton(button, copied ? "Copied" : "Copy failed");
            showToast(copied ? "Terminal commands copied" : "Copy failed, select the text manually");
        });
    });

    const revealItems = $$(".reveal");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if ("IntersectionObserver" in window && !reduceMotion) {
        const reveal = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, {
            rootMargin: "0px 0px -8% 0px",
            threshold: 0.08
        });

        revealItems.forEach((item) => reveal.observe(item));
    } else {
        revealItems.forEach((item) => item.classList.add("is-visible"));
    }
})();
