<template>
  <div class="min-h-screen min-h-dvh bg-slate-50 flex flex-col items-center justify-center px-5 py-10">
    <div class="w-full max-w-md rounded-[28px] bg-white p-7 shadow-[0_8px_40px_rgba(15,23,42,0.10)] border border-slate-100">

      <!-- Header -->
      <header class="mb-7 flex flex-col items-center text-center">
        <div class="mb-4 flex h-[60px] w-[60px] items-center justify-center bg-white shadow-sm border border-slate-100 p-2 overflow-hidden rounded-2xl">
          <img src="/img/logo dwi damar tirta.webp" alt="Logo DDT" class="h-full w-full object-contain" />
        </div>
        <h1 class="text-xl font-bold tracking-tight text-slate-900">Registrasi Karyawan</h1>
        <p class="mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em]">PT. Dwi Damar Tirta</p>
      </header>

      <!-- Stepper -->
      <div class="flex items-center justify-center mb-8 gap-1">
        <template v-for="step in 3" :key="step">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300"
            :class="currentStep >= step
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
              : 'bg-slate-100 text-slate-400'"
          >{{ step }}</div>
          <div
            v-if="step < 3"
            class="w-8 h-0.5 rounded-full transition-all duration-300"
            :class="currentStep > step ? 'bg-blue-600' : 'bg-slate-100'"
          ></div>
        </template>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-5">

        <!-- STEP 1 -->
        <div v-if="currentStep === 1" class="space-y-4 step-slide">
          <p class="section-label flex items-center gap-1.5 mb-3">
            <span class="inline-block w-1 h-4 bg-blue-600 rounded-full"></span>
            Step 1: Akun Sistem
          </p>

          <div>
            <label class="label">Nama Lengkap</label>
            <input v-model="form.name" type="text" required placeholder="Budi Santoso" class="input-base" />
          </div>
          <div>
            <label class="label">Email</label>
            <input v-model="form.email" type="email" required placeholder="nama@perusahaan.com" class="input-base" />
          </div>
          <div>
            <label class="label">Kata Sandi</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="Minimal 8 karakter"
                class="input-base pr-12"
              />
              <button type="button" @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors">
                <Eye v-if="!showPassword" :size="17" />
                <EyeOff v-else :size="17" />
              </button>
            </div>
          </div>
          <div>
            <label class="label">Konfirmasi Kata Sandi</label>
            <div class="relative">
              <input
                v-model="form.password_confirmation"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                placeholder="Ulangi kata sandi"
                class="input-base pr-12"
              />
              <button type="button" @click="showConfirmPassword = !showConfirmPassword"
                class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors">
                <Eye v-if="!showConfirmPassword" :size="17" />
                <EyeOff v-else :size="17" />
              </button>
            </div>
          </div>
        </div>

        <!-- STEP 2 -->
        <div v-if="currentStep === 2" class="space-y-4 step-slide">
          <p class="section-label flex items-center gap-1.5 mb-3">
            <span class="inline-block w-1 h-4 bg-blue-600 rounded-full"></span>
            Step 2: Data Pribadi
          </p>

          <div>
            <label class="label">NIK Karyawan</label>
            <input v-model="form.nik_karyawan" type="text" required placeholder="NIK di sistem kantor" class="input-base" />
          </div>
          <div>
            <label class="label">Jabatan</label>
            <select v-model="form.position_id" required class="input-base appearance-none">
              <option value="" disabled>Pilih Jabatan</option>
              <option v-for="p in positions" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">Nomor KTP (NIK)</label>
            <input v-model="form.identity_number" type="text" required placeholder="16 Digit NIK KTP" class="input-base" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Tempat Lahir</label>
              <input v-model="form.place_of_birth" type="text" placeholder="Jakarta" class="input-base" />
            </div>
            <div>
              <label class="label">Tanggal Lahir</label>
              <input v-model="form.date_of_birth" type="date" class="input-base" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Jenis Kelamin</label>
              <select v-model="form.gender" required class="input-base appearance-none">
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div>
              <label class="label">Status Nikah</label>
              <select v-model="form.marital_status" class="input-base appearance-none">
                <option value="Lajang">Lajang</option>
                <option value="Menikah">Menikah</option>
                <option value="Cerai">Cerai</option>
              </select>
            </div>
          </div>
          <div>
            <label class="label">No. WhatsApp</label>
            <input v-model="form.phone_number" type="tel" placeholder="0812..." class="input-base" />
          </div>
          <div>
            <label class="label">Alamat Domisili</label>
            <textarea v-model="form.address" rows="3" placeholder="Alamat lengkap tempat tinggal..." class="input-base resize-none"></textarea>
          </div>
        </div>

        <!-- STEP 3 -->
        <div v-if="currentStep === 3" class="space-y-4 step-slide">
          <p class="section-label flex items-center gap-1.5 mb-3">
            <span class="inline-block w-1 h-4 bg-blue-600 rounded-full"></span>
            Step 3: Keuangan & Darurat
          </p>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Nama Bank</label>
              <input v-model="form.bank_name" type="text" placeholder="BCA / Mandiri" class="input-base" />
            </div>
            <div>
              <label class="label">No. Rekening</label>
              <input v-model="form.bank_account_number" type="text" placeholder="No. rekening" class="input-base" />
            </div>
          </div>
          <div>
            <label class="label">Nama Kontak Darurat</label>
            <input v-model="form.emergency_contact_name" type="text" placeholder="Nama keluarga / kerabat" class="input-base" />
          </div>
          <div>
            <label class="label">No. Telp Darurat</label>
            <input v-model="form.emergency_contact_phone" type="tel" placeholder="Nomor darurat" class="input-base" />
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex gap-3 pt-2">
          <button
            v-if="currentStep > 1"
            type="button"
            @click="currentStep--"
            class="btn-secondary flex-1"
          >
            Kembali
          </button>

          <button
            v-if="currentStep < 3"
            type="button"
            @click="nextStep"
            class="btn-primary"
            style="flex: 2"
          >
            Lanjut <ChevronRight :size="16" />
          </button>

          <button
            v-if="currentStep === 3"
            type="submit"
            :disabled="isLoading"
            class="btn-primary"
            style="flex: 2"
          >
            <div v-if="isLoading" class="spinner"></div>
            <template v-else>
              Daftar Sekarang <ChevronRight :size="16" />
            </template>
          </button>
        </div>
      </form>

      <div class="mt-7 text-center">
        <p class="text-xs text-slate-500">
          Sudah punya akun?
          <RouterLink to="/login" class="font-bold text-blue-600 hover:text-blue-700 transition-colors">Masuk di sini</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight, Eye, EyeOff } from 'lucide-vue-next'
import api from '../api/axios'
import { useToast } from '../composables/useToast'

const router = useRouter()
const { showToast } = useToast()

const isLoading = ref(false)
const currentStep = ref(1)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const positions = ref<{id: number, name: string}[]>([])

const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  nik_karyawan: '',
  position_id: '',
  phone_number: '',
  address: '',
  identity_number: '',
  place_of_birth: '',
  date_of_birth: '',
  gender: 'Laki-laki',
  marital_status: 'Lajang',
  bank_name: '',
  bank_account_number: '',
  emergency_contact_name: '',
  emergency_contact_phone: ''
})

onMounted(async () => {
  try {
    const res = await api.get('/auth/register-data')
    if (res.data.success) {
      positions.value = res.data.data.positions
    }
  } catch (err) {
    console.error('Gagal mengambil data registrasi', err)
  }
})

const nextStep = () => {
  if (currentStep.value === 1) {
    if (!form.value.name || !form.value.email || !form.value.password || !form.value.password_confirmation) {
      showToast('Lengkapi semua data akun.', 'error')
      return
    }
    if (form.value.password !== form.value.password_confirmation) {
      showToast('Konfirmasi kata sandi tidak cocok.', 'error')
      return
    }
  }
  if (currentStep.value === 2) {
    if (!form.value.nik_karyawan || !form.value.position_id || !form.value.identity_number) {
      showToast('Lengkapi data NIK dan Jabatan.', 'error')
      return
    }
  }
  currentStep.value++
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleRegister = async () => {
  if (isLoading.value) return
  isLoading.value = true
  try {
    const res = await api.post('/auth/register', form.value)
    if (res.data.success) {
      showToast('Registrasi berhasil! Silakan login.', 'success')
      router.push('/login')
    }
  } catch (err: any) {
    let msg = 'Registrasi gagal. Periksa kembali data Anda.'
    if (err.response?.data?.errors) {
      const firstKey = Object.keys(err.response.data.errors)[0]
      msg = err.response.data.errors[firstKey][0]
    } else {
      msg = err.response?.data?.message || msg
    }
    showToast(msg, 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.step-slide {
  animation: stepIn 0.3s ease both;
}
@keyframes stepIn {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0); }
}
</style>
