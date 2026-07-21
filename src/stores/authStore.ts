import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, logout as apiLogout, getMe } from '../api/auth'
import type { AuthUser, LoginCredentials } from '../api/auth'
import { markTokenRefreshed, startSilentRefreshScheduler, stopSilentRefreshScheduler } from '../api/axios'

export const useAuthStore = defineStore('auth', () => {
  // --- STATE ---
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<AuthUser | null>(
    JSON.parse(localStorage.getItem('auth_user') || 'null')
  )

  // --- GETTERS ---
  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => user.value?.name || 'Karyawan')
  const userInitials = computed(() => {
    const name = userName.value.trim()
    if (!name) return 'K'
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  })
  const userPosition = computed(
    () => user.value?.employee?.position?.name || 'Karyawan'
  )

  // --- ACTIONS ---
  const login = async (credentials: LoginCredentials) => {
    const response = await apiLogin(credentials)
    // Backend membungkus response: { success, message, data: { access_token, user } }
    const { access_token, user: userData } = response.data.data

    // Simpan ke state
    token.value = access_token
    user.value = userData

    // Persist ke localStorage
    localStorage.setItem('auth_token', access_token)
    localStorage.setItem('auth_user', JSON.stringify(userData))

    // Catat waktu refresh dan mulai scheduler
    markTokenRefreshed()
    startSilentRefreshScheduler()
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch {
      // Tetap logout lokal meskipun API error
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_token_refreshed_at')
      stopSilentRefreshScheduler()
    }
  }

  const fetchMe = async () => {
    try {
      const response = await getMe()
      // Backend membungkus response: { success, message, data: { ... } }
      user.value = response.data.data
      localStorage.setItem('auth_user', JSON.stringify(response.data.data))
    } catch {
      // Biarkan token-nya, tidak perlu logout di sini
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    userName,
    userInitials,
    userPosition,
    login,
    logout,
    fetchMe,
  }
})
