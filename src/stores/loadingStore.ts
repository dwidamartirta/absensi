import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
  // --- STATE ---
  const activeRequestsCount = ref(0)
  const queuedRequestsCount = ref(0)
  const isManualLoading = ref(false)
  
  const titleMessage = ref('Memproses Permintaan...')
  const subtextMessage = ref('Sistem sedang mengamankan data Anda. Mohon tunggu sebentar.')
  const progressPercent = ref<number | null>(null)

  // Debounce hide timer to prevent UI flicker on ultra-fast requests (< 200ms)
  let hideDebounceTimer: ReturnType<typeof setTimeout> | null = null

  // --- GETTERS ---
  const isLoading = computed(() => {
    return activeRequestsCount.value > 0 || queuedRequestsCount.value > 0 || isManualLoading.value
  })

  const currentTitle = computed(() => {
    if (queuedRequestsCount.value > 0) {
      return 'Antrean Server Padat'
    }
    return titleMessage.value
  })

  const currentSubtext = computed(() => {
    if (queuedRequestsCount.value > 0) {
      return `Ada ${queuedRequestsCount.value} proses dalam antrean. Menunggu diproses server...`
    }
    return subtextMessage.value
  })

  // --- ACTIONS ---
  const startRequest = (msg?: string, subtext?: string) => {
    if (hideDebounceTimer) {
      clearTimeout(hideDebounceTimer)
      hideDebounceTimer = null
    }

    activeRequestsCount.value++
    if (msg) titleMessage.value = msg
    if (subtext) subtextMessage.value = subtext
  }

  const finishRequest = () => {
    if (activeRequestsCount.value > 0) {
      activeRequestsCount.value--
    }

    // Reset default text when all requests finish
    if (activeRequestsCount.value === 0 && queuedRequestsCount.value === 0) {
      hideDebounceTimer = setTimeout(() => {
        titleMessage.value = 'Memproses Permintaan...'
        subtextMessage.value = 'Sistem sedang mengamankan data Anda. Mohon tunggu sebentar.'
        progressPercent.value = null
      }, 300)
    }
  }

  const setQueuedCount = (count: number) => {
    queuedRequestsCount.value = Math.max(0, count)
  }

  const setMessage = (msg: string, subtext?: string) => {
    titleMessage.value = msg
    if (subtext !== undefined) subtextMessage.value = subtext
  }

  const setProgress = (percent: number | null) => {
    progressPercent.value = percent
  }

  const showManual = (msg = 'Memproses...', subtext = 'Mohon jangan menutup aplikasi') => {
    isManualLoading.value = true
    titleMessage.value = msg
    subtextMessage.value = subtext
  }

  const hideManual = () => {
    isManualLoading.value = false
  }

  return {
    activeRequestsCount,
    queuedRequestsCount,
    isManualLoading,
    titleMessage,
    subtextMessage,
    progressPercent,
    isLoading,
    currentTitle,
    currentSubtext,
    startRequest,
    finishRequest,
    setQueuedCount,
    setMessage,
    setProgress,
    showManual,
    hideManual,
  }
})
