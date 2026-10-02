import type { Locale } from "@/i18n/locales";

export const homeChapters = ["hero", "about", "featured-projects", "latest-writing", "connect"] as const;
export const homeLabels = {
  en: { chapters: ["Hero", "About", "Featured Projects", "Latest Writing", "Contact"], about: "About", projects: "Featured Projects", writing: "Latest Writing", contact: "Contact", profile: "VIEW PROFILE", allProjects: "VIEW ALL PROJECTS", archive: "VIEW SECURITY LOG", read: "READ", connect: "CONTACT", skillSphere: "Network Skill Sphere", skills: "Tools and working areas", drag: "DRAG TO EXPLORE / FOCUS A NODE" },
  vi: { chapters: ["Hero", "Giới thiệu", "Dự án tiêu biểu", "Bài viết mới nhất", "Liên hệ"], about: "Giới thiệu", projects: "Dự án tiêu biểu", writing: "Bài viết mới nhất", contact: "Liên hệ", profile: "XEM HỒ SƠ", allProjects: "XEM TẤT CẢ DỰ ÁN", archive: "XEM SECURITY LOG", read: "ĐỌC", connect: "LIÊN HỆ", skillSphere: "Network Skill Sphere", skills: "Công cụ và lĩnh vực thực hành", drag: "KÉO ĐỂ KHÁM PHÁ / FOCUS VÀO ĐIỂM" },
} satisfies Record<Locale, { chapters: readonly string[]; about: string; projects: string; writing: string; contact: string; profile: string; allProjects: string; archive: string; read: string; connect: string; skillSphere: string; skills: string; drag: string }>;
