import { notFound } from "next/navigation";
import { WriteupRoute, writeupMetadata, writeupStaticParams } from "@/app/_shared/writeup-route";
import { isLocale } from "@/i18n/locales";
type Props = { params: Promise<{ locale: string; slug: string }> };
export const dynamicParams = false;
export function generateStaticParams({ params }: { params: { locale: string } }) {
  return isLocale(params.locale) ? writeupStaticParams() : [];
}
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  return writeupMetadata(locale, Promise.resolve({ slug }));
}
export default async function LocalizedWriteupPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  return <WriteupRoute locale={locale} params={Promise.resolve({ slug })} />;
}
