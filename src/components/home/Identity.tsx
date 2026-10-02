import Image from "next/image";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Metadata, MetadataItem } from "@/components/ui/Metadata";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { profile } from "@/data/profile";
import type { Locale } from "@/i18n/locales";
import { publicAssetPath } from "@/lib/deployment-path";

const labels = {
  en: { section: "Identity", question: "Who is behind the system?", field: "Information Security", location: "Vietnam", based: "Based in", learning: "Currently learning", progress: "In progress", caption: "The person behind carwyn.sec" },
  vi: { section: "Giới thiệu", question: "Ai là người phía sau hệ thống?", field: "An toàn thông tin", location: "Việt Nam", based: "Địa điểm", learning: "Đang học", progress: "Đang học", caption: "Con người phía sau carwyn.sec" },
} as const;

export function Identity({ locale }: { locale: Locale }) {
  const copy = labels[locale];
  return <section id="identity" className="identity" aria-labelledby="identity-name" tabIndex={-1}>
    <div className="identity-inner">
      <div className="identity-introduction">
        <SectionLabel number="01">{copy.section}</SectionLabel>
        <p>{copy.question}</p>
      </div>
      <div className="identity-composition">
        <figure className="identity-portrait">
          <div className="identity-image-frame" data-arrival="portrait">
            <Image src={publicAssetPath(profile.portrait.src)} width={profile.portrait.width} height={profile.portrait.height}
              loading="lazy"
              alt={profile.portrait.alt[locale].value}
              sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1565px) 52vw, 750px" />
          </div>
          <figcaption><span>{copy.caption}</span><span aria-hidden="true">NHP / 01</span></figcaption>
        </figure>
        <div className="identity-name-block" data-arrival="name">
          <h2 id="identity-name" className="identity-name" aria-label={profile.name}>
            <span aria-hidden="true">NGUYEN<br />HOANG PHUC</span>
          </h2>
          <p className="identity-field">{copy.field}</p>
        </div>
        <div className="identity-story">
          <p className="identity-biography">{profile.content[locale].value.biography}</p>
          <Metadata className="identity-metadata">
            <MetadataItem label={copy.based}>{copy.location}</MetadataItem>
            <MetadataItem label={copy.learning}>
              <span className="identity-learning">{profile.currentLearning[0].name}<StatusIndicator state={profile.currentLearning[0].status}>{copy.progress}</StatusIndicator></span>
            </MetadataItem>
          </Metadata>
        </div>
      </div>
    </div>
  </section>;
}
