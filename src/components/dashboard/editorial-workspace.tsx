import { useState, type ReactNode } from "react";
import {
  Eye,
  PencilLine,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

type WorkspaceTab = "edit" | "preview";

interface EditorialWorkspaceProps {
  storageKey: string;
  form: ReactNode;
  preview: ReactNode;
  className?: string;
}

export function EditorialWorkspace({
  storageKey,
  form,
  preview,
  className,
}: EditorialWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("edit");

  return (
    <div className={cn("mt-8", className)} data-editorial-workspace={storageKey}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-muted/30 p-1 lg:hidden">
          <Button
            type="button"
            variant={activeTab === "edit" ? "default" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab("edit")}
          >
            <PencilLine className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            type="button"
            variant={activeTab === "preview" ? "default" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab("preview")}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
        </div>
      </div>

      <div className="lg:hidden">
        {activeTab === "edit" ? form : preview}
      </div>

      <div className="hidden min-h-[calc(100vh-16rem)] grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-5 lg:grid">
        <section className="min-w-0 overflow-auto rounded-[1.4rem] border border-border bg-card p-5 shadow-sm xl:p-6">
          {form}
        </section>

        <section className="min-w-0 overflow-hidden rounded-[1.4rem] bg-background/70">
          {preview}
        </section>
      </div>
    </div>
  );
}
