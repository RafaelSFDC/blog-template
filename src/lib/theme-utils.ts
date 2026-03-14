/**
 * Theme utilities for managing theme state and persistence
 */

export const THEME_STORAGE_KEY = "active_theme";
export const DEFAULT_THEME = "tangerine";

export type ThemeVariant =
  | "default"
  | "blue"
  | "green"
  | "amber"
  | "fluorescent-blue"
  | "ecommerce"
  | "vitrine-pro"
  | "mono"
  | "candyland"
  | "cyberpunk"
  | "sunset"
  | "ocean"
  | "nature"
  | "eco-natural"
  | "bubblegum"
  | "violet-bloom"
  | "tangerine"
  | "quantum-rose"
  | "mochamousse"
  | "graphite"
  | "elegantluxury"
  | "ice"
  | "onedarkpro"
  | "meadow"
  | "sketchpad"
  | "trigger"
  | "kebo"
  | "crafterstation"
  | "linear"
  | "mintstore"
  | "industrial"
  | "indigoblue"
  | "caffeine"
  | "claymorphism"
  | "cappuccinobrutal"
  | "darkmatter"
  | "solardusk"
  | "rosegarden"
  | "lumina";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeConfig {
  variant: ThemeVariant;
  scaled: boolean;
  mode: ThemeMode;
}

/**
 * Parse theme string into components
 */
export function parseTheme(themeString: string): {
  variant: ThemeVariant;
  scaled: boolean;
} {
  const isScaled = themeString.endsWith("-scaled");
  const variant = (
    isScaled ? themeString.replace("-scaled", "") : themeString
  ) as ThemeVariant;

  return { variant, scaled: isScaled };
}

/**
 * Build theme string from components
 */
export function buildThemeString(
  variant: ThemeVariant,
  scaled: boolean = false
): string {
  return scaled ? `${variant}-scaled` : variant;
}

/**
 * Get theme from localStorage with fallback
 */
export function getStoredTheme(): string {
  if (typeof window === "undefined") return DEFAULT_THEME;

  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * Save theme to localStorage
 */
export function saveTheme(theme: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn("Failed to save theme:", error);
  }
}

/**
 * Apply theme classes to document body
 */
export function applyThemeClasses(theme: string): void {
  if (typeof document === "undefined") return;

  // Remove existing theme classes
  Array.from(document.body.classList)
    .filter((className) => className.startsWith("theme-"))
    .forEach((className) => {
      document.body.classList.remove(className);
    });

  // Add new theme class (ensuring we don't double-prefix)
  const themeClass = theme.startsWith("theme-") ? theme : `theme-${theme}`;
  document.body.classList.add(themeClass);

  // Add scaled class if needed
  if (theme.endsWith("-scaled")) {
    document.body.classList.add("theme-scaled");
  } else {
    document.body.classList.remove("theme-scaled");
  }
}

export interface ThemeDefinition {
  variant: string; // Changed from ThemeVariant to string to support -scaled variants directly in value
  name: string;
  description: string;
  group: "standard" | "creative" | "compact" | "special";
}

/**
 * Get available themes with metadata
 */
export function getAvailableThemes(): ThemeDefinition[] {
  return [
    // Standard Themes
    {
      variant: "default",
      name: "Default",
      description: "Tema padrão neutro",
      group: "standard",
    },
    {
      variant: "blue",
      name: "Blue",
      description: "Tema azul profissional",
      group: "standard",
    },
    {
      variant: "green",
      name: "Green",
      description: "Tema verde natural",
      group: "standard",
    },
    {
      variant: "amber",
      name: "Amber",
      description: "Tema âmbar caloroso",
      group: "standard",
    },
    {
      variant: "fluorescent-blue",
      name: "Fluorescent Blue",
      description: "Tema azul vibrante e moderno",
      group: "standard",
    },
    {
      variant: "ecommerce",
      name: "E-commerce",
      description: "Tema moderno para e-commerce",
      group: "standard",
    },
    {
      variant: "vitrine-pro",
      name: "Vitrine Pro",
      description: "Tema profissional para negócios",
      group: "standard",
    },
    {
      variant: "lumina",
      name: "Lumina",
      description: "Tema suave e vibrante com tons de roxo e rosa",
      group: "standard",
    },

    // Creative Themes
    {
      variant: "candyland",
      name: "Candyland",
      description: "Tema colorido e vibrante",
      group: "creative",
    },
    {
      variant: "cyberpunk",
      name: "Cyberpunk",
      description: "Tema futurista com cores neon",
      group: "creative",
    },
    {
      variant: "sunset",
      name: "Sunset",
      description: "Tema com cores quentes de pôr do sol",
      group: "creative",
    },
    {
      variant: "ocean",
      name: "Ocean",
      description: "Tema azul/verde oceânico",
      group: "creative",
    },
    {
      variant: "nature",
      name: "Nature",
      description: "Tema verde natural e orgânico",
      group: "creative",
    },
    {
      variant: "eco-natural",
      name: "Eco Natural",
      description: "Tema natural sustentável e ecológico",
      group: "creative",
    },
    {
      variant: "bubblegum",
      name: "Bubblegum",
      description: "Tema doce e divertido com tons rosa",
      group: "creative",
    },
    {
      variant: "violet-bloom",
      name: "Violet Bloom",
      description: "Tema elegante com tons roxos",
      group: "creative",
    },
    {
      variant: "tangerine",
      name: "Tangerine",
      description: "Tema fresco com tons laranja",
      group: "creative",
    },
    {
      variant: "quantum-rose",
      name: "Quantum Rose",
      description: "Tema místico com tons de rosa",
      group: "creative",
    },
    {
      variant: "mochamousse",
      name: "Mocha Mousse",
      description: "Tema quente com tons de café",
      group: "creative",
    },
    {
      variant: "graphite",
      name: "Graphite",
      description: "Tema elegante monocromático cinza",
      group: "creative",
    },
    {
      variant: "elegantluxury",
      name: "Elegant Luxury",
      description: "Tema sofisticado com tons quentes",
      group: "creative",
    },
    {
      variant: "ice",
      name: "Ice",
      description: "Tema gelado com tons azuis e cinza",
      group: "creative",
    },
    {
      variant: "onedarkpro",
      name: "One Dark Pro",
      description: "Tema inspirado em editores de código",
      group: "creative",
    },
    {
      variant: "meadow",
      name: "Meadow",
      description: "Tema fresco com tons verdes naturais",
      group: "creative",
    },
    {
      variant: "sketchpad",
      name: "Sketchpad",
      description: "Tema criativo com tons azuis",
      group: "creative",
    },
    {
      variant: "trigger",
      name: "Trigger",
      description: "Tema ousado com roxo e verde",
      group: "creative",
    },
    {
      variant: "kebo",
      name: "Kebo",
      description: "Tema vibrante com roxo e rosa",
      group: "creative",
    },
    {
      variant: "crafterstation",
      name: "Crafter Station",
      description: "Tema artesanal com dourado e azul",
      group: "creative",
    },
    {
      variant: "linear",
      name: "Linear",
      description: "Tema minimalista e limpo",
      group: "creative",
    },
    {
      variant: "mintstore",
      name: "Mint Store",
      description: "Tema refrescante com tons de menta",
      group: "creative",
    },
    {
      variant: "industrial",
      name: "Industrial",
      description: "Tema industrial com vermelho e verde",
      group: "creative",
    },
    {
      variant: "indigoblue",
      name: "Indigo Blue",
      description: "Tema profundo com tons de índigo",
      group: "creative",
    },
    {
      variant: "caffeine",
      name: "Caffeine",
      description: "Tema limpo inspirado em café",
      group: "creative",
    },
    {
      variant: "claymorphism",
      name: "Claymorphism",
      description: "Design moderno inspirado em argila",
      group: "creative",
    },
    {
      variant: "cappuccinobrutal",
      name: "Cappuccino Brutal",
      description: "Design brutalista inspirado em café",
      group: "creative",
    },
    {
      variant: "darkmatter",
      name: "Dark Matter",
      description: "Tema misterioso e escuro",
      group: "creative",
    },
    {
      variant: "solardusk",
      name: "Solar Dusk",
      description: "Cores quentes do pôr do sol",
      group: "creative",
    },
    {
      variant: "rosegarden",
      name: "Rose Garden",
      description: "Elegante com tons de rosa vintage",
      group: "creative",
    },

    // Compact Themes
    {
      variant: "default-scaled",
      name: "Default Compacto",
      description: "Tema padrão com interface compacta",
      group: "compact",
    },
    {
      variant: "blue-scaled",
      name: "Blue Compacto",
      description: "Tema azul com interface compacta",
      group: "compact",
    },

    // Special Themes
    {
      variant: "mono-scaled",
      name: "Mono",
      description: "Tema minimalista monocromático",
      group: "special",
    },
  ];
}
