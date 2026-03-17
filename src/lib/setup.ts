export const SETUP_WIZARD_STEPS = [
  "identity",
  "seo",
  "monetization",
  "newsletter",
  "content",
] as const;

export type SetupWizardStepKey = (typeof SETUP_WIZARD_STEPS)[number];

export type SetupChecklistKey =
  | "identity"
  | "seo"
  | "pricing"
  | "newsletter"
  | "homepage"
  | "pages"
  | "firstPost";

export interface SetupStepItem {
  key: SetupWizardStepKey;
  label: string;
  description: string;
  isCompleted: boolean;
}

export interface SetupChecklistItem {
  key: SetupChecklistKey;
  label: string;
  description: string;
  isCompleted: boolean;
  href: string;
}

export interface SetupNextAction {
  label: string;
  description: string;
  href: string;
  step: SetupWizardStepKey;
}

export type SetupFlowStatus = "not_started" | "in_progress" | "completed";

export interface SetupStatus {
  status: SetupFlowStatus;
  isStarted: boolean;
  isCompleted: boolean;
  isSkipped: boolean;
  isBlocking: boolean;
  progressPercent: number;
  sitePresetKey: import("#/types/system").SitePresetKey;
  steps: SetupStepItem[];
  checklist: SetupChecklistItem[];
  nextAction: SetupNextAction | null;
  lastStep: SetupWizardStepKey;
  starterContentGenerated: boolean;
}

export interface SetupSnapshot {
  hasStoredBlogName: boolean;
  hasStoredBlogDescription: boolean;
  hasStoredLogo: boolean;
  hasStoredThemeVariant: boolean;
  hasStoredFontFamily: boolean;
  hasStoredSiteUrl: boolean;
  hasStoredMetaTitle: boolean;
  hasStoredMetaDescription: boolean;
  hasStoredOgImage: boolean;
  hasStoredTwitterHandle: boolean;
  hasStoredMonthlyPriceId: boolean;
  hasStoredAnnualPriceId: boolean;
  hasStoredNewsletterSenderEmail: boolean;
  hasStoredDoubleOptInSetting: boolean;
  hasHomepage: boolean;
  hasAboutPage: boolean;
  hasPricingPage: boolean;
  hasContactPage: boolean;
  hasFirstPost: boolean;
  wizardStartedAt?: string | null;
  wizardCompletedAt?: string | null;
  wizardSkippedAt?: string | null;
  wizardLastStep?: SetupWizardStepKey | null;
  starterContentGeneratedAt?: string | null;
  sitePresetKey?: import("#/types/system").SitePresetKey | null;
}

const STEP_META: Record<
  SetupWizardStepKey,
  { label: string; description: string }
> = {
  identity: {
    label: "Identidade",
    description: "Nome, descricao, logo e estilo base da publicacao.",
  },
  seo: {
    label: "Publicacao e SEO",
    description: "URL publica e metadados padrao para descoberta.",
  },
  monetization: {
    label: "Monetizacao",
    description: "Conecte os planos mensais e anuais do Stripe.",
  },
  newsletter: {
    label: "Newsletter",
    description: "Defina remetente e politica de double opt-in.",
  },
  content: {
    label: "Conteudo inicial",
    description: "Crie drafts iniciais para tirar o projeto do vazio.",
  },
};

const CHECKLIST_META: Array<
  Omit<SetupChecklistItem, "isCompleted">
> = [
  {
    key: "identity",
    label: "Configurar identidade",
    description: "Defina nome, descricao e estilo base do site.",
    href: "/dashboard/setup",
  },
  {
    key: "seo",
    label: "Configurar publicacao e SEO",
    description: "Adicione URL publica e metadados padrao.",
    href: "/dashboard/setup",
  },
  {
    key: "pricing",
    label: "Configurar pricing",
    description: "Vincule os planos mensal e anual no Stripe.",
    href: "/dashboard/setup",
  },
  {
    key: "newsletter",
    label: "Configurar newsletter",
    description: "Defina remetente e revisite o opt-in.",
    href: "/dashboard/setup",
  },
  {
    key: "homepage",
    label: "Criar homepage",
    description: "Defina uma pagina principal para o projeto.",
    href: "/dashboard/pages",
  },
  {
    key: "pages",
    label: "Criar paginas essenciais",
    description: "Tenha About, Pricing e Contact prontas para revisar.",
    href: "/dashboard/pages",
  },
  {
    key: "firstPost",
    label: "Criar primeiro post",
    description: "Adicione o primeiro conteudo editorial do blog.",
    href: "/dashboard/posts",
  },
];

export function getDefaultSetupLastStep(
  checklist: SetupChecklistItem[],
): SetupWizardStepKey {
  if (!checklist.find((item) => item.key === "identity")?.isCompleted) {
    return "identity";
  }

  if (!checklist.find((item) => item.key === "seo")?.isCompleted) {
    return "seo";
  }

  if (!checklist.find((item) => item.key === "pricing")?.isCompleted) {
    return "monetization";
  }

  if (!checklist.find((item) => item.key === "newsletter")?.isCompleted) {
    return "newsletter";
  }

  return "content";
}

function toWizardStep(key: SetupChecklistKey): SetupWizardStepKey {
  if (key === "identity") {
    return "identity";
  }

  if (key === "seo") {
    return "seo";
  }

  if (key === "pricing") {
    return "monetization";
  }

  if (key === "newsletter") {
    return "newsletter";
  }

  return "content";
}

export function buildSetupChecklist(
  snapshot: SetupSnapshot,
): SetupChecklistItem[] {
  const statusByKey: Record<SetupChecklistKey, boolean> = {
    identity:
      snapshot.hasStoredBlogName &&
      snapshot.hasStoredBlogDescription &&
      snapshot.hasStoredThemeVariant &&
      snapshot.hasStoredFontFamily,
    seo:
      snapshot.hasStoredSiteUrl &&
      snapshot.hasStoredMetaTitle &&
      snapshot.hasStoredMetaDescription,
    pricing:
      snapshot.hasStoredMonthlyPriceId && snapshot.hasStoredAnnualPriceId,
    newsletter:
      snapshot.hasStoredNewsletterSenderEmail &&
      snapshot.hasStoredDoubleOptInSetting,
    homepage: snapshot.hasHomepage,
    pages:
      snapshot.hasAboutPage &&
      snapshot.hasPricingPage &&
      snapshot.hasContactPage,
    firstPost: snapshot.hasFirstPost,
  };

  return CHECKLIST_META.map((item) => ({
    ...item,
    isCompleted: statusByKey[item.key],
  }));
}

export function buildSetupStatus(snapshot: SetupSnapshot): SetupStatus {
  const checklist = buildSetupChecklist(snapshot);
  const completedCount = checklist.filter((item) => item.isCompleted).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);
  const defaultLastStep = getDefaultSetupLastStep(checklist);
  const starterContentGenerated = Boolean(snapshot.starterContentGeneratedAt);
  const nextChecklistItem = checklist.find((item) => !item.isCompleted) ?? null;
  const blockingAction = nextChecklistItem
    ? {
        label: nextChecklistItem.label,
        description: nextChecklistItem.description,
        href: nextChecklistItem.href,
        step: toWizardStep(nextChecklistItem.key),
      }
    : null;
  const hasBlockingSetupStep = blockingAction !== null;
  const isExplicitlyCompleted = Boolean(snapshot.wizardCompletedAt);
  const status: SetupFlowStatus = isExplicitlyCompleted || !hasBlockingSetupStep
    ? "completed"
    : snapshot.wizardStartedAt
      ? "in_progress"
      : "not_started";
  const lastStep =
    snapshot.wizardCompletedAt || snapshot.wizardSkippedAt
      ? snapshot.wizardLastStep ?? defaultLastStep
      : blockingAction?.step ?? defaultLastStep;

  const steps: SetupStepItem[] = SETUP_WIZARD_STEPS.map((step) => {
    if (step === "identity") {
      return {
        key: step,
        ...STEP_META[step],
        isCompleted: checklist.find((item) => item.key === "identity")?.isCompleted ?? false,
      };
    }

    if (step === "seo") {
      return {
        key: step,
        ...STEP_META[step],
        isCompleted: checklist.find((item) => item.key === "seo")?.isCompleted ?? false,
      };
    }

    if (step === "monetization") {
      return {
        key: step,
        ...STEP_META[step],
        isCompleted: checklist.find((item) => item.key === "pricing")?.isCompleted ?? false,
      };
    }

    if (step === "newsletter") {
      return {
        key: step,
        ...STEP_META[step],
        isCompleted: checklist.find((item) => item.key === "newsletter")?.isCompleted ?? false,
      };
    }

    return {
      key: step,
      ...STEP_META[step],
      isCompleted:
        starterContentGenerated ||
        ((checklist.find((item) => item.key === "homepage")?.isCompleted ?? false) &&
          (checklist.find((item) => item.key === "pages")?.isCompleted ?? false) &&
          (checklist.find((item) => item.key === "firstPost")?.isCompleted ?? false)) ||
        Boolean(snapshot.wizardCompletedAt),
    };
  });

  return {
    status,
    isStarted: Boolean(snapshot.wizardStartedAt),
    isCompleted: status === "completed",
    isSkipped: Boolean(snapshot.wizardSkippedAt),
    isBlocking: status !== "completed" && hasBlockingSetupStep,
    progressPercent,
    sitePresetKey: snapshot.sitePresetKey ?? "creator",
    steps,
    checklist,
    nextAction: status === "completed" ? null : blockingAction,
    lastStep,
    starterContentGenerated,
  };
}

export function shouldRedirectToSetup(status: SetupStatus, role?: string | null) {
  const isAdmin = role === "admin" || role === "super-admin";
  return isAdmin && status.isBlocking && !status.isSkipped && status.nextAction !== null;
}

export function getStepIndex(step: SetupWizardStepKey) {
  return SETUP_WIZARD_STEPS.indexOf(step);
}

export function getNextSetupStep(step: SetupWizardStepKey) {
  const currentIndex = getStepIndex(step);
  return SETUP_WIZARD_STEPS[Math.min(currentIndex + 1, SETUP_WIZARD_STEPS.length - 1)];
}
