import {
  ErrorComponent,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import TanStackQueryProvider from '../integrations/tanstack-query/root-provider'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import { getLocale } from '#/paraglide/runtime'
import { appSettings } from '#/db/schema'
import { createServerFn } from '@tanstack/react-start'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

const getGlobalSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import('#/db/index');
  const settings = await db.select().from(appSettings);
  const settingsObj: Record<string, string> = {};
  settings.forEach((s: any) => {
    settingsObj[s.key] = s.value;
  });
  return {
    blogName: settingsObj["blogName"] || "VibeZine",
    accentColor: settingsObj["accentColor"] || "#ff5c00",
    fontFamily: settingsObj["fontFamily"] || "Inter",
    gaMeasurementId: settingsObj["gaMeasurementId"] || "",
    plausibleDomain: settingsObj["plausibleDomain"] || "",
    blogLogo: settingsObj["blogLogo"] || "",
    twitterProfile: settingsObj["twitterProfile"] || "",
    githubProfile: settingsObj["githubProfile"] || "",
    linkedinProfile: settingsObj["linkedinProfile"] || "",
  };
});

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    // Other redirect strategies are possible; see
    // https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#offline-redirect
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', getLocale())
    }
  },
  loader: () => getGlobalSettings(),

  head: ({ loaderData }) => {
    const settings = loaderData as any
    const blogName = settings?.blogName || 'VibeZine'
    const accentColor = settings?.accentColor || '#ff5c00'
    
    return {
      meta: [
        {
          charSet: 'utf-8',
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          title: `${blogName} | Bold Stories`,
        },
        {
          name: 'description',
          content:
            `${blogName} is a high-energy publication about design, culture, and creative code. Bold thoughts, sharp edges.`,
        },
        {
          property: 'og:site_name',
          content: blogName,
        },
        {
          property: 'og:type',
          content: 'website',
        },
        {
          property: 'og:title',
          content: `${blogName} Blog`,
        },
        {
          property: 'og:description',
          content:
            'A vibrant zine-style blog for the next generation of creators.',
        },
        {
          name: 'twitter:card',
          content: 'summary_large_image',
        },
        {
          name: 'theme-color',
          content: accentColor,
        },
      ],
      links: [
        {
          rel: 'icon',
          href: '/favicon.ico',
        },
        {
          rel: 'stylesheet',
          href: appCss,
        },
        {
          rel: 'alternate',
          type: 'application/rss+xml',
          title: 'RSS Feed',
          href: '/rss.xml',
        },
        {
          rel: 'sitemap',
          type: 'application/xml',
          title: 'Sitemap',
          href: '/sitemap.xml',
        },
      ],
    }
  },
  shellComponent: RootDocument,
  errorComponent: RootErrorComponent,
  notFoundComponent: RootNotFoundComponent,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const settings = Route.useLoaderData();
  const fontSlug = settings.fontFamily.replace(/\s+/g, '+');

  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={`https://fonts.googleapis.com/css2?family=${fontSlug}:wght@400;500;700;800;900&display=swap`} rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${settings.accentColor};
            --font-sans: "${settings.fontFamily}", ui-sans-serif, system-ui;
          }
        ` }} />
        
        {settings.gaMeasurementId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${settings.gaMeasurementId}`} />
            <script dangerouslySetInnerHTML={{ __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${settings.gaMeasurementId}');
            `}} />
          </>
        )}

        {settings.plausibleDomain && (
          <script defer data-domain={settings.plausibleDomain} src="https://plausible.io/js/script.js" />
        )}

        <HeadContent />
      </head>

      <body
        suppressHydrationWarning
        className="font-sans antialiased wrap-anywhere selection:bg-primary/25"
      >
        <TanStackQueryProvider>
          {children}
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        </TanStackQueryProvider>
        <Scripts />
      </body>
    </html>
  )
}

function RootErrorComponent({ error }: { error: unknown }) {
  return (
    <main className="page-wrap px-4 pb-16 pt-14">
      <section className="island-shell clip-sash rounded-3xl p-8">
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
  )
}

function RootNotFoundComponent() {
  return (
    <main className="page-wrap px-4 pb-16 pt-14">
      <section className="island-shell clip-sash rounded-3xl p-8 text-center">
        <p className="island-kicker mb-3">404 - Not Found</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-foreground sm:text-6xl">
          Lost in the Vibe?
        </h1>
        <p className="mx-auto mb-8 max-w-md text-lg text-muted-foreground">
          The page you're looking for has drifted off the grid. Let's get you back to the signal.
        </p>
        <div className="flex justify-center">
          <a
            href="/"
            className="vibe-btn-primary inline-flex h-12 items-center justify-center rounded-full px-8 text-lg font-bold transition-all hover:scale-105 active:scale-95"
          >
            Return to Feed
          </a>
        </div>
      </section>
    </main>
  )
}
