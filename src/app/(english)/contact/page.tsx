import { dedicatedPageMetadata, DedicatedPageRoute } from "@/app/_shared/dedicated-page-route";

export const metadata = dedicatedPageMetadata("contact", "en");
export default function EnglishContactPage() { return <DedicatedPageRoute page="contact" locale="en" />; }

