"use client";

import Image from "next/image";
import { useState } from "react";
import { publicAssetPath } from "@/lib/deployment-path";
import type { Locale } from "@/i18n/locales";
import { profile } from "@/data/profile";

/** An image failure keeps the composed space and the real name, never a fabricated portrait. */
export function HeroPortrait({ locale }: { locale: Locale }) {
  const [unavailable, setUnavailable] = useState(false);
  return <figure className="hero-portrait" data-unavailable={unavailable || undefined}>
    {unavailable ? <div className="hero-portrait-unavailable"><span>{profile.name}</span><p>{locale === "en" ? "Portrait unavailable" : "Ảnh chân dung hiện không khả dụng"}</p></div> : <picture>
      <source type="image/webp" srcSet={`${publicAssetPath("/images/identity/nguyen-hoang-phuc-hero-640.webp")} 640w, ${publicAssetPath("/images/identity/nguyen-hoang-phuc-hero.webp")} 1121w`} sizes="(max-width: 899px) 85vw, 44vw" />
      <Image src={publicAssetPath("/images/identity/nguyen-hoang-phuc-hero.png")} alt={locale === "en" ? "Portrait of Nguyen Hoang Phuc" : "Ảnh chân dung Nguyễn Hoàng Phúc"}
        width={1121} height={1403} sizes="(max-width: 899px) 85vw, 44vw" loading="eager" fetchPriority="high" unoptimized onError={() => setUnavailable(true)} />
    </picture>}
  </figure>;
}
