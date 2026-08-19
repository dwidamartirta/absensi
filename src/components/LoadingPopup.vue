<template>
  <Transition name="loading-fade">
    <div
      v-if="loadingStore.isLoading"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md select-none transition-all duration-300"
      aria-modal="true"
      role="dialog"
      aria-labelledby="loading-title"
    >
      <!-- Main Card Container -->
      <div
        class="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 transform scale-100 text-white"
      >
        <!-- Background Ambient Light Glow -->
        <div class="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-blue-500/20 blur-2xl"></div>
        <div class="pointer-events-none absolute -right-12 -bottom-12 h-36 w-36 rounded-full bg-emerald-500/20 blur-2xl"></div>

        <div class="relative flex flex-col items-center text-center">
          <!-- Animated Spinner Ring -->
          <div class="relative mb-5 flex h-20 w-20 items-center justify-center">
            <!-- Glowing Outer Pulse Ring -->
            <div class="absolute inset-0 animate-ping rounded-full bg-blue-500/20 duration-1000"></div>

            <!-- Rotating Gradient Border -->
            <div class="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500 border-r-emerald-400"></div>

            <!-- Inner Glow Badge -->
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/90 shadow-inner border border-white/10">
              <Loader2 v-if="loadingStore.queuedRequestsCount === 0" class="h-7 w-7 animate-spin text-blue-400" />
              <Layers v-else class="h-7 w-7 animate-bounce text-amber-400" />
            </div>
          </div>

          <!-- Queue Status Badge (Only shown when queued) -->
          <div
            v-if="loadingStore.queuedRequestsCount > 0"
            class="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 animate-pulse"
          >
            <Clock class="h-3.5 w-3.5" />
            <span>Antrean Aktif: {{ loadingStore.queuedRequestsCount }} Request</span>
          </div>

          <!-- Main Title -->
          <h3
            id="loading-title"
            class="text-lg font-bold tracking-tight text-white"
          >
            {{ loadingStore.currentTitle }}
          </h3>

          <!-- Subtext / Instructions -->
          <p class="mt-2 text-xs leading-relaxed text-slate-300">
            {{ loadingStore.currentSubtext }}
          </p>

          <!-- Dynamic Progress Bar (Optional when specified) -->
          <div
            v-if="loadingStore.progressPercent !== null"
            class="mt-4 w-full"
          >
            <div class="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
              <span>Kemajuan</span>
              <span>{{ loadingStore.progressPercent }}%</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-slate-800 border border-white/5">
              <div
                class="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300 rounded-full"
                :style="{ width: `${loadingStore.progressPercent}%` }"
              ></div>
            </div>
          </div>

          <!-- Active Requests Counter Badge -->
          <div class="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-400 border-t border-white/10 pt-4 w-full">
            <ShieldCheck class="h-3.5 w-3.5 text-emerald-400" />
            <span>Koneksi Terenkripsi & Anti-Crash Redis Queue</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useLoadingStore } from '../stores/loadingStore'
import { Loader2, Layers, Clock, ShieldCheck } from 'lucide-vue-next'

const loadingStore = useLoadingStore()
</script>

<style scoped>
.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
