/**
 * تشخیصِ RSC/fetch vs بارگذاریِ کاملِ صفحه
 * یک تابعِ مشترک برای middleware.ts و auth.ts تا دچارِ ناهماهنگی نشن
 */
export function isRSCRequest(
  h: { get: (name: string) => string | null | undefined } | Headers
): boolean {
  // Header names are case-insensitive; try both original and lowercased
  const get = (name: string) => {
    const a = (h as Headers).get?.(name);
    if (a != null) return a;
    const b = (h as any).get?.(name.toLowerCase());
    if (b != null) return b;
    const c = (h as any).get?.(name.toUpperCase());
    if (c != null) return c;
    return null;
  };

  // Also scan raw header keys if Headers is iterable (Edge runtime)
  const hasHeader = (key: string) => {
    const v = get(key);
    if (v != null) return v;
    // Fallback: iterate over entries if available
    try {
      const entries = (h as any).entries?.() ?? (h as any).keys?.();
      if (entries) {
        for (const [k, v] of (h as any).entries?.() ?? []) {
          if (k.toLowerCase() === key.toLowerCase()) return v as string;
        }
      }
    } catch {}
    return null;
  };

  return (
    hasHeader("RSC") === "1" ||
    hasHeader("rsc") === "1" ||
    hasHeader("Next-Router-Prefetch") === "1" ||
    hasHeader("next-router-prefetch") === "1" ||
    hasHeader("x-middleware-prefetch") === "1" ||
    hasHeader("Next-Router-State-Tree") != null ||
    hasHeader("next-router-state-tree") != null ||
    hasHeader("Next-Url") != null ||
    hasHeader("next-url") != null ||
    (hasHeader("accept")?.includes("text/x-component") ?? false) ||
    hasHeader("Sec-Fetch-Mode") === "cors" ||
    hasHeader("sec-fetch-mode") === "cors"
  );
}
