import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Route as RouteIcon, Save, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { DashboardHeader } from "#/components/dashboard/Header";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  createEmptyRedirectDraft,
  mapRedirectToFormValues,
  validateRedirectFormValues,
  type RedirectFormValues,
} from "#/lib/redirect-form";
import { deleteRedirect, getRedirects, saveRedirect } from "#/server/actions/content/redirect-actions";

type RedirectRow = Awaited<ReturnType<typeof getRedirects>>[number];

export const Route = createFileRoute("/dashboard/redirects")({
  loader: () => getRedirects(),
  component: RedirectsPage,
});

function RedirectsPage() {
  const initialRedirects = Route.useLoaderData();
  const [rows, setRows] = useState<RedirectRow[]>(initialRedirects);
  const [savingId, setSavingId] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<RedirectFormValues>(() =>
    createEmptyRedirectDraft(),
  );
  const [draftError, setDraftError] = useState("");

  async function handleSave(row: RedirectFormValues) {
    const parsed = validateRedirectFormValues(row);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid redirect";
      if (row.id) {
        toast.error(message);
      } else {
        setDraftError(message);
      }
      return;
    }

    try {
      setSavingId(row.id ?? "new");
      const saved = await saveRedirect({ data: parsed.data });
      setRows((prev) => {
        const exists = prev.some((item) => item.id === saved.id);
        if (exists) {
          return prev.map((item) => (item.id === saved.id ? saved : item));
        }
        return [...prev, saved].sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
      });
      setDraft(createEmptyRedirectDraft());
      setDraftError("");
      toast.success("Redirect saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save redirect");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this redirect?")) {
      return;
    }

    try {
      await deleteRedirect({ data: id });
      setRows((prev) => prev.filter((row) => row.id !== id));
      toast.success("Redirect deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete redirect");
    }
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Redirects"
        description="Manage SEO-safe 301 and 302 redirects for moved pages and posts."
        icon={RouteIcon}
        iconLabel="SEO"
      />

      <section className="rounded-md border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Plus className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-bold text-foreground">New Redirect</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_140px_auto]">
          <Field>
            <FieldLabel>From</FieldLabel>
            <Input
              value={draft.sourcePath}
              onChange={(e) => setDraft((prev) => ({ ...prev, sourcePath: e.target.value }))}
              placeholder="/old-path"
            />
          </Field>
          <Field>
            <FieldLabel>To</FieldLabel>
            <Input
              value={draft.destinationPath}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, destinationPath: e.target.value }))
              }
              placeholder="/new-path or https://example.com"
            />
          </Field>
          <Field>
            <FieldLabel>Status</FieldLabel>
            <Select
              value={String(draft.statusCode)}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, statusCode: Number(value) as 301 | 302 }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="301">301</SelectItem>
                <SelectItem value="302">302</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={() => void handleSave(draft)}
              disabled={savingId === "new"}
            >
              <Save className="mr-2 h-4 w-4" />
              {savingId === "new" ? "Saving…" : "Add"}
            </Button>
          </div>
        </div>

        {draftError ? <FieldError errors={[draftError]} /> : null}
      </section>

      <div className="grid gap-4">
        {rows.map((row) => (
          <RedirectRowEditor
            key={row.id}
            row={row}
            saving={savingId === row.id}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </DashboardPageContainer>
  );
}

function RedirectRowEditor(props: {
  row: RedirectRow;
  saving: boolean;
  onSave: (row: RedirectFormValues) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const { row, saving, onSave, onDelete } = props;
  const [form, setForm] = useState<RedirectFormValues>(() =>
    mapRedirectToFormValues({
      id: row.id,
      sourcePath: row.sourcePath,
      destinationPath: row.destinationPath,
      statusCode: row.statusCode as 301 | 302,
    }),
  );

  return (
    <article className="grid gap-4 rounded-md border border-border bg-card p-5 shadow-sm md:grid-cols-[1fr_1fr_140px_auto_auto]">
      <Field>
        <FieldLabel>From</FieldLabel>
        <Input
          value={form.sourcePath}
          onChange={(e) => setForm((prev) => ({ ...prev, sourcePath: e.target.value }))}
        />
      </Field>
      <Field>
        <FieldLabel>To</FieldLabel>
        <Input
          value={form.destinationPath}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, destinationPath: e.target.value }))
          }
        />
      </Field>
      <Field>
        <FieldLabel>Status</FieldLabel>
        <Select
          value={String(form.statusCode)}
          onValueChange={(value) =>
            setForm((prev) => ({ ...prev, statusCode: Number(value) as 301 | 302 }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="301">301</SelectItem>
            <SelectItem value="302">302</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <div className="flex items-end">
        <Button type="button" onClick={() => void onSave(form)} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      <div className="flex items-end">
        <Button type="button" variant="destructive" onClick={() => void onDelete(row.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}
