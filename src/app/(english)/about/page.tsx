import { AboutPage } from "@/components/pages/AboutPage";
import { dedicatedPageMetadata, DedicatedPageRoute } from "@/app/_shared/dedicated-page-route";

export const metadata = dedicatedPageMetadata("about", "en");
export default function EnglishAboutPage() { return <DedicatedPageRoute component={AboutPage} page="about" locale="en" />; }

