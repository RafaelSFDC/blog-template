import {
  ErrorComponent,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Footer from '../components/Footer'
import Header from '../components/Header'

import TanStackQueryProvider from '../integrations/tanstack-query/root-provider'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import { getLocale } from '#/paraglide/runtime'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    // Other redirect strategies are possible; see
    // https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#offline-redirect
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', getLocale())
    }
  },

  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'VibeZine | Bold Stories',
      },
      {
        name: 'description',
        content:
          'VibeZine is a high-energy publication about design, culture, and creative code. Bold thoughts, sharp edges.',
      },
      {
        property: 'og:site_name',
        content: 'VibeZine',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:title',
        content: 'VibeZine Blog',
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
        content: '#ff5c00', /* Deep Orange */
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
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RootErrorComponent,
  notFoundComponent: RootNotFoundComponent,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body
        suppressHydrationWarning
        className="font-sans antialiased wrap-anywhere selection:bg-primary/25"
      >
        <TanStackQueryProvider>
          <Header />
          {children}
          <Footer />
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
        <h1 className="display-title mb-3 text-2xl font-bold text-(--sea-ink) sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mb-4 text-(--sea-ink-soft)">
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
        <h1 className="display-title mb-3 text-4xl font-bold text-(--sea-ink) sm:text-6xl">
          Lost in the Vibe?
        </h1>
        <p className="mx-auto mb-8 max-w-md text-lg text-(--sea-ink-soft)">
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
