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

// Response interceptor: handle 401 - token expired/invalid & track time drift
let isRedirecting = false

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
  (error) => {
    // Calibrate time even on errors if header exists
    const serverDateHeader = error.response?.headers['date']
    if (serverDateHeader) {
      const serverTime = new Date(serverDateHeader).getTime()
      const localTime = Date.now()
      const drift = localTime - serverTime
      setServerTimeDrift(drift)
    }

    // Handle 401 - Unauthorized (Token expired or invalid)
    if (error.response?.status === 401 && !isRedirecting) {
      const isLoginRequest = error.config?.url?.includes('/auth/login')
      
      // Jika BUKAN error saat login (misal token di storage sudah basi)
      if (!isLoginRequest) {
        isRedirecting = true
        
        // Bersihkan semua data auth
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        
        // Pakai window.location untuk hard reset agar state benar-benar bersih
        window.location.href = '/login'
        
        return Promise.reject(new Error('Sesi Anda telah berakhir. Silakan login kembali.'))
      }
    }

    return Promise.reject(error)
  }
)

export default api
