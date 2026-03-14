import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { Button } from '#/components/ui/button'
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Image as ImageIcon,
  Link as LinkIcon,
  Video,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Underline as UnderlineIcon,
  Code
} from 'lucide-react'
import ImageExtension from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import UnderlineExtension from '@tiptap/extension-underline'
import YoutubeExtension from '@tiptap/extension-youtube'
import TextAlign from '@tiptap/extension-text-align'
import { uploadMedia } from '#/server/media-actions'
import { useRef } from 'react'
import { toast } from 'sonner'


interface TiptapEditorProps {
  content: string
  onChange: (markdown: string) => void
  placeholder?: string
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null
  }

  const buttons = [
    {
      icon: <Heading1 className="h-4 w-4" />,
      title: 'Heading 1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive('heading', { level: 1 }),
    },
    {
      icon: <Heading2 className="h-4 w-4" />,
      title: 'Heading 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive('heading', { level: 2 }),
    },
    {
      icon: <Bold className="h-4 w-4" />,
      title: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    },
    {
      icon: <Italic className="h-4 w-4" />,
      title: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
    },
    {
      icon: <UnderlineIcon className="h-4 w-4" />,
      title: 'Underline',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive('underline'),
    },
    {
      icon: <LinkIcon className="h-4 w-4" />,
      title: 'Link',
      action: () => {
        const url = window.prompt('URL')
        if (url) {
          editor.chain().focus().setLink({ href: url }).run()
        }
      },
      isActive: () => editor.isActive('link'),
    },
    {
      icon: <List className="h-4 w-4" />,
      title: 'Bullet List',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive('bulletList'),
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      title: 'Ordered List',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive('orderedList'),
    },
    {
      icon: <AlignLeft className="h-4 w-4" />,
      title: 'Align Left',
      action: () => editor.chain().focus().setTextAlign('left').run(),
      isActive: () => editor.isActive({ textAlign: 'left' }),
    },
    {
      icon: <AlignCenter className="h-4 w-4" />,
      title: 'Align Center',
      action: () => editor.chain().focus().setTextAlign('center').run(),
      isActive: () => editor.isActive({ textAlign: 'center' }),
    },
    {
      icon: <AlignRight className="h-4 w-4" />,
      title: 'Align Right',
      action: () => editor.chain().focus().setTextAlign('right').run(),
      isActive: () => editor.isActive({ textAlign: 'right' }),
    },
    {
      icon: <Quote className="h-4 w-4" />,
      title: 'Blockquote',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive('blockquote'),
    },
    {
      icon: <Video className="h-4 w-4" />,
      title: 'YouTube',
      action: () => {
        const url = window.prompt('YouTube URL')
        if (url) {
          editor.chain().focus().setYoutubeVideo({ src: url }).run()
        }
      },
      isActive: () => editor.isActive('youtube'),
    },
    {
      icon: <Code className="h-4 w-4" />,
      title: 'Code Block',
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: () => editor.isActive('codeBlock'),
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border p-2 bg-muted">
      {buttons.map((btn, i) => (
        <Button
          key={i}
          type="button"
          variant="ghost"
          size="icon"
          onClick={btn.action}
          title={btn.title}
          className={`h-8 w-8 rounded-md transition-colors hover:bg-border ${
            btn.isActive() ? 'bg-border text-primary' : 'text-muted-foreground'
          }`}
        >
          {btn.icon}
        </Button>
      ))}
      <div className="mx-1 h-6 w-px bg-border" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="h-8 w-8 rounded-md text-muted-foreground transition-colors hover:bg-border disabled:opacity-30"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="h-8 w-8 rounded-md text-muted-foreground transition-colors hover:bg-border disabled:opacity-30"
      >
        <Redo className="h-4 w-4" />
      </Button>
      <div className="mx-1 h-6 w-px bg-border" />
      <ImageUploadButton editor={editor} />
    </div>
  )
}

function ImageUploadButton({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await uploadMedia({ data: formData })
      if (res?.url) {
        editor.chain().focus().setImage({ src: res.url, alt: file.name }).run()
      }
    } catch (err) {
      console.error('Upload failed:', err)
      toast.error('Image upload failed. Check your storage configuration and try again.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={onFileChange}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        title="Upload Image"
        className="h-8 w-8 rounded-md text-muted-foreground transition-colors hover:bg-border"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
    </>
  )
}


export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
        underline: false,
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto border border-border shadow-md my-4',
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80 transition-colors',
        },
      }),
      UnderlineExtension,
      YoutubeExtension.configure({
        HTMLAttributes: {
          class: 'aspect-video w-full rounded-xl overflow-hidden shadow-lg my-6',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],

    content: content,
    onUpdate: ({ editor }) => {
      // @ts-expect-error - getMarkdown exists on editor with the extension
      onChange(editor.storage.markdown.getMarkdown())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none max-w-none min-h-[300px] p-4 text-foreground',
      },
    },
  })

  return (
    <div className="overflow-hidden rounded-xl border border-input bg-muted transition-shadow focus-within:ring-2 focus-within:ring-primary/20">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
