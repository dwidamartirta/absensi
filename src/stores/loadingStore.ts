import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
  // --- STATE ---
  const activeRequestsCount = ref(0)
  const queuedRequestsCount = ref(0)
  const isManualLoading = ref(false)
  
  const titleMessage = ref('Memproses Data')
  const subtextMessage = ref('Mohon tunggu sebentar...')
  const progressPercent = ref<number | null>(null)

  // Debounce timer to avoid UI flicker on super fast API calls
  let hideDebounceTimer: ReturnType<typeof setTimeout> | null = null

  // --- GETTERS ---
  const isLoading = computed(() => {
    return activeRequestsCount.value > 0 || queuedRequestsCount.value > 0 || isManualLoading.value
  })

  const currentTitle = computed(() => {
    if (queuedRequestsCount.value > 0) {
      return 'Antrean Server'
    }
    return titleMessage.value
  })

  const currentSubtext = computed(() => {
    if (queuedRequestsCount.value > 0) {
      return `Sedang memproses ${queuedRequestsCount.value} antrean. Mohon tidak menutup halaman.`
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

    if (activeRequestsCount.value === 0 && queuedRequestsCount.value === 0) {
      hideDebounceTimer = setTimeout(() => {
        titleMessage.value = 'Memproses Data'
        subtextMessage.value = 'Mohon tunggu sebentar...'
        progressPercent.value = null
      }, 200)
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

  const showManual = (msg = 'Memproses Data', subtext = 'Mohon tunggu sebentar...') => {
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
