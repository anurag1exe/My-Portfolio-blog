"use client";

import { useRef, useEffect, useCallback } from "react";

/* ── Constants ── */
const DESKTOP_RADIUS = 235;
const MOBILE_RADIUS = 150;
const LERP_POS = 0.14;
const LERP_RAD = 0.12;
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

/* ── Monogram SVG ── */
function Monogram() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="monogram"
    >
      {/* Geometric 'A' — two converging strokes with a crossbar */}
      <path
        d="M16 3L4 29h3.5L16 8.5 24.5 29H28L16 3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
      <line x1="9" y1="22" x2="23" y2="22" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/* ── Component ── */
export default function GlassHero() {
  const heroRef = useRef<HTMLElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  /* Pointer state — all refs, zero React re-renders */
  const rawPos = useRef({ x: -999, y: -999 });
  const smoothPos = useRef({ x: -999, y: -999 });
  const currentRadius = useRef(0);
  const targetRadius = useRef(0);
  const isTouching = useRef(false);
  const frameId = useRef(0);
  const reducedMotion = useRef(false);

  /* ── Animation loop ── */
  const tick = useCallback(() => {
    const el = revealRef.current;
    if (!el) {
      frameId.current = requestAnimationFrame(tick);
      return;
    }

    const pf = reducedMotion.current ? 1 : LERP_POS;
    const rf = reducedMotion.current ? 1 : LERP_RAD;

    smoothPos.current.x += (rawPos.current.x - smoothPos.current.x) * pf;
    smoothPos.current.y += (rawPos.current.y - smoothPos.current.y) * pf;
    currentRadius.current += (targetRadius.current - currentRadius.current) * rf;

    el.style.setProperty("--reveal-x", `${smoothPos.current.x}px`);
    el.style.setProperty("--reveal-y", `${smoothPos.current.y}px`);
    el.style.setProperty("--reveal-radius", `${currentRadius.current}px`);

    frameId.current = requestAnimationFrame(tick);
  }, []);

  /* ── Pointer handlers ── */
  const getRadius = useCallback(() => {
    return window.innerWidth <= 767 ? MOBILE_RADIUS : DESKTOP_RADIUS;
  }, []);

  const onPointerEnter = useCallback(
    (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      rawPos.current = { x: e.clientX, y: e.clientY };
      smoothPos.current = { x: e.clientX, y: e.clientY };
      targetRadius.current = getRadius();
    },
    [getRadius]
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        rawPos.current = { x: e.clientX, y: e.clientY };
        targetRadius.current = getRadius();
        return;
      }
      /* Touch — only update while tracking */
      if (!isTouching.current) return;
      rawPos.current = { x: e.clientX, y: e.clientY };
    },
    [getRadius]
  );

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      isTouching.current = true;
      rawPos.current = { x: e.clientX, y: e.clientY };
      smoothPos.current = { x: e.clientX, y: e.clientY };
      targetRadius.current = getRadius();
      try {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {
        /* not supported */
      }
    },
    [getRadius]
  );

  const onPointerUp = useCallback(() => {
    isTouching.current = false;
    targetRadius.current = 0;
  }, []);

  const onPointerLeave = useCallback((e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    targetRadius.current = 0;
  }, []);

  /* ── Mount ── */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    /* Check reduced-motion */
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = mq.matches;
    const onMqChange = (e: MediaQueryListEvent) => {
      reducedMotion.current = e.matches;
    };
    mq.addEventListener("change", onMqChange);

    /* Attach listeners */
    hero.addEventListener("pointerenter", onPointerEnter);
    hero.addEventListener("pointermove", onPointerMove);
    hero.addEventListener("pointerdown", onPointerDown);
    hero.addEventListener("pointerup", onPointerUp);
    hero.addEventListener("pointercancel", onPointerUp);
    hero.addEventListener("pointerleave", onPointerLeave);

    /* Start loop */
    frameId.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId.current);
      hero.removeEventListener("pointerenter", onPointerEnter);
      hero.removeEventListener("pointermove", onPointerMove);
      hero.removeEventListener("pointerdown", onPointerDown);
      hero.removeEventListener("pointerup", onPointerUp);
      hero.removeEventListener("pointercancel", onPointerUp);
      hero.removeEventListener("pointerleave", onPointerLeave);
      mq.removeEventListener("change", onMqChange);
    };
  }, [tick, onPointerEnter, onPointerMove, onPointerDown, onPointerUp, onPointerLeave]);

  return (
    <main>
      <section
        ref={heroRef}
        className="hero"
        aria-label="Portfolio hero"
      >
        {/* Layer 1 — Base portrait */}
        <div className="hero__base" aria-hidden="true" />

        {/* Layer 2 — Reveal portrait (masked) */}
        <div ref={revealRef} className="hero__reveal" aria-hidden="true" />

        {/* Layer 3 — Technical grid + circle */}
        <div className="hero__grid" aria-hidden="true">
          <svg
            className="hero__grid-svg"
            viewBox="0 0 1200 800"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Desktop: 12 columns */}
            {Array.from({ length: 13 }, (_, i) => (
              <line
                key={`vc-${i}`}
                x1={(i * 1200) / 12}
                y1="0"
                x2={(i * 1200) / 12}
                y2="800"
                className="grid-line grid-line--col"
              />
            ))}
            {/* Desktop: 4 rows */}
            {Array.from({ length: 5 }, (_, i) => (
              <line
                key={`hr-${i}`}
                x1="0"
                y1={(i * 800) / 4}
                x2="1200"
                y2={(i * 800) / 4}
                className="grid-line grid-line--row"
              />
            ))}
          </svg>

          {/* Mobile grid — separate SVG */}
          <svg
            className="hero__grid-svg hero__grid-svg--mobile"
            viewBox="0 0 400 900"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {Array.from({ length: 5 }, (_, i) => (
              <line
                key={`mvc-${i}`}
                x1={(i * 400) / 4}
                y1="0"
                x2={(i * 400) / 4}
                y2="900"
                className="grid-line"
              />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <line
                key={`mhr-${i}`}
                x1="0"
                y1={(i * 900) / 6}
                x2="400"
                y2={(i * 900) / 6}
                className="grid-line"
              />
            ))}
          </svg>

          {/* Large circle */}
          <div className="hero__circle" />
        </div>

        {/* Layer 4 — Copy */}
        <div className="hero__copy">
          <h1 className="hero__headline">
            <span className="hero__headline-line hero__headline-line--1">Building</span>
            <span className="hero__headline-line hero__headline-line--2">Beyond</span>
            <span className="hero__headline-line hero__headline-line--3">Possible.</span>
          </h1>

          <div className="hero__bottom">
            <div className="hero__intro">
              <p className="hero__intro-text">
                Builder — crafting interfaces and systems that push what&apos;s next.
              </p>
              <a href="https://github.com/anurag1exe?tab=repositories" target="_blank" rel="noreferrer" className="mt-4 block">
                <InteractiveHoverButton text="Explore my work" className="w-48 bg-white text-black border-black/10 hover:bg-black hover:text-white" />
              </a>
            </div>

            <div className="hero__tagline font-bold text-lg md:text-xl tracking-widest text-black/50 dark:text-white/50">
              <span>THINK</span>
              <span>BUILD</span>
              <span>REPEAT</span>
            </div>
          </div>
        </div>

        {/* Layer 5 — Navigation */}
        <header className="hero__nav">
          <nav aria-label="Main navigation">
            <div className="hero__nav-inner">
              <div className="flex items-center gap-8 md:gap-16">
                <a href="/" className="hero__brand" aria-label="Anurag Kumar — Home">
                  <Monogram />
                  <span className="hero__brand-name">ANURAG KUMAR</span>
                </a>

                <ul className="hero__links" role="list">
                  <li>
                    <a href="https://docs.google.com/document/d/1OFIrYKNo6yu0TDMlcQcSgjINaTjaLw0D5mwtTbw7VRk/edit?usp=sharing" target="_blank" rel="noreferrer">
                      <InteractiveHoverButton text="About" className="w-32 bg-white text-black border-black/10 hover:bg-black hover:text-white" />
                    </a>
                  </li>
                  <li>
                    <a href="https://github.com/anurag1exe" target="_blank" rel="noreferrer">
                      <InteractiveHoverButton text="Work" className="w-32 bg-white text-black border-black/10 hover:bg-black hover:text-white" />
                    </a>
                  </li>
                  <li>
                    <a href="https://movierecommenderrr.streamlit.app/" target="_blank" rel="noreferrer">
                      <InteractiveHoverButton text="Experiments" className="w-40 bg-white text-black border-black/10 hover:bg-black hover:text-white" />
                    </a>
                  </li>
                </ul>
              </div>

              <a href="https://www.linkedin.com/in/anurag-kumar-a15100345/" target="_blank" rel="noreferrer">
                <InteractiveHoverButton text="Let's talk" className="w-32 bg-white text-black border-black/10 hover:bg-black hover:text-white" />
              </a>
            </div>
          </nav>
        </header>
      </section>
    </main>
  );
}
