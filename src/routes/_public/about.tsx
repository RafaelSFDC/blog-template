import { createFileRoute } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'

export const Route = createFileRoute('/_public/about')({
  head: () => ({
    meta: [
      { title: 'About | PlayfulPulse Blog' },
      {
        name: 'description',
        content:
          'Learn about the editorial vision, cadence, and values behind PlayfulPulse.',
      },
    ],
  }),
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 pb-20 pt-14">
      <section className="island-shell rounded-[2.2rem] p-8 text-center sm:p-12">
        <Badge variant="zine">Inside The Studio</Badge>
        <h1 className="font-serif leading-[1.08] tracking-tight text-balance font-extrabold mb-6 text-5xl text-foreground sm:text-6xl">
          About This Publication
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Use this page to explain your editorial vision, publishing cadence, and the problems your content solves for readers.
        </p>
      </section>
    </main>
  )
}
