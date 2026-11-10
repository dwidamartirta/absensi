<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
    <div class="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
      
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div class="flex items-center gap-2.5">
          <div class="icon-badge icon-badge-blue h-9 w-9 rounded-xl">
            <Scan :size="18" />
          </div>
          <div>
            <h3 class="text-sm font-black text-slate-900">Scan & Upload e-KTP</h3>
            <p class="text-[10px] font-bold text-slate-400">Auto-fill data diri otomatis dengan OCR</p>
          </div>
        </div>
        <button
          type="button"
          @click="handleClose"
          class="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-95"
          aria-label="Tutup"
        >
          <X :size="18" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-5">

        <!-- ================= VIEW 1: PILIHAN SUMBER ================= -->
        <div v-if="currentStep === 'choose'" class="space-y-4">
          <div class="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div class="flex items-start gap-3">
              <Sparkles :size="20" class="shrink-0 text-blue-600 mt-0.5" />
              <div>
                <p class="text-xs font-bold text-blue-900">Auto-Fill Otomatis dari e-KTP</p>
                <p class="text-[11px] font-medium text-blue-700 leading-relaxed mt-0.5">
                  Foto e-KTP Anda di tempat yang terang. Sistem akan membaca NIK, nama, tanggal lahir, dan alamat secara otomatis!
                </p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-2.5 pt-1">
            <!-- Pilihan 1: Kamera Live Stream -->
            <button
              type="button"
              @click="startLiveCamera"
              class="flex items-center justify-between rounded-2xl border-2 border-blue-600 bg-blue-50/40 p-4 transition-all hover:bg-blue-50 active:scale-[0.98]"
            >
              <div class="flex items-center gap-3.5">
                <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200">
                  <Camera :size="20" />
                </div>
                <div class="text-left">
                  <p class="text-sm font-black text-slate-900">Buka Kamera Langsung</p>
                  <p class="text-[11px] font-semibold text-slate-500">Dengan bingkai panduan e-KTP presisi</p>
                </div>
              </div>
              <ChevronRight :size="18" class="text-blue-500" />
            </button>

            <!-- Pilihan 2: Kamera Bawaan HP -->
            <label
              class="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-slate-100 bg-white p-4 transition-all hover:border-slate-200 active:scale-[0.98]"
            >
              <input
                ref="cameraInputRef"
                type="file"
                accept="image/*"
                capture="environment"
                class="hidden"
                @change="onFileSelected"
              />
              <div class="flex items-center gap-3.5">
                <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Smartphone :size="20" />
                </div>
                <div class="text-left">
                  <p class="text-sm font-bold text-slate-800">Kamera Bawaan HP</p>
                  <p class="text-[11px] font-medium text-slate-400">Jepret foto dari aplikasi kamera HP</p>
                </div>
              </div>
              <ChevronRight :size="18" class="text-slate-300" />
            </label>

            <!-- Pilihan 3: Galeri / Berkas -->
            <label
              class="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-slate-100 bg-white p-4 transition-all hover:border-slate-200 active:scale-[0.98]"
            >
              <input
                ref="galleryInputRef"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="hidden"
                @change="onFileSelected"
              />
              <div class="flex items-center gap-3.5">
                <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ImageIcon :size="20" />
                </div>
                <div class="text-left">
                  <p class="text-sm font-bold text-slate-800">Pilih dari Galeri</p>
                  <p class="text-[11px] font-medium text-slate-400">Gunakan foto e-KTP yang sudah ada</p>
                </div>
              </div>
              <ChevronRight :size="18" class="text-slate-300" />
            </label>
          </div>
        </div>

        <!-- ================= VIEW 2: LIVE KAMERA DENGAN FRAME ================= -->
        <div v-else-if="currentStep === 'camera'" class="space-y-4">
          <div class="relative overflow-hidden rounded-2xl bg-black aspect-[4/3] flex items-center justify-center">
            <video
              ref="videoRef"
              autoplay
              playsinline
              muted
              class="h-full w-full object-cover"
            ></video>

            <!-- Overlay Bingkai KTP -->
            <div class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              <div class="relative w-full max-w-[320px] aspect-[85.6/53.98] rounded-2xl border-2 border-dashed border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                <!-- Sudut Bounding Box -->
                <div class="absolute -top-1 -left-1 h-5 w-5 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                <div class="absolute -top-1 -right-1 h-5 w-5 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                <div class="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                <div class="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>

                <!-- Petunjuk Posisi -->
                <div class="absolute inset-x-0 bottom-2 text-center">
                  <span class="rounded-full bg-slate-900/80 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                    Posisikan e-KTP di dalam kotak
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="stopLiveCamera(); currentStep = 'choose'"
              class="btn-secondary !w-auto px-4"
            >
              Kembali
            </button>
            <button
              type="button"
              @click="captureFromLiveCamera"
              class="btn-primary flex-1"
            >
              <Camera :size="18" /> Jepret Foto KTP
            </button>
          </div>
        </div>

        <!-- ================= VIEW 3: SCANNING / OCR LOADING ================= -->
        <div v-else-if="currentStep === 'scanning'" class="py-6 flex flex-col items-center justify-center text-center">
          <!-- KTP Preview dengan Scanning Line -->
          <div class="relative h-44 w-72 overflow-hidden rounded-2xl border-2 border-blue-500 bg-slate-100 shadow-xl mb-5">
            <img :src="previewImageUrl!" alt="Preview KTP" class="h-full w-full object-cover" />
            <!-- Laser Scan Line Animation -->
            <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4] animate-bounce"></div>
            <div class="absolute inset-0 bg-blue-500/10 pointer-events-none"></div>
          </div>

          <div class="w-full max-w-xs space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>{{ scanningStatusText }}</span>
              <span>{{ scanningProgress }}%</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full rounded-full bg-blue-600 transition-all duration-300"
                :style="{ width: scanningProgress + '%' }"
              ></div>
            </div>
            <p class="text-[11px] font-medium text-slate-400 pt-1">
              Mohon tunggu beberapa detik selagi sistem mendeteksi NIK & data Anda...
            </p>
          </div>
        </div>

        <!-- ================= VIEW 4: HASIL EXTRACTION & REVIEW ================= -->
        <div v-else-if="currentStep === 'result'" class="space-y-4">
          <!-- Card Foto e-KTP -->
          <div class="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <img :src="previewImageUrl!" alt="Foto KTP" class="h-32 w-full object-cover" />
            <div class="absolute top-2 right-2">
              <span v-if="parsedData?.nik" class="rounded-full bg-emerald-600/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-black text-white shadow">
                ✓ NIK Terdeteksi
              </span>
              <span v-else class="rounded-full bg-amber-500/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-black text-white shadow">
                Koreksi Manual Diperlukan
              </span>
            </div>
          </div>

          <!-- Hasil Deteksi -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-black uppercase tracking-wider text-slate-500">Hasil Pembacaan e-KTP</p>
              <span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {{ extractedCount }} Data Terbaca
              </span>
            </div>

            <div class="max-h-52 overflow-y-auto space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-xs">
              <div class="flex justify-between py-1 border-b border-slate-100">
                <span class="text-slate-400 font-semibold">NIK</span>
                <span class="font-bold text-slate-900 tracking-wider">{{ parsedData?.nik || '(Tidak terbaca)' }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100">
                <span class="text-slate-400 font-semibold">Nama</span>
                <span class="font-bold text-slate-900">{{ parsedData?.nama || '(Tidak terbaca)' }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100">
                <span class="text-slate-400 font-semibold">Tempat/Tgl Lahir</span>
                <span class="font-bold text-slate-900">
                  {{ parsedData?.tempat_lahir || '-' }}, {{ parsedData?.tanggal_lahir || '-' }}
                </span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100">
                <span class="text-slate-400 font-semibold">Jenis Kelamin</span>
                <span class="font-bold text-slate-900">{{ parsedData?.jenis_kelamin || '-' }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100">
                <span class="text-slate-400 font-semibold">Status Pernikahan</span>
                <span class="font-bold text-slate-900">{{ parsedData?.status_perkawinan || '-' }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100">
                <span class="text-slate-400 font-semibold">Agama</span>
                <span class="font-bold text-slate-900">{{ parsedData?.agama || '-' }}</span>
              </div>
              <div class="flex justify-between py-1">
                <span class="text-slate-400 font-semibold">Alamat</span>
                <span class="font-bold text-slate-900 text-right truncate max-w-[180px]">{{ parsedData?.alamat || '-' }}</span>
              </div>
            </div>

            <p class="mt-2 text-[11px] font-medium text-slate-400 text-center">
              💡 Tenang, Anda masih bisa mengedit dan menyempurnakan isian ini di formulir sebelum disimpan.
            </p>
          </div>

          <!-- Tombol Aksi -->
          <div class="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              @click="resetToChoose"
              class="btn-secondary text-xs"
              :disabled="isUploading"
            >
              <RotateCcw :size="14" /> Foto Ulang
            </button>
            <button
              type="button"
              @click="applyAndUpload"
              class="btn-primary text-xs"
              :disabled="isUploading"
            >
              <div v-if="isUploading" class="spinner"></div>
              <template v-else>
                <Check :size="15" /> Terapkan Data
              </template>
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import {
  Scan, X, Camera, Smartphone, ImageIcon, ChevronRight, Sparkles, RotateCcw, Check
} from 'lucide-vue-next'
import { scanKtpImageWithOcr, type ParsedKtpData } from '../utils/ktpScanner'
import { uploadKtp } from '../api/profile'
import { useToast } from '../composables/useToast'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'applied', payload: { parsed: ParsedKtpData; fileUrl: string; documentId: number }): void
}>()

const { showToast } = useToast()

type Step = 'choose' | 'camera' | 'scanning' | 'result'
const currentStep = ref<Step>('choose')

const videoRef = ref<HTMLVideoElement | null>(null)
const cameraInputRef = ref<HTMLInputElement | null>(null)

let mediaStream: MediaStream | null = null
const selectedFile = ref<File | null>(null)
const previewImageUrl = ref<string | null>(null)

const scanningProgress = ref(0)
const scanningStatusText = ref('Menyiapkan gambar...')
const parsedData = ref<ParsedKtpData | null>(null)
const rawOcrText = ref<string>('')
const ocrConfidenceScore = ref<number>(0)
const isUploading = ref(false)

const extractedCount = computed(() => {
  if (!parsedData.value) return 0
  const keys: (keyof ParsedKtpData)[] = [
    'nik', 'nama', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'status_perkawinan', 'agama', 'alamat'
  ]
  return keys.filter((k) => !!parsedData.value?.[k]).length
})

/* ---------- Live Camera Stream ---------- */
const startLiveCamera = async () => {
  try {
    currentStep.value = 'camera'
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    })
    mediaStream = stream
    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }
  } catch (err) {
    console.warn('Gagal membuka kamera langsung, beralih ke kamera native:', err)
    stopLiveCamera()
    showToast('Kamera browser tidak tersedia, gunakan kamera HP.', 'info')
    cameraInputRef.value?.click()
  }
}

const stopLiveCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop())
    mediaStream = null
  }
}

const captureFromLiveCamera = () => {
  const video = videoRef.value
  if (!video) return

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth || 1280
  canvas.height = video.videoHeight || 720
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  stopLiveCamera()

  canvas.toBlob(
    (blob) => {
      if (blob) {
        const file = new File([blob], `ktp_${Date.now()}.jpg`, { type: 'image/jpeg' })
        processImageForOcr(file)
      }
    },
    'image/jpeg',
    0.95
  )
}

/* ---------- File Input (Kamera Native / Galeri) ---------- */
const onFileSelected = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    showToast('Ukuran foto maksimal 5 MB.', 'error')
    return
  }

  processImageForOcr(file)
}

/* ---------- OCR Processing ---------- */
const processImageForOcr = async (file: File) => {
  selectedFile.value = file
  previewImageUrl.value = URL.createObjectURL(file)
  currentStep.value = 'scanning'
  scanningProgress.value = 10
  scanningStatusText.value = 'Menyiapkan gambar...'

  try {
    const res = await scanKtpImageWithOcr(file, (progress, status) => {
      scanningProgress.value = progress
      scanningStatusText.value = status
    })

    parsedData.value = res.parsed
    rawOcrText.value = res.rawText
    ocrConfidenceScore.value = res.confidence

    currentStep.value = 'result'
    if (res.parsed.nik) {
      showToast('Data e-KTP berhasil terbaca!', 'success')
    } else {
      showToast('KTP terbaca sebagian. Periksa kembali isian form.', 'info')
    }
  } catch (error) {
    console.error('OCR Error:', error)
    showToast('OCR offline gagal membaca, tetap bisa upload foto.', 'error')
    currentStep.value = 'result'
  }
}

const resetToChoose = () => {
  stopLiveCamera()
  if (previewImageUrl.value) {
    URL.revokeObjectURL(previewImageUrl.value)
    previewImageUrl.value = null
  }
  selectedFile.value = null
  parsedData.value = null
  currentStep.value = 'choose'
}

const applyAndUpload = async () => {
  if (!selectedFile.value || isUploading.value) return
  isUploading.value = true

  try {
    const res = await uploadKtp(
      selectedFile.value,
      parsedData.value,
      rawOcrText.value,
      ocrConfidenceScore.value
    )

    showToast('Data e-KTP berhasil diterapkan ke form!', 'success')
    emit('applied', {
      parsed: parsedData.value || {
        nik: null, nama: null, tempat_lahir: null, tanggal_lahir: null,
        jenis_kelamin: null, gol_darah: null, alamat: null, rt_rw: null,
        kel_desa: null, kecamatan: null, agama: null, status_perkawinan: null, pekerjaan: null
      },
      fileUrl: res.data.data.file_url,
      documentId: res.data.data.document_id,
    })
  } catch (err: any) {
    showToast(err.response?.data?.message || 'Gagal mengunggah berkas KTP.', 'error')
  } finally {
    isUploading.value = false
  }
}

const handleClose = () => {
  stopLiveCamera()
  emit('close')
}

onBeforeUnmount(() => {
  stopLiveCamera()
  if (previewImageUrl.value) {
    URL.revokeObjectURL(previewImageUrl.value)
  }
})
</script>

