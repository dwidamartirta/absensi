<template>
  <div class="relative min-h-screen w-full max-w-md mx-auto bg-slate-100 overflow-hidden">
    <header class="absolute left-4 top-6 z-20">
      <RouterLink to="/absensi" class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 shadow-sm border border-slate-200/50">
        <ArrowLeft :size="20" class="text-slate-700" />
      </RouterLink>
    </header>

    <div id="mapOut" class="absolute inset-0 z-0 bg-slate-200"></div>

    <!-- Calibration Button — pojok kanan bawah map -->
    <button 
      @click="recalibrateLocation" 
      :disabled="isCalibrating"
      class="absolute right-4 z-20 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 backdrop-blur-sm shadow-lg border border-slate-200/60 text-blue-600 active:scale-90 transition-all duration-200 disabled:opacity-60"
      :style="{ bottom: (sheetCollapsed ? '80px' : '480px'), transition: 'bottom 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }"
      title="Kalibrasi Ulang Lokasi"
    >
      <LocateFixed :size="22" :class="isCalibrating ? 'animate-spin' : ''" />
    </button>

    <!-- Alert Popup Modal Validasi -->
    <Transition name="modal">
      <div v-if="showValidationModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-5">
        <div class="w-full max-w-xs rounded-3xl bg-white p-6 shadow-2xl text-center">
          <!-- Icon Header -->
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-inner">
            <AlertCircle :size="30" />
          </div>

          <!-- Message -->
          <h3 class="text-sm font-bold text-slate-900 leading-snug mb-6">
            {{ validationMessage }}
          </h3>

          <!-- Button -->
          <button
            @click="closeValidationModal"
            class="w-full rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md active:scale-95 transition-all hover:bg-blue-700"
          >
            Oke
          </button>
        </div>
      </div>
    </Transition>

    <section 
      class="absolute bottom-0 left-0 right-0 z-20 flex flex-col rounded-t-[32px] bg-white px-6 pb-8 pt-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] will-change-transform max-h-[85vh]"
      :style="{ transform: `translateY(${translateY}px)`, transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }"
    >
      <div class="w-full flex flex-col items-center pb-4 cursor-grab touch-none select-none shrink-0" @mousedown.prevent="startDrag" @touchstart.passive="startDrag" @click="toggleSheet">
        <div class="mb-4 h-1.5 w-12 rounded-full transition-colors" :class="isDragging ? 'bg-blue-400' : 'bg-slate-300'"></div>
        <div class="text-center">
          <p class="text-xs font-medium text-blue-600 uppercase tracking-widest">Absen Pulang</p>
          <h2 class="mt-1 text-xl font-bold text-slate-900 leading-tight">Laporan Kerja</h2>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto scrollbar-hide">
        <!-- Security Warning Alert -->
        <div v-if="securityError" class="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-700 shadow-sm animate-pulse text-left">
          <ShieldAlert :size="20" class="mt-0.5 shrink-0 text-rose-600" />
          <div>
            <p class="text-xs font-black uppercase tracking-wider text-rose-800 leading-none">Keamanan Terpicu</p>
            <p class="mt-1.5 text-[10px] font-bold leading-relaxed opacity-90">{{ securityError }}</p>
          </div>
        </div>

        <!-- Location Status Card -->
        <div v-else class="mb-5 flex items-start gap-2 rounded-xl px-3 py-3 text-[11px] font-medium transition-colors text-left" :class="isInRadius ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'">
          <MapPin :size="14" class="mt-0.5 shrink-0" />
          <p>{{ isLoadingLocation ? 'Memverifikasi lokasi GPS...' : (isInRadius ? `Lokasi valid (${namaLokasiTerdekat}). Silakan isi laporan.` : `Diluar radius (${jarakUserKeKantor}m).`) }}</p>
        </div>

        <!-- Validation Error Alert -->
        <div v-if="validationError" class="mb-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 text-left animate-shake">
          <AlertCircle :size="16" class="shrink-0 text-rose-600" />
          <span>{{ validationError }}</span>
        </div>

        <form @submit.prevent="handleClockOut" class="space-y-4">
          <div class="grid grid-cols-1 gap-4 text-left">
            <!-- Input Jumlah Trip -->
            <div>
              <label class="mb-1 flex items-center justify-between text-xs font-black uppercase text-slate-800">
                <span>Jumlah Trip</span>
                <span v-if="isDriver" class="text-rose-600 font-bold text-[10px] lowercase bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">* Wajib (Driver)</span>
              </label>
              <p class="mb-2 text-[10px] text-slate-500 font-medium">
                {{ isDriver ? 'Sebagai Driver, Anda wajib mengisi jumlah trip hari ini' : 'Isi jumlah trip jika Anda adalah seorang Driver' }}
              </p>
              <input
                ref="tripInputRef"
                v-model="form.trip"
                type="number"
                placeholder="Masukkan jumlah trip (contoh: 2)"
                class="w-full rounded-xl border-2 border-slate-300 bg-white py-3 px-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 shadow-sm"
                :disabled="isSubmitting"
              />
            </div>

            <!-- Input Laporan Pekerjaan -->
            <div>
              <label class="mb-1 flex items-center justify-between text-xs font-black uppercase text-slate-800">
                <span>Laporan Pekerjaan</span>
                <span v-if="isDriver || isGudang" class="text-rose-600 font-bold text-[10px] lowercase bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">* Wajib ({{ isDriver ? 'Driver' : 'Gudang' }})</span>
              </label>
              <p class="mb-2 text-[10px] text-slate-500 font-medium">
                Deskripsikan secara singkat kegiatan atau pekerjaan Anda hari ini
              </p>
              <textarea
                ref="keteranganInputRef"
                v-model="form.keterangan"
                rows="3"
                placeholder="Tuliskan ringkasan hasil pekerjaan hari ini..."
                class="w-full rounded-xl border-2 border-slate-300 bg-white py-3 px-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 shadow-sm"
                :disabled="isSubmitting"
              ></textarea>
            </div>
          </div>

          <button type="submit" :disabled="!isInRadius || !!securityError || isSubmitting" class="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-md active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400">
            <LogOut :size="18" />
            <span>{{ securityError ? 'Absensi Diblokir' : (isLoadingLocation ? 'Memverifikasi Lokasi GPS...' : 'Selesaikan Hari Kerja') }}</span>
          </button>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, MapPin, LogOut, ShieldAlert, LocateFixed, AlertCircle } from 'lucide-vue-next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { storeAttendance, getLocations } from '../api/attendance'
import { getProfile } from '../api/profile'
import { runQuickAudit, runSecurityAudit, type GPSMeasurement } from '../utils/security'

const router = useRouter()

const form = ref({ trip: '', keterangan: '' })
const userPosition = ref<string>('')
const validationError = ref<string | null>(null)
const showValidationModal = ref(false)
const validationMessage = ref('')
const tripInputRef = ref<HTMLInputElement | null>(null)
const keteranganInputRef = ref<HTMLTextAreaElement | null>(null)
const fieldToFocus = ref<'trip' | 'keterangan' | null>(null)

const closeValidationModal = () => {
  showValidationModal.value = false
  setTimeout(() => {
    if (fieldToFocus.value === 'trip' && tripInputRef.value) {
      tripInputRef.value.focus()
      tripInputRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else if (fieldToFocus.value === 'keterangan' && keteranganInputRef.value) {
      keteranganInputRef.value.focus()
      keteranganInputRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 150)
}

const isDriver = computed(() => {
  const p = userPosition.value.toLowerCase()
  return p.includes('driver') || p.includes('supir')
})

const isGudang = computed(() => {
  const p = userPosition.value.toLowerCase()
  return p.includes('gudang') || p.includes('warehouse')
})

// Ambil lokasi langsung dari API
const daftarKantor = ref<{nama: string, lat: number, lng: number, radius: number}[]>([])
const isLoadingLocation = ref(true)
const isInRadius = ref(false)
const jarakUserKeKantor = ref(0)
const namaLokasiTerdekat = ref('')
const isSubmitting = ref(false)
const securityError = ref<string | null>(null)
const isCalibrating = ref(false)
const sheetCollapsed = ref(false)

let userLat = 0, userLng = 0
let map: any
let userMarker: any
let watchId: number | null = null
let timer: any
const waktuSekarang = ref(new Date())

onMounted(async () => {
  // Inisialisasi map langsung
  map = L.map('mapOut', { zoomControl: false, attributionControl: false }).setView([-6.2088, 106.8456], 15)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
  timer = setInterval(() => waktuSekarang.value = new Date(), 1000)

  // Ambil profil user untuk menentukan posisi/jabatan
  getProfile().then(res => {
    if (res.data?.success && res.data.data) {
      userPosition.value = res.data.data.position || ''
    }
  }).catch(() => {})

  // PARALEL: Fetch lokasi kantor + GPS secara bersamaan
  await Promise.allSettled([
    getLocations().then(res => {
      if (res.data.success && res.data.data) {
        daftarKantor.value = res.data.data.map(loc => ({
          nama: loc.name,
          lat: Number(loc.latitude),
          lng: Number(loc.longitude),
          radius: loc.radius || 100
        }))

        if (daftarKantor.value.length > 0 && map) {
          daftarKantor.value.forEach(k => {
            L.circle([k.lat, k.lng], { 
              color: '#2563eb', 
              fillOpacity: 0.1, 
              radius: k.radius 
            }).addTo(map)
          })
        }
      }
    })
  ])

  // Start GPS watch
  startGPSWatch()
})

/**
 * Start GPS watchPosition — langsung dapat posisi pertama secepat mungkin.
 */
const startGPSWatch = () => {
  isLoadingLocation.value = true
  securityError.value = null

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
  }

  let firstPositionReceived = false

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const measurement: GPSMeasurement = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp
      }

      // Quick audit — single measurement
      const audit = runQuickAudit(measurement)

      if (!audit.isValid) {
        securityError.value = audit.reason || 'Sensor GPS terindikasi tidak valid.'
        isLoadingLocation.value = false
        isInRadius.value = false
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId)
          watchId = null
        }
        return
      }

      // Update koordinat
      userLat = pos.coords.latitude
      userLng = pos.coords.longitude
      const uLatLng = L.latLng(userLat, userLng)

      // Update marker
      if (map) {
        if (!userMarker) {
          userMarker = L.marker(uLatLng, { 
            icon: L.divIcon({ 
              className: 'bg-transparent', 
              html: '<div class="h-8 w-8 rounded-full bg-blue-600 border-2 border-white shadow-lg animate-pulse"></div>' 
            }) 
          }).addTo(map)
        } else {
          userMarker.setLatLng(uLatLng)
        }
      }

      processNearestLocation(uLatLng)

      if (!firstPositionReceived) {
        firstPositionReceived = true
        fitMapBounds(uLatLng)
      }

      isLoadingLocation.value = false
      isCalibrating.value = false
    },
    () => {
      isLoadingLocation.value = false
      isCalibrating.value = false
      namaLokasiTerdekat.value = 'Akses GPS Ditolak / Gagal'
    },
    { 
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 8000
    }
  )
}

const processNearestLocation = (uLatLng: L.LatLng) => {
  if (daftarKantor.value.length === 0) {
    namaLokasiTerdekat.value = 'Belum ada lokasi (Hubungi Admin)'
    isInRadius.value = false
    jarakUserKeKantor.value = 0
    return
  }

  let terdekat = daftarKantor.value[0], minJarak = Infinity
  daftarKantor.value.forEach(k => {
    const d = Math.round(L.latLng(k.lat, k.lng).distanceTo(uLatLng))
    if (d < minJarak) { minJarak = d; terdekat = k; }
  })
  
  namaLokasiTerdekat.value = terdekat.nama
  jarakUserKeKantor.value = minJarak
  isInRadius.value = minJarak <= (terdekat.radius + 10)
}

const fitMapBounds = (uLatLng: L.LatLng) => {
  if (!map || daftarKantor.value.length === 0) {
    if (map) map.setView(uLatLng, 15)
    return
  }

  let terdekat = daftarKantor.value[0], minJarak = Infinity
  daftarKantor.value.forEach(k => {
    const d = L.latLng(k.lat, k.lng).distanceTo(uLatLng)
    if (d < minJarak) { minJarak = d; terdekat = k; }
  })

  map.fitBounds(
    L.latLngBounds([uLatLng, L.latLng(terdekat.lat, terdekat.lng)]), 
    { padding: [50, 50] }
  )
}

/**
 * Tombol Kalibrasi — force refresh GPS tanpa cache
 */
const recalibrateLocation = () => {
  isCalibrating.value = true
  isLoadingLocation.value = true
  securityError.value = null

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const measurement: GPSMeasurement = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp
      }

      const audit = runQuickAudit(measurement)

      if (!audit.isValid) {
        securityError.value = audit.reason || 'Sensor GPS terindikasi tidak valid.'
        isLoadingLocation.value = false
        isInRadius.value = false
        isCalibrating.value = false
        return
      }

      userLat = pos.coords.latitude
      userLng = pos.coords.longitude
      const uLatLng = L.latLng(userLat, userLng)

      if (userMarker) {
        userMarker.setLatLng(uLatLng)
      }

      processNearestLocation(uLatLng)
      fitMapBounds(uLatLng)
      
      isLoadingLocation.value = false
      isCalibrating.value = false

      startGPSWatch()
    },
    () => {
      isLoadingLocation.value = false
      isCalibrating.value = false
      namaLokasiTerdekat.value = 'Kalibrasi gagal. Coba lagi.'
    },
    { 
      enableHighAccuracy: true, 
      maximumAge: 0,
      timeout: 10000 
    }
  )
}

const handleClockOut = async () => {
  if (isSubmitting.value || securityError.value) return
  
  validationError.value = null

  // Validasi posisi karyawan dengan pesan singkat & mengarahkan ke input
  if (isDriver.value) {
    const isTripEmpty = form.value.trip === '' || form.value.trip === null || Number(form.value.trip) < 0
    const isNotesEmpty = !form.value.keterangan || !form.value.keterangan.trim()

    if (isTripEmpty && isNotesEmpty) {
      validationMessage.value = 'Jumlah trip & laporan pekerjaan wajib diisi'
      fieldToFocus.value = 'trip'
      showValidationModal.value = true
      return
    }
    if (isTripEmpty) {
      validationMessage.value = 'Jumlah trip wajib diisi'
      fieldToFocus.value = 'trip'
      showValidationModal.value = true
      return
    }
    if (isNotesEmpty) {
      validationMessage.value = 'Laporan pekerjaan wajib diisi'
      fieldToFocus.value = 'keterangan'
      showValidationModal.value = true
      return
    }
  } else if (isGudang.value) {
    if (!form.value.keterangan || !form.value.keterangan.trim()) {
      validationMessage.value = 'Laporan pekerjaan wajib diisi'
      fieldToFocus.value = 'keterangan'
      showValidationModal.value = true
      return
    }
  }

  // Final Security Check before sending payload
  const finalAudit = runSecurityAudit(null, {
    latitude: userLat,
    longitude: userLng,
    accuracy: 5,
    timestamp: Date.now()
  })

  if (!finalAudit.isValid) {
    securityError.value = finalAudit.reason || 'Pelanggaran keamanan terdeteksi!'
    return
  }

  isSubmitting.value = true

  try {
    await storeAttendance({
      status: 'Hadir',
      lat: userLat,
      long: userLng,
      attendance_detail: form.value.keterangan || undefined,
      daily_trip: form.value.trip || undefined,
    })

    router.push({
      path: '/feedback',
      query: {
        status: 'success',
        title: 'Absen Pulang Berhasil!',
        message: `Absen pulang di ${namaLokasiTerdekat.value} pada pukul ${jamSekarang.value} telah tercatat.`,
        btn: 'Ke Beranda'
      }
    })
  } catch (err: any) {
    const message = err.response?.data?.message || 'Gagal menyimpan absensi. Coba lagi.'
    router.push({
      path: '/feedback',
      query: { status: 'error', title: 'Absen Gagal', message, btn: 'Coba Lagi' }
    })
  } finally {
    isSubmitting.value = false
  }
}

// UI dragging logic
const translateY = ref(0)
const isDragging = ref(false)
const startY = ref(0)
const currentY = ref(0)
const hasMoved = ref(false)
const maxTranslateDown = 340

const startDrag = (e: any) => { 
  isDragging.value = true
  hasMoved.value = false
  startY.value = e.touches ? e.touches[0].clientY : e.clientY
  currentY.value = translateY.value
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', endDrag)
}

const onDrag = (e: any) => { 
  if (!isDragging.value) return
  hasMoved.value = true
  const y = e.touches ? e.touches[0].clientY : e.clientY
  let newY = currentY.value + (y - startY.value)
  translateY.value = Math.max(0, Math.min(newY, maxTranslateDown))
}

const endDrag = () => { 
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', endDrag)
  
  if (hasMoved.value) {
    const collapsed = translateY.value > maxTranslateDown / 2
    translateY.value = collapsed ? maxTranslateDown : 0
    sheetCollapsed.value = collapsed
  }
}

const toggleSheet = () => { 
  if (!hasMoved.value) {
    const collapsed = translateY.value === 0
    translateY.value = collapsed ? maxTranslateDown : 0
    sheetCollapsed.value = collapsed
  }
}

onBeforeUnmount(() => { 
  if (watchId !== null) navigator.geolocation.clearWatch(watchId)
  if (map) map.remove()
  clearInterval(timer) 
})

const jamSekarang = computed(() => waktuSekarang.value.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
</script>