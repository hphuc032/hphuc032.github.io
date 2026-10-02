import { SectionLabel } from "@/components/ui/SectionLabel";
import { publishedExperience } from "@/data/experience";
import type { Locale } from "@/i18n/locales";
import type { DateRange } from "@/types/content";

const months = { en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], vi: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"] } as const;
function dateText(range: DateRange, locale: Locale) {
  const render = (value: NonNullable<DateRange["start"]>) => {
    if (value.precision === "year") return value.value.slice(0, 4);
    const [year, month] = value.value.split("-");
    return value.precision === "month" ? `${months[locale][Number(month) - 1]} ${year}` : value.value;
  };
  if (!range.start) return undefined;
  return { start: render(range.start), end: range.end === "present" ? (locale === "en" ? "Present" : "Hiện tại") : range.end ? render(range.end) : undefined };
}

export function Experience({ locale }: { locale: Locale }) {
  const vi = locale === "vi";
  const records = publishedExperience(locale);
  return <section id="experience" className="experience" aria-labelledby="experience-title" tabIndex={-1}>
    <div className="experience-inner">
      <div className="experience-topline"><SectionLabel number="03">{vi ? "Kinh nghiệm" : "Experience"}</SectionLabel><span>{String(records.length).padStart(2, "0")} {vi ? "công việc" : "work records"}</span></div>
      <div className="experience-intro"><h2 id="experience-title">{vi ? "Công việc, trong thực tế." : "Work, in context."}</h2><p>{vi ? "Kiểm thử phần mềm và công việc thủ công trực tiếp." : "Software testing and hands-on craft."}</p></div>
      <ol className="experience-list">
        {records.map(({ record, content }) => {
          const date = record.dates ? dateText(record.dates, locale) : undefined;
          return <li key={record.id} className="experience-record">
            <div className="experience-chronology">
              <span className="experience-index">{String(record.order).padStart(2, "0")}</span>
              {date && <p className="experience-date"><time dateTime={record.dates!.start!.value}>{date.start}</time>{date.end && <><span aria-hidden="true">—</span><span>{date.end}</span></>}</p>}
            </div>
            <div className="experience-primary">
              <p className="experience-kind">{record.kind === "technical" ? (vi ? "Công việc số" : "Digital work") : (vi ? "Công việc thủ công" : "Craft work")}</p>
              <h3>{record.organization ?? content.role}</h3>
              {record.organization && <p className="experience-role">{content.role}</p>}
              {record.location && <p className="experience-location">{locale === "vi" && record.location === "Phu Nhuan" ? "Phú Nhuận" : record.location}</p>}
            </div>
            <div className="experience-detail">
              {content.description && <p className="experience-description">{content.description}</p>}
              {!!content.responsibilities?.length && <ul aria-label={vi ? "Trách nhiệm đã xác nhận" : "Confirmed responsibilities"}>{content.responsibilities.map(item => <li key={item}>{item}</li>)}</ul>}
            </div>
          </li>;
        })}
      </ol>
    </div>
  </section>;
}
