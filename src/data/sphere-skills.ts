import type { Locale } from "@/i18n/locales";

// R4's approved tool set, not a proficiency scale or a replacement Expertise catalog.
export const sphereCategories = {
  network: { en: "NETWORK", vi: "MẠNG" },
  web: { en: "WEB TESTING", vi: "KIỂM THỬ WEB" },
  api: { en: "APP / API", vi: "ỨNG DỤNG / API" },
  infrastructure: { en: "BACKEND / INFRA", vi: "BACKEND / HẠ TẦNG" },
} satisfies Record<string, Record<Locale, string>>;
export const sphereSkills = [
  { name: "Wireshark", category: "network" }, { name: "Nmap", category: "network" },
  { name: "Burp Suite", category: "web" }, { name: "OWASP ZAP", category: "web" }, { name: "Metasploit", category: "web" },
  { name: "JWT", category: "api" }, { name: "OAuth2", category: "api" }, { name: "Keycloak", category: "api" }, { name: "Kong", category: "api" },
  { name: "FastAPI", category: "infrastructure" }, { name: "Spring Boot", category: "infrastructure" }, { name: "Docker", category: "infrastructure" }, { name: "Linux", category: "infrastructure" },
] as const satisfies readonly { name: string; category: keyof typeof sphereCategories }[];
