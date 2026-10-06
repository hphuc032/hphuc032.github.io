import { ContactPage } from "@/components/pages/ContactPage";
import { dedicatedPageMetadata, DedicatedPageRoute } from "@/app/_shared/dedicated-page-route";

export const metadata = dedicatedPageMetadata("contact", "en");
export default function EnglishContactPage() { return <DedicatedPageRoute component={ContactPage} page="contact" locale="en" />; }

