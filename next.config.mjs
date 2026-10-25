/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    // حتماً داخلِ headers() چک شود — نه در سطحِ ماژول — چون next build همیشه production است
    // وگرنه مقدار در build فریز می‌شود و در runtime (next start) درست کار نمی‌کند
    const isProd = process.env.NODE_ENV === "production";
    const frameAncestors = isProd
      ? "frame-ancestors 'self'"
      : "frame-ancestors 'self' https://*.arena.ai https://*.arena.site https://*.e2b.app https://*.e2b.dev https://*.figma.site https://*.lovable.app";

    return [
      {
        source: "/(.*)",
        headers: [
          // X-Frame-Options حذف — با CSPِ frame-ancestors کنترل می‌کنیم
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https: https://images.unsplash.com",
              "connect-src 'self'",
              frameAncestors,
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
