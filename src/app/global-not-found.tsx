import type { Metadata } from "next";
import { BilingualNotFoundContent } from "@/components/layout/NotFoundContent";
import { editorialFont, technicalFont } from "@/styles/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Page not found — carwyn.sec",
  description: "The requested page is unavailable or has not been published.",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  // Next can insert the metadata title after this early language bootstrap.
  // Keep its established Vietnamese title stable throughout the 404 document.
  const localeScript = `if (/(?:^|\\/)vi(?:\\/|$)/.test(location.pathname)) {
    document.documentElement.lang = "vi";
    const localize = () => { if (document.title !== "Không tìm thấy trang — carwyn.sec") document.title = "Không tìm thấy trang — carwyn.sec"; };
    localize();
    const observer = new MutationObserver(localize);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    addEventListener("pagehide", () => observer.disconnect());
    addEventListener("pageshow", event => { if (event.persisted) { localize(); observer.observe(document.head, { childList: true, subtree: true, characterData: true }); } });
  }`;
  return <html lang="en" suppressHydrationWarning className={`dark ${editorialFont.variable} ${technicalFont.variable}`}>
    <head><script dangerouslySetInnerHTML={{ __html: localeScript }} /></head>
    <body>
      <BilingualNotFoundContent />
    </body>
  </html>;
}
