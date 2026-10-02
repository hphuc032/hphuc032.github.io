import { DedicatedPageFrame } from "@/components/pages/DedicatedPageFrame";
import { publicCv, socialLink } from "@/data/contact";
import { profile } from "@/data/profile";
import type { Locale } from "@/i18n/locales";
import { publicAssetPath } from "@/lib/deployment-path";

const copy = {
  en: {
    eyebrow: "CONTACT / CONNECTION",
    title: "LET'S CONNECT.",
    description: "Open to conversations about information security, software projects, cloud, and technical collaboration.",
    channels: "Public contact channels",
    names: { email: "Email", github: "GitHub", linkedin: "LinkedIn", cv: "CV / Resume" },
    actions: { email: "WRITE EMAIL", github: "VIEW GITHUB", linkedin: "VIEW LINKEDIN", cv: "VIEW CV" },
    newTab: "opens in a new tab",
    closing: "A direct conversation. A shared technical interest.",
  },
  vi: {
    eyebrow: "LIÊN HỆ / KẾT NỐI",
    title: "LET'S CONNECT.",
    description: "Sẵn sàng trao đổi về an toàn thông tin, dự án phần mềm, cloud và các cơ hội hợp tác kỹ thuật.",
    channels: "Các kênh liên hệ công khai",
    names: { email: "Email", github: "GitHub", linkedin: "LinkedIn", cv: "CV / Hồ sơ" },
    actions: { email: "GỬI EMAIL", github: "XEM GITHUB", linkedin: "XEM LINKEDIN", cv: "XEM CV" },
    newTab: "mở trong thẻ mới",
    closing: "Một cuộc trao đổi trực tiếp. Một mối quan tâm chung về kỹ thuật.",
  },
} as const;

export function ContactPage({ locale }: { locale: Locale }) {
  const labels = copy[locale];
  const methods = [
    { id: "email", link: socialLink("email"), newTab: false },
    { id: "github", link: socialLink("github"), newTab: true },
    { id: "linkedin", link: socialLink("linkedin"), newTab: true },
    { id: "cv", link: publicCv, newTab: true },
  ] as const;

  return <DedicatedPageFrame locale={locale} page="contact" {...labels}>
    <section id="contact" className="contact-destination" aria-labelledby="contact-channels-title">
      <h2 id="contact-channels-title" className="sr-only">{labels.channels}</h2>
      <address className="contact-address">
        <ol className="contact-list">
          {methods.map((method, index) => <li key={method.id} className="contact-record">
            <span className="contact-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <span className="contact-kind">{labels.names[method.id]}</span>
            <a href={method.id === "cv" ? publicAssetPath(method.link.url) : method.link.url}
              data-cursor="open" {...(method.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              <span className="contact-value">{method.id === "github" ? new URL(method.link.url).host + new URL(method.link.url).pathname : method.link.label}</span>
              <span className="contact-action">{labels.actions[method.id]} <span aria-hidden="true">{method.newTab ? "↗" : "→"}</span></span>
              {method.newTab && <span className="sr-only"> ({labels.newTab})</span>}
            </a>
          </li>)}
        </ol>
      </address>
      <div className="contact-context">
        <p>{profile.name}<br /><span lang="en">{profile.field} / {profile.location}</span></p>
        <p>{labels.closing}</p>
      </div>
    </section>
  </DedicatedPageFrame>;
}
