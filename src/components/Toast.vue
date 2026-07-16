<template>
  <Transition name="toast">
    <div
      v-if="isVisible"
      class="fixed left-1/2 top-6 z-[999] flex w-full max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-2xl p-4 shadow-2xl sm:max-w-md"
      :class="[
        type === 'success' ? 'bg-emerald-500 text-white' : '',
        type === 'error'   ? 'bg-rose-500 text-white'    : '',
        type === 'info'    ? 'bg-blue-600 text-white'    : ''
      ]"
    >
      <div class="flex shrink-0 items-center justify-center rounded-full bg-white/20 p-1.5">
        <CheckCircle2 v-if="type === 'success'" :size="18" />
        <AlertCircle  v-else-if="type === 'error'" :size="18" />
        <Info         v-else :size="18" />
      </div>

      <p class="flex-1 text-sm font-semibold leading-snug">{{ message }}</p>

      <button @click="hideToast" class="rounded-full bg-white/15 p-1.5 transition-colors hover:bg-white/25">
        <X :size="14" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useToast } from '../composables/useToast'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'

const { isVisible, message, type, hideToast } = useToast()
</script>
