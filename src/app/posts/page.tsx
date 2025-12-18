'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NewPostDialog } from '@/components/posts/new-post-dialog'
import { ApprovalDialog } from '@/components/posts/approval-dialog'
import { Plus, CheckCircle, XCircle, Clock, Eye, MessageSquare, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Post {
  id: string
  caption: string
  imageUrl: string | null
  budget: number | null
  startDate: string
  endDate: string
  status: string
  createdAt: string
  program?: { id: string; name: string; campus: string }
  campaign?: { id: string; name: string; type: string }
  createdBy: { id: string; name: string; email: string }
  approvals?: Array<{
    id: string
    order: number
    status: string
    comment: string | null
    approvedAt: string | null
    approver: { id: string; name: string; email: string }
  }>
  comments?: Array<{
    id: string
    comment: string
    createdAt: string
    user: { id: string; name: string }
  }>
}

export default function PostsPage() {
  const { user, loading: authLoading } = useAuth()
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [pendingPosts, setPendingPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean
    type: 'approve' | 'reject'
    postId: string | null
    loading: boolean
  }>({
    open: false,
    type: 'approve',
    postId: null,
    loading: false,
  })

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch('/api/posts/pending')
      if (response.ok) {
        const data = await response.json()
        setPendingPosts(data.posts)
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error)
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      fetchPosts()
      fetchPendingApprovals()
    }
  }, [authLoading, user])

  const openApprovalDialog = (postId: string, type: 'approve' | 'reject') => {
    setApprovalDialog({
      open: true,
      type,
      postId,
      loading: false,
    })
  }

  const handleApprovalConfirm = async (comment: string) => {
    if (!approvalDialog.postId) return

    setApprovalDialog((prev) => ({ ...prev, loading: true }))

    try {
      const endpoint =
        approvalDialog.type === 'approve'
          ? `/api/posts/${approvalDialog.postId}/approve`
          : `/api/posts/${approvalDialog.postId}/reject`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      })

      if (response.ok) {
        toast.success(
          approvalDialog.type === 'approve'
            ? 'Post approved successfully'
            : 'Post rejected'
        )
        fetchPosts()
        fetchPendingApprovals()
        setApprovalDialog({ open: false, type: 'approve', postId: null, loading: false })
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to ${approvalDialog.type} post`)
        setApprovalDialog((prev) => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error(`Error ${approvalDialog.type}ing post:`, error)
      toast.error(`Failed to ${approvalDialog.type} post`)
      setApprovalDialog((prev) => ({ ...prev, loading: false }))
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      DRAFT: { variant: 'secondary', label: 'Draft', icon: null },
      PENDING_APPROVAL: { variant: 'warning', label: 'Pending Approval', icon: Clock },
      APPROVED: { variant: 'success', label: 'Approved', icon: CheckCircle },
      REJECTED: { variant: 'destructive', label: 'Rejected', icon: XCircle },
      PUBLISHED: { variant: 'info', label: 'Published', icon: Eye },
      SCHEDULED: { variant: 'default', label: 'Scheduled', icon: Calendar },
    }

    const config = variants[status] || variants.DRAFT
    const Icon = config.icon

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {config.label}
      </Badge>
    )
  }

  const renderPost = (post: Post, showApprovalActions = false) => (
    <Card key={post.id} className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row gap-4 p-6">
          {/* Image */}
          {post.imageUrl && (
            <div className="w-full md:w-48 h-48 flex-shrink-0">
              <img
                src={post.imageUrl}
                alt="Post image"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  By {post.createdBy.name} • {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                </p>
                {post.program && (
                  <p className="text-xs text-muted-foreground">
                    Program: {post.program.name} - {post.program.campus}
                  </p>
                )}
                {post.campaign && (
                  <p className="text-xs text-muted-foreground">
                    Campaign: {post.campaign.name}
                  </p>
                )}
              </div>
              {getStatusBadge(post.status)}
            </div>

            {/* Caption */}
            <p className="text-sm line-clamp-3">{post.caption}</p>

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {post.budget && (
                <span>Budget: ${post.budget.toLocaleString()}</span>
              )}
              <span>
                Duration: {format(new Date(post.startDate), 'MMM dd')} - {format(new Date(post.endDate), 'MMM dd, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {post.comments?.length || 0}
              </span>
            </div>

            {/* Approval Chain */}
            {post.approvals && post.approvals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Approval Chain:</p>
                <div className="space-y-2">
                  {post.approvals.sort((a, b) => a.order - b.order).map((approval) => (
                    <div key={approval.id} className="space-y-1">
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs ${
                          approval.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : approval.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <span className="font-bold">{approval.order}</span>
                        <span>{approval.approver.name}</span>
                        {approval.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                        {approval.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                        {approval.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {approval.approvedAt && (
                          <span className="text-xs opacity-75 ml-auto">
                            {format(new Date(approval.approvedAt), 'MMM dd, HH:mm')}
                          </span>
                        )}
                      </div>
                      {approval.comment && (
                        <div className="ml-4 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-muted-foreground italic">
                            "{approval.comment}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approval Actions */}
            {showApprovalActions && (
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => openApprovalDialog(post.id, 'approve')}
                  size="sm"
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => openApprovalDialog(post.id, 'reject')}
                  size="sm"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Handle loading and auth states
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="mt-2 text-gray-600">Please sign in to access social media posts.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Professional Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Social Media Posts</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage social media posts with approval workflow
            </p>
          </div>
          <Button onClick={() => setShowNewDialog(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending My Approval ({pendingPosts.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({posts.filter(p => p.status === 'APPROVED').length})
          </TabsTrigger>
        </TabsList>

          {/* All Posts */}
          <TabsContent value="all" className="space-y-4">
          {loading ? (
            <p className="text-center py-8">Loading posts...</p>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No posts yet</p>
                <Button onClick={() => setShowNewDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => renderPost(post))
          )}
        </TabsContent>

          {/* Pending Approvals */}
          <TabsContent value="pending" className="space-y-4">
          {pendingPosts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No posts pending your approval</p>
              </CardContent>
            </Card>
          ) : (
            pendingPosts.map((post) => renderPost(post, true))
          )}
        </TabsContent>

          {/* Approved Posts */}
          <TabsContent value="approved" className="space-y-4">
          {posts?.filter(p => p.status === 'APPROVED').length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No approved posts yet</p>
              </CardContent>
            </Card>
          ) : (
            posts?.filter(p => p.status === 'APPROVED').map((post) => renderPost(post))
          )}
        </TabsContent>
        </Tabs>

        {/* New Post Dialog */}
        <NewPostDialog
          open={showNewDialog}
          onOpenChange={setShowNewDialog}
          onPostCreated={() => {
            fetchPosts()
            fetchPendingApprovals()
          }}
        />

        {/* Approval Dialog */}
        <ApprovalDialog
          open={approvalDialog.open}
          onOpenChange={(open) =>
            setApprovalDialog((prev) => ({ ...prev, open }))
          }
          type={approvalDialog.type}
          onConfirm={handleApprovalConfirm}
          loading={approvalDialog.loading}
        />
      </div>
    </DashboardLayout>
  )
}

