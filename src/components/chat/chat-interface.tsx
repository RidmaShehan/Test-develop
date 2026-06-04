'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles, RotateCcw, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const STORAGE_KEY = 'ai-assistant-chat-messages-v1'

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeModel, setActiveModel] = useState<string | null>(null)
  const [lastRequest, setLastRequest] = useState<{
    message: string
    history: Array<{ role: Message['role']; content: string }>
  } | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      // Find the scrollable container
      const scrollContainer = scrollAreaRef.current
      if (scrollContainer) {
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        })
      }
    }
  }, [messages])

  useEffect(() => {
    try {
      const persisted = localStorage.getItem(STORAGE_KEY)
      if (!persisted) return
      const parsed = JSON.parse(persisted) as Array<{
        id: string
        role: 'user' | 'assistant'
        content: string
        timestamp: string
      }>
      setMessages(
        parsed.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
      )
    } catch (persistError) {
      console.warn('Failed to restore chat history', persistError)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          messages.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(),
          }))
        )
      )
    } catch (persistError) {
      console.warn('Failed to persist chat history', persistError)
    }
  }, [messages])

  const consumeSSE = async (
    response: Response,
    onChunk: (chunk: string) => void
  ) => {
    const reader = response.body?.getReader()
    if (!reader) throw new Error('No stream available')
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.replace('data: ', '').trim()
        if (payload === '[DONE]') return
        const data = JSON.parse(payload) as { token?: string; done?: boolean; error?: string; message?: string }
        if (data.error) throw new Error(data.error)
        if (data.done) return
        if (data.token) onChunk(data.token)
      }
    }
  }

  const sendToApi = async (payload: {
    message: string
    history: Array<{ role: Message['role']; content: string }>
  }, onChunk?: (chunk: string) => void): Promise<{ message: string; model: string | null }> => {
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...payload, stream: true }),
        signal: controller.signal,
      })

      if (!response.ok) {
        let errorMessage = 'Failed to get response'
        try {
          const data = await response.json()
          errorMessage = data.error || errorMessage
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const usedModel = response.headers.get('X-Model-Used')
      let message = ''
      await consumeSSE(response, (chunk) => {
        message += chunk
        onChunk?.(chunk)
      })
      return { message, model: usedModel }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Response stopped')
      }
      throw new Error(err.message || 'An error occurred while chatting')
    } finally {
      abortRef.current = null
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    const history = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    const payload = { message: userMessage.content, history }
    setLastRequest(payload)
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)
    const streamingId = `${Date.now()}-assistant`

    try {
      const placeholderAssistantMessage: Message = {
        id: streamingId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, placeholderAssistantMessage])

      const result = await sendToApi(payload, (chunk) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingId ? { ...msg, content: `${msg.content}${chunk}` } : msg
          )
        )
      })
      setActiveModel(result.model)
      console.info('chat.ui.sent', { model: result.model, inputChars: payload.message.length })
    } catch (err: any) {
      setMessages((prev) => prev.filter((msg) => msg.id !== streamingId))
      setError(err.message || 'An error occurred while chatting')
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = async () => {
    if (!lastRequest || isLoading) return
    setIsLoading(true)
    setError(null)

    try {
      const result = await sendToApi(lastRequest)
      setActiveModel(result.model)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      setError(err.message || 'Retry failed')
      console.error('Chat retry error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
    setActiveModel(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const stopGenerating = () => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">
              Powered by Gemini{activeModel ? ` (${activeModel})` : ''}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-xs"
          >
            Clear Chat
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Welcome to AI Assistant
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Ask me anything! I can help you with your CRM tasks, answer questions,
                provide insights, and assist with your work.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div
                className={cn(
                  'rounded-lg px-4 py-2 max-w-[80%]',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-lg px-4 py-2 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm border-t flex items-center justify-between gap-3">
          <span>{error}</span>
          {lastRequest && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isLoading}
              className="h-7"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Retry
            </Button>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-card px-4 py-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
            rows={2}
            className="flex-1 resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          {isLoading && (
            <Button
              onClick={stopGenerating}
              variant="outline"
              size="icon"
              title="Stop generating"
            >
              <Square className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}




