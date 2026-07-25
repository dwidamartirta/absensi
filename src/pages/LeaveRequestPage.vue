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
          <p class="text-[10px] font-bold text-slate-400 mt-1">Pengajuan Izin, Sakit & Cuti</p>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-md px-4 pt-5">
      <!-- Dynamic Banner per Type -->
      <section
        class="card p-4 mb-4 transition-all duration-300 border"
        :class="currentMeta.bannerClass"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl text-white font-black shadow-md shrink-0" :class="currentMeta.iconBg">
              <component :is="currentMeta.icon" :size="22" />
            </div>
            <div>
              <p class="text-[10px] font-extrabold uppercase tracking-wider leading-none" :class="currentMeta.subtitleClass">
                {{ currentMeta.subtitle }}
              </p>
              <h3 class="text-sm font-black mt-1 leading-none" :class="currentMeta.titleClass">
                {{ currentMeta.title }}
              </h3>
            </div>
          </div>
          <div class="text-right">
            <span class="rounded-xl px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border" :class="currentMeta.badgeClass">
              {{ currentMeta.badgeText }}
            </span>
            <p v-if="form.type === 'cuti'" class="text-[11px] font-black mt-1 text-indigo-700">
              <span v-if="isLoadingCuti" class="inline-block h-3 w-8 animate-pulse bg-slate-200 rounded"></span>
              <span v-else>{{ sisaCuti !== null ? sisaCuti + ' Hari' : '0 Hari' }}</span>
            </p>
          </div>
        </div>
      </section>

      <form @submit.prevent="handleSubmit" class="space-y-4">

        <!-- Jenis Pengajuan Selector -->
        <section class="card p-5">
          <label class="section-label mb-3">Pilih Jenis Ketidakhadiran</label>
          <div class="grid grid-cols-3 gap-2.5">
            <button
              v-for="opt in options"
              :key="opt.id"
              type="button"
              @click="form.type = opt.id"
              class="relative flex flex-col items-center justify-center rounded-2xl py-4 px-2 text-center transition-all border-2 group active:scale-95"
              :class="form.type === opt.id ? opt.activeClass : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100/80'"
            >
              <component
                :is="opt.icon"
                :size="20"
                class="mb-1.5 transition-transform group-hover:scale-110"
                :class="form.type === opt.id ? opt.iconColor : 'text-slate-400'"
              />
              <span class="text-xs font-black">{{ opt.label }}</span>
              <span class="text-[8px] font-bold uppercase tracking-wider mt-0.5" :class="form.type === opt.id ? opt.iconColor : 'text-slate-400'">
                {{ opt.sublabel }}
              </span>
            </button>
          </div>
        </section>

        <!-- Form Inputs Card -->
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
            <label class="label">
              Alasan / Keterangan {{ currentMeta.labelSuffix }}
              <span class="text-rose-500">*</span>
            </label>
            <textarea
              v-model="form.reason"
              rows="3"
              :placeholder="currentMeta.placeholder"
              required
              class="input-base resize-none"
            ></textarea>
          </div>

          <!-- File Upload Section -->
          <div class="border-t border-slate-100 pt-4">
            <div class="flex items-center justify-between mb-2">
              <label class="label mb-0">
                Dokumen Pendukung
              </label>
              <span
                class="text-[10px] font-bold px-2 py-0.5 rounded-md"
                :class="['sakit', 'izin'].includes(form.type) ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'"
              >
                {{ ['sakit', 'izin'].includes(form.type) ? 'Wajib Lampirkan' : 'Opsional' }}
              </span>
            </div>

            <p class="text-[10px] text-slate-400 mb-2 font-medium">
              {{ currentMeta.uploadHint }}
            </p>

            <div
              class="relative flex items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all cursor-pointer"
              :class="fileName
                ? 'border-emerald-300 bg-emerald-50/50'
                : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40'"
            >
              <input type="file" accept="image/*,.pdf" class="absolute inset-0 cursor-pointer opacity-0" @change="handleFile" />
              <div class="text-center pointer-events-none">
                <component
                  :is="fileName ? CheckCircle2 : Upload"
                  :size="24"
                  :class="fileName ? 'mx-auto text-emerald-600' : 'mx-auto text-slate-400'"
                />
                <p class="mt-1.5 text-[11px] font-bold" :class="fileName ? 'text-emerald-700' : 'text-slate-600'">
                  {{ fileName || 'Klik di sini untuk upload file' }}
                </p>
                <p class="text-[9px] text-slate-400 mt-0.5">Format: JPG, PNG, atau PDF (Max 2MB)</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Error Banner -->
        <div v-if="errorMsg" class="alert alert-error">
          <AlertCircle :size="16" class="shrink-0 mt-0.5" />
          <p class="text-xs leading-relaxed">{{ errorMsg }}</p>
        </div>

        <!-- Submit Button with Dynamic Theme -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-xs font-black text-white shadow-lg transition-all active:scale-[0.97]"
          :class="currentMeta.btnClass"
        >
          <div v-if="isSubmitting" class="spinner"></div>
          <template v-else>
            <Send :size="16" />
            <span>Kirim Pengajuan {{ options.find(o => o.id === form.type)?.label }}</span>
          </template>
        </button>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Upload, AlertCircle, Send, CheckCircle2,
  Stethoscope, FileText, Palmtree
} from 'lucide-vue-next'
import { storeAttendance } from '../api/attendance'
import { getProfile } from '../api/profile'

const route = useRoute()
const router = useRouter()

const options = [
  {
    id: 'sakit',
    label: 'Sakit',
    sublabel: 'Surat Dokter',
    icon: Stethoscope,
    iconColor: 'text-rose-600',
    activeClass: 'bg-rose-50 border-rose-500 text-rose-700 shadow-md shadow-rose-100 ring-2 ring-rose-300/30'
  },
  {
    id: 'izin',
    label: 'Izin',
    sublabel: 'Keperluan',
    icon: FileText,
    iconColor: 'text-amber-600',
    activeClass: 'bg-amber-50 border-amber-500 text-amber-700 shadow-md shadow-amber-100 ring-2 ring-amber-300/30'
  },
  {
    id: 'cuti',
    label: 'Cuti',
    sublabel: 'Potong Cuti',
    icon: Palmtree,
    iconColor: 'text-indigo-600',
    activeClass: 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md shadow-indigo-100 ring-2 ring-indigo-300/30'
  }
]

const form = ref({ type: 'sakit', startDate: '', endDate: '', reason: '', file: null as File | null })
const fileName = ref('')
const isSubmitting = ref(false)
const isLoadingCuti = ref(true)
const sisaCuti = ref<number | null>(null)
const errorMsg = ref('')

onMounted(async () => {
  const queryType = route.query.type as string
  if (queryType && options.find(o => o.id === queryType)) {
    form.value.type = queryType
  }

  try {
    const profileRes = await getProfile()
    if (profileRes.data?.success) {
      sisaCuti.value = profileRes.data.data.leave_stats?.balance ?? 0
    }
  } catch (err) {
    console.error('Failed to fetch leave stats:', err)
  } finally {
    isLoadingCuti.value = false
  }
})

const currentMeta = computed(() => {
  switch (form.value.type) {
    case 'sakit':
      return {
        icon: Stethoscope,
        iconBg: 'bg-rose-600 shadow-rose-200',
        bannerClass: 'bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100',
        subtitleClass: 'text-rose-400',
        titleClass: 'text-rose-900',
        badgeClass: 'bg-rose-100/80 text-rose-700 border-rose-200',
        badgeText: 'Kesehatan',
        title: 'Pengajuan Sakit',
        subtitle: 'Syarat Surat Dokter',
        placeholder: 'Contoh: Sakit demam tinggi, membutuhkan istirahat sesuai rujukan dokter.',
        labelSuffix: '(Detail Keluhan)',
        uploadHint: 'Harap unggah Surat Keterangan Sakit / Resep Dokter dari Faskes.',
        btnClass: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
      }
    case 'izin':
      return {
        icon: FileText,
        iconBg: 'bg-amber-500 shadow-amber-200',
        bannerClass: 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100',
        subtitleClass: 'text-amber-500',
        titleClass: 'text-amber-900',
        badgeClass: 'bg-amber-100/80 text-amber-800 border-amber-200',
        badgeText: 'Keperluan',
        title: 'Pengajuan Izin',
        subtitle: 'Hal Mendesak',
        placeholder: 'Contoh: Mengurus dokumen keluarga mendesak / acara keluarga.',
        labelSuffix: '(Alasan Izin)',
        uploadHint: 'Harap unggah foto bukti / surat izin pendukung jika ada.',
        btnClass: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
      }
    case 'cuti':
      return {
        icon: Palmtree,
        iconBg: 'bg-indigo-600 shadow-indigo-200',
        bannerClass: 'bg-gradient-to-r from-indigo-50 to-sky-50 border-indigo-100',
        subtitleClass: 'text-indigo-400',
        titleClass: 'text-indigo-900',
        badgeClass: 'bg-indigo-100/80 text-indigo-700 border-indigo-200',
        badgeText: 'Sisa Kuota',
        title: 'Pengajuan Cuti Tahunan',
        subtitle: 'Istirahat & Liburan',
        placeholder: 'Contoh: Mengambil cuti tahunan untuk keperluan keluarga.',
        labelSuffix: '(Tujuan Cuti)',
        uploadHint: 'Upload dokumen opsional jika ada keperluan khusus.',
        btnClass: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
      }
    default:
      return {
        icon: FileText,
        iconBg: 'bg-blue-600 shadow-blue-200',
        bannerClass: 'bg-blue-50 border-blue-100',
        subtitleClass: 'text-blue-400',
        titleClass: 'text-blue-900',
        badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
        badgeText: 'Umum',
        title: 'Pengajuan Ketidakhadiran',
        subtitle: 'Form Resmi',
        placeholder: 'Tuliskan keterangan detail...',
        labelSuffix: '',
        uploadHint: 'Upload lampiran pendukung.',
        btnClass: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
      }
  }
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