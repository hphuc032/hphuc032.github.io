import { SectionLabel } from "@/components/ui/SectionLabel";
import { publishedExpertise } from "@/data/expertise";
import type { Locale } from "@/i18n/locales";

const labels = {
  en: { section: "Expertise", heading: "Security in practice.", note: "Applied in projects. Practiced in labs.", discipline: "Discipline", practice: "Practical scope", tools: "Worked with", count: "04 disciplines" },
  vi: { section: "Chuyên môn", heading: "Bảo mật qua thực hành.", note: "Áp dụng trong dự án. Thực hành qua bài lab.", discipline: "Lĩnh vực", practice: "Phạm vi thực hành", tools: "Đã sử dụng", count: "04 lĩnh vực" },
} as const;

export function Expertise({ locale }: { locale: Locale }) {
  const copy = labels[locale];
  const records = publishedExpertise(locale);
  return <section id="expertise" className="expertise" aria-labelledby="expertise-title" tabIndex={-1}>
    <div className="expertise-inner">
      <div className="expertise-topline"><SectionLabel number="02">{copy.section}</SectionLabel><span>{copy.count}</span></div>
      <div className="expertise-introduction">
        <h2 id="expertise-title" data-reveal="chapter" data-reveal-key="expertise">{copy.heading}</h2>
        <p>{copy.note}</p>
      </div>
      <div className="expertise-columns" aria-hidden="true">
        <span>No.</span><span>{copy.discipline}</span><span>{copy.practice}</span><span>{copy.tools}</span>
      </div>
      <ol className="expertise-list">
        {records.map(({ record, content }) => <li key={record.id} className="expertise-row">
          <span className="expertise-number" aria-hidden="true">{String(record.order).padStart(2, "0")}</span>
          <h3>{content.title}</h3>
          <p className="expertise-description">{content.description}</p>
          <div className="expertise-evidence">
            <p className="expertise-tools-label">{copy.tools}</p>
            <ul aria-label={copy.tools} lang="en">{record.toolIds.map(tool => <li key={tool}>{tool}</li>)}</ul>
          </div>
        </li>)}
      </ol>
    </div>
  </section>;
}
