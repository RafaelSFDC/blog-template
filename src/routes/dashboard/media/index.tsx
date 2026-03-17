import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { Image, Upload, Trash2, Copy, Check } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "#/components/ui/button";
import {
  bulkDeleteMedia,
  getMediaItems,
  uploadMedia,
  deleteMediaItem,
} from "#/server/actions/content/media-actions";
import { toast } from "sonner";
import { EmptyState } from "#/components/dashboard/EmptyState";
import { Checkbox } from "#/components/ui/checkbox";

export const Route = createFileRoute("/dashboard/media/")({
  loader: () => getMediaItems(),
  component: MediaLibraryPage,
});

type MediaItem = Awaited<ReturnType<typeof getMediaItems>>[number];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : undefined;
}

function MediaLibraryPage() {
  const mediaItems = Route.useLoaderData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  async function onUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("file", file);

      await uploadMedia({ data: formData }); // Pass FormData to the server action
      toast.success("File uploaded successfully");
      // Simple reload for now
      window.location.reload();
    } catch (error) {
      toast.error(getErrorMessage(error) || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onDelete(id: number, filename: string) {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      await deleteMediaItem({ data: { id, filename } });
      toast.success("File deleted");
      window.location.reload();
    } catch (error) {
      toast.error(getErrorMessage(error) || "Delete failed");
    }
  }

  async function onBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm("Delete all selected media files?")) return;

    try {
      await bulkDeleteMedia({ data: { ids: selectedIds } });
      toast.success("Selected media deleted");
      window.location.reload();
    } catch (error) {
      toast.error(getErrorMessage(error) || "Bulk delete failed");
    }
  }

  function copyToClipboard(text: string, id: number) {
    const absoluteUrl =
      typeof window !== "undefined" && text.startsWith("/")
        ? `${window.location.protocol}//${window.location.host}${text}`
        : text;
    navigator.clipboard.writeText(absoluteUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("URL copied to clipboard");
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Media Library"
        description="Manage your uploaded images and files."
        icon={Image}
        iconLabel="Assets"
      >
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <Checkbox
              checked={mediaItems.length > 0 && selectedIds.length === mediaItems.length}
              onCheckedChange={(checked) =>
                setSelectedIds(
                  checked === true ? mediaItems.map((item: MediaItem) => item.id) : [],
                )
              }
            />
            <span className="text-sm font-medium">Select all</span>
          </label>
          <Button
            onClick={() => void onBulkDelete()}
            disabled={selectedIds.length === 0}
            variant="outline"
          >
            Delete Selected
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onUpload}
            className="hidden"
            accept="image/*"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="default"
          >
            {uploading ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload New
              </>
            )}
          </Button>
        </div>
      </DashboardHeader>

      {mediaItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {mediaItems.map((item: MediaItem) => (
            <div
              key={item.id}
              className="group bg-card border shadow-sm relative aspect-square overflow-hidden rounded-xl p-0 hover:border-primary/50"
            >
              <div className="absolute left-2 top-2 z-10 rounded-md bg-background/90 p-1">
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={(checked) =>
                    setSelectedIds((current: number[]) =>
                      checked === true
                        ? [...current, item.id]
                        : current.filter((id) => id !== item.id),
                    )
                  }
                />
              </div>
              <img
                src={item.url}
                alt={item.altText || item.filename}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="bg-background"
                    onClick={() => copyToClipboard(item.url, item.id)}
                    title="Copy URL"
                  >
                    {copiedId === item.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => onDelete(item.id, item.filename)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="max-w-[80%] truncate px-2 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                  {item.filename}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Image}
          title="No media found"
          description="Start by uploading some images for your posts."
        />
      )}
    </DashboardPageContainer>
  );
}
