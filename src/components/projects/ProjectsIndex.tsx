import { DeploymentLink } from "@/components/ui/DeploymentLink";
import { ProjectVisual } from "@/components/operations/ProjectVisual";
import { socialLink } from "@/data/contact";
import { casePath } from "@/data/project-publication";
import { publishedCases } from "@/data/projects";
import type { Locale } from "@/i18n/locales";

/** Server-rendered rows; CSS provides all preview/hover/focus interaction. */
export function ProjectsIndex({ locale }: { locale: Locale }) {
  const vi = locale === "vi";
  const copy = {
    selection: vi ? "Danh sách dự án" : "Project selection",
    case: vi ? "XEM BÀI DỰ ÁN" : "VIEW CASE",
    tools: vi ? "Công cụ và công nghệ" : "Tools and technologies",
    beyond: vi ? "Tiếp tục khám phá" : "Beyond this selection",
    github: vi ? "KHÁM PHÁ GITHUB" : "EXPLORE GITHUB",
  };
  return <section className="projects-index" aria-label={copy.selection}>
    <ol className="projects-index-list">
      {publishedCases(locale).map(project => {
        const presentation = project.indexPresentation;
        const translation = presentation?.content[locale];
        if (!presentation || translation?.state !== "published") {
          throw new Error(`Missing reviewed Projects index presentation: ${project.id}/${locale}`);
        }
        const titleId = `project-title-${project.id}`;
        const ctaId = `project-cta-${project.id}`;
        return <li className="projects-index-row" key={project.id} data-project={project.id}>
          <DeploymentLink className="projects-index-link" href={casePath(project.slug, locale)}
            prefetch={false} data-cursor="view" aria-labelledby={`${ctaId} ${titleId}`}>
            <span className="projects-index-number" aria-hidden="true">{String(project.featuredOrder).padStart(2, "0")}</span>
            <div className="projects-index-copy">
              <p className="projects-index-category">{translation.value.label}</p>
              <h2 id={titleId} lang="en">{project.content[locale]!.value.title}</h2>
              <p className="projects-index-description">{translation.value.description}</p>
              <ul className="projects-index-tools" aria-label={copy.tools}>
                {presentation.tools.map(tool => <li key={tool}>{tool}</li>)}
              </ul>
              <span className="projects-index-cta"><span id={ctaId}>{copy.case}</span><span className="projects-index-arrow" aria-hidden="true">→</span></span>
            </div>
            <div className="projects-index-preview" aria-hidden="true">
              <ProjectVisual project={project} locale={locale} />
            </div>
          </DeploymentLink>
        </li>;
      })}
    </ol>
    <div className="projects-index-end">
      <p>{copy.beyond}</p>
      <a className="projects-index-github" href={socialLink("github").url}>{copy.github}<span aria-hidden="true"> ↗</span></a>
    </div>
  </section>;
}
