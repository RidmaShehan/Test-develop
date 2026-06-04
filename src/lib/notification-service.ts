import { prisma } from './prisma'
import { sendPushNotification } from './push-notification-service'

export type NotificationType = 
  | 'POST_APPROVAL_REQUEST'
  | 'POST_APPROVED' 
  | 'POST_REJECTED'
  | 'POST_FULLY_APPROVED'
  | 'SYSTEM'
  | 'REMINDER'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  postId?: string
}

/**
 * Create a notification for a user and send push notification if enabled
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  postId,
}: CreateNotificationParams) {
  try {
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        postId,
        read: false,
      },
    })

    // Send push notification asynchronously (don't block if it fails)
    sendPushNotification(userId, {
      title,
      body: message,
      url: postId ? `/posts?postId=${postId}` : '/dashboard',
      notificationId: notification.id,
      type: type.toLowerCase(),
      requireInteraction: type === 'POST_APPROVAL_REQUEST',
    }).catch((error) => {
      console.error('Error sending push notification:', error)
      // Don't throw - notification was created successfully
    })

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

/**
 * Create multiple notifications at once
 */
export async function createNotifications(notifications: CreateNotificationParams[]) {
  try {
    return await prisma.notification.createMany({
      data: notifications.map(n => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        postId: n.postId,
        read: false,
      })),
    })
  } catch (error) {
    console.error('Error creating notifications:', error)
    throw error
  }
}

export async function notifyCampaignStarted(
  coordinatorId: string,
  campaignId: string,
  campaignName: string
) {
  return createNotification({
    userId: coordinatorId,
    type: 'SYSTEM',
    title: 'Campaign started',
    message: `Your campaign "${campaignName}" is now ACTIVE.`,
  })
}

export async function notifyCampaignClosed(
  coordinatorId: string,
  campaignId: string,
  campaignName: string,
  newStatus: string
) {
  return createNotification({
    userId: coordinatorId,
    type: 'SYSTEM',
    title: 'Campaign closed',
    message: `Your campaign "${campaignName}" was marked as ${newStatus}.`,
  })
}

/**
 * Notify approver that a post needs their approval
 */
export async function notifyApprovalRequest(
  approverId: string,
  postId: string,
  postCaption: string,
  creatorName: string
) {
  return createNotification({
    userId: approverId,
    type: 'POST_APPROVAL_REQUEST',
    title: 'Post Approval Request',
    message: `${creatorName} submitted a post for your approval: "${postCaption.substring(0, 50)}${postCaption.length > 50 ? '...' : ''}"`,
    postId,
  })
}

/**
 * Notify next approver after previous approval
 */
export async function notifyNextApprover(
  approverId: string,
  postId: string,
  postCaption: string,
  previousApproverName: string
) {
  return createNotification({
    userId: approverId,
    type: 'POST_APPROVAL_REQUEST',
    title: 'Post Ready for Your Approval',
    message: `${previousApproverName} approved a post. Now it's your turn: "${postCaption.substring(0, 50)}${postCaption.length > 50 ? '...' : ''}"`,
    postId,
  })
}

/**
 * Notify creator that their post was approved
 */
export async function notifyPostApproved(
  creatorId: string,
  postId: string,
  postCaption: string,
  approverName: string
) {
  return createNotification({
    userId: creatorId,
    type: 'POST_APPROVED',
    title: 'Post Approved',
    message: `${approverName} approved your post: "${postCaption.substring(0, 50)}${postCaption.length > 50 ? '...' : ''}"`,
    postId,
  })
}

/**
 * Notify creator that their post was fully approved
 */
export async function notifyPostFullyApproved(
  creatorId: string,
  postId: string,
  postCaption: string
) {
  return createNotification({
    userId: creatorId,
    type: 'POST_FULLY_APPROVED',
    title: '🎉 Post Fully Approved!',
    message: `All approvers have approved your post: "${postCaption.substring(0, 50)}${postCaption.length > 50 ? '...' : ''}". It's ready to publish!`,
    postId,
  })
}

/**
 * Notify creator that their post was rejected
 */
export async function notifyPostRejected(
  creatorId: string,
  postId: string,
  postCaption: string,
  approverName: string,
  reason: string
) {
  return createNotification({
    userId: creatorId,
    type: 'POST_REJECTED',
    title: 'Post Rejected',
    message: `${approverName} rejected your post: "${postCaption.substring(0, 30)}...". Reason: ${reason}`,
    postId,
  })
}

/**
 * Notify user that a rejected post was assigned to them to revise and resubmit
 */
export async function notifyPostRejectedAssignedToYou(
  assignedToUserId: string,
  postId: string,
  postCaption: string,
  approverName: string,
  reason: string
) {
  return createNotification({
    userId: assignedToUserId,
    type: 'POST_REJECTED',
    title: 'Post assigned to you to revise',
    message: `${approverName} rejected a post and assigned it to you. Reason: ${reason}. Open the Rejected tab to resubmit.`,
    postId,
  })
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  })
}

/**
 * Delete old read notifications (cleanup)
 */
export async function deleteOldNotifications(daysOld: number = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  return prisma.notification.deleteMany({
    where: {
      read: true,
      createdAt: {
        lt: cutoffDate,
      },
    },
  })
}

