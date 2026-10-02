import { notFound } from "next/navigation";
import { dedicatedPageMetadata, DedicatedPageRoute } from "@/app/_shared/dedicated-page-route";
import { isLocale } from "@/i18n/locales";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return dedicatedPageMetadata("about", locale); }
export default async function LocalizedAboutPage({ params }: Props) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <DedicatedPageRoute page="about" locale={locale} />; }

