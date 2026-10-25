import type { Metadata } from "next";
import "./globals.css";
import { getDict, getLocale, getDir } from "@/lib/i18n";
import { ThemeProvider } from "@/components/ThemeProvider";
import SmoothScroll from "@/components/SmoothScroll";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDict();
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://campine.ir").replace(/\/$/, "");
  return {
    metadataBase: new URL(base),
    title: { default: dict.meta.title, template: `%s | ${dict.brand}` },
    description: dict.meta.description,
    alternates: { canonical: base, languages: { fa: `${base}/?lang=fa`, en: `${base}/?lang=en` } },
    openGraph: {
      type: "website",
      locale: getLocale() === "fa" ? "fa_IR" : "en_US",
      url: base,
      siteName: dict.brand,
      title: dict.meta.title,
      description: dict.meta.description,
      images: [{ url: "/assets/hero/hero-sky-starry.webp", width: 1200, height: 630, alt: dict.brand }],
    },
    twitter: { card: "summary_large_image", title: dict.meta.title, description: dict.meta.description },
    robots: { index: true, follow: true },
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  };
}

const themeInitScript = `(function(){try{var m=localStorage.getItem('campine:mode');if(m!=='day'&&m!=='night'){var h=new Date().getHours();m=(h>=6&&h<18)?'day':'night';}var r=document.documentElement;r.classList.toggle('dark',m==='night');r.setAttribute('data-mode',m);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale();
  return (
    <html lang={locale} dir={getDir(locale)}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Lalezar&family=Vazirmatn:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <SmoothScroll />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
