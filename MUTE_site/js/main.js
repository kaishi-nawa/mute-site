/* =========================
   MUTE main.js (STABLE + ALWAYS TOP)
   - Loader: never-stuck (hard failsafe)
   - ALWAYS show TOP after load (disable scroll restoration + force scrollTo)
   - Hero logo appears 2s after page-ready
   - Menu open/close (overlay/outside/ESC)
   - Smooth scroll (menu stays)
   - Night background shifts on scroll
   - Reveal on scroll
   - Product carousel: infinite via scrollLeft (no cut)
     + hold to accelerate, click to step
   ========================= */

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

(() => {
  document.documentElement.classList.add("js");

  /* =========================
     ★ ALWAYS TOP (scroll restore OFF)
     ========================= */
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  // ページの表示完了時も保険でTOPへ（ハッシュがある時は尊重）
  window.addEventListener(
    "load",
    () => {
      if (!location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    },
    { once: true }
  );

  /* =========================
     0) LOADER (never stuck)
     ========================= */
  (() => {
    const body = document.body;
    const loader = $("#loader");
    const heroLogoDelay = 2000;

    let done = false;

    const setLen = (path) => {
      if (!path) return;
      try {
        const len = path.getTotalLength();
        path.style.setProperty("--len", String(len));
        path.style.strokeDasharray = `${len}`;
        path.style.strokeDashoffset = `${len}`;
      } catch {}
    };

    const finish = () => {
      if (done) return;
      done = true;

      // ★ローダーが終わった瞬間に必ずTOPへ（展示で絶対TOPを見せたい用）
      if (!location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }

      body.classList.remove("is-loading");
      body.classList.add("page-ready");

      window.setTimeout(() => body.classList.add("hero-logo-in"), heroLogoDelay);

      if (!loader) return;

      loader.classList.add("is-done");
      window.setTimeout(() => {
        try {
          loader.remove();
        } catch {}
      }, 950);
    };

    // start
    body.classList.add("is-loading");
    body.classList.remove("page-ready");
    body.classList.remove("hero-logo-in");

    // ★開始時点でも一回TOPへ（戻る/復元対策）
    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    if (loader) {
      const left = $(".m-left", loader);
      const tri = $(".m-tri", loader);
      setLen(left);
      setLen(tri);
      loader.classList.add("is-play");
    }

    // “window load待ち”だけだと module やエラーで止まる事故があるので保険を張る
    const hardFailSafe = window.setTimeout(finish, 4500); // ←絶対終わらせる

    // できるだけ正規に終わらせる
    window.addEventListener(
      "load",
      () => {
        window.clearTimeout(hardFailSafe);
        // 描画アニメ分 + フェード分
        window.setTimeout(finish, 3300);
      },
      { once: true }
    );

    // DOMだけでも進める（loadが詰まっても見せる）
    window.addEventListener(
      "DOMContentLoaded",
      () => {
        // DOMが来たのにloadが来ない場合の救済
        window.setTimeout(() => {
          if (!done) finish();
        }, 5000);
      },
      { once: true }
    );
  })();

  /* =========================
     1) MENU
     ========================= */
  (() => {
    const btn = $(".menu-btn");
    const panel = $(".menu-panel");
    const overlay = $(".menu-overlay");
    if (!btn || !panel) return;

    const openMenu = () => {
      document.body.classList.add("menu-open");
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-label", "メニューを閉じる");
      panel.setAttribute("aria-hidden", "false");
      overlay?.setAttribute("aria-hidden", "false");
    };

    const closeMenu = () => {
      document.body.classList.remove("menu-open");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "メニューを開く");
      panel.setAttribute("aria-hidden", "true");
      overlay?.setAttribute("aria-hidden", "true");
    };

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      document.body.classList.contains("menu-open") ? closeMenu() : openMenu();
    });

    overlay?.addEventListener("click", closeMenu);

    document.addEventListener("pointerdown", (e) => {
      if (!document.body.classList.contains("menu-open")) return;
      const insidePanel = panel.contains(e.target);
      const insideBtn = btn.contains(e.target);
      if (!insidePanel && !insideBtn) closeMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
        closeMenu();
      }
    });

    // Smooth scroll (do NOT close menu)
    $$("[data-scroll]").forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || !href.startsWith("#")) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  })();

  /* =========================
     2) NIGHT BACKGROUND (scroll -> darker)
     ========================= */
  (() => {
    const lerp = (a, b, t) => a + (b - a) * t;

    const hexToRgb = (hex) => {
      const h = hex.replace("#", "");
      const v = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
      return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
    };
    const rgbToHex = ({ r, g, b }) => {
      const toHex = (n) => n.toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };
    const mixHex = (from, to, t) => {
      const a = hexToRgb(from);
      const b = hexToRgb(to);
      return rgbToHex({
        r: Math.round(lerp(a.r, b.r, t)),
        g: Math.round(lerp(a.g, b.g, t)),
        b: Math.round(lerp(a.b, b.b, t)),
      });
    };

    const START_A = "#3b4aa1";
    const START_B = "#151a47";
    const START_C = "#0a0b14";

    const END_A = "#0f1126";
    const END_B = "#070814";
    const END_C = "#020208";

    const updateNight = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const tRaw = max <= 0 ? 0 : doc.scrollTop / max;
      const t = Math.min(1, Math.max(0, Math.pow(tRaw, 1.12)));

      doc.style.setProperty("--bg-a", mixHex(START_A, END_A, t));
      doc.style.setProperty("--bg-b", mixHex(START_B, END_B, t));
      doc.style.setProperty("--bg-c", mixHex(START_C, END_C, t));
    };

    updateNight();
    window.addEventListener("scroll", updateNight, { passive: true });
    window.addEventListener("resize", updateNight);
  })();

  /* =========================
     3) REVEAL
     ========================= */
  (() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const items = $$(".reveal");
    if (!items.length) return;

    if (reduce) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          io.unobserve(e.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -12% 0px" }
    );

    items.forEach((el) => io.observe(el));
  })();

  /* =========================
     4) PRODUCT CAROUSEL (no cut, infinite)
     - uses viewport.scrollLeft + clones
     - hold accelerates safely
     ========================= */
  (() => {
    const viewport = $("#productViewport");
    const track = $("#productTrack");
    if (!viewport || !track) return;

    const prevBtn = $(".carousel-btn.prev");
    const nextBtn = $(".carousel-btn.next");

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const getGap = () => {
      const cs = getComputedStyle(track);
      const gap = cs.columnGap || cs.gap || "0px";
      return parseFloat(gap) || 0;
    };

    const getUnit = () => {
      const first = track.querySelector(".product-card");
      if (!first) return 0;
      return first.getBoundingClientRect().width + getGap();
    };

    // Clone to both ends (1x each side)
    const setupClones = () => {
      if (track.dataset.cloned === "1") return;

      const originals = Array.from(track.children).filter((n) => n.nodeType === 1);
      if (originals.length < 2) return;

      const headClones = originals.map((n) => n.cloneNode(true));
      const tailClones = originals.map((n) => n.cloneNode(true));

      headClones.forEach((n) => track.insertBefore(n, track.firstChild));
      tailClones.forEach((n) => track.appendChild(n));

      track.dataset.cloned = "1";
      track.dataset.count = String(originals.length);
    };

    setupClones();

    const originalCount = Math.max(0, parseInt(track.dataset.count || "0", 10));
    if (originalCount < 2) return;

    const jumpToStart = () => {
      const unit = getUnit();
      if (!unit) return;
      // head clones分だけ進めて「本体の先頭」に合わせる
      viewport.scrollLeft = unit * originalCount;
    };

    // normalize (infinite)
    const normalize = () => {
      const unit = getUnit();
      if (!unit) return;

      const start = unit * originalCount;   // originals start
      const end = unit * originalCount * 2; // originals end

      // 端に寄りすぎたらジャンプ（見えない範囲で）
      if (viewport.scrollLeft < start - unit * 2) {
        viewport.scrollLeft += unit * originalCount;
      } else if (viewport.scrollLeft > end + unit * 2) {
        viewport.scrollLeft -= unit * originalCount;
      }
    };

    // Step (click)
    const step = (dir) => {
      const unit = getUnit();
      if (!unit) return;
      viewport.scrollBy({ left: dir * unit, behavior: "smooth" });
      // smooth中でも補正
      window.setTimeout(normalize, 350);
    };

    prevBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      step(-1);
    });
    nextBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      step(+1);
    });

    // Hold accelerate
    let holdDir = 0;
    let holdRaf = 0;

    const holdTick = () => {
      if (!holdDir) {
        holdRaf = 0;
        return;
      }
      // 速度：押し続けても途切れない程度
      viewport.scrollLeft += holdDir * 8.0;
      normalize();
      holdRaf = requestAnimationFrame(holdTick);
    };

    const startHold = (dir) => {
      holdDir = dir;
      if (!holdRaf) holdRaf = requestAnimationFrame(holdTick);
    };
    const stopHold = () => {
      holdDir = 0;
    };

    prevBtn?.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      startHold(-1);
    });
    nextBtn?.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      startHold(+1);
    });
    window.addEventListener("pointerup", stopHold);
    window.addEventListener("pointercancel", stopHold);
    window.addEventListener("blur", stopHold);

    // Auto move (very subtle)
    let autoRaf = 0;
    const autoTick = () => {
      if (document.hidden) {
        autoRaf = 0;
        return;
      }
      if (!holdDir && !reduce) {
        viewport.scrollLeft += 0.35; // 小さく自動
        normalize();
      }
      autoRaf = requestAnimationFrame(autoTick);
    };

    // Start position after first layout
    requestAnimationFrame(() => {
      jumpToStart();
      normalize();
      if (!autoRaf) autoRaf = requestAnimationFrame(autoTick);
    });

    // Resize: re-align
    window.addEventListener("resize", () => {
      jumpToStart();
      normalize();
    });

    // Visibility
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && !autoRaf) autoRaf = requestAnimationFrame(autoTick);
    });

    // Also normalize on manual scroll (if any)
    viewport.addEventListener("scroll", () => normalize(), { passive: true });
  })();
})();