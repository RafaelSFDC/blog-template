import { Twitter, Linkedin, Facebook, Link as LinkIcon } from 'lucide-react'

interface SocialSharingProps {
  url: string
  title: string
}

export function SocialSharing({ url, title }: SocialSharingProps) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareLinks = [
    {
      name: 'Twitter',
      icon: <Twitter className="h-4 w-4" />,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'hover:bg-sky-500',
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin className="h-4 w-4" />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'hover:bg-blue-600',
    },
    {
      name: 'Facebook',
      icon: <Facebook className="h-4 w-4" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:bg-blue-700',
    },
  ]

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url)
    // You could add a toast here
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-bold uppercase tracking-widest text-(--sea-ink-soft) sm:mr-2">Compartilhe</span>
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex h-10 w-10 items-center justify-center rounded-full border border-(--line) text-(--sea-ink-soft) transition-all hover:scale-110 hover:text-white ${link.color}`}
          title={`Share on ${link.name}`}
        >
          {link.icon}
        </a>
      ))}
      <button
        onClick={copyToClipboard}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-(--line) text-(--sea-ink-soft) transition-all hover:scale-110 hover:bg-(--lagoon-deep) hover:text-white"
        title="Copy link"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
