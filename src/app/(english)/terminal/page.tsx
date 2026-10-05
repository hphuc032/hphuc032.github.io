import { TerminalPage } from "@/components/pages/TerminalPage";
import { dedicatedPageMetadata, DedicatedPageRoute } from "@/app/_shared/dedicated-page-route";

export const metadata = dedicatedPageMetadata("terminal", "en");
export default function EnglishTerminalPage() { return <DedicatedPageRoute component={TerminalPage} page="terminal" locale="en" />; }

