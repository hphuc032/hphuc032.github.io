import { LogEntryRow } from "@/components/log/LogEntryRow";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TextLink } from "@/components/ui/TextLink";
import { publishedSecurityLogs } from "@/data/security-log";
import type { Locale } from "@/i18n/locales";

export function SecurityLogIndex({ locale }: { locale: Locale }) {
  const vi = locale === "vi";
  const home = `${vi ? "/vi" : "/"}#latest-writing`;
  const entries = publishedSecurityLogs(locale);
  return <main id="main-content" tabIndex={-1} className="log-index">
    <div className="log-index-inner">
      <TextLink href={home} variant="navigation">{vi ? "← Trang chủ / Security Log" : "← Home / Security Log"}</TextLink>
      <header className="log-index-opening">
        <SectionLabel number="07">Security Log</SectionLabel>
        <h1>{vi ? "Ghi chép kỹ thuật. Bài lab. Phân tích." : "Field notes. Labs. Analysis."}</h1>
        <p>{vi ? "Một kho lưu trữ nhỏ dành cho phương pháp, quan sát và giới hạn trong quá trình học an toàn thông tin." : "A small technical archive for methods, observations, and limits encountered while studying information security."}</p>
      </header>
      <div className="log-index-count"><span>{vi ? "Hồ sơ công khai" : "Published record"}</span><strong>{String(entries.length).padStart(2, "0")}</strong></div>
      <ol className="security-log-list">{entries.map(entry => <LogEntryRow key={entry.id} entry={entry} locale={locale} />)}</ol>
    </div>
  </main>;
}
