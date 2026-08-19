<template>
  <Transition name="loading-fade">
    <div
      v-if="loadingStore.isLoading"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm select-none transition-all duration-200"
      aria-modal="true"
      role="dialog"
    >
      <!-- Main Loading Card - Matches App Design System -->
      <div
        class="relative w-full max-w-xs overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-900 text-center transform transition-all"
      >
        <!-- Top Accent Bar in App Brand Color (#2563eb) -->
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-blue-600"></div>

        <div class="flex flex-col items-center pt-2">
          <!-- Simple Clean Spinner -->
          <div class="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <Loader2 v-if="loadingStore.queuedRequestsCount === 0" class="h-7 w-7 animate-spin text-blue-600" />
            <Clock v-else class="h-7 w-7 animate-pulse text-amber-600" />
          </div>

          <!-- Queue Counter Badge (Shown only during queueing) -->
          <div
            v-if="loadingStore.queuedRequestsCount > 0"
            class="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-0.5 text-xs font-semibold text-amber-700"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
            <span>Antrean ke-{{ loadingStore.queuedRequestsCount }}</span>
          </div>

          <!-- Simple & Clear Title -->
          <h3 class="text-base font-bold text-slate-900 tracking-tight">
            {{ loadingStore.currentTitle }}
          </h3>

          <!-- Simple Subtext -->
          <p class="mt-1 text-xs text-slate-500 leading-relaxed max-w-[220px]">
            {{ loadingStore.currentSubtext }}
          </p>

          <!-- Progress Bar (Optional) -->
          <div
            v-if="loadingStore.progressPercent !== null"
            class="mt-3.5 w-full"
          >
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full bg-blue-600 transition-all duration-300 rounded-full"
                :style="{ width: `${loadingStore.progressPercent}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useLoadingStore } from '../stores/loadingStore'
import { Loader2, Clock } from 'lucide-vue-next'

const loadingStore = useLoadingStore()
</script>

<style scoped>
.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
