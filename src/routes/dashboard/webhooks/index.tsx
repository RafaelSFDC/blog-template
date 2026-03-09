import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { webhooks } from '#/db/schema'
import { eq, desc } from 'drizzle-orm'
import { requireAdminSession } from '#/lib/admin-auth'
import { Button } from '#/components/ui/button'
import { Webhook, Plus, Trash2, Activity, Globe } from 'lucide-react'
import { useState } from 'react'

const getWebhooks = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdminSession()
  return db.query.webhooks.findMany({
    orderBy: [desc(webhooks.createdAt)],
  })
})

const deleteWebhook = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await requireAdminSession()
    await db.delete(webhooks).where(eq(webhooks.id, id))
    return { success: true }
  })

const toggleWebhook = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number; isActive: boolean }) => data)
  .handler(async ({ data }) => {
    await requireAdminSession()
    await db.update(webhooks).set({ isActive: data.isActive }).where(eq(webhooks.id, data.id))
    return { success: true }
  })

export const Route = createFileRoute('/dashboard/webhooks/')({
  loader: () => getWebhooks(),
  component: WebhooksPage,
})

function WebhooksPage() {
  const initialWebhooks = Route.useLoaderData()
  const [list, setList] = useState(initialWebhooks)

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this webhook?')) return
    await deleteWebhook({ data: id })
    setList(list.filter((w: any) => w.id !== id))
  }

  async function handleToggle(id: number, isActive: boolean) {
    await toggleWebhook({ data: { id, isActive } })
    setList(list.map((w: any) => (w.id === id ? { ...w, isActive } : w)))
  }

  return (
    <div className="space-y-10">
      <header className="island-shell rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Webhook size={20} strokeWidth={3} />
            <p className="island-kicker mb-0">Integrations</p>
          </div>
          <h1 className="display-title text-5xl text-foreground sm:text-6xl uppercase">Webhooks</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground font-medium">
            Notify external services when posts are published.
          </p>
        </div>
        
        <Button asChild variant="zine" size="lg" className="rounded-2xl shadow-zine-sm">
          <a href="/dashboard/webhooks/new">
            <Plus size={20} className="mr-2" strokeWidth={3} />
            New Webhook
          </a>
        </Button>
      </header>

      <section className="island-shell rounded-3xl p-6 sm:p-10 bg-card border-3 border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Name</th>
                <th className="pb-4 text-xs font-black uppercase tracking-widest text-muted-foreground">URL</th>
                <th className="pb-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Event</th>
                <th className="pb-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="pb-4 text-right text-xs font-black uppercase tracking-widest text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-muted-foreground font-medium">
                    No webhooks configured yet.
                  </td>
                </tr>
              ) : (
                list.map((webhook: any) => (
                  <tr key={webhook.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="py-5 font-bold text-foreground">
                      <div className="flex items-center gap-3">
                         <div className={`w-3 h-3 rounded-full ${webhook.isActive ? `bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]` : `bg-muted-foreground/30`}`} />
                         {webhook.name}
                      </div>
                    </td>
                    <td className="py-5 text-sm text-muted-foreground font-mono max-w-[200px] truncate">
                      {webhook.url}
                    </td>
                    <td className="py-5">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-wider">
                        {webhook.event}
                      </span>
                    </td>
                    <td className="py-5">
                      <button 
                        onClick={() => handleToggle(webhook.id, !webhook.isActive)}
                        className={`text-xs font-black uppercase tracking-widest transition-colors ${webhook.isActive ? `text-green-600 hover:text-green-700` : `text-muted-foreground hover:text-foreground`}`}
                      >
                        {webhook.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => handleDelete(webhook.id)}>
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
         <div className="island-shell rounded-2xl bg-muted/50 p-6 border-3 border-border/30">
            <h3 className="font-black uppercase tracking-tighter text-foreground mb-4 flex items-center gap-2">
               <Globe size={18} className="text-primary" />
               External Integrations
            </h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
               Use webhooks to connect with services like Zapier, Make.com, n8n, or your own custom notification bots.
            </p>
         </div>
         <div className="island-shell rounded-2xl bg-muted/50 p-6 border-3 border-border/30">
            <h3 className="font-black uppercase tracking-tighter text-foreground mb-4 flex items-center gap-2">
               <Activity size={18} className="text-primary" />
               Verification
            </h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
               The payload includes the post title, slug, excerpt, and ID. If a secret is provided, it will be sent in the <code>X-Webhook-Secret</code> header.
            </p>
         </div>
      </div>
    </div>
  )
}
