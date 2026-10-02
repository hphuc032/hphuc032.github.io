import "server-only";
import type { Project } from "@/types/content";
import type { Locale } from "@/i18n/locales";
import { isPublishedCase, projectPublication } from "./project-publication";

// Evidence: docs/operations-evidence-audit.md + explicit Phase 11 approval of brief-level content.
// No dates, results, architecture edges, responsibilities or repository URLs are inferred.
export const projects: readonly Project[] = [
  {
    ...projectPublication[0], id: "secure-api-gateway", featuredOrder: 1,
    state: "published", caseStudyState: "published", visualConcept: "access",
    content: {
      en: { state: "published", value: { title: "Secure API Gateway", summary: "A project focused on API authentication and authorization." } },
      vi: { state: "published", value: { title: "Secure API Gateway", summary: "Dự án tập trung vào xác thực và phân quyền API." } },
    },
    category: { en: { state: "published", value: "API Security" }, vi: { state: "published", value: "Bảo mật API" } },
    overview: {
      en: { state: "published", value: "Secure API Gateway brings together work with authentication, authorization, RBAC and API authorization testing. The technologies below were used in the project." },
      vi: { state: "published", value: "Secure API Gateway tập hợp việc thực hành xác thực, phân quyền, RBAC và kiểm thử phân quyền API. Các công nghệ dưới đây đã được sử dụng trong dự án." },
    },
    technologyIds: ["FastAPI", "PostgreSQL", "Keycloak", "Kong", "Docker", "JWT", "OAuth2", "OpenID Connect (OIDC)", "RBAC"],
    indexPresentation: {
      content: {
        en: { state: "published", value: { label: "API SECURITY / BACKEND", description: "Authentication and authorization with Kong, Keycloak, JWT and RBAC in a controlled project environment." } },
        vi: { state: "published", value: { label: "BẢO MẬT API / BACKEND", description: "Thực hành xác thực và phân quyền API với Kong, Keycloak, JWT và RBAC trong môi trường dự án có kiểm soát." } },
      },
      tools: ["FastAPI", "Keycloak", "Kong", "JWT", "Docker"],
    },
  },
  {
    ...projectPublication[1], id: "vulnerability-assessment", featuredOrder: 2,
    state: "published", caseStudyState: "published", visualConcept: "assessment",
    indexPresentation: {
      content: {
        en: { state: "published", value: { label: "SECURITY TESTING / ASSESSMENT", description: "Hands-on labs in service enumeration, vulnerability identification and security assessment." } },
        vi: { state: "published", value: { label: "KIỂM THỬ BẢO MẬT / ĐÁNH GIÁ", description: "Thực hành thu thập thông tin dịch vụ, nhận diện lỗ hổng và đánh giá bảo mật trong bài lab." } },
      },
      tools: ["Kali Linux", "Nmap", "Metasploit", "OWASP ZAP", "Burp Suite"],
    },
    content: {
      en: { state: "published", value: { title: "Vulnerability Assessment", summary: "Security assessment practice in an educational lab context." } },
      vi: { state: "published", value: { title: "Vulnerability Assessment", summary: "Thực hành đánh giá bảo mật trong bối cảnh bài lab học tập." } },
    },
    category: { en: { state: "published", value: "Security Lab" }, vi: { state: "published", value: "Bài lab bảo mật" } },
    overview: {
      en: { state: "published", value: "An educational security assessment project. The related practice covers service enumeration and vulnerability identification and assessment in labs and projects." },
      vi: { state: "published", value: "Dự án đánh giá bảo mật phục vụ học tập. Phạm vi thực hành liên quan gồm thu thập thông tin dịch vụ, nhận diện và đánh giá lỗ hổng trong các bài lab và dự án." },
    },
  },
  {
    ...projectPublication[2], id: "network-traffic-analysis", featuredOrder: 3,
    state: "published", caseStudyState: "published", visualConcept: "protocol",
    indexPresentation: {
      content: {
        en: { state: "published", value: { label: "NETWORK SECURITY / ANALYSIS", description: "Packet and protocol analysis with Wireshark. Comparing plaintext HTTP visibility with encrypted HTTPS traffic." } },
        vi: { state: "published", value: { label: "AN NINH MẠNG / PHÂN TÍCH", description: "Phân tích gói tin và giao thức bằng Wireshark. Đối chiếu nội dung HTTP dạng rõ với lưu lượng HTTPS được mã hóa." } },
      },
      tools: ["Wireshark", "TCP/IP", "DNS", "HTTP / HTTPS"],
    },
    content: {
      en: { state: "published", value: { title: "Network Traffic Analysis", summary: "Packet and protocol analysis as a hands-on learning practice." } },
      vi: { state: "published", value: { title: "Network Traffic Analysis", summary: "Thực hành phân tích gói tin và giao thức trong quá trình học tập." } },
    },
    category: { en: { state: "published", value: "Network Security" }, vi: { state: "published", value: "An ninh mạng" } },
    overview: {
      en: { state: "published", value: "A network traffic analysis project. The related hands-on practice includes Wireshark, TCP/IP, DNS and HTTP / HTTPS traffic analysis." },
      vi: { state: "published", value: "Dự án phân tích lưu lượng mạng. Phạm vi thực hành liên quan gồm Wireshark, TCP/IP, DNS và phân tích lưu lượng HTTP / HTTPS." },
    },
  },
];

function assertPublishedProject(project: Project, locale: Locale) {
  const content = project.content[locale];
  const category = project.category?.[locale];
  if (content?.state !== "published" || !content.value.title || !content.value.summary) {
    throw new Error(`Published project ${project.id} lacks complete ${locale} summary content.`);
  }
  if (category?.state !== "published" || !category.value) {
    throw new Error(`Published project ${project.id} lacks a ${locale} category.`);
  }
}

export function publishedProjects(locale: Locale) {
  const records = projects.filter(project => project.state === "published" && project.content[locale]?.state === "published");
  records.forEach(project => assertPublishedProject(project, locale));
  return records.toSorted((a, b) => a.featuredOrder - b.featuredOrder);
}
export function publishedCase(slug: string, locale: Locale) {
  return publishedCases(locale).find(project => project.slug === slug);
}
export function publishedCases(locale: Locale) {
  return publishedProjects(locale).filter(project => project.caseStudyState === "published" && isPublishedCase(project.slug, locale));
}
