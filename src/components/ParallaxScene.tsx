"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "./ThemeProvider";

type Mode = "day" | "night";

const MODE_TRANSITION_MS = 10000;

/**
 * Cinematic parallax hero with a day/night crossfade.
 * Adapted from the Lovable "Torino" hero (GSAP + ScrollTrigger + Lenis).
 * Day/night mode is shared globally via ThemeProvider.
 */
export default function ParallaxScene({
  brand,
  subtitle,
  ctaPrimary,
  ctaSecondary,
  modeDay,
  modeNight,
  children,
}: {
  brand: string;
  subtitle: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  modeDay: string;
  modeNight: string;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { mode, setMode } = useTheme();

  useEffect(() => {
    rootRef.current?.style.setProperty(
      "--mode-transition",
      `${MODE_TRANSITION_MS}ms`
    );
  }, []);

  const changeMode = (m: Mode) => setMode(m);

  // GSAP parallax timeline + Lenis smooth scroll
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const layers = rootRef.current?.querySelector("[data-parallax-layers]");
    if (layers) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: layers as Element,
          start: "0% 0%",
          end: "100% 0%",
          scrub: 0,
        },
      });

      (
        [
          { layer: "1", yPercent: 70 },
          { layer: "2", yPercent: 55 },
          { layer: "3", yPercent: 40 },
          { layer: "4", yPercent: 10 },
        ] as const
      ).forEach((cfg, i) => {
        tl.to(
          (layers as Element).querySelectorAll(
            `[data-parallax-layer="${cfg.layer}"]`
          ),
          {
            yPercent: cfg.yPercent,
            ease: "none",
          },
          i === 0 ? undefined : "<"
        );
      });
    }

    // Lenis is now global (SmoothScroll) — just refresh ScrollTrigger
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const celestial = mode === "day" ? "moon" : "sun";

  return (
    <div
      ref={rootRef}
      className="parallax"
      data-mode={mode}
      data-celestial={celestial}
    >
      <section className="parallax__header">
        <div className="parallax__visuals">
          <div className="parallax__black-line-overflow" />
          <div data-parallax-layers="true" className="parallax__layers">
            <div data-parallax-layer="1" className="parallax__layer-sky">
              <img
                src="/assets/hero/hero-sky-no-sun.webp"
                loading="eager"
                alt=""
                className="parallax__layer-img parallax__sky"
                data-sky="night"
              />
              <img
                src="/assets/hero/hero-sky-starry.webp"
                loading="eager"
                alt=""
                className="parallax__layer-img parallax__sky"
                data-sky="day"
              />
              <img
                src="/assets/hero/hero-sun.png"
                width={2000}
                height={1906}
                loading="eager"
                alt=""
                className="parallax__layer-img parallax__celestial"
                data-body="sun"
              />
              <img
                src="/assets/hero/hero-moon.png"
                width={2000}
                height={1906}
                loading="eager"
                alt=""
                className="parallax__layer-img parallax__celestial"
                data-body="moon"
              />
            </div>
            <img
              src="/assets/hero/osmo-parallax-layer-2.webp"
              loading="eager"
              data-parallax-layer="2"
              alt=""
              className="parallax__layer-img"
            />
            <div data-parallax-layer="3" className="parallax__layer-title">
              <h2 className="parallax__title" dir="auto">
                {brand}
              </h2>
            </div>
            <img
              src="/assets/hero/osmo-parallax-layer-1.webp"
              loading="eager"
              data-parallax-layer="4"
              alt=""
              className="parallax__layer-img"
            />
          </div>
          <div className="parallax__fade" />
        </div>

        <div
          className="parallax__mode"
          dir="rtl"
          role="group"
          aria-label={modeDay}
        >
          <button
            type="button"
            onClick={() => changeMode("day")}
            data-active={mode === "day"}
            aria-pressed={mode === "day"}
          >
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            <span>{modeDay}</span>
          </button>
          <button
            type="button"
            onClick={() => changeMode("night")}
            data-active={mode === "night"}
            aria-pressed={mode === "night"}
          >
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 14.5A8.5 8.5 0 1 1 9.6 4a6.9 6.9 0 0 0 10.4 10.5Z" />
            </svg>
            <span>{modeNight}</span>
          </button>
        </div>
      </section>

      <section className="parallax__content">
        <div className="mx-auto max-w-3xl px-4 pt-28 text-center sm:px-6 sm:pt-32">
          <p className="text-base leading-8 scene-muted sm:text-lg">{subtitle}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={ctaPrimary.href}
              className="rounded-xl bg-brand-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-brand-700"
            >
              {ctaPrimary.label}
            </a>
            <a
              href={ctaSecondary.href}
              className="rounded-xl border border-slate-300/60 px-7 py-3.5 text-sm font-bold transition scene-fg hover:bg-black/5"
            >
              {ctaSecondary.label}
            </a>
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}
