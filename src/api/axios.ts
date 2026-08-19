import axios from 'axios'
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { setServerTimeDrift } from '../utils/security'
import { useLoadingStore } from '../stores/loadingStore'

// Extended Axios Request Config interface for Queue & Loading options
export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  hideLoading?: boolean
  loadingTitle?: string
  loadingSubtext?: string
  _retry?: boolean
  _retryCount?: number
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-App-Secret': import.meta.env.VITE_APP_SECRET,
  },
})

// Safe helper to access loading store without breaking outside Vue app context
const getLoadingStore = () => {
  try {
    return useLoadingStore()
  } catch {
    return null
  }
}

// --- Client-Side Request Queue & Concurrency Control ---
const MAX_CONCURRENT_REQUESTS = 5
let activeRequestCount = 0
const requestQueue: Array<() => void> = []

const processNextInQueue = () => {
  const loadingStore = getLoadingStore()
  if (loadingStore) {
    loadingStore.setQueuedCount(requestQueue.length)
  }

  if (activeRequestCount < MAX_CONCURRENT_REQUESTS && requestQueue.length > 0) {
    const nextRequest = requestQueue.shift()
    if (nextRequest) {
      activeRequestCount++
      nextRequest()
    }
  }
}

// Request interceptor: Queue execution & JWT Header
api.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    // 1. Add Auth Header
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    // 2. Manage Loading State
    if (!config.hideLoading) {
      const loadingStore = getLoadingStore()
      if (loadingStore) {
        loadingStore.startRequest(config.loadingTitle, config.loadingSubtext)
      }
    }

    // 3. Concurrency Queue Throttle
    return new Promise((resolve) => {
      const executeRequest = () => {
        resolve(config)
      }

      if (activeRequestCount < MAX_CONCURRENT_REQUESTS) {
        activeRequestCount++
        executeRequest()
      } else {
        requestQueue.push(executeRequest)
        const loadingStore = getLoadingStore()
        if (loadingStore) {
          loadingStore.setQueuedCount(requestQueue.length)
        }
      }
    })
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Helper for cleaning up request counter
const finalizeRequestState = (config?: CustomAxiosRequestConfig) => {
  activeRequestCount = Math.max(0, activeRequestCount - 1)
  
  if (config && !config.hideLoading) {
    const loadingStore = getLoadingStore()
    if (loadingStore) {
      loadingStore.finishRequest()
    }
  }
  
  processNextInQueue()
}

// --- Auto Token Refresh System ---
let isRefreshing = false
let failedQueue: { resolve: (val: any) => void; reject: (err: any) => void }[] = []

const processTokenQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

export const markTokenRefreshed = () => {
  localStorage.setItem('auth_token_refreshed_at', String(Date.now()))
}

const forceLogout = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  localStorage.removeItem('auth_token_refreshed_at')
  window.location.href = '/login'
}

// Response interceptor: Handle 401 (Refresh), 429/503 (Queue Retry with Backoff) & Time Drift
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calibrate server date drift
    const serverDateHeader = response.headers['date']
    if (serverDateHeader) {
      const serverTime = new Date(serverDateHeader).getTime()
      const localTime = Date.now()
      setServerTimeDrift(localTime - serverTime)
    }

    finalizeRequestState(response.config as CustomAxiosRequestConfig)
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig

    // Calibrate time even on error
    if (error.response?.headers?.['date']) {
      const serverTime = new Date(error.response.headers['date']).getTime()
      const localTime = Date.now()
      setServerTimeDrift(localTime - serverTime)
    }

    // --- CASE 1: 429 Too Many Requests OR 503 Service Unavailable (Queue Retry with Backoff) ---
    const status = error.response?.status
    const isRateLimitedOrBusy = status === 429 || status === 503

    if (isRateLimitedOrBusy && originalRequest) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
      const maxRetries = 4

      if (originalRequest._retryCount <= maxRetries) {
        const loadingStore = getLoadingStore()

        // Calculate Exponential Backoff with Jitter
        // Attempt 1: ~1s, Attempt 2: ~2s, Attempt 3: ~4s, Attempt 4: ~8s
        const retryAfterHeader = error.response?.headers?.['retry-after']
        let delayMs = Math.pow(2, originalRequest._retryCount - 1) * 1000 + Math.random() * 500

        if (retryAfterHeader) {
          const parsedSeconds = parseInt(retryAfterHeader, 10)
          if (!isNaN(parsedSeconds)) {
            delayMs = parsedSeconds * 1000
          }
        }

        if (loadingStore && !originalRequest.hideLoading) {
          loadingStore.setMessage(
            'Antrean Server Sedang Padat',
            `Sistem sedang mengatur antrean (Percobaan ${originalRequest._retryCount}/${maxRetries}). Mengulang dalam ${(delayMs / 1000).toFixed(1)} detik...`
          )
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs))

        // Retry request without increasing activeRequestCount twice
        try {
          const retriedResponse = await api(originalRequest)
          return retriedResponse
        } catch (retryError) {
          return Promise.reject(retryError)
        }
      }
    }

    // --- CASE 2: 401 Unauthorized (Auto Token Refresh) ---
    if (status === 401 && originalRequest && !originalRequest._retry) {
      const isLoginRequest = originalRequest.url?.includes('/auth/login')
      const isRefreshRequest = originalRequest.url?.includes('/auth/refresh')

      if (!isLoginRequest && !isRefreshRequest) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then((token) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`
              return api(originalRequest)
            })
            .catch((err) => Promise.reject(err))
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const response = await api.post('/auth/refresh', {}, { hideLoading: true } as CustomAxiosRequestConfig)
          const newToken = response.data.data.access_token
          const userData = response.data.data.user

          localStorage.setItem('auth_token', newToken)
          markTokenRefreshed()

          if (userData) {
            localStorage.setItem('auth_user', JSON.stringify(userData))
          }

          processTokenQueue(null, newToken)
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`
          return api(originalRequest)
        } catch (refreshError) {
          processTokenQueue(refreshError, null)
          forceLogout()
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }
    }

    // Cleanup request counter for failed requests
    finalizeRequestState(originalRequest)
    return Promise.reject(error)
  }
)

// --- Silent Token Refresh Scheduler ---
const REFRESH_INTERVAL_MS = 50 * 60 * 1000
const TOKEN_REFRESH_THRESHOLD_MS = 55 * 60 * 1000

let refreshTimerId: ReturnType<typeof setInterval> | null = null

export const startSilentRefreshScheduler = () => {
  if (refreshTimerId) return

  refreshTimerId = setInterval(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) return

    const refreshedAt = localStorage.getItem('auth_token_refreshed_at')
    if (!refreshedAt) {
      markTokenRefreshed()
      return
    }

    const elapsed = Date.now() - Number(refreshedAt)
    if (elapsed >= TOKEN_REFRESH_THRESHOLD_MS) {
      try {
        const response = await api.post('/auth/refresh', {}, { hideLoading: true } as CustomAxiosRequestConfig)
        const newToken = response.data.data.access_token
        const userData = response.data.data.user

        localStorage.setItem('auth_token', newToken)
        markTokenRefreshed()

        if (userData) {
          localStorage.setItem('auth_user', JSON.stringify(userData))
        }
        console.log('[Auth] Token silently refreshed')
      } catch {
        console.warn('[Auth] Silent refresh failed — user may need to re-login on next API call')
      }
    }
  }, REFRESH_INTERVAL_MS)
}

export const stopSilentRefreshScheduler = () => {
  if (refreshTimerId) {
    clearInterval(refreshTimerId)
    refreshTimerId = null
  }
}

export default api
