import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { subscribers } from '#/db/schema'
import { requireAdminSession } from '#/lib/admin-auth'
import { Users, Download, Info, CheckCircle2 } from 'lucide-react'
import { desc } from 'drizzle-orm'
import { format } from 'date-fns'

const getSubscribers = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdminSession()
  const { db } = await import('#/db/index');
  return db.query.subscribers.findMany({
    orderBy: [desc(subscribers.createdAt)],
  })
})

const exportSubscribersCSV = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdminSession()
  const { db } = await import('#/db/index');
  const allSubscribers = await db.query.subscribers.findMany({
    orderBy: [desc(subscribers.createdAt)],
  })

  if (allSubscribers.length === 0) {
    return { data: null, error: 'No subscribers found' }
  }

  // Generate CSV Header
  const headers = ['Email', 'Status', 'Subscribed At']
  
  // Generate CSV Rows
  const rows = allSubscribers.map((sub: any) => [
    sub.email,
    sub.status,
    sub.createdAt.toISOString()
  ])

  // Combine headers and rows, handle escaping for CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map((row: any[]) => row.map((value: any) => `"${String(value).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  return { data: csvContent, count: allSubscribers.length }
})

export const Route = createFileRoute('/dashboard/users/subscribers')({
  loader: () => getSubscribers(),
  component: SubscribersPage,
})

function SubscribersPage() {
  const subs = Route.useLoaderData()

  const handleExport = async () => {
    try {
      const result = await exportSubscribersCSV()
      
      if (result?.data) {
        // Create a Blob from the CSV String
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        
        // Create an invisible link to trigger the download
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `vibe-subscribers-${format(new Date(), 'yyyy-MM-dd')}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        alert(result?.error || 'Failed to export subscribers.')
      }
    } catch (e) {
      console.error('Export failed:', e)
      alert('An error occurred during export.')
    }
  }

  return (
    <div className="space-y-10">
      <header className="bg-card border shadow-sm rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Users size={20} strokeWidth={3} />
            <p className="island-kicker mb-0">Audience</p>
          </div>
          <h1 className="display-title text-5xl text-foreground sm:text-6xl uppercase">Subscribers</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground font-medium">
            Manage your newsletter audience and export your list.
          </p>
        </div>
        
        <button
          onClick={handleExport}
          disabled={subs.length === 0}
          className="vibe-btn-primary flex items-center gap-2 whitespace-nowrap rounded-xl px-6 py-4 font-bold disabled:opacity-50"
        >
          <Download size={18} />
          Export CSV ({subs.length})
        </button>
      </header>

      <div className="bg-card border shadow-sm overflow-hidden rounded-3xl bg-card border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs font-black uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-5">Email Address</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Date Subscribed</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border/10">
              {subs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                       <Info size={24} className="opacity-50" />
                       <p className="font-bold">No subscribers yet.</p>
                       <p className="text-sm">When users subscribe, they will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                subs.map((sub: any) => (
                  <tr key={sub.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-6 py-5 font-bold text-foreground">
                      {sub.email}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-bold text-xs uppercase ${
                        sub.status === 'active' 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {sub.status === 'active' && <CheckCircle2 size={12} />}
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-medium text-muted-foreground">
                      {format(new Date(sub.createdAt), 'MMM d, yyyy h:mm a')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
