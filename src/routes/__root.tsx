import {
  ErrorComponent,
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import { getLocale } from "#/paraglide/runtime";
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import appCss from "../styles.css?url";
import { ThemeProvider } from "next-themes";
import { LazyPostHogProvider } from "#/components/analytics/lazy-posthog-provider";
import type { QueryClient } from "@tanstack/react-query";
import { Toaster } from "#/components/ui/sonner";

interface MyRouterContext {
  queryClient: QueryClient;
}

import {
  DEFAULT_SITE_DATA,
  type GlobalSiteData,
  getGlobalSiteData,
} from "#/lib/cms";

const getGlobalSettings = createServerFn({ method: "GET" }).handler(
  async () => {
    setResponseHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400",
    );
    try {
      return await getGlobalSiteData();
    } catch (error) {
      console.error("Failed to fetch settings from DB, using defaults:", error);
      return DEFAULT_SITE_DATA;
    }
  },
);

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='system')?stored:'system';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='system'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    // Other redirect strategies are possible; see
    // https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#offline-redirect
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", getLocale());
    }
  },
  loader: () => getGlobalSettings(),

  head: ({ loaderData }) => {
    const settings = loaderData as GlobalSiteData;
    const blogName = settings?.blogName || "Lumina";
    const accentColor = settings?.accentColor || "var(--primary)";

    return {
      meta: [
        {
          charSet: "utf-8",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        {
          title: `${blogName} | Elegant Stories`,
        },
        {
          name: "description",
          content: `${blogName} is a premium publication about design, culture, and creative code. Refined thoughts, elegant edges.`,
        },
        {
          property: "og:site_name",
          content: blogName,
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          property: "og:title",
          content: `${blogName} Blog`,
        },
        {
          property: "og:description",
          content:
            "An elegant premium blog for the next generation of creators.",
        },
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        {
          name: "theme-color",
          content: accentColor,
        },
      ],
      links: [
        {
          rel: "icon",
          href: "/favicon.ico",
        },
        {
          rel: "stylesheet",
          href: appCss,
        },
        {
          rel: "alternate",
          type: "application/rss+xml",
          title: "RSS Feed",
          href: "/rss.xml",
        },
        {
          rel: "sitemap",
          type: "application/xml",
          title: "Sitemap",
          href: "/sitemap.xml",
        },
      ],
    };
  },
  shellComponent: RootDocument,
  errorComponent: RootErrorComponent,
  notFoundComponent: RootNotFoundComponent,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const settings = Route.useLoaderData() || DEFAULT_SITE_DATA;
  const fontSlug = (settings.fontFamily || DEFAULT_SITE_DATA.fontFamily).replace(
    /\s+/g,
    "+",
  );

  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href={`https://fonts.googleapis.com/css2?family=${fontSlug}:wght@400;500;700;800;900&display=swap`}
          rel="stylesheet"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
          :root {
            --primary: ${settings.accentColor};
            --font-sans: "${settings.fontFamily}", ui-sans-serif, system-ui;
          }
        `,
          }}
        />

        {settings.gaMeasurementId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${settings.gaMeasurementId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${settings.gaMeasurementId}');
            `,
              }}
            />
          </>
        )}

        {settings.plausibleDomain && (
          <script
            defer
            data-domain={settings.plausibleDomain}
            src="https://plausible.io/js/script.js"
          />
        )}

        <HeadContent />
      </head>

      <body
        suppressHydrationWarning
        className={`font-sans antialiased wrap-anywhere selection:bg-primary/25 ${settings.themeVariant || ""}`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TanStackQueryProvider>
            <LazyPostHogProvider>{children}</LazyPostHogProvider>
            <Toaster closeButton position="bottom-right" />
            <TanStackDevtools
              config={{
                position: "bottom-right",
              }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
                TanStackQueryDevtools,
              ]}
            />
          </TanStackQueryProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootErrorComponent({ error }: { error: unknown }) {
  return (
    <main className="page-wrap px-4 pb-16 pt-14">
      <section className="bg-card border shadow-sm clip-sash rounded-md p-8">
        <p className="island-kicker mb-3">Route Error</p>
        <h1 className="display-title mb-3 text-2xl font-bold text-foreground sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mb-4 text-muted-foreground">
          An unexpected error occurred while rendering this route.
        </p>
        <ErrorComponent error={error} />
      </section>
    </main>
  );
}

function RootNotFoundComponent() {
  return (
    <main className="page-wrap px-4 pb-16 pt-14">
      <section className="bg-card border shadow-sm clip-sash rounded-md p-8 text-center">
        <p className="island-kicker mb-3">404 - Not Found</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-foreground sm:text-6xl">
          Lost in the Light?
        </h1>
        <p className="mx-auto mb-8 max-w-md text-lg text-muted-foreground">
          The page you&apos;re looking for has drifted off the grid. Let&apos;s get you
          back to the signal.
        </p>
        <div className="flex justify-center">
          <Link
            to="/"
            className="lumina-btn-primary inline-flex h-12 items-center justify-center rounded-full px-8 text-lg font-bold transition-all hover:scale-105 active:scale-95"
          >
            Return to Feed
          </Link>
        </div>
      </section>
    </main>
  );
}
