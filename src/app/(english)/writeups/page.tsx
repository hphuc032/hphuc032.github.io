import { dedicatedPageMetadata, DedicatedPageRoute } from "@/app/_shared/dedicated-page-route";

export const metadata = dedicatedPageMetadata("writeups", "en");
export default function EnglishWriteupsPage() { return <DedicatedPageRoute page="writeups" locale="en" />; }

