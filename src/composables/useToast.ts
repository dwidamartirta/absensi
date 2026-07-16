// src/composables/useToast.ts
import { ref } from 'vue'

// State ditaruh di luar fungsi agar bersifat GLOBAL (bisa diakses antar halaman)
const isVisible = ref(false)
const message = ref('')
const type = ref<'success' | 'error' | 'info'>('success')
let timeout: number | null = null

export function useToast() {
  const showToast = (msg: string, toastType: 'success' | 'error' | 'info' = 'success') => {
    message.value = msg
    type.value = toastType
    isVisible.value = true

    // Reset timer jika ada pesan baru yang muncul sebelum yang lama hilang
    if (timeout) clearTimeout(timeout)
    
    // Hilangkan otomatis setelah 3 detik
    timeout = window.setTimeout(() => {
      isVisible.value = false
    }, 3000)
  }

  const hideToast = () => {
    isVisible.value = false
  }

  return { isVisible, message, type, showToast, hideToast }
}