<template>
  <div class="min-h-screen min-h-dvh bg-slate-50 text-slate-900 pb-10">

    <!-- Header -->
    <header class="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-100 px-4 py-4">
      <div class="mx-auto flex max-w-md items-center gap-4">
        <RouterLink to="/absensi" class="btn-back">
          <ArrowLeft :size="18" />
        </RouterLink>
        <div>
          <h1 class="text-[15px] font-black tracking-tight leading-none text-slate-900">Form Ketidakhadiran</h1>
          <p class="text-[10px] font-bold text-slate-400 mt-1">Izin, Sakit, atau Cuti</p>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-md px-4 pt-5">
      <form @submit.prevent="handleSubmit" class="space-y-4">

        <!-- Jenis Pengajuan -->
        <section class="card p-5">
          <label class="section-label mb-3">Jenis Pengajuan</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="opt in options" :key="opt.id" type="button"
              @click="form.type = opt.id"
              class="rounded-2xl py-3.5 text-center text-xs font-bold transition-all border-2"
              :class="form.type === opt.id ? opt.activeClass : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'"
            >{{ opt.label }}</button>
          </div>
        </section>

        <!-- Tanggal -->
        <section class="card p-5 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Mulai Tanggal <span class="text-rose-500">*</span></label>
              <input v-model="form.startDate" type="date" required class="input-base" />
            </div>
            <div>
              <label class="label">Sampai Tanggal <span class="text-rose-500">*</span></label>
              <input v-model="form.endDate" type="date" required class="input-base" />
            </div>
          </div>

          <div>
            <label class="label">Alasan / Keterangan <span class="text-rose-500">*</span></label>
            <textarea v-model="form.reason" rows="3" placeholder="Tulis alasan pengajuan secara detail..."
              required class="input-base resize-none"></textarea>
          </div>

          <div class="border-t border-slate-100 pt-4">
            <label class="label mb-2">
              Lampiran Dokumen
              <span class="text-slate-400 font-normal normal-case tracking-normal ml-1">
                {{ ['sakit', 'izin'].includes(form.type) ? '(Wajib)' : '(Opsional)' }}
              </span>
            </label>
            <div
              class="relative flex items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-colors cursor-pointer"
              :class="fileName ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50'"
            >
              <input type="file" accept="image/*,.pdf" class="absolute inset-0 cursor-pointer opacity-0" @change="handleFile" />
              <div class="text-center pointer-events-none">
                <component :is="fileName ? CheckCircle2 : Upload" :size="22"
                  :class="fileName ? 'mx-auto text-blue-500' : 'mx-auto text-slate-400'" />
                <p class="mt-1.5 text-[11px] font-medium" :class="fileName ? 'text-blue-700' : 'text-slate-500'">
                  {{ fileName || 'Klik untuk upload foto/dokumen' }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Error Banner -->
        <div v-if="errorMsg" class="alert alert-error">
          <AlertCircle :size="16" class="shrink-0 mt-0.5" />
          <p class="text-xs leading-relaxed">{{ errorMsg }}</p>
        </div>

        <button type="submit" :disabled="isSubmitting" class="btn-primary">
          <div v-if="isSubmitting" class="spinner"></div>
          <template v-else>
            <Send :size="16" />
            Kirim Pengajuan
          </template>
        </button>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Upload, AlertCircle, Send, CheckCircle2 } from 'lucide-vue-next'
import { storeAttendance } from '../api/attendance'

const route = useRoute()
const router = useRouter()

const options = [
  { id: 'sakit', label: 'Sakit', activeClass: 'bg-rose-50 border-rose-500 text-rose-600' },
  { id: 'izin', label: 'Izin', activeClass: 'bg-amber-50 border-amber-500 text-amber-600' },
  { id: 'cuti', label: 'Cuti', activeClass: 'bg-sky-50 border-sky-500 text-sky-600' }
]

const form = ref({ type: 'izin', startDate: '', endDate: '', reason: '', file: null as File | null })
const fileName = ref('')
const isSubmitting = ref(false)
const errorMsg = ref('')

onMounted(() => {
  const queryType = route.query.type as string
  if (queryType && options.find(o => o.id === queryType)) form.value.type = queryType
})

const handleFile = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    errorMsg.value = 'Ukuran file maksimal 2MB!'
    target.value = ''
    return
  }
  errorMsg.value = ''
  form.value.file = file
  fileName.value = file.name
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  errorMsg.value = ''

  if (form.value.endDate < form.value.startDate) {
    errorMsg.value = 'Tanggal akhir tidak boleh lebih awal dari tanggal mulai.'
    return
  }
  if (['sakit', 'izin'].includes(form.value.type) && !form.value.file) {
    errorMsg.value = 'Surat keterangan / lampiran wajib diunggah untuk pengajuan Sakit atau Izin.'
    return
  }

  isSubmitting.value = true
  try {
    await storeAttendance({
      status: form.value.type,
      start_date: form.value.startDate,
      end_date: form.value.endDate,
      attendance_detail: form.value.reason,
      attachment: form.value.file || undefined
    })
    router.push({ path: '/feedback', query: { status: 'success', title: 'Pengajuan Terkirim', message: 'Permohonan Anda berhasil dicatat dan sedang menunggu proses HRD.', btn: 'Kembali ke Beranda', redirect: '/absensi' } })
  } catch (error: any) {
    const message = error.response?.data?.message || 'Terjadi kesalahan saat mengirim data. Coba lagi.'
    errorMsg.value = message
  } finally {
    isSubmitting.value = false
  }
}
</script>