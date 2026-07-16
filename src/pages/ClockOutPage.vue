<template>
  <div class="relative min-h-screen w-full max-w-md mx-auto bg-slate-100 overflow-hidden">
    <header class="absolute left-4 top-6 z-20">
      <RouterLink to="/absensi" class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 shadow-sm border border-slate-200/50">
        <ArrowLeft :size="20" class="text-slate-700" />
      </RouterLink>
    </header>

    <div id="mapOut" class="absolute inset-0 z-0 bg-slate-200"></div>

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
          <p>{{ isLoadingLocation ? 'Memverifikasi koordinat GPS dan enkripsi sistem keamanan...' : (isInRadius ? `Lokasi valid (${namaLokasiTerdekat}). Silakan isi laporan.` : `Diluar radius (${jarakUserKeKantor}m).`) }}</p>
        </div>

        <form @submit.prevent="handleClockOut" class="space-y-4">
          <div class="grid grid-cols-1 gap-3">
            <div>
              <label class="mb-1 block text-[10px] font-bold uppercase text-slate-400 text-left">Jumlah Trip</label>
              <p class="mb-1.5 text-[9px] text-slate-400 italic text-left">Isi jika Anda adalah seorang Driver</p>
              <input v-model="form.trip" type="number" placeholder="0" class="w-full rounded-xl border-slate-200 bg-slate-50 py-3 px-4 text-sm outline-none focus:border-blue-500 disabled:opacity-50" :disabled="!isInRadius || !!securityError" />
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-[10px] font-bold uppercase text-slate-400 text-left">Laporan Pekerjaan</label>
            <textarea v-model="form.keterangan" rows="3" placeholder="Deskripsikan pekerjaan Anda hari ini..." class="w-full rounded-xl border-slate-200 bg-slate-50 py-3 px-4 text-sm outline-none focus:border-blue-500 disabled:opacity-50" :disabled="!isInRadius || !!securityError"></textarea>
          </div>

          <button type="submit" :disabled="!isInRadius || !!securityError || isSubmitting" class="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-md active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400">
            <LogOut :size="18" />
            <span>{{ securityError ? 'Absensi Diblokir' : 'Selesaikan Hari Kerja' }}</span>
          </button>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, MapPin, LogOut, ShieldAlert } from 'lucide-vue-next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { storeAttendance, getLocations } from '../api/attendance'
import { runSecurityAudit, type GPSMeasurement } from '../utils/security'

const router = useRouter()

const form = ref({ trip: '', keterangan: '' })

// Ambil lokasi langsung dari API
const daftarKantor = ref<{nama: string, lat: number, lng: number, radius: number}[]>([])
const isLoadingLocation = ref(true)
const isInRadius = ref(false)
const jarakUserKeKantor = ref(0)
const namaLokasiTerdekat = ref('')
const isSubmitting = ref(false)
const securityError = ref<string | null>(null)

let userLat = 0, userLng = 0
let map: any
let userMarker: any
let timer: any
const waktuSekarang = ref(new Date())

onMounted(async () => {
  // Selalu inisialisasi map supaya tidak blank
  map = L.map('mapOut', { zoomControl: false, attributionControl: false }).setView([-6.2088, 106.8456], 15)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
  timer = setInterval(() => waktuSekarang.value = new Date(), 1000)

  try {
    const res = await getLocations()
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
  } catch (error) {
    console.error('Gagal mengambil lokasi dari server', error)
  }

  getRealLocationWithSecurity()
})

const getRealLocationWithSecurity = () => {
  isLoadingLocation.value = true
  securityError.value = null

  // Pembacaan pertama untuk koordinat GPS
  navigator.geolocation.getCurrentPosition((pos1) => {
    const m1: GPSMeasurement = {
      latitude: pos1.coords.latitude,
      longitude: pos1.coords.longitude,
      accuracy: pos1.coords.accuracy,
      timestamp: pos1.timestamp
    }

    userLat = pos1.coords.latitude
    userLng = pos1.coords.longitude
    const uLatLng = L.latLng(userLat, userLng)

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
      map.setView(uLatLng, 15)
    }

    // Jeda 1.2 detik sebelum pembacaan kedua untuk mendeteksi Jitter alami sensor GPS (Zero-Drift Heuristic)
    setTimeout(() => {
      navigator.geolocation.getCurrentPosition((pos2) => {
        const m2: GPSMeasurement = {
          latitude: pos2.coords.latitude,
          longitude: pos2.coords.longitude,
          accuracy: pos2.coords.accuracy,
          timestamp: pos2.timestamp
        }

        // Jalankan audit keamanan penuh
        const audit = runSecurityAudit(m1, m2)
        if (!audit.isValid) {
          console.error('[SECURITY] GPS validation failed:', audit.reason)
          securityError.value = audit.reason || 'Sensor GPS terindikasi tidak valid (Fake GPS).'
          isLoadingLocation.value = false
          isInRadius.value = false
          return
        }

        userLat = pos2.coords.latitude
        userLng = pos2.coords.longitude
        const finalLatLng = L.latLng(userLat, userLng)
        
        if (userMarker) {
          userMarker.setLatLng(finalLatLng)
        }

        // Proses lokasi kantor terdekat
        if (daftarKantor.value.length === 0) {
          isLoadingLocation.value = false
          namaLokasiTerdekat.value = 'Belum ada lokasi (Hubungi Admin)'
          isInRadius.value = false
          jarakUserKeKantor.value = 0
          return
        }

        let terdekat = daftarKantor.value[0], minJarak = Infinity
        daftarKantor.value.forEach(k => {
          const d = Math.round(L.latLng(k.lat, k.lng).distanceTo(finalLatLng))
          if (d < minJarak) { minJarak = d; terdekat = k; }
        })
        
        jarakUserKeKantor.value = minJarak
        isInRadius.value = minJarak <= (terdekat.radius + 10)
        namaLokasiTerdekat.value = terdekat.nama

        if (map) {
          map.fitBounds(L.latLngBounds([finalLatLng, L.latLng(terdekat.lat, terdekat.lng)]), { padding: [50, 50] })
        }
        isLoadingLocation.value = false

      }, () => {
        // Fallback jika pembacaan kedua gagal, namun tetap di-audit
        const audit = runSecurityAudit(null, m1)
        if (!audit.isValid) {
          securityError.value = audit.reason || 'Keamanan lokasi terblokir.'
          isLoadingLocation.value = false
          isInRadius.value = false
          return
        }

        processSingleLocation(m1)
      }, { enableHighAccuracy: true })

    }, 1200)

  }, () => { 
    isLoadingLocation.value = false
    namaLokasiTerdekat.value = 'Akses GPS Ditolak / Gagal'
  }, { enableHighAccuracy: true })
}

const processSingleLocation = (m: GPSMeasurement) => {
  userLat = m.latitude
  userLng = m.longitude
  const uLatLng = L.latLng(userLat, userLng)

  if (daftarKantor.value.length === 0) {
    isLoadingLocation.value = false
    namaLokasiTerdekat.value = 'Belum ada lokasi'
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
  
  if (map) {
    map.fitBounds(L.latLngBounds([uLatLng, L.latLng(terdekat.lat, terdekat.lng)]), { padding: [50, 50] })
  }
  isLoadingLocation.value = false
}

const handleClockOut = async () => {
  if (isSubmitting.value || securityError.value) return
  
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
    translateY.value = translateY.value > maxTranslateDown / 2 ? maxTranslateDown : 0
  }
}

const toggleSheet = () => { 
  if (!hasMoved.value) {
    translateY.value = translateY.value > 0 ? 0 : maxTranslateDown
  }
}

onBeforeUnmount(() => { 
  if (map) map.remove()
  clearInterval(timer) 
})

const jamSekarang = computed(() => waktuSekarang.value.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
</script>