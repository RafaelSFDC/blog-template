import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, CircleDashed, Sparkles } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Progress } from "#/components/ui/progress";
import type { SetupStatus } from "#/types/system";

interface SetupChecklistProps {
  setup: SetupStatus;
}

export function SetupChecklist({ setup }: SetupChecklistProps) {
  const setupStateCopy =
    setup.status === "completed"
      ? {
          badge: "Setup completed",
          title: "Onboarding concluido",
          description:
            "O fluxo inicial deixou de bloquear o dashboard. Reabra o wizard apenas para revisar configuracoes ou ajustar os defaults do launch.",
          ctaLabel: "Revisar onboarding",
        }
      : setup.status === "not_started"
        ? {
            badge: "Setup not started",
            title: "Comece o setup guiado do launch",
            description:
              "O wizard organiza os primeiros passos e reduz a navegacao aleatoria antes da primeira publicacao.",
            ctaLabel: "Iniciar setup",
          }
        : {
            badge: setup.isSkipped ? "Setup paused" : "Setup in progress",
            title: setup.isSkipped ? "Setup pausado" : "Setup em andamento",
            description:
              "Retome o wizard quando quiser e siga o proximo bloqueio real para tirar o projeto do estado vazio.",
            ctaLabel: "Retomar setup",
          };

  return (
    <section className="rounded-xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-[0.18em]">
              {setupStateCopy.badge}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              {setupStateCopy.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {setupStateCopy.description}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Setup completeness</span>
              <span>{setup.progressPercent}%</span>
            </div>
            <Progress value={setup.progressPercent} className="h-2.5" />
          </div>
        </div>

        <div className="min-w-72 space-y-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
            {setup.status === "completed" ? "Onboarding" : "Proximo passo"}
          </p>
          {setup.nextAction ? (
            <>
              <div>
                <p className="font-bold text-foreground">{setup.nextAction.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {setup.nextAction.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/dashboard/setup">
                    {setupStateCopy.ctaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to={setup.nextAction.href}>Abrir area</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                O wizard foi concluido. Agora voce pode revisar pages, posts e
                configuracoes sem pendencias bloqueantes.
              </p>
              <Button asChild variant="outline">
                <Link to="/dashboard/setup">{setupStateCopy.ctaLabel}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {setup.checklist.map((item) => (
          <Link
            key={item.key}
            to={item.href}
            className="rounded-xl border border-border/50 bg-background/70 p-4 no-underline transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="flex items-start gap-3">
              {item.isCompleted ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
              ) : (
                <CircleDashed className="mt-0.5 h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-semibold text-foreground">{item.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
