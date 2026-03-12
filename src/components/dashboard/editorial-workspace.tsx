import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import {
  Eye,
  PanelLeftClose,
  PanelLeftOpen,
  PencilLine,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "#/components/ui/resizable";
import { cn } from "#/lib/utils";

type WorkspaceTab = "edit" | "preview";

interface EditorialWorkspaceProps {
  storageKey: string;
  form: ReactNode;
  preview: ReactNode;
  className?: string;
}

const COLLAPSE_KEY_SUFFIX = "collapsed";

function getCollapseStorageKey(storageKey: string) {
  return `lumina.editorial.${storageKey}.${COLLAPSE_KEY_SUFFIX}`;
}

export function EditorialWorkspace({
  storageKey,
  form,
  preview,
  className,
}: EditorialWorkspaceProps) {
  const panelRef = useRef<ImperativePanelHandle>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("edit");
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(getCollapseStorageKey(storageKey));
      if (stored === "true") {
        setIsCollapsed(true);
        panelRef.current?.collapse();
      }
    } catch {
      // Ignore storage errors and keep a sensible default layout.
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        getCollapseStorageKey(storageKey),
        String(isCollapsed),
      );
    } catch {
      // Ignore storage errors to keep the editor usable in restricted environments.
    }
  }, [isCollapsed, storageKey]);

  function togglePanel() {
    if (isCollapsed) {
      panelRef.current?.expand();
      setIsCollapsed(false);
      return;
    }

    panelRef.current?.collapse();
    setIsCollapsed(true);
  }

  return (
    <div className={cn("mt-8", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="hidden items-center gap-2 lg:flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={togglePanel}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="mr-2 h-4 w-4" />
            ) : (
              <PanelLeftClose className="mr-2 h-4 w-4" />
            )}
            {isCollapsed ? "Expand editor" : "Collapse editor"}
          </Button>
        </div>

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

      <div className="hidden lg:block">
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId={`lumina-editorial-${storageKey}`}
          className="min-h-[calc(100vh-16rem)]"
        >
          <ResizablePanel
            ref={panelRef}
            defaultSize={46}
            minSize={30}
            maxSize={64}
            collapsible
            collapsedSize={5}
            onCollapse={() => setIsCollapsed(true)}
            onExpand={() => setIsCollapsed(false)}
          >
            <div className="h-full overflow-auto rounded-[1.4rem] border border-border bg-card p-5 shadow-sm xl:p-6">
              {isCollapsed ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  <PencilLine className="h-4 w-4 text-primary" />
                  <span className="[writing-mode:vertical-rl]">Editor</span>
                </div>
              ) : (
                form
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="mx-2 rounded-full bg-border/80" />

          <ResizablePanel defaultSize={54} minSize={36}>
            <div className="h-full overflow-hidden rounded-[1.4rem] bg-background/70">
              {preview}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
