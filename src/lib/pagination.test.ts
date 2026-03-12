import { describe, expect, it } from "vitest";
import { getPaginationMeta, normalizePage } from "#/lib/pagination";

describe("pagination", () => {
  it("normalizes invalid page values to page 1", () => {
    expect(normalizePage(undefined)).toBe(1);
    expect(normalizePage("0")).toBe(1);
    expect(normalizePage("-2")).toBe(1);
  });

  it("builds pagination metadata with bounded pages", () => {
    expect(getPaginationMeta(25, 4, 9)).toEqual({
      currentPage: 3,
      pageSize: 9,
      totalItems: 25,
      totalPages: 3,
      hasPreviousPage: true,
      hasNextPage: false,
      offset: 18,
    });
  });
});
