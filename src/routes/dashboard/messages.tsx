import { createFileRoute } from '@tanstack/react-router'
import { DashboardHeader } from '#/components/dashboard/Header'
import { DashboardPageContainer } from '#/components/dashboard/DashboardPageContainer'
import { createServerFn } from '@tanstack/react-start'
import { contactMessages } from '#/db/schema'
import { eq, desc } from 'drizzle-orm'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Mail, Trash2, Check, Archive, Inbox } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { requireAdminSession } from '#/lib/admin-auth'

const getMessages = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession()
  const { db } = await import('#/db/index');
  return await db.query.contactMessages.findMany({
    orderBy: desc(contactMessages.createdAt),
  })
})

const updateMessageStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { id: number; status: "read" | "archived" | "new" }) => data)
  .handler(async ({ data }) => {
    await requireAdminSession()
    const { db } = await import('#/db/index');
    await db.update(contactMessages).set({ status: data.status }).where(eq(contactMessages.id, data.id))
    return { success: true }
  })

const deleteMessage = createServerFn({ method: "POST" })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await requireAdminSession()
    const { db } = await import('#/db/index');
    await db.delete(contactMessages).where(eq(contactMessages.id, id))
    return { success: true }
  })

export const Route = createFileRoute('/dashboard/messages')({
  loader: () => getMessages(),
  component: MessagesPage,
})

function MessagesPage() {
  const messages = Route.useLoaderData()
  const navigate = useNavigate()

  async function handleStatus(id: number, status: "read" | "archived" | "new") {
    await updateMessageStatus({ data: { id, status } })
    navigate({ to: '.' })
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this message?')) return
    await deleteMessage({ data: id })
    navigate({ to: '.' })
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Inbox"
        description="Manage inquiries and messages from your site's contact form."
        icon={Inbox}
        iconLabel="Communication"
      />

      <div className="grid gap-6">
        {messages.length > 0 ? (
          messages.map((msg: any) => (
            <div 
              key={msg.id} 
              className={`island-shell rounded-3xl bg-card p-6 border-3 transition-all group ${
                msg.status === 'new' ? 'border-primary/30 shadow-zine-sm' : 'border-border/50 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-black text-foreground uppercase tracking-wider text-sm flex items-center gap-2">
                       <Mail size={14} className={msg.status === 'new' ? 'text-primary' : 'text-muted-foreground'} />
                       {msg.name}
                    </span>
                    <span className="text-muted-foreground text-xs font-bold font-mono">
                      &lt;{msg.email}&gt;
                    </span>
                    <Badge variant={msg.status === 'new' ? 'default' : msg.status === 'read' ? 'outline' : 'secondary'}>
                      {msg.status}
                    </Badge>
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground">
                    {msg.subject || '(No Subject)'}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/20 italic">
                    "{msg.message}"
                  </p>
                  
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pt-2">
                    Received on {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>

                <div className="flex flex-row sm:flex-col gap-2 self-end sm:self-center">
                  {msg.status !== 'read' && (
                    <Button 
                      size="sm" 
                      variant="zine" 
                      onClick={() => handleStatus(msg.id, 'read')}
                      title="Mark as Read"
                      className="rounded-full"
                    >
                      <Check size={16} />
                    </Button>
                  )}
                  {msg.status !== 'archived' && (
                    <Button 
                      size="sm" 
                      variant="zine-outline" 
                      onClick={() => handleStatus(msg.id, 'archived')}
                      title="Archive"
                      className="rounded-full"
                    >
                      <Archive size={16} />
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDelete(msg.id)}
                    className="rounded-full border-2 border-destructive/20"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="island-shell rounded-4xl p-20 text-center border-3 border-dashed border-border/20">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground/50">
                <Inbox size={40} />
            </div>
            <h2 className="text-2xl font-black text-foreground uppercase">Your inbox is empty</h2>
            <p className="text-muted-foreground font-bold mt-2">Messages from the contact form will appear here.</p>
          </div>
        )}
      </div>
    </DashboardPageContainer>
  )
}
