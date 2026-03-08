import { createFileRoute } from '@tanstack/react-router'
import { Image } from 'lucide-react'

export const Route = createFileRoute('/dashboard/media/')({
  component: MediaLibraryPage,
})

function MediaLibraryPage() {
  return (
    <div className="space-y-8">
      <header className="island-shell flex flex-wrap items-end justify-between gap-6 rounded-3xl p-8 sm:p-10">
        <div>
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Image size={20} strokeWidth={3} />
            <p className="island-kicker mb-0">Assets</p>
          </div>
          <h1 className="display-title text-5xl text-foreground sm:text-6xl">Media Library</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground font-medium">
            Manage your uploaded images and files.
          </p>
        </div>
      </header>
    </div>
  )
}
