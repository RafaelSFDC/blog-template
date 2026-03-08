import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/demo/better-auth')({
  component: BetterAuthDemo,
})

function BetterAuthDemo() {
  return (
    <main className="page-wrap px-4 pb-20 pt-14 text-center">
      <h1 className="display-title mb-6 text-4xl font-bold text-(--sea-ink) sm:text-5xl lg:text-6xl">
        Better Auth Demo
      </h1>
      <p className="mx-auto max-w-2xl text-xl text-(--sea-ink-soft)">
        Sign in to explore the features of Better Auth integration.
      </p>
    </main>
  )
}
