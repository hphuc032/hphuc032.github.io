import { dedicatedPageMetadata, DedicatedPageRoute } from "@/app/_shared/dedicated-page-route";

export const metadata = dedicatedPageMetadata("terminal", "en");
export default function EnglishTerminalPage() { return <DedicatedPageRoute page="terminal" locale="en" />; }

