export const EDITORIAL_CHECKLIST_ITEMS = [
  { key: "title_reviewed", label: "Title reviewed" },
  { key: "seo_completed", label: "SEO completed" },
  { key: "featured_image_added", label: "Featured image added" },
  { key: "taxonomy_reviewed", label: "Categories and tags reviewed" },
  { key: "premium_reviewed", label: "Premium access reviewed" },
  { key: "content_finalized", label: "Content finalized" },
] as const;

export type EditorialChecklistItemKey = (typeof EDITORIAL_CHECKLIST_ITEMS)[number]["key"];

export function getEditorialStatusCopy(status: string) {
  switch (status) {
    case "in_review":
      return "In Review";
    case "scheduled":
      return "Scheduled";
    case "published":
      return "Published";
    case "archived":
      return "Archived";
    case "private":
      return "Private";
    default:
      return "Draft";
  }
}

export function getEditorialStatusTone(status: string) {
  switch (status) {
    case "published":
      return "success";
    case "scheduled":
      return "default";
    case "in_review":
      return "warning";
    case "archived":
      return "info";
    default:
      return "warning";
  }
}
