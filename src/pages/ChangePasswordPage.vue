<template>
  <div class="min-h-screen min-h-dvh bg-slate-50 text-slate-900 pb-24">

    <!-- Header -->
    <header class="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-100 px-4 py-4">
      <div class="mx-auto flex max-w-md items-center gap-4">
        <button @click="router.back()" class="btn-back">
          <ArrowLeft :size="18" />
        </button>
        <div>
          <h1 class="text-[15px] font-black tracking-tight leading-none text-slate-900">Keamanan Akun</h1>
          <p class="text-[10px] font-bold text-slate-400 mt-1">Ganti kata sandi Anda</p>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-md px-4 pt-5">

      <!-- Tips Card -->
      <div class="alert alert-warning mb-5">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <ShieldAlert :size="18" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-amber-800">Tips Keamanan</h3>
          <p class="text-[11px] leading-relaxed mt-0.5 text-amber-700">
            Gunakan minimal 8 karakter dengan kombinasi huruf dan angka untuk keamanan maksimal.
          </p>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="card p-5 space-y-4">
          <div>
            <label class="label">Kata Sandi Saat Ini</label>
            <div class="relative">
              <input v-model="form.current_password" :type="showCurrent ? 'text' : 'password'" required
                placeholder="Masukkan kata sandi lama" class="input-base pr-12" />
              <button type="button" @click="showCurrent = !showCurrent"
                class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors">
                <Eye v-if="!showCurrent" :size="17" />
                <EyeOff v-else :size="17" />
              </button>
            </div>
          </div>

          <div class="h-px bg-slate-100"></div>

          <div>
            <label class="label">Kata Sandi Baru</label>
            <div class="relative">
              <input v-model="form.password" :type="showNew ? 'text' : 'password'" required
                placeholder="Minimal 8 karakter" class="input-base pr-12" />
              <button type="button" @click="showNew = !showNew"
                class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors">
                <Eye v-if="!showNew" :size="17" />
                <EyeOff v-else :size="17" />
              </button>
            </div>
          </div>

          <div>
            <label class="label">Konfirmasi Kata Sandi Baru</label>
            <div class="relative">
              <input v-model="form.password_confirmation" :type="showConfirm ? 'text' : 'password'" required
                placeholder="Ulangi kata sandi baru" class="input-base pr-12" />
              <button type="button" @click="showConfirm = !showConfirm"
                class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors">
                <Eye v-if="!showConfirm" :size="17" />
                <EyeOff v-else :size="17" />
              </button>
            </div>
          </div>
        </div>

        <button type="submit" :disabled="isSaving" class="btn-primary" style="background:#0f172a; box-shadow: 0 8px 24px rgba(15,23,42,0.2)">
          <div v-if="isSaving" class="spinner"></div>
          <template v-else>
            <ShieldCheck :size="17" />
            Update Kata Sandi
          </template>
        </button>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '../composables/useToast'
import { changePassword } from '../api/profile'
import { ArrowLeft, ShieldAlert, Eye, EyeOff, ShieldCheck } from 'lucide-vue-next'

const router = useRouter()
const { showToast } = useToast()

const isSaving = ref(false)
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const form = ref({ current_password: '', password: '', password_confirmation: '' })

const handleSubmit = async () => {
  if (isSaving.value) return
  if (form.value.password.length < 8) {
    showToast('Password minimal 8 karakter.', 'error')
    return
  }
  if (form.value.password !== form.value.password_confirmation) {
    showToast('Konfirmasi password tidak cocok.', 'error')
    return
  }
  isSaving.value = true
  try {
    await changePassword(form.value)
    showToast('Kata sandi berhasil diperbarui!', 'success')
    setTimeout(() => router.push('/profile'), 1200)
  } catch (error: any) {
    let msg = 'Gagal memperbarui kata sandi.'
    if (error.response?.data?.errors) {
      const firstKey = Object.keys(error.response.data.errors)[0]
      msg = error.response.data.errors[firstKey][0]
    } else {
      msg = error.response?.data?.message || msg
    }
    showToast(msg, 'error')
  } finally {
    isSaving.value = false
  }
}
</script>
