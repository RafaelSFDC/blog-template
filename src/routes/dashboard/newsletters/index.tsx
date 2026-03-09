import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { newsletters, subscribers } from '#/db/schema'
import { desc, eq } from 'drizzle-orm'
import { Button } from '#/components/ui/button'
import { requireAdminSession } from '#/lib/admin-auth'
import { format } from 'date-fns'
import { Mail, Plus, Trash2, Download } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

const getNewsletters = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdminSession()
    const { db } = await import('#/db/index');
    return db.query.newsletters.findMany({
      orderBy: desc(newsletters.createdAt),
    })
  })

const deleteNewsletter = createServerFn({ method: "POST" })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await requireAdminSession()
    const { db } = await import('#/db/index');
    await db.delete(newsletters).where(eq(newsletters.id, id))
    return { success: true }
  })

const exportSubscribers = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAdminSession()
    const { db } = await import('#/db/index');
    const allSubscribers = await db.query.subscribers.findMany()
    
    const header = 'ID,Email,Status,CreatedAt\n'
    const rows = allSubscribers.map((s: { id: number; email: string; status: string; createdAt: Date | null }) => 
      `${s.id},"${s.email}",${s.status},${s.createdAt ? s.createdAt.toISOString() : ''}`
    ).join('\n')
    
    return header + rows
  })

export const Route = createFileRoute('/dashboard/newsletters/')({
  loader: () => getNewsletters(),
  component: NewsletterIndexPage,
})

function NewsletterIndexPage() {
  const data = Route.useLoaderData()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState<number | null>(null)

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this campaign?')) return
    try {
      setDeleting(id)
      await deleteNewsletter({ data: id })
      navigate({ to: '.' }) // Refresh
    } catch (err) {
      alert('Failed to delete newsletter.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <main className="page-wrap px-4 pb-16 pt-14">
      <section className="island-shell flex flex-col items-start justify-between gap-6 rounded-4xl p-8 sm:p-10 md:flex-row md:items-center">
        <div>
          <p className="island-kicker mb-4">Marketing & Growth</p>
          <h1 className="display-title text-5xl text-foreground sm:text-6xl">Newsletters</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Connect directly with your audience through curated email campaigns.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="zine-outline" 
            size="lg" 
            className="rounded-full"
            onClick={async () => {
              const csv = await exportSubscribers()
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`
              a.click()
            }}
          >
            <Download className="mr-2 h-5 w-5" />
            Export CSV
          </Button>
          <Button asChild variant="zine" size="lg" className="rounded-full shadow-lg shadow-primary/20">
            <Link to="/dashboard/newsletters/new" className="flex items-center gap-2" search={{ fromId: undefined } as any}>
              <Plus className="h-5 w-5" />
              New Campaign
            </Link>
          </Button>
        </div>
      </section>

      <div className="mt-8 space-y-4">
        {data.length === 0 ? (
          <div className="island-shell flex flex-col items-center justify-center rounded-3xl py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold">No campaigns yet</h3>
            <p className="mt-2 text-muted-foreground">Start your first newsletter campaign to engage your subscribers.</p>
            <Button asChild variant="zine-outline" className="mt-8 rounded-full">
              <Link to="/dashboard/newsletters/new" search={{ fromId: undefined } as any}>Create First Campaign</Link>
            </Button>
          </div>
        ) : (
          data.map((item: any) => (
            <div
              key={item.id}
              className="island-shell group flex flex-col items-start justify-between gap-4 rounded-[1.6rem] p-6 transition-all hover:bg-muted/50 sm:flex-row sm:items-center sm:p-8"
            >
              <div className="flex items-center gap-5">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                  item.status === 'sent' ? 'bg-green-500/10 text-green-500' : 
                  item.status === 'sending' ? 'bg-blue-500/10 text-blue-500 animate-pulse' :
                  'bg-primary/10 text-primary'
                }`}>
                  <Mail className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">{item.subject}</h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.status === 'sent' ? 'bg-green-500/10 text-green-500' :
                      item.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                      'bg-muted-foreground/10'
                    }`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                    <span>•</span>
                    <span>{format(new Date(item.createdAt!), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {item.status === 'draft' && (
                   <Button variant="zine-outline" size="sm" className="rounded-full" asChild>
                     <Link to={`/dashboard/newsletters/new`} search={{ fromId: item.id } as any}>
                        Edit
                     </Link>
                   </Button>
                )}
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="rounded-full h-9 w-9 border-2 border-destructive/20"
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {(item.status === 'sent' || item.status === 'failed') && (
                  <Button variant="zine" size="sm" className="rounded-full">
                    View Results
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
