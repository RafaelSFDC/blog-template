import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 pb-20 pt-14 text-center">
      <h1 className="display-title mb-6 text-4xl font-bold text-(--sea-ink) sm:text-5xl lg:text-6xl">
        About Us
      </h1>
      <p className="mx-auto max-w-2xl text-xl text-(--sea-ink-soft)">
        This is a placeholder for the About page. Share your story here!
      </p>
    </main>
  )
}
