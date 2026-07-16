import api from './axios'

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthUser {
  id: number
  name: string
  email: string
  employee?: {
    id: number
    nik: string
    position?: {
      name: string
    }
    department?: {
      name: string
    }
    locations?: {
      id: number
      name: string
      latitude: string | number
      longitude: string | number
      radius: number
    }[]
  }
}

// Wrapper response dari backend Laravel
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface LoginData {
  access_token: string
  token_type: string
  expires_in: number
  user: AuthUser
}

/**
 * Login dan dapatkan JWT token
 * POST /api/v1/auth/login
 * Response: { success, message, data: { access_token, token_type, expires_in, user } }
 */
export const login = (credentials: LoginCredentials) => {
  return api.post<ApiResponse<LoginData>>('/auth/login', credentials)
}

/**
 * Logout - batalkan token
 * POST /api/v1/auth/logout
 */
export const logout = () => {
  return api.post('/auth/logout')
}

/**
 * Dapatkan data user yang sedang login
 * POST /api/v1/auth/me
 * Response: { success, message, data: { ...user } }
 */
export const getMe = () => {
  return api.post<ApiResponse<AuthUser>>('/auth/me')
}

/**
 * Refresh JWT token
 * POST /api/v1/auth/refresh
 * Response: { success, message, data: { access_token, ... } }
 */
export const refreshToken = () => {
  return api.post<ApiResponse<LoginData>>('/auth/refresh')
}

/**
 * Lupa Kata Sandi
 * POST /api/v1/auth/forgot-password
 * Request: { email_or_nik: string }
 * Response: { success, message }
 */
export const forgotPassword = (emailOrNik: string) => {
  return api.post<ApiResponse<{ email: string }>>('/auth/forgot-password', {
    email_or_nik: emailOrNik
  })
}

