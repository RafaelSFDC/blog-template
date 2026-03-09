import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { webhooks } from '#/db/schema'
import { requireAdminSession } from '#/lib/admin-auth'
import { Button } from '#/components/ui/button'
import { Webhook, Save, ChevronLeft, Info } from 'lucide-react'
import { useState, type FormEvent } from 'react'

const createWebhook = createServerFn({ method: 'POST' })
  .inputValidator((data: { name: string; url: string; event: string; secret?: string }) => data)
  .handler(async ({ data }) => {
    await requireAdminSession()
    await db.insert(webhooks).values({
      name: data.name,
      url: data.url,
      event: data.event,
      secret: data.secret || null,
      isActive: true,
      createdAt: new Date(),
    })
    return { success: true }
  })

export const Route = createFileRoute('/dashboard/webhooks/new')({
  component: NewWebhookPage,
})

function NewWebhookPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [event, setEvent] = useState('post.published')
  const [secret, setSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name || !url) {
      setErrorMessage('Name and URL are required.')
      return
    }

    try {
      setSaving(true)
      setErrorMessage('')
      await createWebhook({ data: { name, url, event, secret } })
      await navigate({ to: '/dashboard/webhooks' })
    } catch {
      setErrorMessage('Failed to create webhook. Please check the data.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-10">
      <header className="island-shell rounded-3xl p-8 sm:p-10">
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-6 rounded-full text-muted-foreground hover:text-foreground">
           <a href="/dashboard/webhooks" className="flex items-center gap-1">
             <ChevronLeft className="h-4 w-4" />
             Back to Webhooks
           </a>
        </Button>
        <div className="mb-4 flex items-center gap-2 text-primary">
          <Webhook size={20} strokeWidth={3} />
          <p className="island-kicker mb-0">Composer</p>
        </div>
        <h1 className="display-title text-5xl text-foreground sm:text-6xl uppercase">New Webhook</h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={onSubmit} className="island-shell rounded-3xl p-6 sm:p-10 bg-card border-3 border-border/50 space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-foreground">
                  Friendly Name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-muted/50 px-5 py-4 text-sm font-bold text-foreground outline-none focus:border-primary transition-all"
                  placeholder="e.g. My Zapier Integration"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="url" className="text-xs font-black uppercase tracking-widest text-foreground">
                  Destination URL
                </label>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-muted/50 px-5 py-4 text-sm font-bold text-foreground outline-none focus:border-primary transition-all font-mono"
                  placeholder="https://hooks.zapier.com/..."
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="event" className="text-xs font-black uppercase tracking-widest text-foreground">
                    Trigger Event
                  </label>
                  <select
                    id="event"
                    value={event}
                    onChange={(e) => setEvent(e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-muted/50 px-5 py-3 text-sm font-bold text-foreground outline-none focus:border-primary transition-all"
                  >
                    <option value="post.published">Post Published</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="secret" className="text-xs font-black uppercase tracking-widest text-foreground">
                    Webhook Secret (Optional)
                  </label>
                  <input
                    id="secret"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-muted/50 px-5 py-3 text-sm font-bold text-foreground outline-none focus:border-primary transition-all font-mono"
                    placeholder="shhh-secret-key"
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl border-2 border-destructive/20 bg-destructive/5 px-6 py-4 text-sm font-bold text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="pt-4 border-t-2 border-border/10">
              <Button
                type="submit"
                disabled={saving}
                variant="zine"
                size="lg"
                className="rounded-xl h-14 px-10 shadow-zine-sm"
              >
                <Save size={20} className="mr-2" strokeWidth={3} />
                <span className="uppercase tracking-widest font-black">
                  {saving ? 'Creating...' : 'Create Webhook'}
                </span>
              </Button>
            </div>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="island-shell rounded-2xl bg-muted/50 p-6 border-3 border-border/30">
            <h3 className="font-black uppercase tracking-tighter text-foreground mb-4 flex items-center gap-2">
              <Info size={18} className="text-primary" />
              Webhook Security
            </h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              When a secret is configured, VibeZine will send it in the <code>X-Webhook-Secret</code> header. Use this to verify that the request came from your blog.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
