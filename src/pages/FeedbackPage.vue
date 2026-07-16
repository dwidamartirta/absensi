<template>
  <div class="min-h-screen min-h-dvh bg-white flex flex-col items-center justify-center px-6 w-full max-w-md mx-auto">

    <!-- Icon -->
    <div class="flex-1 flex flex-col items-center justify-center text-center py-10">
      <div class="relative flex items-center justify-center mb-8">
        <div
          class="absolute inset-0 rounded-full animate-ping opacity-15"
          :class="isSuccess ? 'bg-blue-500' : 'bg-rose-500'"
        ></div>
        <div
          class="relative z-10 flex h-28 w-28 items-center justify-center rounded-full shadow-lg"
          :class="isSuccess ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-500'"
        >
          <CheckCircle2 v-if="isSuccess" :size="56" stroke-width="2" />
          <XCircle v-else :size="56" stroke-width="2" />
        </div>
      </div>

      <h1 class="text-2xl font-bold tracking-tight text-slate-900 mb-2">
        {{ title }}
      </h1>
      <p class="text-sm text-slate-500 leading-relaxed px-4 max-w-xs">
        {{ message }}
      </p>
    </div>

    <!-- Button -->
    <div class="w-full pb-10 shrink-0">
      <button
        @click="goBack"
        class="btn-primary"
        :style="isSuccess ? '' : 'background: #f43f5e; box-shadow: 0 8px 24px rgba(244,63,94,0.25)'"
      >
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CheckCircle2, XCircle } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const isSuccess = computed(() => route.query.status === 'success')
const title = computed(() => route.query.title as string || 'Berhasil')
const message = computed(() => route.query.message as string || 'Proses telah selesai dicatat.')
const buttonText = computed(() => route.query.btn as string || 'Kembali ke Beranda')
const redirectPath = computed(() => (route.query.redirect as string) || '/absensi')

const goBack = () => router.push(redirectPath.value)
</script>