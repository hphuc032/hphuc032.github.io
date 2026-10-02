import { dedicatedPageMetadata, DedicatedPageRoute } from "@/app/_shared/dedicated-page-route";

export const metadata = dedicatedPageMetadata("projects", "en");
export default function EnglishProjectsPage() { return <DedicatedPageRoute page="projects" locale="en" />; }

