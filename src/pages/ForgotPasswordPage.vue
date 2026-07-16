<template>
  <div class="flex min-h-screen min-h-dvh w-full max-w-md mx-auto flex-col bg-white px-6 pb-10 pt-12 text-slate-900 relative">

    <button @click="router.push('/login')"
      class="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">
      <ArrowLeft :size="20" />
    </button>

    <header class="mb-8 mt-10 flex flex-col items-center text-center">
      <div class="mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] bg-blue-50 text-blue-600 border border-blue-100">
        <KeyRound :size="32" stroke-width="2" />
      </div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Lupa Sandi?</h1>
      <p class="mt-2 text-sm text-slate-500 leading-relaxed px-4 max-w-xs">
        Masukkan NIK atau alamat Email terdaftar. Kami akan mengirimkan instruksi reset kata sandi Anda.
      </p>
    </header>

    <form @submit.prevent="handleResetPassword" class="flex-1 space-y-5">
      <div>
        <label class="label">Email / NIK</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
            <Mail :size="17" />
          </div>
          <input
            v-model="accountInput"
            type="text"
            placeholder="123456 atau email@perusahaan.com"
            required
            class="input-base !pl-11"
          />
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="alert alert-error">
        <AlertCircle :size="16" class="shrink-0 mt-0.5" />
        <p class="text-[12px] font-medium leading-relaxed">{{ errorMessage }}</p>
      </div>

      <button
        type="submit"
        :disabled="isLoading || !accountInput"
        class="btn-primary mt-2"
      >
        <div v-if="isLoading" class="spinner"></div>
        <span v-else>Kirim Tautan Reset</span>
      </button>
    </form>

    <footer class="mt-8 pt-6 text-center border-t border-slate-100">
      <p class="text-xs text-slate-500">
        Masih mengalami kendala?<br />
        <a href="#" class="text-blue-600 font-bold hover:underline mt-1 inline-block">Hubungi Tim HRD / IT Support</a>
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, KeyRound, Mail, AlertCircle } from 'lucide-vue-next'
import { forgotPassword } from '../api/auth'

const router = useRouter()
const isLoading = ref(false)
const accountInput = ref('')
const errorMessage = ref('')

const handleResetPassword = async () => {
  if (isLoading.value) return
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await forgotPassword(accountInput.value)
    
    router.push({
      path: '/feedback',
      query: {
        status: 'success',
        title: 'Cek Email Anda',
        message: response.data.message || `Kami telah mengirimkan instruksi pemulihan kata sandi ke email terdaftar. Silakan periksa kotak masuk atau folder spam Anda.`,
        btn: 'Kembali ke Login',
        redirect: '/login'
      }
    })
  } catch (err: any) {
    let msg = 'Gagal memproses permintaan reset kata sandi.'
    if (err.response && err.response.data) {
      msg = err.response.data.message || msg
    } else if (err.request) {
      msg = 'Tidak dapat terhubung ke server. Periksa koneksi Anda.'
    }
    errorMessage.value = msg
  } finally {
    isLoading.value = false
  }
}
</script>