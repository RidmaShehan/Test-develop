'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Send, 
  AtSign, 
  Smile, 
  Paperclip,
  MoreHorizontal,
  Edit,
  Trash2,
  Reply
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/contexts/notification-context'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt?: string
  author: User
  mentions?: User[]
  replies?: Comment[]
  parentId?: string
}

interface CommentSystemProps {
  entityId: string
  entityType: 'task' | 'project' | 'deal'
  onCommentAdded?: (comment: Comment) => void
  onCommentUpdated?: (comment: Comment) => void
  onCommentDeleted?: (commentId: string) => void
}

export function CommentSystem({ 
  entityId, 
  entityType, 
  onCommentAdded, 
  onCommentUpdated, 
  onCommentDeleted 
}: CommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [loading, setLoading] = useState(true)
  const { addNotification } = useNotifications()

  useEffect(() => {
    fetchComments()
    fetchUsers()
  }, [entityId])

  const fetchComments = async () => {
    try {
      // This would be replaced with actual API call
      const mockComments: Comment[] = [
        {
          id: '1',
          content: 'Great progress on this task! @john.doe can you review the design?',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          author: {
            id: '1',
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          mentions: [
            {
              id: '2',
              name: 'John Doe',
              email: 'john@example.com'
            }
          ]
        },
        {
          id: '2',
          content: 'I\'ll take a look at it this afternoon.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
          author: {
            id: '2',
            name: 'John Doe',
            email: 'john@example.com'
          }
        }
      ]
      setComments(mockComments)
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/basic')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleCommentChange = (value: string) => {
    setNewComment(value)
    
    // Check for @ mentions
    const cursorPos = textareaRef.current?.selectionStart || 0
    setCursorPosition(cursorPos)
    
    const textBeforeCursor = value.substring(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1])
      setShowMentions(true)
    } else {
      setShowMentions(false)
    }
  }

  const handleMentionSelect = (user: User) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition)
    const textAfterCursor = newComment.substring(cursorPosition)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    
    if (mentionMatch) {
      const beforeMention = textBeforeCursor.substring(0, mentionMatch.index)
      const newText = `${beforeMention}@${user.name} ${textAfterCursor}`
      setNewComment(newText)
      setShowMentions(false)
      
      // Set cursor position after the mention
      setTimeout(() => {
        const newCursorPos = beforeMention.length + user.name.length + 2
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    try {
      // Extract mentions from comment
      const mentionMatches = newComment.match(/@(\w+)/g)
      const mentionedUsers = mentionMatches?.map(mention => {
        const username = mention.substring(1)
        return users.find(user => user.name.toLowerCase() === username.toLowerCase())
      }).filter(Boolean) as User[]

      const comment: Comment = {
        id: Date.now().toString(),
        content: newComment,
        createdAt: new Date().toISOString(),
        author: {
          id: 'current-user',
          name: 'Current User',
          email: 'current@example.com'
        },
        mentions: mentionedUsers
      }

      setComments(prev => [comment, ...prev])
      setNewComment('')
      setShowMentions(false)
      
      // Send notifications to mentioned users
      mentionedUsers.forEach(mentionedUser => {
        addNotification({
          title: 'You were mentioned',
          message: `You were mentioned in a comment on ${entityType}`,
          type: 'warning',
          actionUrl: `/${entityType}s?${entityType}=${entityId}`,
          actionText: 'View Comment',
          entityType: 'mention',
          entityId: entityId,
          fromUser: {
            id: 'current-user',
            name: 'Current User',
            email: 'current@example.com'
          }
        })
      })
      
      onCommentAdded?.(comment)
    } catch (error) {
      console.error('Error submitting comment:', error)
    }
  }

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const updatedComment: Comment = {
        ...comments.find(c => c.id === commentId)!,
        content: editContent,
        updatedAt: new Date().toISOString()
      }

      setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c))
      setEditingComment(null)
      setEditContent('')
      
      onCommentUpdated?.(updatedComment)
    } catch (error) {
      console.error('Error updating comment:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      setComments(prev => prev.filter(c => c.id !== commentId))
      onCommentDeleted?.(commentId)
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const renderCommentContent = (content: string, mentions?: User[]) => {
    if (!mentions || mentions.length === 0) {
      return content
    }

    let processedContent = content
    mentions.forEach(mention => {
      const mentionRegex = new RegExp(`@${mention.name}`, 'g')
      processedContent = processedContent.replace(
        mentionRegex, 
        `<span class="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-medium">@${mention.name}</span>`
      )
    })

    return processedContent
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="animate-pulse">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => handleCommentChange(e.target.value)}
                placeholder={`Add a comment... (use @ to mention someone)`}
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    handleSubmitComment()
                  }
                }}
              />
              
              {/* Mentions Dropdown */}
              {showMentions && (
                <div className="absolute bottom-full left-0 mb-2 w-full max-w-xs bg-white border rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <div className="text-xs text-muted-foreground mb-2">Mention someone:</div>
                    {filteredUsers.slice(0, 5).map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleMentionSelect(user)}
                        className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded text-left"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <AtSign className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Comment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {comment.author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{comment.author.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                    {comment.updatedAt && (
                      <span className="text-xs text-muted-foreground">(edited)</span>
                    )}
                  </div>
                  
                  {editingComment === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[60px]"
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdateComment(comment.id)}
                        >
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingComment(null)
                            setEditContent('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p 
                        className="text-sm text-gray-900 mb-2"
                        dangerouslySetInnerHTML={{ 
                          __html: renderCommentContent(comment.content, comment.mentions) 
                        }}
                      />
                      
                      {comment.mentions && comment.mentions.length > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-xs text-muted-foreground">Mentioned:</span>
                          {comment.mentions.map((mention) => (
                            <Badge key={mention.id} variant="outline" className="text-xs">
                              @{mention.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditComment(comment)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
