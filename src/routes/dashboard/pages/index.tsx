import { createFileRoute } from '@tanstack/react-router'
import { Library } from 'lucide-react'

export const Route = createFileRoute('/dashboard/pages/')({
  component: PagesManagementPage,
})

function PagesManagementPage() {
  return (
    <div className="space-y-8">
      <header className="island-shell flex flex-wrap items-end justify-between gap-6 rounded-3xl p-8 sm:p-10">
        <div>
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Library size={20} strokeWidth={3} />
            <p className="island-kicker mb-0">Static Content</p>
          </div>
          <h1 className="display-title text-5xl text-foreground sm:text-6xl">Pages</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground font-medium">
            Manage your static pages like About and Contact.
          </p>
        </div>
      </header>
    </div>
  )
}
