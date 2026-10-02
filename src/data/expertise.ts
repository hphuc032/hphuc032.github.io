import "server-only";

import type { Expertise } from "@/types/content";
import type { Locale } from "@/i18n/locales";

// User-confirmed baseline, including R8 group names and Burp Suite. Tools indicate use, not proficiency.
export const expertise = [
  {
    id: "network-security", order: 1, state: "published",
    content: {
      en: { state: "published", value: { title: "Network Security / Traffic Analysis", description: "Hands-on work with packet and protocol analysis: TCP/IP, DNS, HTTP and HTTPS traffic, alongside basic network enumeration." } },
      vi: { state: "published", value: { title: "An toàn mạng / Phân tích lưu lượng", description: "Đã thực hành phân tích gói tin và giao thức: TCP/IP, DNS, lưu lượng HTTP và HTTPS, cùng việc thu thập thông tin mạng ở mức cơ bản." } },
    },
    toolIds: ["Wireshark", "Nmap"],
  },
  {
    id: "web-vulnerability-assessment", order: 2, state: "published",
    content: {
      en: { state: "published", value: { title: "Vulnerability Assessment / Security Testing", description: "Applied in labs and projects: service enumeration, web vulnerability identification and assessment, and brute-force / rate-limit testing." } },
      vi: { state: "published", value: { title: "Đánh giá lỗ hổng / Kiểm thử bảo mật", description: "Đã áp dụng trong bài lab và dự án: thu thập thông tin dịch vụ, nhận diện và đánh giá lỗ hổng web, kiểm thử brute-force và giới hạn tần suất yêu cầu." } },
    },
    toolIds: ["Kali Linux", "Nmap", "Metasploit", "OWASP ZAP", "Burp Suite"],
  },
  {
    id: "application-api-security", order: 3, state: "published",
    content: {
      en: { state: "published", value: { title: "Application / API Security", description: "Used in the Secure API Gateway project: authentication, authorization and RBAC, with JWT security and API authorization testing." } },
      vi: { state: "published", value: { title: "Bảo mật ứng dụng / API", description: "Đã sử dụng trong dự án Secure API Gateway: xác thực, phân quyền và RBAC, bảo mật JWT và kiểm thử phân quyền API." } },
    },
    toolIds: ["FastAPI", "Keycloak", "Kong", "JWT", "OAuth2", "OpenID Connect (OIDC)", "Docker", "PostgreSQL"],
  },
  {
    id: "backend-infrastructure", order: 4, state: "published",
    content: {
      en: { state: "published", value: { title: "Backend / Infrastructure", description: "Worked with Java and Python backend development and SQL data access. Applied Linux command-line workflows, containers and infrastructure security tools in labs." } },
      vi: { state: "published", value: { title: "Backend / Hạ tầng", description: "Đã làm việc với phát triển backend bằng Java, Python và truy cập dữ liệu SQL. Đã thực hành dòng lệnh Linux, container và công cụ bảo mật hạ tầng trong các bài lab." } },
    },
    toolIds: ["Java", "Spring Boot", "Python", "MySQL", "Ubuntu", "Docker", "FortiGate"],
  },
] as const satisfies readonly Expertise[];

export function publishedExpertise(locale: Locale) {
  return expertise
    .filter((record) => record.state === "published" && record.content[locale]?.state === "published")
    .map((record) => {
      const content = record.content[locale]?.value;
      if (!content?.title || !content.description || !record.toolIds.length) {
        throw new Error(`Published expertise ${record.id} lacks complete ${locale} content.`);
      }
      return {
        record,
        content: { ...content, title: content.title, description: content.description },
      };
    })
    .toSorted((a, b) => a.record.order - b.record.order);
}
