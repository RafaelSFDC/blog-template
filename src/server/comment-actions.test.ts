import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const findFirst = vi.fn();
  const returning = vi.fn();
  const values = vi.fn(() => ({ returning }));
  const insert = vi.fn(() => ({ values }));

  return {
    findFirst,
    insert,
    returning,
    values,
  };
});

vi.mock("#/db/index", () => ({
  db: {
    query: {
      posts: {
        findFirst: mocks.findFirst,
      },
    },
    insert: mocks.insert,
  },
}));

import { createPendingComment } from "#/server/comment-actions";

describe("comment-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a pending comment for an existing post", async () => {
    mocks.findFirst.mockResolvedValue({ id: 42 });
    mocks.returning.mockResolvedValue([
      {
        id: 9,
        postId: 42,
        authorName: "Reader One",
        authorEmail: "reader@example.com",
        content: "Loved this article.",
        status: "pending",
      },
    ]);

    const created = await createPendingComment({
      postId: 42,
      authorName: "Reader One",
      authorEmail: "reader@example.com",
      content: "Loved this article.",
    });

    expect(mocks.findFirst).toHaveBeenCalledOnce();
    expect(mocks.insert).toHaveBeenCalledOnce();
    expect(mocks.values).toHaveBeenCalledWith({
      postId: 42,
      authorName: "Reader One",
      authorEmail: "reader@example.com",
      content: "Loved this article.",
      status: "pending",
    });
    expect(created).toMatchObject({
      id: 9,
      postId: 42,
      status: "pending",
    });
  });

  it("stores a null email when the public form leaves it blank", async () => {
    mocks.findFirst.mockResolvedValue({ id: 7 });
    mocks.returning.mockResolvedValue([
      {
        id: 10,
        postId: 7,
        authorName: "Reader Two",
        authorEmail: null,
        content: "Great walkthrough.",
        status: "pending",
      },
    ]);

    await createPendingComment({
      postId: 7,
      authorName: "Reader Two",
      authorEmail: "",
      content: "Great walkthrough.",
    });

    expect(mocks.values).toHaveBeenCalledWith({
      postId: 7,
      authorName: "Reader Two",
      authorEmail: null,
      content: "Great walkthrough.",
      status: "pending",
    });
  });

  it("throws when the target post does not exist", async () => {
    mocks.findFirst.mockResolvedValue(undefined);

    await expect(
      createPendingComment({
        postId: 999,
        authorName: "Reader Three",
        authorEmail: "reader3@example.com",
        content: "Where did the post go?",
      }),
    ).rejects.toThrow("Post not found");

    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
