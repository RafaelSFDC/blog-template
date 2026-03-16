import { Outlet, createFileRoute } from "@tanstack/react-router";
import { LuminaMarketingShell } from "#/components/lumina/marketing-shell";

export const Route = createFileRoute("/lumina")({
  component: LuminaLayout,
});

function LuminaLayout() {
  return (
    <LuminaMarketingShell>
      <Outlet />
    </LuminaMarketingShell>
  );
}
