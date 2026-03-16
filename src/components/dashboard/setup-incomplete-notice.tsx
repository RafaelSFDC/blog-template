import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "#/components/ui/button";
import type { SetupStatus } from "#/types/system";

type SetupNoticeArea = "settings" | "pages" | "posts";

interface SetupIncompleteNoticeProps {
  setup: SetupStatus | null;
  area: SetupNoticeArea;
}

function getChecklistStatus(setup: SetupStatus) {
  const byKey = new Map(setup.checklist.map((item) => [item.key, item.isCompleted]));

  return {
    identity: byKey.get("identity") === true,
    seo: byKey.get("seo") === true,
    pricing: byKey.get("pricing") === true,
    newsletter: byKey.get("newsletter") === true,
    homepage: byKey.get("homepage") === true,
    pages: byKey.get("pages") === true,
    firstPost: byKey.get("firstPost") === true,
  };
}

export function SetupIncompleteNotice({ setup, area }: SetupIncompleteNoticeProps) {
  if (!setup || setup.status === "completed") {
    return null;
  }

  const checklist = getChecklistStatus(setup);
  const setupCtaLabel = setup.status === "not_started" ? "Iniciar setup" : "Retomar setup";
  const prerequisitesIncomplete =
    !checklist.identity || !checklist.seo || !checklist.pricing || !checklist.newsletter;

  let title = "";
  let description = "";
  let primaryHref = "/dashboard/setup";
  let primaryLabel = setupCtaLabel;

  if (area === "settings" && prerequisitesIncomplete) {
    title = "Finalize o setup guiado antes de ajustar configuracoes soltas";
    description =
      "Identidade, SEO, pricing e newsletter ainda fazem parte do onboarding inicial. Use o wizard para manter o estado do launch coerente.";
  }

  if (area === "pages") {
    if (prerequisitesIncomplete) {
      title = "O launch ainda depende do setup base antes das paginas essenciais";
      description =
        "Feche identidade, SEO, pricing e newsletter primeiro. Depois disso, use esta area para revisar homepage, About, Pricing e Contact.";
    } else if (!checklist.homepage || !checklist.pages) {
      title = "As paginas essenciais do launch ainda nao estao prontas";
      description =
        "Crie ou revise homepage, About, Pricing e Contact para o projeto deixar de parecer vazio logo no primeiro uso.";
      primaryHref = "/dashboard/pages/new";
      primaryLabel = "Criar pagina";
    }
  }

  if (area === "posts") {
    if (prerequisitesIncomplete) {
      title = "Ainda existe setup critico antes do primeiro conteudo";
      description =
        "Feche o onboarding base para evitar um projeto incoerente. Depois use a fila editorial para criar o primeiro post.";
    } else if (!checklist.firstPost) {
      title = "O launch ainda precisa do primeiro conteudo editorial";
      description =
        "Crie o primeiro post para tirar a publicacao do estado vazio e fechar o fluxo inicial de ativacao.";
      primaryHref = "/dashboard/posts/new";
      primaryLabel = "Criar primeiro post";
    }
  }

  if (!title) {
    return null;
  }

  return (
    <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-[0.18em]">
              Setup incompleto
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-foreground">{title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3">
          <Button asChild>
            <Link to={primaryHref}>
              {primaryLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          {primaryHref !== "/dashboard/setup" ? (
            <Button asChild variant="outline">
              <Link to="/dashboard/setup">Ver onboarding</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
