import api from './axios'

export interface DailyTask {
  id: number
  title: string
  client_name: string
  date: string
  time: string
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled'
  notes: string | null
  details: {
    nopol?: string
    driver?: string
    waste_code?: string
    [key: string]: any
  }
}

export interface DailyTaskResponse {
  success: boolean
  message: string
  data: DailyTask[]
}

/**
 * Get list of daily tasks for the driver
 * GET /api/v1/auth/daily-tasks
 */
export const getDailyTasks = () => {
  return api.get<DailyTaskResponse>('/auth/daily-tasks')
}

/**
 * Get detail of a specific task
 * GET /api/v1/auth/daily-tasks/{id}
 */
export const getDailyTaskDetail = (id: number) => {
  return api.get<{ success: boolean; data: DailyTask }>(`/auth/daily-tasks/${id}`)
}

/**
 * Update task status
 * POST /api/v1/auth/daily-tasks/{id}/status
 */
export const updateTaskStatus = (id: number, status: string) => {
  return api.post(`/auth/daily-tasks/${id}/status`, { status })
}
