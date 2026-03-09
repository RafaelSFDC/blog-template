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
  settings.forEach((s: any) => {
    settingsObj[s.key] = s.value
  })

  return {
    blogName: settingsObj['blogName'] || 'VibeZine',
    blogDescription: settingsObj['blogDescription'] || 'A vibrant zine-style blog for creators.',
    blogLogo: settingsObj['blogLogo'] || '',
    accentColor: settingsObj['accentColor'] || '#ff5c00',
    fontFamily: settingsObj['fontFamily'] || 'Inter',
    gaMeasurementId: settingsObj['gaMeasurementId'] || '',
    plausibleDomain: settingsObj['plausibleDomain'] || '',
    stripePriceId: settingsObj['stripePriceId'] || '',
  }
})

const updateAppSettings = createServerFn({ method: 'POST' })
  .inputValidator((input: { 
    blogName: string; 
    blogDescription: string;
    blogLogo: string;
    accentColor: string;
    fontFamily: string;
    gaMeasurementId: string;
    plausibleDomain: string;
    stripePriceId: string;
  }) => input)
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
    await upsert('blogLogo', data.blogLogo)
    await upsert('accentColor', data.accentColor)
    await upsert('fontFamily', data.fontFamily)
    await upsert('gaMeasurementId', data.gaMeasurementId)
    await upsert('plausibleDomain', data.plausibleDomain)
    await upsert('stripePriceId', data.stripePriceId)

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
  const [blogLogo, setBlogLogo] = useState(initialSettings.blogLogo)
  const [accentColor, setAccentColor] = useState(initialSettings.accentColor)
  const [fontFamily, setFontFamily] = useState(initialSettings.fontFamily)
  const [gaMeasurementId, setGaMeasurementId] = useState(initialSettings.gaMeasurementId)
  const [plausibleDomain, setPlausibleDomain] = useState(initialSettings.plausibleDomain)
  const [stripePriceId, setStripePriceId] = useState(initialSettings.stripePriceId)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      await updateAppSettings({ data: { 
        blogName, 
        blogDescription, 
        blogLogo, 
        accentColor, 
        fontFamily,
        gaMeasurementId: gaMeasurementId.trim(),
        plausibleDomain: plausibleDomain.trim(),
        stripePriceId: stripePriceId.trim()
      } })
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

              <div className="pt-6 border-t border-border/10">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-6">Branding & Style</h3>
                
                <div className="grid gap-6 sm:grid-cols-2">
                   <div className="space-y-2">
                    <label htmlFor="blogLogo" className="text-xs font-black uppercase tracking-widest text-foreground">
                      Logo URL
                    </label>
                    <input
                      id="blogLogo"
                      value={blogLogo}
                      onChange={(e) => setBlogLogo(e.target.value)}
                      className="w-full rounded-xl border-2 border-border bg-muted/50 px-5 py-3 text-sm font-bold text-foreground outline-none focus:border-primary transition-all"
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="accentColor" className="text-xs font-black uppercase tracking-widest text-foreground">
                      Accent Color
                    </label>
                    <div className="flex gap-4">
                      <input
                        id="accentColor"
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="h-11 w-20 rounded-lg border-2 border-border bg-background p-1 outline-none pointer cursor-pointer"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="flex-1 rounded-xl border-2 border-border bg-muted/50 px-5 py-3 text-sm font-bold text-foreground outline-none focus:border-primary transition-all font-mono uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="fontFamily" className="text-xs font-black uppercase tracking-widest text-foreground">
                      Typography / Font Family
                    </label>
                    <select
                      id="fontFamily"
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full rounded-xl border-2 border-border bg-muted/50 px-5 py-3 text-sm font-bold text-foreground outline-none focus:border-primary transition-all"
                    >
                      <option value="Inter">Modern (Inter)</option>
                      <option value="Outfit">Creative (Outfit)</option>
                      <option value="Playfair Display">Elegant (Playfair Display)</option>
                      <option value="Space Grotesk">Tech (Space Grotesk)</option>
                      <option value="Bricolage Grotesque">Expressive (Bricolage Grotesque)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/10">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-6">Analytics Tracking</h3>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="gaMeasurementId" className="text-xs font-black uppercase tracking-widest text-foreground">
                      Google Analytics Measurement ID
                    </label>
                    <input
                      id="gaMeasurementId"
                      value={gaMeasurementId}
                      onChange={(e) => setGaMeasurementId(e.target.value)}
                      className="w-full rounded-xl border-2 border-border bg-muted/50 px-5 py-3 text-sm font-bold text-foreground outline-none focus:border-primary transition-all"
                      placeholder="G-XXXXXXXXXX"
                    />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Requires a "G-" prefix</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="plausibleDomain" className="text-xs font-black uppercase tracking-widest text-foreground">
                      Plausible Analytics Domain
                    </label>
                    <input
                      id="plausibleDomain"
                      value={plausibleDomain}
                      onChange={(e) => setPlausibleDomain(e.target.value)}
                      className="w-full rounded-xl border-2 border-border bg-muted/50 px-5 py-3 text-sm font-bold text-foreground outline-none focus:border-primary transition-all"
                      placeholder="yourdomain.com"
                    />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Leaves out "https://"</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/10">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-6">Monetization (Stripe)</h3>
                <div className="space-y-2">
                  <label htmlFor="stripePriceId" className="text-xs font-black uppercase tracking-widest text-foreground">
                    Premium Plan Price ID
                  </label>
                  <input
                    id="stripePriceId"
                    value={stripePriceId}
                    onChange={(e) => setStripePriceId(e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-muted/50 px-5 py-3 text-sm font-bold text-foreground outline-none focus:border-primary transition-all font-mono"
                    placeholder="price_H5v..."
                  />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Obtido no dashboard do Stripe</p>
                </div>
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
