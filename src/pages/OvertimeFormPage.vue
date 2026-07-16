<template>
  <div class="page-container pb-bottom-nav">

    <!-- Header -->
    <header class="page-header">
      <div class="page-header-inner">
        <RouterLink to="/lembur" class="btn-back">
          <ArrowLeft :size="18" />
        </RouterLink>
        <div>
          <h1 class="text-[15px] font-black tracking-tight leading-none text-slate-900">Pengajuan Lembur</h1>
          <p class="text-[10px] font-bold text-slate-400 mt-1">Isi formulir dengan lengkap &amp; benar</p>
        </div>
        <div class="w-10"></div>
      </div>
    </header>

    <main class="mx-auto max-w-md px-4 pt-5">
      <form @submit.prevent="handleSubmit" class="space-y-4">

        <!-- Info Banner -->
        <div class="alert alert-warning">
          <Clock :size="16" class="shrink-0 mt-0.5" />
          <p class="text-xs leading-relaxed">
            Pengajuan lembur hanya dapat dilakukan untuk <strong>hari ini atau kemarin</strong>. Durasi dihitung otomatis dari jam mulai dan selesai.
          </p>
        </div>

        <!-- Jadwal Lembur -->
        <section class="card p-5 space-y-4">
          <div class="flex items-center gap-2 mb-1">
            <CalendarDays :size="15" class="text-slate-400" />
            <p class="section-label">Jadwal Lembur</p>
          </div>

          <div>
            <label class="label">Tanggal Lembur <span class="text-rose-500">*</span></label>
            <input id="ot-date" v-model="form.date" type="date" required :max="today" :min="yesterday"
              class="input-base" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Jam Mulai <span class="text-rose-500">*</span></label>
              <input id="ot-start" v-model="form.start_time" type="time" required class="input-base" />
            </div>
            <div>
              <label class="label">Jam Selesai <span class="text-rose-500">*</span></label>
              <input id="ot-end" v-model="form.end_time" type="time" required class="input-base" />
            </div>
          </div>

          <!-- Duration Preview -->
          <div v-if="calculatedDuration !== null" class="flex items-center justify-between rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
            <div class="flex items-center gap-2">
              <Timer :size="15" class="text-amber-500" />
              <span class="text-xs font-semibold text-slate-600">Estimasi Durasi</span>
            </div>
            <span class="text-sm font-black text-amber-600">{{ calculatedDuration }} Jam</span>
          </div>
          <div v-else-if="form.start_time && form.end_time" class="alert alert-error">
            <AlertCircle :size="15" class="shrink-0" />
            <span class="text-xs font-semibold">Jam selesai harus lebih dari jam mulai</span>
          </div>
        </section>

        <!-- Detail Lembur -->
        <section class="card p-5 space-y-4">
          <div class="flex items-center gap-2 mb-1">
            <FileText :size="15" class="text-slate-400" />
            <p class="section-label">Detail Lembur</p>
          </div>

          <div>
            <label class="label">Alasan / Deskripsi Pekerjaan <span class="text-rose-500">*</span></label>
            <textarea id="ot-reason" v-model="form.reason" rows="4" minlength="10" maxlength="1000" required
              placeholder="Jelaskan pekerjaan yang dilakukan saat lembur secara detail (min. 10 karakter)..."
              class="input-base resize-none"></textarea>
            <div class="flex justify-end mt-1">
              <span class="text-[10px] font-medium" :class="form.reason.length < 10 ? 'text-rose-400' : 'text-slate-400'">
                {{ form.reason.length }} / 1000
              </span>
            </div>
          </div>

          <!-- Upload Lampiran -->
          <div class="border-t border-slate-100 pt-4">
            <label class="label mb-2">
              Lampiran Pendukung
              <span class="text-slate-400 font-normal normal-case tracking-normal ml-1">(Opsional — jpeg, png, pdf — maks. 5MB)</span>
            </label>
            <div
              class="relative flex items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all cursor-pointer"
              :class="fileName ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50/50'"
            >
              <input id="ot-attachment" type="file" accept=".jpg,.jpeg,.png,.pdf" class="absolute inset-0 cursor-pointer opacity-0" @change="handleFile" />
              <div class="text-center pointer-events-none">
                <component :is="fileName ? CheckCircle2 : Upload" :size="24"
                  :class="fileName ? 'mx-auto text-amber-500' : 'mx-auto text-slate-400'" />
                <p class="mt-1.5 text-[11px] font-medium" :class="fileName ? 'text-amber-700' : 'text-slate-500'">
                  {{ fileName || 'Klik untuk upload dokumen' }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Error -->
        <div v-if="errorMessage" class="alert alert-error">
          <AlertCircle :size="16" class="shrink-0 mt-0.5" />
          <p class="text-xs leading-relaxed">{{ errorMessage }}</p>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="isSubmitting || calculatedDuration === null"
          class="btn-primary"
          :style="calculatedDuration !== null ? '' : 'background: #cbd5e1; box-shadow: none;'"
        >
          <div v-if="isSubmitting" class="spinner"></div>
          <Send v-else :size="16" />
          {{ isSubmitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Lembur' }}
        </button>

      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Clock, CalendarDays, Timer, FileText, Upload, CheckCircle2, AlertCircle, Send } from 'lucide-vue-next'
import { storeOvertime } from '../api/overtime'

const router = useRouter()
const today = new Date().toISOString().split('T')[0]
const yesterdayDate = new Date()
yesterdayDate.setDate(yesterdayDate.getDate() - 1)
const yesterday = yesterdayDate.toISOString().split('T')[0]

const form = ref({ date: today, start_time: '', end_time: '', reason: '' })
const fileName = ref('')
const attachmentFile = ref<File | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref('')

const calculatedDuration = computed<string | null>(() => {
  if (!form.value.start_time || !form.value.end_time) return null
  const [sh, sm] = form.value.start_time.split(':').map(Number)
  const [eh, em] = form.value.end_time.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  if (diff <= 0) return null
  const hours = Math.floor(diff / 60)
  const mins = diff % 60
  return mins > 0 ? `${hours}j ${mins}m` : `${hours}`
})

const handleFile = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const valid = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
  if (!valid.includes(file.type)) {
    errorMessage.value = 'Format file tidak didukung. Gunakan jpeg, png, atau pdf.'
    target.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'Ukuran file tidak boleh melebihi 5MB.'
    target.value = ''
    return
  }
  errorMessage.value = ''
  attachmentFile.value = file
  fileName.value = file.name
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  errorMessage.value = ''
  if (calculatedDuration.value === null) {
    errorMessage.value = 'Jam selesai harus lebih dari jam mulai.'
    return
  }
  if (form.value.reason.trim().length < 10) {
    errorMessage.value = 'Alasan lembur minimal 10 karakter.'
    return
  }
  isSubmitting.value = true
  try {
    const res = await storeOvertime({
      date: form.value.date, start_time: form.value.start_time, end_time: form.value.end_time,
      reason: form.value.reason.trim(), attachment: attachmentFile.value,
    })
    router.push({ path: '/feedback', query: { status: 'success', title: 'Lembur Diajukan', message: res.data.message || 'Pengajuan lembur Anda sedang menunggu persetujuan HRD.', btn: 'Kembali ke Beranda', redirect: '/absensi' } })
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.'
  } finally {
    isSubmitting.value = false
  }
}
</script>