'use client'

import dynamic from 'next/dynamic'
import { useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import 'react-quill/dist/quill.snow.css'
import './note-quill-editor.css'

const ReactQuill = dynamic(
  async () => {
    const mod = await import('react-quill')
    return mod.default
  },
  { ssr: false, loading: () => <div className="min-h-[200px] animate-pulse rounded-md bg-muted" /> }
)
const ReactQuillAny = ReactQuill as any

export interface NoteQuillEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  /** Minimum height for the editing area (Tailwind class, e.g. min-h-[300px]) */
  editorMinHeightClass?: string
}

export function NoteQuillEditor({
  value,
  onChange,
  placeholder = 'Start writing your note...',
  className,
  disabled = false,
  editorMinHeightClass = 'min-h-[240px]',
}: NoteQuillEditorProps) {
  const quillRef = useRef<any>(null)

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          ['blockquote', 'code-block'],
          [{ color: [] }, { background: [] }],
          ['link', 'image'],
          ['clean'],
          [{ table: 'insert' }],
        ],
        handlers: {
          table: () => {
            const quill = quillRef.current?.getEditor?.()
            if (!quill) return
            const index = (quill.getSelection && quill.getSelection())?.index ?? quill.getLength()
            const html =
              '<table border="1" style="border-collapse:collapse;width:100%">' +
              '<tr><th>Header 1</th><th>Header 2</th></tr>' +
              '<tr><td>Cell 1</td><td>Cell 2</td></tr>' +
              '</table><p><br/></p>'
            quill.clipboard.dangerouslyPasteHTML(index, html)
          },
        },
      },
    }),
    []
  )

  return (
    <div
      className={cn('note-quill-editor overflow-hidden rounded-lg border border-border bg-background', className)}
      data-note-quill-editor
    >
      <div className={cn(editorMinHeightClass, '[&_.ql-container]:min-h-[inherit] [&_.ql-editor]:min-h-[inherit]')}>
        <ReactQuillAny
          ref={quillRef as any}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          readOnly={disabled}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
