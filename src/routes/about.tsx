import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 pb-20 pt-14">
      <section className="island-shell clip-sash rounded-[2.2rem] p-8 text-center sm:p-12">
        <p className="island-kicker mb-4">Inside The Studio</p>
        <h1 className="display-title mb-6 text-5xl font-bold text-(--sea-ink) sm:text-6xl">
          About This Publication
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-(--sea-ink-soft)">
          Use this page to explain your editorial vision, publishing cadence, and the problems your content solves for readers.
        </p>
      </section>
    </main>
  )
}
