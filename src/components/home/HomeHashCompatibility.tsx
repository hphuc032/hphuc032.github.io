"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { legacyHomeDestination } from "@/i18n/locale-navigation";
import { isStaticExport, publicRoutePath } from "@/lib/deployment-path";
import type { Locale } from "@/i18n/locales";

export function HomeHashCompatibility({ locale }: { locale: Locale }) {
  const router = useRouter();
  useEffect(() => {
    const resolve = () => {
      const target = legacyHomeDestination(window.location.hash, locale);
      if (!target) return;
      const href = publicRoutePath(target);
      if (isStaticExport) window.location.replace(href);
      else router.replace(href);
    };
    resolve(); window.addEventListener("hashchange", resolve);
    return () => window.removeEventListener("hashchange", resolve);
  }, [locale, router]);
  return null;
}
