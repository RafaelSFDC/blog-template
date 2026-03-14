import { describe, expect, it } from "vitest";
import {
  createDefaultPageBuilderData,
  getPageBuilderData,
  isPuckPageContent,
  parsePuckData,
  serializePuckData,
} from "#/lib/puck";

describe("puck page helpers", () => {
  it("detects valid puck page content", () => {
    const content = serializePuckData(
      createDefaultPageBuilderData({
        title: "Landing",
        description: "Launch faster",
      }),
    );

    expect(isPuckPageContent(content)).toBe(true);
    expect(parsePuckData(content)?.content).toHaveLength(1);
  });

  it("rejects markdown content as non-puck", () => {
    expect(isPuckPageContent("# Hello world")).toBe(false);
    expect(parsePuckData("# Hello world")).toBeNull();
  });

  it("builds starter content when page body is empty", () => {
    const data = getPageBuilderData({
      content: "",
      title: "About us",
      description: "Meet the team",
    });

    expect(data.content[0]).toMatchObject({
      type: "Hero",
      props: {
        title: "About us",
        description: "Meet the team",
      },
    });
  });
});
