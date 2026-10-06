import { TextLink } from "@/components/ui/TextLink";
import Image from "next/image";
import { ProjectVisual } from "./ProjectVisual";
import { publishedCases } from "@/data/projects";
import { casePath } from "@/data/project-publication";
import { dedicatedPagePath } from "@/data/page-publication";
import type { Project } from "@/types/content";
import type { Locale } from "@/i18n/locales";
import { publicAssetPath } from "@/lib/deployment-path";

export function CaseStudy({ project, locale }: { project: Project; locale: Locale }) {
  const vi = locale === "vi";
  const copy = project.content[locale]!.value;
  const overview = project.overview?.[locale];
  const others = publishedCases(locale).filter(item => item.id !== project.id);
  return <main id="main-content" tabIndex={-1} className="case-study">
    <article className="case-inner" aria-labelledby="case-title">
      <TextLink href={dedicatedPagePath("projects", locale)!} prefetch={false} variant="navigation">{vi ? "← Dự án tiêu biểu" : "← Selected Operations"}</TextLink>
      <header className="case-opening">
        <p className="case-eyebrow">CASE {project.caseNumber}<span>/</span>{project.category?.[locale]?.value}</p>
        <h1 id="case-title" lang="en">{copy.title}</h1>
        <p className="case-summary">{copy.summary}</p>
      </header>
      <div className="case-overview-grid">
        <ProjectVisual project={project} locale={locale} />
        <div className="case-overview">
          {overview?.state === "published" && <section aria-labelledby="overview"><h2 id="overview">{vi ? "Tổng quan" : "Overview"}</h2><p>{overview.value}</p></section>}
          {!!project.technologyIds?.length && <section aria-labelledby="technologies"><h2 id="technologies">{vi ? "Công nghệ đã sử dụng" : "Technologies used"}</h2><ul className="case-technologies" lang="en">{project.technologyIds.map(tool => <li key={tool}>{tool}</li>)}</ul></section>}
        </div>
      </div>
      {project.sections?.filter(section => section.state === "published" && section.content[locale]?.state === "published").map(section => {
        const prose = section.content[locale]!.value;
        if (!prose.paragraphs.length) return null;
        const evidence = section.evidence;
        return <section className="case-prose" key={section.id} aria-labelledby={section.id}><h2 id={section.id}>{prose.heading}</h2>{prose.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
          {evidence && evidence.alt[locale]?.state === "published" && <figure className="case-evidence"><Image src={publicAssetPath(evidence.src)} width={evidence.width} height={evidence.height} alt={evidence.alt[locale]!.value} sizes="(max-width: 768px) 90vw, 704px" />{evidence.caption?.[locale]?.state === "published" && <figcaption>{evidence.caption[locale]!.value}</figcaption>}</figure>}
        </section>;
      })}
      {!!project.links?.length && <nav className="case-resources" aria-label={vi ? "Tài liệu dự án" : "Project resources"}>{project.links.map(link => <TextLink key={link.url} href={link.url} arrow="external">{link.label}</TextLink>)}</nav>}
      <nav className="case-next" aria-label={vi ? "Các dự án khác" : "Other featured cases"}><p>{vi ? "Khám phá tiếp" : "Continue exploring"}</p>{others.map(item => <TextLink key={item.id} href={casePath(item.slug, locale)} variant="editorial" arrow="right" data-cursor="view">CASE {item.caseNumber} / <span lang="en">{item.content[locale]!.value.title}</span></TextLink>)}</nav>
    </article>
  </main>;
}
