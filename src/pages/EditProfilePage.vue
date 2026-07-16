<template>
  <div class="min-h-screen min-h-dvh bg-slate-50 text-slate-900 pb-24">

    <!-- Header -->
    <header class="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-100 px-4 py-4">
      <div class="mx-auto flex max-w-md items-center gap-4">
        <button @click="router.back()" class="btn-back">
          <ArrowLeft :size="18" />
        </button>
        <div>
          <h1 class="text-[15px] font-black tracking-tight leading-none text-slate-900">Edit Profil</h1>
          <p class="text-[10px] font-bold text-slate-400 mt-1">Perbarui informasi pribadi Anda</p>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-md px-4 pt-5">
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        <p class="mt-4 text-sm text-slate-500 font-medium">Memuat data profil...</p>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-5">

        <!-- Informasi Pribadi -->
        <div>
          <div class="flex items-center gap-2 mb-3 px-1">
            <User :size="15" class="text-blue-600" />
            <p class="section-label">Informasi Pribadi</p>
          </div>
          <div class="card p-5 space-y-4">
            <div>
              <label class="label">Nama Lengkap</label>
              <input v-model="form.name" type="text" class="input-base" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Jenis Kelamin</label>
                <select v-model="form.gender" class="input-base">
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label class="label">Status Nikah</label>
                <select v-model="form.marital_status" class="input-base">
                  <option value="Belum Kawin">Belum Kawin</option>
                  <option value="Kawin">Kawin</option>
                  <option value="Cerai">Cerai</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Tempat Lahir</label>
                <input v-model="form.place_of_birth" type="text" class="input-base" />
              </div>
              <div>
                <label class="label">Tanggal Lahir</label>
                <input v-model="form.date_of_birth" type="date" class="input-base" />
              </div>
            </div>
          </div>
        </div>

        <!-- Kontak & Alamat -->
        <div>
          <div class="flex items-center gap-2 mb-3 px-1">
            <Phone :size="15" class="text-blue-600" />
            <p class="section-label">Kontak &amp; Alamat</p>
          </div>
          <div class="card p-5 space-y-4">
            <div>
              <label class="label">Nomor Telepon / WA</label>
              <input v-model="form.phone_number" type="tel" class="input-base" />
            </div>
            <div>
              <label class="label">Alamat Domisili</label>
              <textarea v-model="form.address" rows="3" class="input-base resize-none"></textarea>
            </div>
          </div>
        </div>

        <!-- Rekening Bank -->
        <div>
          <div class="flex items-center gap-2 mb-3 px-1">
            <CreditCard :size="15" class="text-blue-600" />
            <p class="section-label">Informasi Rekening</p>
          </div>
          <div class="card p-5">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Nama Bank</label>
                <input v-model="form.bank_name" type="text" placeholder="BCA, Mandiri..." class="input-base" />
              </div>
              <div>
                <label class="label">No. Rekening</label>
                <input v-model="form.bank_account_number" type="text" class="input-base" />
              </div>
            </div>
          </div>
        </div>

        <!-- Kontak Darurat -->
        <div>
          <div class="flex items-center gap-2 mb-3 px-1">
            <ShieldAlert :size="15" class="text-blue-600" />
            <p class="section-label">Kontak Darurat</p>
          </div>
          <div class="card p-5 space-y-4">
            <div>
              <label class="label">Nama Kontak</label>
              <input v-model="form.emergency_contact_name" type="text" class="input-base" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Hubungan</label>
                <input v-model="form.emergency_contact_relationship" type="text" placeholder="Istri, Orang Tua..." class="input-base" />
              </div>
              <div>
                <label class="label">No. Telp Darurat</label>
                <input v-model="form.emergency_contact_phone" type="tel" class="input-base" />
              </div>
            </div>
          </div>
        </div>

        <!-- Submit -->
        <button type="submit" :disabled="isSaving" class="btn-primary">
          <div v-if="isSaving" class="spinner"></div>
          <template v-else>
            <Save :size="16" />
            Simpan Perubahan
          </template>
        </button>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '../composables/useToast'
import { getProfile, updateProfile } from '../api/profile'
import { ArrowLeft, User, Phone, CreditCard, ShieldAlert, Save } from 'lucide-vue-next'

const router = useRouter()
const { showToast } = useToast()

const isLoading = ref(true)
const isSaving = ref(false)

const form = ref({
  name: '', phone_number: '', address: '',
  place_of_birth: '', date_of_birth: '',
  gender: 'Laki-laki', marital_status: 'Belum Kawin',
  bank_name: '', bank_account_number: '',
  emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '',
  current_password: '', password: '', password_confirmation: ''
})

onMounted(async () => {
  isLoading.value = true
  try {
    const res = await getProfile()
    const d = res.data.data
    form.value.name = d.name
    form.value.phone_number = d.phone_number || ''
    form.value.address = d.address || ''
    if (d.detail) {
      form.value.place_of_birth = d.detail.place_of_birth || ''
      form.value.date_of_birth = d.detail.date_of_birth || ''
      form.value.gender = d.detail.gender || 'Laki-laki'
      form.value.marital_status = d.detail.marital_status || 'Belum Kawin'
      form.value.bank_name = d.detail.bank_name || ''
      form.value.bank_account_number = d.detail.bank_account_number || ''
      form.value.emergency_contact_name = d.detail.emergency_contact_name || ''
      form.value.emergency_contact_phone = d.detail.emergency_contact_phone || ''
      form.value.emergency_contact_relationship = d.detail.emergency_contact_relationship || ''
    }
  } catch {
    showToast('Gagal memuat data profil.', 'error')
  } finally {
    isLoading.value = false
  }
})

const handleSubmit = async () => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const payload: any = { ...form.value }
    if (!payload.password) {
      delete payload.current_password
      delete payload.password
      delete payload.password_confirmation
    }
    await updateProfile(payload)
    showToast('Profil berhasil diperbarui!', 'success')
    setTimeout(() => router.push('/profile'), 1200)
  } catch (error: any) {
    let msg = 'Gagal memperbarui profil.'
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
