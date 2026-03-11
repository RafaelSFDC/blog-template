import { lazy, Suspense, useEffect, useState } from "react";

interface LazyTiptapEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}

const LazyEditor = lazy(() =>
  import("./tiptap-editor").then((module) => ({
    default: module.TiptapEditor,
  })),
);

export function LazyTiptapEditor(props: LazyTiptapEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <EditorFallback />;
  }

  return (
    <Suspense fallback={<EditorFallback />}>
      <LazyEditor {...props} />
    </Suspense>
  );
}

function EditorFallback() {
  return (
    <div className="overflow-hidden rounded-xl border border-input bg-muted">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted p-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="h-8 w-8 rounded-md bg-background/70" />
        ))}
      </div>
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-background/70" />
        <div className="h-4 w-full rounded bg-background/70" />
        <div className="h-4 w-5/6 rounded bg-background/70" />
        <div className="h-32 rounded bg-background/70" />
      </div>
    </div>
  );
}
