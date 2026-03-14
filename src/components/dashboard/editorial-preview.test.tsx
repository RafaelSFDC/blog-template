import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PageEditorialPreview } from "#/components/dashboard/editorial-preview";
import { buildPagePreviewDraft } from "#/lib/editorial-preview";

function PagePreviewHarness() {
  const [title, setTitle] = useState("Initial title");

  return (
    <div>
      <input
        aria-label="title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <PageEditorialPreview
        draft={buildPagePreviewDraft({
          title,
          slug: "",
          excerpt: "Preview excerpt",
          content: "## Outline",
          metaTitle: "",
          metaDescription: "",
          ogImage: "",
          status: "draft",
          isHome: false,
          useVisualBuilder: false,
        })}
      />
    </div>
  );
}

describe("PageEditorialPreview", () => {
  it("updates the rendered preview when the draft changes", async () => {
    vi.useFakeTimers();

    render(<PagePreviewHarness />);

    expect(screen.getAllByText("Initial title").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("title"), {
      target: { value: "Updated title" },
    });

    await act(async () => {
      vi.advanceTimersByTime(170);
    });

    expect(screen.getAllByText("Updated title").length).toBeGreaterThan(0);

    vi.useRealTimers();
  });
});
