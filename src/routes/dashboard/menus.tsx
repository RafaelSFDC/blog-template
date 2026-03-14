import { createFileRoute } from "@tanstack/react-router";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { DashboardHeader } from "#/components/dashboard/Header";
import { Button } from "#/components/ui/button";
import { FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
  createEmptyMenuItem,
  mapMenusToEditorState,
  normalizeMenuItemsForSave,
} from "#/lib/menu-form";
import { saveMenu, getMenusForDashboard } from "#/server/menu-actions";
import { Navigation, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";

export const Route = createFileRoute("/dashboard/menus")({
  loader: () => getMenusForDashboard(),
  component: MenusPage,
});

function MenusPage() {
  const data = Route.useLoaderData();
  const [menusState, setMenusState] = useState(() =>
    mapMenusToEditorState(data.menus),
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);

  function updateItem(
    menuKey: string,
    index: number,
    field: "label" | "href" | "kind",
    value: string,
  ) {
    setMenusState((prev) => ({
      ...prev,
      [menuKey]: prev[menuKey].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addItem(menuKey: string) {
    setMenusState((prev) => ({
      ...prev,
      [menuKey]: [
        ...prev[menuKey],
        createEmptyMenuItem(prev[menuKey].length),
      ],
    }));
  }

  function removeItem(menuKey: string, index: number) {
    setMenusState((prev) => ({
      ...prev,
      [menuKey]: prev[menuKey]
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({ ...item, sortOrder: itemIndex })),
    }));
  }

  async function handleSave(menuKey: string) {
    try {
      setSavingKey(menuKey);
      await saveMenu({
        data: {
          key: menuKey as "primary" | "footer",
          items: normalizeMenuItemsForSave(menusState[menuKey]),
        },
      });
      toast.success("Menu saved successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save menu");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Menus"
        description="Manage the primary and footer navigation."
        icon={Navigation}
        iconLabel="Navigation"
      />

      <div className="grid gap-8">
        {data.menus.map((menu: (typeof data.menus)[number]) => (
          <section key={menu.id} className="bg-card border shadow-sm rounded-xl p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{menu.label}</h2>
                <p className="text-sm text-muted-foreground">
                  {menu.key === "primary"
                    ? "Displayed in the site header."
                    : "Displayed in the site footer."}
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => addItem(menu.key)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
                <Button type="button" onClick={() => void handleSave(menu.key)} disabled={savingKey === menu.key}>
                  {savingKey === menu.key ? "Saving…" : "Save Menu"}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {menusState[menu.key]?.length ? (
                menusState[menu.key].map((item, index) => (
                  <div key={`${menu.key}-${index}`} className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-[1.2fr_1.6fr_180px_auto]">
                    <div className="space-y-2">
                      <FieldLabel>Label</FieldLabel>
                      <Input
                        value={item.label}
                        onChange={(e) => updateItem(menu.key, index, "label", e.target.value)}
                        placeholder="About"
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Link</FieldLabel>
                      <Input
                        value={item.href}
                        onChange={(e) => updateItem(menu.key, index, "href", e.target.value)}
                        placeholder={item.kind === "internal" ? "/about" : "https://example.com"}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Type</FieldLabel>
                      <Select value={item.kind} onValueChange={(value) => updateItem(menu.key, index, "kind", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">Internal</SelectItem>
                          <SelectItem value="external">External</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button type="button" variant="destructive" size="icon" onClick={() => removeItem(menu.key, index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No items yet. Add links to pages or external destinations.
                </div>
              )}
            </div>

            {data.pages.length > 0 && (
              <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                Suggested internal links: {data.pages.map((page: (typeof data.pages)[number]) => `/${page.slug}`).join(", ")}
              </div>
            )}
          </section>
        ))}
      </div>
    </DashboardPageContainer>
  );
}
