import type { PublicationState } from "@/types/content";

type ExternalArticle = {
  id: string;
  state: PublicationState;
  title: string;
  url: `https://${string}`;
  platform: string;
  language: "en" | "vi";
};

// External publications remain links, separate from local MDX and CTF writeups.
// Prepend newly approved entries: display order is newest added to the portfolio first.
const externalArticles: readonly ExternalArticle[] = [
  {
    id: "cloud-ai-student-to-builder",
    state: "published",
    title: "Your Journey Starts with Cloud & AI: From Student to Builder ☁️",
    url: "https://builder.aws.com/content/3LJ6nu8C9FWmXJ6lJOIYTATwcTv/your-journey-starts-with-cloud-and-ai-from-student-to-builder",
    platform: "AWS Builder Center",
    language: "en",
  },
  {
    id: "security-fundamentals-defender",
    state: "published",
    title: "Security Fundamentals: Think Like a Defender, Not Just an Attacker",
    url: "https://builder.aws.com/content/3LJAaucWOdAH9WW73xHhXH50yCR/security-fundamentals-think-like-a-defender-not-just-an-attacker",
    platform: "AWS Builder Center",
    language: "en",
  },
];

export function publishedExternalArticles() {
  return externalArticles.filter(article => article.state === "published");
}
