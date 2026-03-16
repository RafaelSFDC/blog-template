import type { z } from "zod";
import {
  pageFormSchema,
  postFormSchema,
} from "#/schemas/editorial";

export type PostEditorFormValues = z.infer<typeof postFormSchema>;
export type PageEditorFormValues = z.infer<typeof pageFormSchema>;

export interface PostPreviewDraft extends PostEditorFormValues {
  permalink: string;
  categoryNames: string[];
  tagNames: string[];
  coverImage?: string | null;
  authorName?: string | null;
  readingTime?: number | null;
}

export interface PagePreviewDraft extends PageEditorFormValues {
  permalink: string;
}
