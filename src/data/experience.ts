import "server-only";

import type { Experience } from "@/types/content";
import type { Locale } from "@/i18n/locales";

// Evidence classification and withheld fields: docs/experience-evidence-audit.md.
export const experience: readonly Experience[] = [
  {
    id: "uat-web-mobile", order: 1, organization: "Era Group", kind: "technical", state: "published",
    dates: { start: { value: "2026-08", precision: "month" }, end: "present" },
    content: {
      en: { state: "published", value: {
        role: "UAT Tester — Web & Mobile Applications",
        description: "User acceptance and regression testing for web and mobile applications.",
        responsibilities: [
          "Conduct UAT for web and mobile applications.",
          "Create and execute test scenarios based on business requirements.",
          "Report and track defects during the testing process.",
          "Perform regression testing and verify bug fixes.",
        ],
      } },
      vi: { state: "published", value: {
        role: "Kiểm thử UAT — Ứng dụng web & di động",
        description: "Kiểm thử chấp nhận người dùng và kiểm thử hồi quy cho ứng dụng web và di động.",
        responsibilities: [
          "Thực hiện kiểm thử UAT cho ứng dụng web và di động.",
          "Xây dựng và thực thi kịch bản kiểm thử dựa trên yêu cầu nghiệp vụ.",
          "Báo cáo và theo dõi lỗi trong quá trình kiểm thử.",
          "Thực hiện kiểm thử hồi quy và xác nhận các lỗi đã được sửa.",
        ],
      } },
    },
  },
  {
    id: "memory-flower", order: 2, organization: "Memory Flower", kind: "non-technical", state: "published", location: "Phu Nhuan",
    content: {
      en: { state: "published", value: { role: "Flower Arrangement", description: "Flower-arrangement work at Memory Flower in Phu Nhuan." } },
      vi: { state: "published", value: { role: "Cắm hoa", description: "Công việc cắm hoa tại Memory Flower, Phú Nhuận." } },
    },
  },
] as const satisfies readonly Experience[];

export function publishedExperience(locale: Locale) {
  return experience
    .filter((record) => record.state === "published" && record.content[locale]?.state === "published")
    .map((record) => {
      const content = record.content[locale]?.value;
      if (!content?.role || !content.description) {
        throw new Error(`Published experience ${record.id} lacks complete ${locale} content.`);
      }
      return {
        record,
        content: { ...content, role: content.role, description: content.description },
      };
    })
    .toSorted((a, b) => a.record.order - b.record.order);
}
