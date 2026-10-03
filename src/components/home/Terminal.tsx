import { SectionLabel } from "@/components/ui/SectionLabel";
import { TerminalConsole } from "@/components/terminal/TerminalConsole";
import type { TerminalContent, TerminalResponse } from "@/components/terminal/types";
import { publishedAchievements } from "@/data/achievements";
import { publicCv, socialLinks } from "@/data/contact";
import { publishedExpertise } from "@/data/expertise";
import { publishedExperience } from "@/data/experience";
import { casePath } from "@/data/project-publication";
import { profile } from "@/data/profile";
import { publishedProjects } from "@/data/projects";
import { publishedSecurityLogs } from "@/data/security-log";
import { logArticlePath, logIndexPath } from "@/data/security-log-publication";
import type { Locale } from "@/i18n/locales";
import { dedicatedPagePath } from "@/data/page-publication";
import { DeploymentLink } from "@/components/ui/DeploymentLink";
import { terminalCommands } from "@/components/terminal/types";

const labels = {
  en: {
    section: "Terminal", mode: "Local command map", ready: "INTERFACE READY", consoleLabel: "CARWYN.SEC / LOCAL INTERFACE",
    instruction: 'Type "help" to list the available commands.', input: "Enter a portfolio command", output: "Terminal output history",
    available: "Available commands", invalid: "command not found", hint: 'type "help" for available commands', cleared: "Terminal history cleared.",
    actions: { operations: "OPEN SELECTED OPERATIONS", experience: "OPEN EXPERIENCE", achievements: "OPEN ACHIEVEMENTS", logs: "OPEN SECURITY LOG", contact: "OPEN CONTACT" },
    status: { "core-team": "Core Team", participated: "Qualifying round participant", "top-4": "Top 4", recognized: "Recognized", "in-progress": "In progress", completed: "Completed" },
    contact: "Public contact channels", unavailable: "No published records.", identityField: "Information Security / Cyber Security", identityLocation: "Vietnam",
    submit: "Run command", reference: "Command reference", keyboard: "Enter to run · ↑ / ↓ to recall · Ctrl+L to clear while typing", noJs: "Enable JavaScript to use the interactive console. Published content remains available through these links.",
    descriptions: {
      help: "list available commands", whoami: "show the identity behind carwyn.sec", skills: "show published capability groups",
      projects: "show featured projects", experience: "show published work records", achievements: "show published achievement records",
      logs: "show published Security Log entries", contact: "show public contact channels", clear: "clear this terminal history",
    },
  },
  vi: {
    section: "Terminal", mode: "Các lệnh cục bộ", ready: "GIAO DIỆN SẴN SÀNG", consoleLabel: "CARWYN.SEC / GIAO DIỆN CỤC BỘ",
    instruction: 'Nhập "help" để xem các lệnh hiện có.', input: "Nhập lệnh portfolio", output: "Lịch sử đầu ra terminal",
    available: "Các lệnh hiện có", invalid: "không tìm thấy lệnh", hint: 'nhập "help" để xem các lệnh hiện có', cleared: "Đã xóa lịch sử terminal.",
    actions: { operations: "MỞ DỰ ÁN TIÊU BIỂU", experience: "MỞ KINH NGHIỆM", achievements: "MỞ THÀNH TỰU", logs: "MỞ SECURITY LOG", contact: "MỞ LIÊN HỆ" },
    status: { "core-team": "Core Team", participated: "Tham dự vòng sơ khảo", "top-4": "Top 4", recognized: "Được ghi nhận", "in-progress": "Đang học", completed: "Hoàn thành" },
    contact: "Các kênh liên hệ công khai", unavailable: "Chưa có nội dung công khai.", identityField: "An toàn thông tin / Cyber Security", identityLocation: "Việt Nam",
    submit: "Gửi lệnh", reference: "Tra cứu lệnh", keyboard: "Enter để gửi · ↑ / ↓ để xem lịch sử · Ctrl+L để xóa khi đang nhập", noJs: "Bật JavaScript để dùng bảng lệnh tương tác. Bạn vẫn có thể xem nội dung đã công bố qua các liên kết dưới đây.",
    descriptions: {
      help: "liệt kê các lệnh hiện có", whoami: "hiển thị danh tính phía sau carwyn.sec", skills: "hiển thị các nhóm năng lực đã công bố",
      projects: "hiển thị các dự án tiêu biểu", experience: "hiển thị kinh nghiệm đã công bố", achievements: "hiển thị thành tựu đã công bố",
      logs: "hiển thị các bài Security Log đã công bố", contact: "xem các kênh liên hệ công khai", clear: "xóa lịch sử terminal này",
    },
  },
} as const;

export function Terminal({ locale }: { locale: Locale }) {
  const copy = labels[locale];
  const projectsPath = dedicatedPagePath("projects", locale)!;
  const aboutPath = dedicatedPagePath("about", locale)!;
  const contactPath = dedicatedPagePath("contact", locale)!;
  const skills = publishedExpertise(locale).map(({ record, content }) => ({ label: content.title, detail: record.toolIds.join(" / ") }));
  const projectEntries = publishedProjects(locale).map(project => {
    const detail = project.category?.[locale]?.value;
    return { label: project.content[locale]!.value.title, href: casePath(project.slug, locale), ...(detail ? { detail } : {}) };
  });
  const experienceEntries = publishedExperience(locale).map(({ record, content }) => {
    const location = locale === "vi" && record.location === "Phu Nhuan" ? "Phú Nhuận" : record.location;
    return { label: record.organization ?? content.role, detail: [record.organization ? content.role : undefined, location].filter(Boolean).join(" / ") };
  });
  const achievementEntries = publishedAchievements(locale).map(record => {
    const content = record.content[locale]!.value;
    const label = record.category === "community" && record.organization ? record.organization : content.title;
    const detail = record.category === "community" ? copy.status[record.status]
      : [content.descriptor, copy.status[record.status]].filter((part, index, parts) => part && parts.indexOf(part) === index).join(" / ");
    return { label, detail };
  });
  const logEntries = publishedSecurityLogs(locale).map(entry => ({ label: entry.content[locale]!.value.title, detail: `LOG_${entry.logNumber}`, href: logArticlePath(entry.slug, locale) }));
  const contactEntries = [
    ...socialLinks.map(link => ({ label: link.kind === "email" ? "Email" : link.kind === "github" ? "GitHub" : "LinkedIn", detail: link.label, href: link.url })),
    { label: "CV", detail: publicCv.label, href: publicCv.url },
  ];
  const response = (value: Omit<TerminalResponse, "announcement">): TerminalResponse => ({ ...value, announcement: value.heading ?? value.lines?.[0] ?? value.entries?.[0]?.label ?? copy.unavailable });
  const content: TerminalContent = {
    submitLabel: copy.submit, keyboardHint: copy.keyboard,
    prompt: "carwyn@sec:~$", ready: copy.ready, consoleLabel: copy.consoleLabel, instruction: copy.instruction, inputLabel: copy.input, outputLabel: copy.output,
    commandDescriptions: copy.descriptions, availableHeading: copy.available, invalidPrefix: copy.invalid,
    invalidHint: copy.hint, clearedAnnouncement: copy.cleared,
    responses: {
      whoami: response({ lines: [profile.name, profile.brand, copy.identityField, copy.identityLocation] }),
      skills: response({ heading: copy.descriptions.skills, entries: skills }),
      projects: response({ heading: copy.descriptions.projects, entries: projectEntries, action: { label: copy.actions.operations, href: projectsPath } }),
      experience: response({ heading: copy.descriptions.experience, entries: experienceEntries, action: { label: copy.actions.experience, href: `${aboutPath}#experience` } }),
      achievements: response({ heading: copy.descriptions.achievements, entries: achievementEntries, action: { label: copy.actions.achievements, href: `${aboutPath}#achievements` } }),
      logs: response({ heading: copy.descriptions.logs, entries: logEntries, action: { label: copy.actions.logs, href: logIndexPath(locale) } }),
      contact: response({ heading: copy.contact, entries: contactEntries, action: { label: copy.actions.contact, href: contactPath } }),
    },
  };

  return <section id="terminal" className="terminal-section" aria-labelledby="terminal-title" tabIndex={-1} data-native-cursor>
    <div className="terminal-inner">
      <div className="terminal-topline"><SectionLabel number="01">{copy.section}</SectionLabel><h2 id="terminal-title">{copy.mode}</h2></div>
      <TerminalConsole content={content} />
      <noscript><style>{`.terminal-console{display:none}`}</style><div className="terminal-noscript">
        <p>{copy.noJs}</p>
        <ul>
          <li><DeploymentLink href={projectsPath}>{copy.actions.operations}</DeploymentLink></li>
          <li><DeploymentLink href={`${aboutPath}#experience`}>{copy.actions.experience}</DeploymentLink></li>
          <li><DeploymentLink href={`${aboutPath}#achievements`}>{copy.actions.achievements}</DeploymentLink></li>
          <li><DeploymentLink href={logIndexPath(locale)}>{copy.actions.logs}</DeploymentLink></li>
          <li><DeploymentLink href={contactPath}>{copy.actions.contact}</DeploymentLink></li>
        </ul>
      </div></noscript>
      <aside className="terminal-reference" aria-labelledby="terminal-reference-title">
        <div><h2 id="terminal-reference-title">{copy.reference}</h2><p>{copy.keyboard}</p></div>
        <dl>{terminalCommands.map(command => <div key={command}><dt><code>{command}</code></dt><dd>{copy.descriptions[command]}</dd></div>)}</dl>
      </aside>
    </div>
  </section>;
}
