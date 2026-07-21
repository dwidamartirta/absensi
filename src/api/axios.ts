import axios from 'axios'
import { setServerTimeDrift } from '../utils/security'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-App-Secret': import.meta.env.VITE_APP_SECRET,
  },
})

// Request interceptor: tambahkan JWT token dari localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// --- Auto Token Refresh System ---
// Mencegah user harus login ulang dengan otomatis memperbarui token
// saat token expire (401). Jika refresh gagal, baru redirect ke login.

let isRefreshing = false
let failedQueue: { resolve: (val: any) => void; reject: (err: any) => void }[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

/**
 * Simpan timestamp saat token terakhir di-refresh/login.
 * Digunakan untuk scheduled silent refresh.
 */
export const markTokenRefreshed = () => {
  localStorage.setItem('auth_token_refreshed_at', String(Date.now()))
}

/**
 * Force logout — bersihkan semua data auth dan redirect ke login.
 * Hanya dipanggil jika refresh token juga gagal.
 */
const forceLogout = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  localStorage.removeItem('auth_token_refreshed_at')
  window.location.href = '/login'
}

// Response interceptor: handle 401 with auto-refresh & track time drift
api.interceptors.response.use(
  (response) => {
    // Extract Server Time to calibrate system time and prevent time tampering
    const serverDateHeader = response.headers['date']
    if (serverDateHeader) {
      const serverTime = new Date(serverDateHeader).getTime()
      const localTime = Date.now()
      const drift = localTime - serverTime
      setServerTimeDrift(drift)
    }
    return response
  },
  async (error) => {
    // Calibrate time even on errors if header exists
    const serverDateHeader = error.response?.headers['date']
    if (serverDateHeader) {
      const serverTime = new Date(serverDateHeader).getTime()
      const localTime = Date.now()
      const drift = localTime - serverTime
      setServerTimeDrift(drift)
    }

    const originalRequest = error.config

    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      const isLoginRequest = originalRequest?.url?.includes('/auth/login')
      const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh')

      // Jangan coba refresh jika ini adalah request login atau refresh itu sendiri
      if (isLoginRequest || isRefreshRequest) {
        return Promise.reject(error)
      }

      // Jika sudah dalam proses refresh, antrekan request ini
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`
          return api(originalRequest)
        }).catch((err) => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Coba refresh token
        const response = await api.post('/auth/refresh')
        const newToken = response.data.data.access_token
        const userData = response.data.data.user

        // Simpan token baru
        localStorage.setItem('auth_token', newToken)
        markTokenRefreshed()

        // Update user data jika tersedia dari refresh response
        if (userData) {
          localStorage.setItem('auth_user', JSON.stringify(userData))
        }

        // Proses antrian request yang tertunda
        processQueue(null, newToken)

        // Retry request original dengan token baru
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh gagal — token benar-benar expired / revoked
        processQueue(refreshError, null)
        forceLogout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// --- Silent Token Refresh Scheduler ---
// Secara periodik cek apakah token sudah mendekati expired, lalu refresh
// sebelum user mengalami gangguan.

const REFRESH_INTERVAL_MS = 50 * 60 * 1000  // Cek setiap 50 menit
const TOKEN_REFRESH_THRESHOLD_MS = 55 * 60 * 1000  // Refresh jika token > 55 menit

let refreshTimerId: ReturnType<typeof setInterval> | null = null

export const startSilentRefreshScheduler = () => {
  // Jangan double-start
  if (refreshTimerId) return

  refreshTimerId = setInterval(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) return // Tidak login

    const refreshedAt = localStorage.getItem('auth_token_refreshed_at')
    if (!refreshedAt) {
      // Belum ada timestamp, set sekarang
      markTokenRefreshed()
      return
    }

    const elapsed = Date.now() - Number(refreshedAt)
    
    if (elapsed >= TOKEN_REFRESH_THRESHOLD_MS) {
      try {
        const response = await api.post('/auth/refresh')
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
