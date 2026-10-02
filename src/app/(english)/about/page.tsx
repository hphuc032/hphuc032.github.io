import { dedicatedPageMetadata, DedicatedPageRoute } from "@/app/_shared/dedicated-page-route";

export const metadata = dedicatedPageMetadata("about", "en");
export default function EnglishAboutPage() { return <DedicatedPageRoute page="about" locale="en" />; }

