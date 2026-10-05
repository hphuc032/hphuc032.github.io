import { ProjectsPage } from "@/components/pages/ProjectsPage";
import { notFound } from "next/navigation";
import { dedicatedPageMetadata, DedicatedPageRoute } from "@/app/_shared/dedicated-page-route";
import { isLocale } from "@/i18n/locales";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return dedicatedPageMetadata("projects", locale); }
export default async function LocalizedProjectsPage({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <DedicatedPageRoute component={ProjectsPage} page="projects" locale={locale} />; }

