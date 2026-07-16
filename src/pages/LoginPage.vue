<template>
  <div class="flex min-h-screen min-h-dvh w-full max-w-md mx-auto flex-col items-center justify-center bg-slate-50 px-5 py-10">

    <div class="w-full rounded-[28px] bg-white p-7 shadow-[0_8px_40px_rgba(15,23,42,0.10)] border border-slate-100">

      <!-- Header -->
      <header class="mb-8 flex flex-col items-center text-center">
        <div class="mb-5 flex h-[72px] w-[72px] items-center justify-center bg-white shadow-md border border-slate-100 p-2 overflow-hidden rounded-2xl">
          <img src="/img/logo dwi damar tirta.webp" alt="Logo DDT" class="h-full w-full object-contain" />
        </div>
        <h1 class="text-[22px] font-bold tracking-tight text-slate-900">Selamat Datang</h1>
        <p class="mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em]">PT. Dwi Damar Tirta</p>
      </header>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">

        <!-- Email -->
        <div>
          <label class="label">Email Karyawan</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
              <Mail :size="17" />
            </div>
            <input
              v-model="email"
              type="email"
              placeholder="nama@perusahaan.com"
              autocomplete="email"
              class="input-base !pl-11"
            />
          </div>
        </div>

        <!-- Password -->
        <div>
          <div class="flex items-center justify-between mb-1.5 px-1">
            <label class="label mb-0">Kata Sandi</label>
            <RouterLink to="/lupa-sandi" class="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Lupa Sandi?
            </RouterLink>
          </div>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
              <Lock :size="17" />
            </div>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Kata sandi Anda"
              autocomplete="current-password"
              class="input-base !pl-11 !pr-12"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Eye v-if="!showPassword" :size="17" />
              <EyeOff v-else :size="17" />
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="alert alert-error">
          <AlertCircle :size="16" class="shrink-0 mt-0.5" />
          <p class="text-[12px] font-medium leading-relaxed">{{ errorMessage }}</p>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="isLoading"
          class="btn-primary mt-2"
        >
          <div v-if="isLoading" class="spinner"></div>
          <template v-else>
            <LogIn :size="17" />
            Masuk ke Sistem
          </template>
        </button>
      </form>

      <!-- Register Link -->
      <div class="mt-7 text-center">
        <p class="text-xs text-slate-500">
          Belum punya akun?
          <RouterLink to="/register" class="font-bold text-blue-600 hover:text-blue-700 transition-colors">
            Daftar Akun Baru
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-vue-next'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

onMounted(() => {
  if (authStore.isLoggedIn) {
    router.replace('/absensi')
  }
})

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

const handleLogin = async () => {
  if (isLoading.value) return

  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Email dan kata sandi wajib diisi.'
    return
  }

  isLoading.value = true

  try {
    await authStore.login({ email: email.value, password: password.value })
    showToast('Login berhasil! Selamat datang.', 'success')
    await router.replace('/absensi')
  } catch (err: any) {
    let msg = 'Terjadi kesalahan sistem.'

    if (err.response) {
      const status = err.response.status
      const data = err.response.data

      if (status === 401) {
        msg = 'Email atau kata sandi salah.'
      } else if (status === 422 && data.errors) {
        const firstKey = Object.keys(data.errors)[0]
        msg = data.errors[firstKey][0]
      } else {
        msg = data.message || msg
      }
    } else if (err.request) {
      msg = 'Tidak dapat terhubung ke server. Periksa koneksi Anda.'
    }

    errorMessage.value = msg
  } finally {
    isLoading.value = false
  }
}
</script>
