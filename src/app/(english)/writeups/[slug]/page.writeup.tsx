import { WriteupRoute, writeupMetadata, writeupStaticParams } from "@/app/_shared/writeup-route";
type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export const generateStaticParams = writeupStaticParams;
export const generateMetadata = ({ params }: Props) => writeupMetadata("en", params);
export default function EnglishWriteupPage({ params }: Props) {
  return <WriteupRoute locale="en" params={params} />;
}
