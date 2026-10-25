"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Very slow, buttery ease — starts immediately, crawls so details stay visible
const easeSlow = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic — soft & steady
const SMOOTH_DURATION = 2.2; // long enough to see page details
const SCROLL_OFFSET = 88;

export default function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Init global Lenis once — slow wheel too so everything feels consistent
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: SMOOTH_DURATION,
      easing: easeSlow,
      gestureOrientation: "vertical",
      smoothWheel: true,
    } as any);
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    (window as any).__campineLenis = lenis;
    document.documentElement.style.scrollBehavior = "auto";

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Immediate smooth on route/hash change — no setTimeout delay
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        const lenis = lenisRef.current;
        if (lenis) lenis.scrollTo(el, { duration: SMOOTH_DURATION, easing: easeSlow, offset: -SCROLL_OFFSET, immediate: false } as any);
        else el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    } else {
      const lenis = lenisRef.current;
      if (lenis) lenis.scrollTo(0, { duration: SMOOTH_DURATION, easing: easeSlow } as any);
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname]);

  // Click handler — immediate, no delay
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const a = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;

      const hashIdx = href.indexOf("#");
      if (hashIdx !== -1) {
        const hash = href.slice(hashIdx + 1);
        if (!hash) return;
        const isHomeHash = href.startsWith("/#") || href.startsWith("#");
        if (!isHomeHash) return;

        e.preventDefault();
        if (window.location.pathname === "/" || window.location.pathname === "") {
          const el = document.getElementById(hash);
          if (el) {
            const lenis = lenisRef.current;
            if (lenis) lenis.scrollTo(el, { duration: SMOOTH_DURATION, easing: easeSlow, offset: -SCROLL_OFFSET } as any);
            else el.scrollIntoView({ behavior: "smooth", block: "start" });
            history.pushState(null, "", `/#${hash}`);
          }
        } else {
          router.push(`/#${hash}`, { scroll: false });
        }
        return;
      }

      if (href === "/" && window.location.pathname === "/") {
        e.preventDefault();
        const lenis = lenisRef.current;
        if (lenis) lenis.scrollTo(0, { duration: SMOOTH_DURATION, easing: easeSlow } as any);
        else window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [router]);

  // Initial load with hash — immediate
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    // Wait just for Lenis to be ready (one frame), not 400ms
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const lenis = lenisRef.current;
        if (lenis) lenis.scrollTo(el, { duration: SMOOTH_DURATION, easing: easeSlow, offset: -SCROLL_OFFSET, immediate: false } as any);
        else el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, []);

  return null;
}
