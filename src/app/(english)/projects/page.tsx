import { ProjectsPage } from "@/components/pages/ProjectsPage";
import { dedicatedPageMetadata, DedicatedPageRoute } from "@/app/_shared/dedicated-page-route";

export const metadata = dedicatedPageMetadata("projects", "en");
export default function EnglishProjectsPage() { return <DedicatedPageRoute component={ProjectsPage} page="projects" locale="en" />; }

