import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "#/db/index";
import { comments } from "#/db/schema";

const SUSPICIOUS_TERMS = [
  "crypto giveaway",
  "buy followers",
  "casino",
  "viagra",
  "loan approval",
  "work from home",
];

function countLinks(content: string) {
  const matches = content.match(/https?:\/\/|www\./gi);
  return matches?.length ?? 0;
}

export async function evaluateCommentSpam(input: {
  postId: number;
  authorEmail?: string | null;
  content: string;
  sourceIpHash?: string | null;
}) {
  const normalized = input.content.trim().toLowerCase();
  const linkCount = countLinks(normalized);

  if (linkCount >= 3) {
    return { decision: "spam" as const, reason: "too_many_links" };
  }

  if (linkCount >= 1 && normalized.length < 25) {
    return { decision: "blocked" as const, reason: "short_comment_with_link" };
  }

  if (SUSPICIOUS_TERMS.some((term) => normalized.includes(term))) {
    return { decision: "spam" as const, reason: "suspicious_keywords" };
  }

  const recentWindow = new Date(Date.now() - 15 * 60 * 1000);
  const recentMatches = db.query.comments?.findMany
    ? await db.query.comments.findMany({
        where: and(eq(comments.postId, input.postId), gte(comments.createdAt, recentWindow)),
        orderBy: [desc(comments.createdAt)],
        columns: {
          content: true,
          authorEmail: true,
          sourceIpHash: true,
        },
        limit: 20,
      })
    : [];

  const repeated = recentMatches.find(
    (comment) =>
      comment.content.trim().toLowerCase() === normalized &&
      ((input.authorEmail &&
        comment.authorEmail &&
        comment.authorEmail.toLowerCase() === input.authorEmail.toLowerCase()) ||
        (input.sourceIpHash && comment.sourceIpHash === input.sourceIpHash)),
  );

  if (repeated) {
    return { decision: "spam" as const, reason: "duplicate_recent_comment" };
  }

  return { decision: "pending" as const, reason: null };
}
