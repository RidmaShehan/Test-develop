'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Mic, Square, Trash2, Upload, Play, Pause, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface VoiceNote {
  id: string
  cloudinaryUrl: string
  durationSec: number
  createdAt: string
  uploadedBy: { name: string }
  transcription?: string
}

interface VoiceRecorderProps {
  seekerId: string
  notes: VoiceNote[]
  onNoteAdded: () => void
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VoiceRecorder({ seekerId, notes, onNoteAdded }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setRecordedBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingDuration(0)
      timerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000)
    } catch {
      toast.error('Microphone access denied. Please allow microphone access.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording])

  const discardRecording = useCallback(() => {
    setRecordedBlob(null)
    setRecordingDuration(0)
  }, [])

  const uploadRecording = useCallback(async () => {
    if (!recordedBlob) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('audio', recordedBlob, `voice_note_${Date.now()}.webm`)
      formData.append('durationSec', String(recordingDuration))

      const res = await fetch(`/api/inquiries/${seekerId}/voice`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Voice note saved')
        setRecordedBlob(null)
        setRecordingDuration(0)
        onNoteAdded()
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [recordedBlob, recordingDuration, seekerId, onNoteAdded])

  const togglePlay = (noteId: string, url: string) => {
    if (playingId === noteId) {
      audioRef.current?.pause()
      setPlayingId(null)
    } else {
      if (audioRef.current) audioRef.current.pause()
      const audio = new Audio(url)
      audioRef.current = audio
      audio.play()
      setPlayingId(noteId)
      audio.onended = () => setPlayingId(null)
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      await fetch(`/api/inquiries/${seekerId}/voice?noteId=${noteId}`, { method: 'DELETE' })
      toast.success('Voice note deleted')
      onNoteAdded()
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      {/* Recorder control */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
        {!recordedBlob ? (
          <>
            <Button
              size="sm"
              variant={isRecording ? 'destructive' : 'default'}
              onClick={isRecording ? stopRecording : startRecording}
              className="gap-2"
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Record
                </>
              )}
            </Button>
            {isRecording && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-mono text-red-600">{formatDuration(recordingDuration)}</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Recording ready ({formatDuration(recordingDuration)})
            </span>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="ghost" onClick={discardRecording}>
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={uploadRecording} disabled={isUploading} className="gap-1">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Save
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Notes list */}
      {notes.length > 0 && (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              <button
                onClick={() => togglePlay(note.id, note.cloudinaryUrl)}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                  playingId === note.id
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white'
                )}
              >
                {playingId === note.id ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {formatDuration(note.durationSec)} · {note.uploadedBy.name}
                </p>
                <p className="text-xs text-slate-400">
                  {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                </p>
                {note.transcription && (
                  <p className="text-xs text-slate-500 mt-1 italic">"{note.transcription}"</p>
                )}
              </div>
              <button
                onClick={() => deleteNote(note.id)}
                className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {notes.length === 0 && !isRecording && !recordedBlob && (
        <p className="text-xs text-center text-slate-400 py-2">
          No voice notes yet. Click Record to add one.
        </p>
      )}
    </div>
  )
}
