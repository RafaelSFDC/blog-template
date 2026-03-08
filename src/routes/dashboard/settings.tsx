import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { appSettings } from '#/db/schema'
import { useState, type FormEvent } from 'react'
import { requireAdminSession } from '#/lib/admin-auth'
import { Button } from '#/components/ui/button'
import { Settings as SettingsIcon, Save, Info } from 'lucide-react'

const getAppSettings = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdminSession()
  const settings = await db.select().from(appSettings)
  
  // Convert array to a more useful object
  const settingsObj: Record<string, string> = {}
  settings.forEach(s => {
    settingsObj[s.key] = s.value
  })

  return {
    blogName: settingsObj['blogName'] || 'VibeZine',
    blogDescription: settingsObj['blogDescription'] || 'A vibrant zine-style blog for creators.',
  }
})

const updateAppSettings = createServerFn({ method: 'POST' })
  .inputValidator((input: { blogName: string; blogDescription: string }) => input)
  .handler(async ({ data }) => {
    await requireAdminSession()

    const upsert = async (key: string, value: string) => {
       await db.insert(appSettings)
         .values({ key, value, updatedAt: new Date() })
         .onConflictDoUpdate({
           target: appSettings.key,
           set: { value, updatedAt: new Date() }
         })
    }

    await upsert('blogName', data.blogName)
    await upsert('blogDescription', data.blogDescription)

    return { ok: true as const }
  })

export const Route = createFileRoute('/dashboard/settings')({
  loader: () => getAppSettings(),
  component: SettingsPage,
})

function SettingsPage() {
  const initialSettings = Route.useLoaderData()
  const [blogName, setBlogName] = useState(initialSettings.blogName)
  const [blogDescription, setBlogDescription] = useState(initialSettings.blogDescription)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      await updateAppSettings({ data: { blogName, blogDescription } })
      setMessage('Settings saved successfully!')
    } catch {
      setMessage('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-10">
      <header className="island-shell rounded-3xl p-8 sm:p-10">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <SettingsIcon size={20} strokeWidth={3} />
          <p className="island-kicker mb-0">Configuration</p>
        </div>
        <h1 className="display-title text-5xl text-foreground sm:text-6xl uppercase">Blog Settings</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground font-medium">
          Manage your publication's identity and global configuration.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={onSubmit} className="island-shell rounded-3xl p-6 sm:p-10 bg-card border-3 border-border/50 space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="blogName" className="text-xs font-black uppercase tracking-widest text-foreground">
                  Publication Name
                </label>
                <input
                  id="blogName"
                  value={blogName}
                  onChange={(e) => setBlogName(e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-muted/50 px-5 py-4 text-sm font-bold text-foreground outline-none focus:border-primary transition-all"
                  placeholder="e.g. VibeZine"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="blogDescription" className="text-xs font-black uppercase tracking-widest text-foreground">
                  Short Bio / Description
                </label>
                <textarea
                  id="blogDescription"
                  value={blogDescription}
                  onChange={(e) => setBlogDescription(e.target.value)}
                  className="min-h-32 w-full rounded-xl border-2 border-border bg-muted/50 px-5 py-4 text-sm font-bold text-foreground outline-none focus:border-primary transition-all"
                  placeholder="Tell your readers what this blog is about..."
                />
              </div>
            </div>

            {message && (
              <div className={`rounded-xl border-2 px-6 py-4 text-sm font-bold flex items-center gap-3 ${
                message.includes('successfully') 
                  ? 'border-green-500/20 bg-green-500/5 text-green-600' 
                  : 'border-destructive/20 bg-destructive/5 text-destructive'
              }`}>
                <Info size={18} />
                {message}
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
                  {saving ? 'Saving...' : 'Save Configuration'}
                </span>
              </Button>
            </div>
          </form>
        </div>

        <aside className="space-y-6">
           <div className="island-shell rounded-2xl bg-muted/50 p-6 border-3 border-border/30">
              <h3 className="font-black uppercase tracking-tighter text-foreground mb-4 flex items-center gap-2">
                 <Info size={18} className="text-primary" />
                 Metadata Tip
              </h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                 These settings affect your blog's public appearance in the header, footer, and SEO tags. 
                 Ensure your description is concise but descriptive to help with search engine rankings.
              </p>
           </div>
        </aside>
      </div>
    </div>
  )
}
