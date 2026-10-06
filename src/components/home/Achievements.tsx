import { SectionLabel } from "@/components/ui/SectionLabel";
import { publishedAchievements } from "@/data/achievements";
import type { Locale } from "@/i18n/locales";
import type { Achievement } from "@/types/content";

const categoryOrder: readonly Achievement["category"][] = ["community", "competition", "recognition", "certification"];
const labels = {
  en: {
    section: "Achievements", count: "published records", heading: "Progress, on record.",
    intro: "Community, competition, recognition, and current study.", status: "Status", viewEvent: "View event", newTab: "opens in a new tab",
    categories: { community: "Community", competition: "Competitions", recognition: "Recognition", certification: "Certifications" },
    states: { "core-team": "Core Team", participated: "Qualifying round participant", "top-4": "Top 4", recognized: "Recognized", "in-progress": "In progress", completed: "Completed" },
  },
  vi: {
    section: "Thành tựu", count: "hồ sơ công khai", heading: "Tiến trình, được ghi nhận.",
    intro: "Cộng đồng, cuộc thi, ghi nhận và quá trình học hiện tại.", status: "Trạng thái", viewEvent: "Xem sự kiện", newTab: "mở trong thẻ mới",
    categories: { community: "Cộng đồng", competition: "Cuộc thi", recognition: "Ghi nhận", certification: "Chứng chỉ" },
    states: { "core-team": "Core Team", participated: "Tham dự vòng sơ khảo", "top-4": "Top 4", recognized: "Được ghi nhận", "in-progress": "Đang học", completed: "Hoàn thành" },
  },
} as const;

export function Achievements({ locale }: { locale: Locale }) {
  const copy = labels[locale];
  const records = publishedAchievements(locale);
  const groups = categoryOrder.map(category => ({ category, records: records.filter(record => record.category === category) })).filter(group => group.records.length > 0);

  return <section id="achievements" className="achievements" aria-labelledby="achievements-title" tabIndex={-1}>
    <div className="achievements-inner">
      <div className="achievements-topline"><SectionLabel number="04">{copy.section}</SectionLabel><span>{String(records.length).padStart(2, "0")} {copy.count}</span></div>
      <div className="achievements-intro"><h2 id="achievements-title">{copy.heading}</h2><p>{copy.intro}</p></div>
      <div className="achievement-groups">
        {groups.map(group => <section className="achievement-group" aria-labelledby={`achievement-${group.category}`} key={group.category}>
          <header className="achievement-group-heading"><h3 id={`achievement-${group.category}`}>{copy.categories[group.category]}</h3><span>{String(group.records.length).padStart(2, "0")}</span></header>
          <ol>
            {group.records.map(record => {
              const content = record.content[locale]!.value;
              const communityRecord = record.category === "community" && record.organization;
              return <li className="achievement-record" data-status={record.status} key={record.id}>
                <span className="achievement-index">{String(record.order).padStart(3, "0")}</span>
                <div className="achievement-primary">
                  <h4 data-reveal="record" data-reveal-key={`achievement-${record.id}`}>{communityRecord ? record.organization : content.title}</h4>
                  <p className="achievement-descriptor">{communityRecord ? content.title : content.descriptor}</p>
                  {content.detail && <p className="achievement-detail">{content.detail}</p>}
                  {!!record.evidenceLinks?.length && <ul className="achievement-links">{record.evidenceLinks.map(link => <li key={link.url}><a href={link.url} target="_blank" rel="noopener noreferrer">{copy.viewEvent} <span aria-hidden="true">↗</span><span className="sr-only"> ({copy.newTab})</span></a></li>)}</ul>}
                </div>
                <p className="achievement-status"><span>{copy.status}</span><strong>{copy.states[record.status]}</strong></p>
              </li>;
            })}
          </ol>
        </section>)}
      </div>
    </div>
  </section>;
}
