<template>
  <Transition name="slide-up">
    <div 
      v-if="isVisible" 
      class="fixed inset-x-4 bottom-6 z-[999] mx-auto max-w-md overflow-hidden rounded-[28px] border border-white bg-white/80 p-5 shadow-2xl shadow-slate-350/50 backdrop-blur-xl transition-all duration-300"
    >
      <!-- Glassmorphic Glowing Orbs behind the card for visual wow-factor -->
      <div class="absolute -right-10 -top-10 -z-10 h-24 w-24 rounded-full bg-blue-500/10 blur-xl"></div>
      <div class="absolute -bottom-10 -left-10 -z-10 h-24 w-24 rounded-full bg-indigo-500/10 blur-xl"></div>

      <!-- Close Button -->
      <button 
        @click="dismissPrompt" 
        class="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-90 transition-all"
      >
        <X :size="14" />
      </button>

      <div class="flex items-start gap-4">
        <!-- Logo Icon with Premium Shadow -->
        <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-md">
          <img src="/img/logo dwi damar tirta.webp" alt="DDT Logo" class="h-10 w-10 object-contain rounded-lg" />
        </div>

        <div class="flex-1 pr-6">
          <p class="text-[10px] font-black uppercase tracking-widest text-blue-600">Aplikasi Lebih Praktis</p>
          <h3 class="mt-0.5 text-base font-black tracking-tight text-slate-900 leading-tight">Install Aplikasi DDT</h3>
          <p class="mt-1.5 text-[11px] font-medium leading-relaxed text-slate-500">
            Dapatkan performa super cepat, akses offline, dan hemat kuota dengan menambahkan aplikasi ke layar utama Anda.
          </p>
        </div>
      </div>

      <!-- Platform-Specific Layouts -->
      <div class="mt-5 border-t border-slate-100/80 pt-4">
        <!-- Android / Chrome Desktop standard install -->
        <div v-if="platform === 'android'" class="flex items-center gap-3">
          <button 
            @click="dismissPrompt" 
            class="flex-1 rounded-xl bg-slate-100 py-3 text-center text-xs font-black text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
          >
            Nanti Saja
          </button>
          <button 
            @click="installPwa" 
            class="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-3 text-center text-xs font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Download :size="14" />
            Install Sekarang
          </button>
        </div>

        <!-- iOS Safari step-by-step helper guide -->
        <div v-else-if="platform === 'ios'" class="space-y-3.5">
          <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">PANDUAN PEMASANGAN iOS:</p>
          
          <div class="space-y-2.5">
            <div class="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
                1
              </div>
              <p class="text-[11px] font-medium text-slate-600 leading-tight">
                Tekan tombol <span class="inline-block p-1 bg-white border border-slate-200 rounded text-slate-700"><ShareIcon class="inline-block" :size="12" /> Bagikan (Share)</span> di bagian bawah Safari.
              </p>
            </div>

            <div class="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
                2
              </div>
              <p class="text-[11px] font-medium text-slate-600 leading-tight">
                Gulir ke bawah dan pilih menu <span class="font-bold text-slate-800">"Tambahkan ke Layar Utama"</span> (Add to Home Screen).
              </p>
            </div>
          </div>

          <button 
            @click="dismissPrompt" 
            class="w-full rounded-xl bg-slate-100 py-3 text-center text-xs font-black text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { X, Download, Share2 as ShareIcon } from 'lucide-vue-next'

const isVisible = ref(false)
const platform = ref<'android' | 'ios' | 'other'>('other')
let deferredPrompt: any = null

onMounted(() => {
  // Check if already in standalone (installed) mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;

  if (isStandalone) {
    console.log('[PWA] App is already running in standalone mode.');
    return;
  }

  // Check state persistence: Don't show if dismissed within last 7 days
  const dismissedTime = localStorage.getItem('pwa_prompt_dismissed_at');
  if (dismissedTime) {
    const elapsed = Date.now() - Number(dismissedTime);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (elapsed < sevenDays) {
      console.log('[PWA] Prompt is snoozed.');
      return;
    }
  }

  detectPlatform()

  // 1. Android/Chrome check: listen for global beforeinstallprompt
  if ((window as any).deferredPrompt) {
    deferredPrompt = (window as any).deferredPrompt;
    isVisible.value = true;
  }

  window.addEventListener('pwa-installable', handleInstallableEvent);
  
  // 2. iOS check: Safari doesn't trigger beforeinstallprompt, but we can show manual instructions
  if (platform.value === 'ios') {
    isVisible.value = true;
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('pwa-installable', handleInstallableEvent);
})

const detectPlatform = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/crios|fxios|opr|mercury/.test(userAgent);
  
  if (isIos && isSafari) {
    platform.value = 'ios';
  } else if (/android|chrome|crios/.test(userAgent)) {
    platform.value = 'android';
  } else {
    platform.value = 'other';
  }
}

const handleInstallableEvent = () => {
  deferredPrompt = (window as any).deferredPrompt;
  if (deferredPrompt && platform.value === 'android') {
    isVisible.value = true;
  }
}

const installPwa = async () => {
  if (!deferredPrompt) return;
  
  // Show prompt
  deferredPrompt.prompt();
  
  // Wait for user choices
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`[PWA] Install prompt outcome: ${outcome}`);
  
  // Reset deferred prompt
  deferredPrompt = null;
  (window as any).deferredPrompt = null;
  isVisible.value = false;
}

const dismissPrompt = () => {
  isVisible.value = false;
  // Snooze the prompt for 7 days
  localStorage.setItem('pwa_prompt_dismissed_at', String(Date.now()));
}
</script>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(40px) scale(0.95);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.97);
}
</style>
