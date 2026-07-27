import api from './axios'

export interface AppNotification {
  id: string
  title: string
  body: string
  type: 'attendance_in' | 'attendance_out' | 'transport_task' | 'general'
  priority: 'high' | 'medium' | 'low'
  action_url: string
  icon: string
  created_at: string
}

export interface NotificationResponse {
  success: boolean
  message: string
  unread_count: number
  data: AppNotification[]
}

/**
 * Get active user notifications & reminders
 * GET /api/v1/auth/notifications
 */
export const getNotifications = () => {
  return api.get<NotificationResponse>('/auth/notifications')
}
