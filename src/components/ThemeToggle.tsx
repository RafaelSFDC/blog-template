import { useTheme } from 'next-themes'
import { Button } from '#/components/ui/button'
import { Sun, Moon, Monitor } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  function toggleMode() {
    const modes = ['light', 'dark', 'system']
    const currentIndex = modes.indexOf(theme || 'system')
    const nextIndex = (currentIndex + 1) % modes.length
    setTheme(modes[nextIndex])
  }

  const label = `Theme mode: ${theme || 'system'}. Click to switch mode.`

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className="toy-button flex h-11 items-center justify-center rounded-lg border border-border bg-accent px-4 text-sm font-black text-foreground shadow-sm gap-2"
    >
      {theme === 'system' || !theme ? (
        <>
          <Monitor size={16} />
          <span>Auto</span>
        </>
      ) : theme === 'dark' ? (
        <>
          <Moon size={16} />
          <span>Dark</span>
        </>
      ) : (
        <>
          <Sun size={16} />
          <span>Light</span>
        </>
      )}
    </Button>
  )
}
