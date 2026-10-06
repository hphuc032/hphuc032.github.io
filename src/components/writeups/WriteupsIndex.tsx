import { DeploymentLink } from "@/components/ui/DeploymentLink";
import { TextLink } from "@/components/ui/TextLink";
import { logIndexPath } from "@/data/security-log-publication";
import { publishedWriteupSummaries, writeupArticlePath } from "@/lib/writeups/publication";
import type { Locale } from "@/i18n/locales";

const copy = {
  en: { archive: "CTF / CHALLENGE WRITEUPS", empty: "No CTF writeups are published yet.", note: "Technical learning notes and lab analysis are available in the Security Log.", log: "VIEW SECURITY LOG", read: "READ WRITEUP", distinction: "Technical notes", description: "Security Log collects learning, experiments and analysis beyond CTF challenges." },
  vi: { archive: "CTF / BÀI GIẢI THỬ THÁCH", empty: "Chưa có bài giải CTF nào được xuất bản.", note: "Các ghi chú học tập và phân tích kỹ thuật hiện có tại Security Log.", log: "XEM SECURITY LOG", read: "ĐỌC WRITEUP", distinction: "Ghi chép kỹ thuật", description: "Security Log lưu các ghi chép học tập, thử nghiệm và phân tích ngoài các thử thách CTF." },
} as const;

export function WriteupsIndex({ locale }: { locale: Locale }) {
  const content = copy[locale], entries = publishedWriteupSummaries();
  return <div className="writeups-index">
    <section aria-labelledby="writeups-archive-title" className="writeups-archive">
      <h2 id="writeups-archive-title" className="writeups-label">{content.archive}</h2>
      {entries.length === 0 ? <div className="writeups-empty">
        <p className="writeups-empty-title">{content.empty}</p>
        <p className="writeups-empty-note">{content.note}</p>
        <TextLink href={logIndexPath(locale)} variant="editorial" arrow="right" prefetch={false}>{content.log}</TextLink>
      </div> : <ol className="writeups-list">{entries.map((entry, index) => <li key={entry.slug}>
        <DeploymentLink href={writeupArticlePath(entry.slug, locale)} className="writeups-row" prefetch={false}>
          <span className="writeups-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <div><p className="writeups-label">{entry.event} / {entry.category.toUpperCase()}</p><h3>{entry.title}</h3></div>
          <span className="writeups-row-action">{content.read} <span aria-hidden="true">→</span></span>
        </DeploymentLink>
      </li>)}</ol>}
    </section>
    {entries.length > 0 && <aside className="writeups-log" aria-labelledby="writeups-log-title">
      <h2 id="writeups-log-title">{content.distinction}</h2><p>{content.description}</p>
      <TextLink href={logIndexPath(locale)} variant="editorial" arrow="right" prefetch={false}>{content.log}</TextLink>
    </aside>}
  </div>;
}
