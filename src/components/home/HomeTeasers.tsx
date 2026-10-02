import { DeploymentLink } from "@/components/ui/DeploymentLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TextLink } from "@/components/ui/TextLink";
import { profile } from "@/data/profile";
import { homeLabels } from "@/data/home";
import { publishedCases } from "@/data/projects";
import { casePath } from "@/data/project-publication";
import { publishedSecurityLogs } from "@/data/security-log";
import { logIndexPath, logArticlePath } from "@/data/security-log-publication";
import { localizedPath } from "@/i18n/global-ui";
import type { Locale } from "@/i18n/locales";

export function HomeTeasers({ locale }: { locale: Locale }) {
  const copy = homeLabels[locale];
  return <>
    <section id="about" className="home-teaser home-about" aria-labelledby="home-about-title" tabIndex={-1}>
      <SectionLabel number="02">{copy.about}</SectionLabel>
      <div className="home-teaser-body">
        <h2 id="home-about-title" data-reveal="chapter" data-reveal-key="home-about" lang="en">{profile.name}</h2>
        <p>{profile.content[locale].value.biography}</p>
        <TextLink href={localizedPath("/about", locale)!} variant="editorial" arrow="right" prefetch={false}>{copy.profile}</TextLink>
      </div>
    </section>
    <section id="featured-projects" className="home-teaser home-projects" aria-labelledby="home-projects-title" tabIndex={-1}>
      <SectionLabel number="03">{copy.projects}</SectionLabel>
      <div className="home-teaser-body">
        <h2 id="home-projects-title" className="sr-only">{copy.projects}</h2>
        <ol className="home-project-list">{publishedCases(locale).map((project, index) => <li className="home-project" key={project.id}>
          <DeploymentLink href={casePath(project.slug, locale)} prefetch={false} data-cursor="view">
            <span className="home-record-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div><h3 lang="en" data-reveal="record" data-reveal-key={`home-${project.id}`}>{project.content[locale]!.value.title}</h3><p>{project.content[locale]!.value.summary}</p></div>
            <span className="home-record-arrow" aria-hidden="true">↗</span>
          </DeploymentLink>
        </li>)}</ol>
        <TextLink href={localizedPath("/projects", locale)!} variant="editorial" arrow="right" prefetch={false}>{copy.allProjects}</TextLink>
      </div>
    </section>
    <section id="latest-writing" className="home-teaser home-writing" aria-labelledby="home-writing-title" tabIndex={-1}>
      <SectionLabel number="04">{copy.writing}</SectionLabel>
      <div className="home-teaser-body">
        <h2 id="home-writing-title" className="sr-only">{copy.writing}</h2>
        {publishedSecurityLogs(locale).slice(0, 1).map(entry => <article key={entry.id} className="home-note">
          <p className="home-note-label">{entry.id.toUpperCase()} / SECURITY LOG</p>
          <h3 data-reveal="chapter" data-reveal-key={`home-${entry.id}`}><DeploymentLink href={logArticlePath(entry.slug, locale)} prefetch={false}>{entry.content[locale]!.value.title}</DeploymentLink></h3>
          <p>{entry.content[locale]!.value.excerpt}</p>
          <TextLink href={logArticlePath(entry.slug, locale)} variant="editorial" arrow="right" prefetch={false}>{copy.read}<span className="sr-only">: {entry.content[locale]!.value.title}</span></TextLink>
        </article>)}
        <TextLink href={logIndexPath(locale)} variant="editorial" arrow="right" prefetch={false}>{copy.archive}</TextLink>
      </div>
    </section>
    <section id="connect" className="home-teaser home-connect" aria-labelledby="home-connect-title" tabIndex={-1}>
      <SectionLabel number="05">{copy.contact}</SectionLabel>
      <div className="home-teaser-body"><h2 id="home-connect-title" lang="en" aria-label="LET'S CONNECT." data-arrival="conclusion"><span>LET&apos;S</span><span>CONNECT.</span></h2>
        <TextLink href={localizedPath("/contact", locale)!} variant="editorial" arrow="right" prefetch={false}>{copy.connect}</TextLink>
      </div>
    </section>
  </>;
}
