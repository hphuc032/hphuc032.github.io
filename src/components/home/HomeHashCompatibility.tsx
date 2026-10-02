"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { localizedPath } from "@/i18n/global-ui";
import { isStaticExport, publicRoutePath } from "@/lib/deployment-path";
import type { Locale } from "@/i18n/locales";

// Old bookmarks and shared Terminal actions stay useful during the R9 migration.
const legacyChapters: Readonly<Record<string, string>> = {
  identity: "/about#identity", expertise: "/about#expertise", experience: "/about#experience",
  achievements: "/about#achievements", operations: "/projects", log: "/log",
  terminal: "/terminal#terminal", contact: "/contact#contact",
};
export function HomeHashCompatibility({ locale }: { locale: Locale }) {
  const router = useRouter();
  useEffect(() => {
    const resolve = () => {
      const target = legacyChapters[window.location.hash.slice(1)];
      if (!target) return;
      const [path, fragment] = target.split("#");
      const equivalent = localizedPath(path!, locale);
      if (!equivalent) return;
      const href = publicRoutePath(`${equivalent}${fragment ? `#${fragment}` : ""}`);
      if (isStaticExport) window.location.replace(href);
      else router.replace(href);
    };
    resolve(); window.addEventListener("hashchange", resolve);
    return () => window.removeEventListener("hashchange", resolve);
  }, [locale, router]);
  return null;
}
