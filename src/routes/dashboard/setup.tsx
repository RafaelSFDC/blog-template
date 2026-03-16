import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Rocket, SkipForward } from "lucide-react";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Switch } from "#/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Progress } from "#/components/ui/progress";
import { toast } from "sonner";
import {
  applyLaunchDefaults,
  getLaunchTemplateCatalog,
  getSetupStatus,
  saveSetupStep,
} from "#/server/setup-actions";
import { getDashboardSettings } from "#/server/system/settings";
import { getAvailableThemes } from "#/lib/theme-utils";
import {
  getStepIndex,
  SETUP_WIZARD_STEPS,
  type SetupWizardStepKey,
} from "#/lib/setup";

export const Route = createFileRoute("/dashboard/setup")({
  loader: async () => {
    await applyLaunchDefaults();
    const [{ settings }, status] = await Promise.all([
      getDashboardSettings(),
      getSetupStatus(),
    ]);
    const templateCatalog = await getLaunchTemplateCatalog();

    return {
      settings,
      status,
      templateCatalog,
    };
  },
  component: DashboardSetupPage,
});

function DashboardSetupPage() {
  const { settings, status, templateCatalog } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SetupWizardStepKey>(status.lastStep);
  const [saving, setSaving] = useState(false);
  const [identityValues, setIdentityValues] = useState({
    blogName: settings.blogName,
    blogDescription: settings.blogDescription,
    blogLogo: settings.blogLogo,
    fontFamily: settings.fontFamily,
    themeVariant: settings.themeVariant,
  });
  const [seoValues, setSeoValues] = useState({
    siteUrl: settings.siteUrl,
    defaultMetaTitle: settings.defaultMetaTitle,
    defaultMetaDescription: settings.defaultMetaDescription,
    defaultOgImage: settings.defaultOgImage,
    robotsIndexingEnabled: settings.robotsIndexingEnabled,
    twitterHandle: settings.twitterHandle,
  });
  const [monetizationValues, setMonetizationValues] = useState({
    stripeMonthlyPriceId: settings.stripeMonthlyPriceId,
    stripeAnnualPriceId: settings.stripeAnnualPriceId,
  });
  const [newsletterValues, setNewsletterValues] = useState({
    newsletterSenderEmail: settings.newsletterSenderEmail,
    doubleOptInEnabled: settings.doubleOptInEnabled,
  });
  const [selectedPresetKey, setSelectedPresetKey] = useState(status.sitePresetKey);

  const stepIndex = getStepIndex(currentStep);
  const currentStepMeta = useMemo(
    () => status.steps.find((step) => step.key === currentStep),
    [currentStep, status.steps],
  );
  const setupStateCopy =
    status.status === "completed"
      ? {
          badge: "Setup completed",
          description:
            "Revise o onboarding com calma. Nada aqui volta a bloquear o dashboard a menos que voce ainda queira ajustar os defaults.",
        }
      : status.status === "not_started"
        ? {
            badge: "Setup not started",
            description:
              "Configure o essencial do projeto e remova a friccao dos primeiros minutos.",
          }
        : {
            badge: status.isSkipped ? "Setup paused" : "Setup in progress",
            description:
              "Continue de onde parou e finalize apenas o que ainda bloqueia a experiencia inicial.",
          };

  async function refreshAfterSave() {
    await router.invalidate();
    const latestStatus = await getSetupStatus();
    setCurrentStep(latestStatus.isCompleted ? "content" : latestStatus.lastStep);
    return latestStatus;
  }

  async function handleNext() {
    try {
      setSaving(true);

      if (currentStep === "identity") {
        await saveSetupStep({
          data: {
            step: "identity",
            ...identityValues,
          },
        });
      }

      if (currentStep === "seo") {
        await saveSetupStep({
          data: {
            step: "seo",
            ...seoValues,
          },
        });
      }

      if (currentStep === "monetization") {
        await saveSetupStep({
          data: {
            step: "monetization",
            ...monetizationValues,
          },
        });
      }

      if (currentStep === "newsletter") {
        await saveSetupStep({
          data: {
            step: "newsletter",
            ...newsletterValues,
          },
        });
      }

      if (currentStep === "content") {
        await saveSetupStep({
          data: {
            step: "content",
            sitePresetKey: selectedPresetKey,
            generateStarterContent: true,
          },
        });
        toast.success("Starter kit criado e setup concluido.");
        await router.invalidate();
        await navigate({ to: "/dashboard" });
        return;
      }

      const latestStatus = await refreshAfterSave();
      const nextStep = SETUP_WIZARD_STEPS[Math.min(stepIndex + 1, SETUP_WIZARD_STEPS.length - 1)];
      setCurrentStep(latestStatus.lastStep === currentStep ? nextStep : latestStatus.lastStep);
      toast.success("Etapa salva.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar esta etapa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCompleteWithoutSeed() {
    try {
      setSaving(true);
      await saveSetupStep({
        data: {
          step: "content",
          sitePresetKey: selectedPresetKey,
          generateStarterContent: false,
        },
      });
      toast.success("Setup concluido. Voce pode criar o conteudo manualmente depois.");
      await router.invalidate();
      await navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel concluir o setup.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Setup Inicial"
        description={setupStateCopy.description}
        icon={Rocket}
        iconLabel={setupStateCopy.badge}
      />

      <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-6 rounded-xl border border-border/50 bg-card p-6 shadow-sm">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
              Setup progress
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight text-foreground">
              {status.progressPercent}%
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              O wizard resolve o basico; o checklist abaixo mostra o que ja esta de fato pronto.
            </p>
          </div>

          <Progress value={status.progressPercent} className="h-2.5" />

          <div className="space-y-3">
            {status.steps.map((step, index) => (
              <button
                key={step.key}
                type="button"
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  currentStep === step.key
                    ? "border-primary bg-primary/5"
                    : "border-border/50 bg-background hover:border-primary/20"
                }`}
                onClick={() => setCurrentStep(step.key)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                      step.isCompleted
                        ? "bg-emerald-100 text-emerald-700"
                        : currentStep === step.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{step.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {status.status === "completed" ? (
            <Button type="button" variant="outline" className="w-full" disabled>
              <SkipForward className="mr-2 h-4 w-4" />
              Revisao concluida
            </Button>
          ) : (
            <Button asChild type="button" variant="outline" className="w-full" disabled={saving}>
              <a href="/dashboard?skipSetup=1">
                <SkipForward className="mr-2 h-4 w-4" />
                {status.isSkipped ? "Setup pausado" : "Pular por agora"}
              </a>
            </Button>
          )}
        </aside>

        <section className="rounded-xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-8 space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
              Etapa {stepIndex + 1} de {SETUP_WIZARD_STEPS.length}
            </p>
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              {currentStepMeta?.label}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {currentStepMeta?.description}
            </p>
          </div>

          <div className="space-y-6">
            {currentStep === "identity" ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field
                    label="Publication name"
                    value={identityValues.blogName}
                    onChange={(value) =>
                      setIdentityValues((current) => ({ ...current, blogName: value }))
                    }
                    placeholder="Lumina Weekly"
                  />
                  <Field
                    label="Logo URL"
                    value={identityValues.blogLogo}
                    onChange={(value) =>
                      setIdentityValues((current) => ({ ...current, blogLogo: value }))
                    }
                    placeholder="https://cdn.example.com/logo.png"
                  />
                </div>
                <Field
                  label="Short description"
                  value={identityValues.blogDescription}
                  onChange={(value) =>
                    setIdentityValues((current) => ({ ...current, blogDescription: value }))
                  }
                  placeholder="What makes this publication worth reading?"
                  multiline
                />
                <div className="grid gap-6 sm:grid-cols-2">
                  <SelectField
                    label="Font family"
                    value={identityValues.fontFamily}
                    onChange={(value) =>
                      setIdentityValues((current) => ({ ...current, fontFamily: value }))
                    }
                    options={[
                      { label: "Modern (Inter)", value: "Inter" },
                      { label: "Creative (Outfit)", value: "Outfit" },
                      { label: "Elegant (Playfair Display)", value: "Playfair Display" },
                      { label: "Tech (Space Grotesk)", value: "Space Grotesk" },
                      { label: "Expressive (Bricolage Grotesque)", value: "Bricolage Grotesque" },
                    ]}
                  />
                  <ThemeField
                    value={identityValues.themeVariant}
                    onChange={(value) =>
                      setIdentityValues((current) => ({ ...current, themeVariant: value }))
                    }
                  />
                </div>
              </>
            ) : null}

            {currentStep === "seo" ? (
              <>
                <Field
                  label="Public site URL"
                  value={seoValues.siteUrl}
                  onChange={(value) =>
                    setSeoValues((current) => ({ ...current, siteUrl: value }))
                  }
                  placeholder="https://blog.example.com"
                />
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field
                    label="Default meta title"
                    value={seoValues.defaultMetaTitle}
                    onChange={(value) =>
                      setSeoValues((current) => ({ ...current, defaultMetaTitle: value }))
                    }
                    placeholder="Lumina Weekly"
                  />
                  <Field
                    label="Default OG image"
                    value={seoValues.defaultOgImage}
                    onChange={(value) =>
                      setSeoValues((current) => ({ ...current, defaultOgImage: value }))
                    }
                    placeholder="https://cdn.example.com/og.jpg"
                  />
                </div>
                <Field
                  label="Default meta description"
                  value={seoValues.defaultMetaDescription}
                  onChange={(value) =>
                    setSeoValues((current) => ({
                      ...current,
                      defaultMetaDescription: value,
                    }))
                  }
                  placeholder="Explain the editorial promise of your publication."
                  multiline
                />
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field
                    label="Twitter / X handle"
                    value={seoValues.twitterHandle}
                    onChange={(value) =>
                      setSeoValues((current) => ({ ...current, twitterHandle: value }))
                    }
                    placeholder="@lumina"
                  />
                  <SwitchField
                    label="Allow search engine indexing"
                    checked={seoValues.robotsIndexingEnabled}
                    onChange={(checked) =>
                      setSeoValues((current) => ({
                        ...current,
                        robotsIndexingEnabled: checked,
                      }))
                    }
                    description="Disable this only for staging or private launch reviews."
                  />
                </div>
              </>
            ) : null}

            {currentStep === "monetization" ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  label="Stripe monthly price ID"
                  value={monetizationValues.stripeMonthlyPriceId}
                  onChange={(value) =>
                    setMonetizationValues((current) => ({
                      ...current,
                      stripeMonthlyPriceId: value,
                    }))
                  }
                  placeholder="price_monthly_..."
                />
                <Field
                  label="Stripe annual price ID"
                  value={monetizationValues.stripeAnnualPriceId}
                  onChange={(value) =>
                    setMonetizationValues((current) => ({
                      ...current,
                      stripeAnnualPriceId: value,
                    }))
                  }
                  placeholder="price_annual_..."
                />
              </div>
            ) : null}

            {currentStep === "newsletter" ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  label="Sender email"
                  value={newsletterValues.newsletterSenderEmail}
                  onChange={(value) =>
                    setNewsletterValues((current) => ({
                      ...current,
                      newsletterSenderEmail: value,
                    }))
                  }
                  placeholder="newsletter@example.com"
                />
                <SwitchField
                  label="Double opt-in"
                  checked={newsletterValues.doubleOptInEnabled}
                  onChange={(checked) =>
                    setNewsletterValues((current) => ({
                      ...current,
                      doubleOptInEnabled: checked,
                    }))
                  }
                  description="New subscribers confirm their email before entering the active segment."
                />
              </div>
            ) : null}

            {currentStep === "content" ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
                      Site preset
                    </p>
                    <h3 className="mt-2 text-xl font-black text-foreground">
                      Escolha a direcao visual do launch
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      O preset aplica tema sugerido, copy base, menus e templates de pagina
                      sem sobrescrever o que ja existir.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {templateCatalog.presets.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => setSelectedPresetKey(preset.key)}
                        className={`rounded-xl border p-5 text-left transition-colors ${
                          selectedPresetKey === preset.key
                            ? "border-primary bg-primary/5"
                            : "border-border/50 bg-background hover:border-primary/20"
                        }`}
                      >
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                          {preset.label}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {preset.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 bg-background p-5">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
                    Starter kit
                  </p>
                  <h3 className="mt-3 text-xl font-black text-foreground">
                    Gerar drafts iniciais
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Cria drafts idempotentes para Home, About, Pricing, Contact,
                    Newsletter landing, Members-only archive e um welcome post.
                    Nada sera publicado automaticamente.
                  </p>
                  <Button
                    type="button"
                    className="mt-6"
                    disabled={saving}
                    onClick={() => void handleNext()}
                  >
                    Criar starter kit e concluir
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="rounded-xl border border-border/50 bg-background p-5">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">
                    Inicio manual
                  </p>
                  <h3 className="mt-3 text-xl font-black text-foreground">
                    Comecar com projeto vazio
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Finaliza o wizard agora e deixa o checklist do dashboard guiar
                    a criacao manual de paginas e do primeiro post.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-6"
                    disabled={saving}
                    onClick={() => void handleCompleteWithoutSeed()}
                  >
                    Concluir sem starter kit
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {currentStep !== "content" ? (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-6">
              <Button
                type="button"
                variant="outline"
                disabled={saving || stepIndex === 0}
                onClick={() =>
                  setCurrentStep(SETUP_WIZARD_STEPS[Math.max(stepIndex - 1, 0)])
                }
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>

              <Button type="button" disabled={saving} onClick={() => void handleNext()}>
                {saving ? "Salvando..." : "Salvar e continuar"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    </DashboardPageContainer>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">{props.label}</span>
      {props.multiline ? (
        <Textarea
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          placeholder={props.placeholder}
          className="min-h-32"
        />
      ) : (
        <Input
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          placeholder={props.placeholder}
        />
      )}
    </label>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">{props.label}</span>
      <Select value={props.value} onValueChange={props.onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {props.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function SwitchField(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <Switch checked={props.checked} onCheckedChange={(checked) => props.onChange(checked === true)} />
        <div>
          <p className="font-semibold text-foreground">{props.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{props.description}</p>
        </div>
      </div>
    </div>
  );
}

function ThemeField(props: { value: string; onChange: (value: string) => void }) {
  const themeGroups = ["standard", "creative", "compact", "special"];

  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">Theme variant</span>
      <Select value={props.value} onValueChange={props.onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a theme" />
        </SelectTrigger>
        <SelectContent>
          {themeGroups.map((group) => (
            <SelectGroup key={group}>
              <div className="px-2 py-1.5 text-xs text-muted-foreground">{group}</div>
              {getAvailableThemes()
                .filter((theme) => theme.group === group)
                .map((theme) => (
                  <SelectItem key={theme.variant} value={`theme-${theme.variant}`}>
                    {theme.name}
                  </SelectItem>
                ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
