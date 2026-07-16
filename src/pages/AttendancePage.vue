<template>
  <div class="page-container pb-bottom-nav">
    <div class="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pt-6">

      <!-- Header -->
      <header class="mb-5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200/60 text-white font-black text-base select-none">
            {{ inisial }}
          </div>
          <div>
            <h1 class="text-[16px] font-black tracking-tight text-slate-900 leading-none">{{ namaKaryawan }}</h1>
            <p class="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{{ jabatan }}</p>
          </div>
        </div>
        <button
          @click="$router.push('/profile')"
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 shadow-sm active:scale-90 transition-all"
        >
          <UserRound :size="19" />
        </button>
      </header>

      <!-- Main Attendance Card -->
      <section class="card-glass relative overflow-hidden p-5 mb-5">
        <!-- Decorative blobs -->
        <div class="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-400/5 blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-blue-600/5 blur-3xl pointer-events-none"></div>

        <!-- Skeleton -->
        <div v-if="absensiState === 'loading'" class="space-y-5">
          <div class="flex items-start justify-between">
            <div class="skeleton h-4 w-24 rounded-lg"></div>
            <div class="skeleton h-8 w-24 rounded-xl"></div>
          </div>
          <div class="skeleton h-20 w-full rounded-2xl"></div>
          <div class="skeleton h-14 w-full rounded-2xl"></div>
        </div>

        <div v-else class="relative z-10">
          <!-- Status Row -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <span class="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">Status Kehadiran</span>
              <div class="flex items-center gap-2 mt-1">
                <div
                  class="pulse-dot h-2 w-2 rounded-full"
                  :class="absensiState === 'sudah_masuk' ? 'bg-teal-500' : 'bg-slate-300'"
                ></div>
                <span class="text-sm font-bold text-slate-900">
                  {{ absensiState === 'belum_masuk' ? 'Belum Absen' : absensiState === 'sudah_masuk' ? 'Sedang Bekerja' : 'Sudah Pulang' }}
                </span>
              </div>
            </div>
            <div class="rounded-2xl bg-slate-800 px-3.5 py-2 text-center text-white">
              <p class="text-[9px] font-bold opacity-50 uppercase tracking-widest">{{ tanggalHariIni.split(',')[0] }}</p>
              <p class="text-xs font-black leading-tight">{{ tanggalHariIni.split(',')[1] }}</p>
            </div>
          </div>

          <!-- Clock -->
          <div class="flex flex-col items-center justify-center py-4">
            <div class="flex items-baseline gap-0.5">
              <h2 class="text-5xl font-black tracking-tighter text-slate-900 tabular-nums">{{ jamSekarang }}</h2>
            </div>
            <p class="mt-3 text-xs font-medium text-slate-400 text-center px-6 leading-relaxed">
              {{ statusAbsensi }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div v-if="absensiState === 'belum_masuk'" class="mt-4">
            <RouterLink
              to="/absen-masuk"
              class="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-200 transition-all active:scale-[0.97]"
            >
              <Fingerprint :size="19" />
              ABSEN MASUK
            </RouterLink>
          </div>

          <div v-else-if="absensiState === 'sudah_masuk'" class="mt-4 space-y-3">
            <div class="grid grid-cols-2 gap-2.5">
              <div class="rounded-2xl bg-blue-50 border border-blue-100/70 p-3.5 text-center">
                <p class="text-[9px] font-bold uppercase text-blue-400 mb-1">Masuk Pukul</p>
                <p class="text-sm font-black text-blue-700">{{ jamMasukHariIni || '--:--' }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 border border-slate-100 p-3.5 text-center">
                <p class="text-[9px] font-bold uppercase text-slate-400 mb-1">Shift</p>
                <p class="text-sm font-black text-slate-700">Reguler</p>
              </div>
            </div>
            <RouterLink
              to="/absen-pulang"
              class="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-rose-500 py-4 text-sm font-black text-white shadow-lg shadow-rose-200 transition-all active:scale-[0.97]"
            >
              <LogOut :size="19" />
              ABSEN PULANG
            </RouterLink>
          </div>

          <div v-else-if="absensiState === 'sudah_pulang'" class="mt-4 rounded-2xl bg-teal-50 border border-teal-100 p-5 text-center">
            <div class="flex justify-center mb-3 text-teal-600">
              <CheckCircle2 :size="30" />
            </div>
            <h3 class="text-sm font-black text-teal-800 uppercase tracking-wide">Pekerjaan Selesai</h3>
            <p class="mt-1 text-xs text-teal-600 font-medium">Sampai jumpa di hari esok!</p>
            <div class="mt-4 flex items-center justify-center gap-8 border-t border-teal-100 pt-4">
              <div>
                <p class="text-[9px] font-bold uppercase text-teal-400 mb-0.5">Masuk</p>
                <p class="text-xs font-black text-teal-800">{{ jamMasukHariIni }}</p>
              </div>
              <div class="h-4 w-px bg-teal-200"></div>
              <div>
                <p class="text-[9px] font-bold uppercase text-teal-400 mb-0.5">Pulang</p>
                <p class="text-xs font-black text-teal-800">{{ jamPulangHariIni }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- History Section -->
      <section class="flex-1">
        <div class="mb-4 flex items-center justify-between px-1">
          <div>
            <h3 class="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase">Riwayat Absensi</h3>
            <p class="mt-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">7 Hari Terakhir</p>
          </div>
          <RouterLink
            to="/history-absensi"
            class="flex items-center gap-1 text-[10px] font-black text-blue-600 transition-all hover:gap-1.5"
          >
            LIHAT SEMUA <ChevronRight :size="13" />
          </RouterLink>
        </div>

        <!-- Skeleton -->
        <div v-if="isLoadingRiwayat" class="space-y-2.5">
          <div v-for="i in 3" :key="i" class="skeleton h-[72px] w-full rounded-2xl"></div>
        </div>

        <!-- Empty -->
        <div v-else-if="riwayatAbsensi.length === 0" class="empty-state">
          <div class="empty-state-icon">
            <CalendarCheck :size="30" />
          </div>
          <p class="empty-state-desc">Belum ada aktivitas absensi</p>
        </div>

        <!-- List -->
        <div v-else class="space-y-2.5">
          <button
            v-for="item in riwayatAbsensi.slice(0, 7)"
            :key="item.id"
            @click="openDetail(item)"
            class="group w-full flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm transition-all hover:border-blue-100 hover:bg-blue-50/20 active:scale-[0.985]"
          >
            <div class="flex items-center gap-3">
              <div
                :class="['late','Terlambat'].includes(item.status)
                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                  : 'bg-blue-50 text-blue-600 border-blue-100'"
                class="flex h-11 w-11 items-center justify-center rounded-xl shrink-0 border transition-all"
              >
                <div class="text-center leading-none">
                  <p class="text-[7px] font-black uppercase mb-0.5">{{ new Date(item.date).toLocaleDateString('id-ID', { month: 'short' }) }}</p>
                  <p class="text-sm font-black">{{ new Date(item.date).getDate() }}</p>
                </div>
              </div>
              <div class="text-left">
                <p class="text-xs font-black text-slate-900 uppercase tracking-wide">{{ new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long' }) }}</p>
                <div v-if="!['sakit','izin','cuti','sick','permit','leave'].includes(item.status)" class="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <Clock :size="9" />
                  <span>{{ formatJam(item.time_in) }} - {{ formatJam(item.time_out) }}</span>
                </div>
                <div v-else class="mt-0.5 text-[10px] font-bold text-slate-400">
                  {{ getStatusLabel(item.status) }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2.5">
              <span
                class="badge"
                :class="['late','Terlambat'].includes(item.status) ? 'badge-warning' : ['present','Hadir'].includes(item.status) ? 'badge-success' : 'badge-error'"
              >{{ getStatusLabel(item.status) }}</span>
              <ChevronRight :size="15" class="text-slate-300 group-hover:text-blue-400 transition-colors" />
            </div>
          </button>
        </div>
      </section>

      <!-- Modal Detail -->
      <Transition name="modal">
        <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
          <div class="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl relative max-h-[88vh] overflow-y-auto scrollbar-hide">
            <button @click="closeModal" class="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              <X :size="16" />
            </button>

            <div class="mb-5 pr-10">
              <p class="text-[10px] font-bold uppercase tracking-widest text-blue-600">Detail Kehadiran</p>
              <h3 class="text-base font-bold text-slate-900 mt-1">{{ selectedItem?.date ? formatTanggal(selectedItem.date) : '' }}</h3>
              <span
                class="badge mt-2"
                :class="['late','Terlambat'].includes(selectedItem?.status ?? '') ? 'badge-warning' : 'badge-info'"
              >{{ getStatusLabel(selectedItem?.status ?? '') }}</span>
            </div>

            <!-- Map -->
            <div v-if="['Hadir','present','Terlambat','late'].includes(selectedItem?.status ?? '') && selectedItem?.lat_in && selectedItem?.long_in"
              class="mb-5 overflow-hidden rounded-2xl border border-slate-100">
              <div id="dashboardDetailMap" class="h-40 w-full bg-slate-100 z-0 relative"></div>
              <div class="bg-slate-50 p-2.5 text-center border-t border-slate-100">
                <p class="text-[11px] font-bold text-slate-600 flex items-center justify-center gap-1.5">
                  <MapPin :size="13" class="text-blue-600" /> Lokasi Absen Masuk
                </p>
              </div>
            </div>

            <div class="space-y-3">
              <template v-if="!['sakit','izin','cuti','sick','permit','leave'].includes(selectedItem?.status ?? '')">
                <div class="grid grid-cols-2 gap-2.5">
                  <div class="card p-3.5">
                    <p class="info-row-label">Jam Kerja</p>
                    <p class="info-row-value mt-1">{{ formatJam(selectedItem?.time_in ?? null) }} - {{ formatJam(selectedItem?.time_out ?? null) }}</p>
                  </div>
                  <div class="card p-3.5">
                    <p class="info-row-label">Total Waktu</p>
                    <p class="info-row-value mt-1">
                      <span v-if="selectedItem?.work_hours">{{ Number(selectedItem.work_hours).toFixed(1) }} Jam</span>
                      <span v-else>-</span>
                    </p>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2.5">
                  <div class="card p-3.5">
                    <p class="info-row-label">Jumlah Trip</p>
                    <p class="info-row-value mt-1">{{ selectedItem?.daily_trip || '0' }} Trip</p>
                  </div>
                  <div class="card p-3.5">
                    <p class="info-row-label">Keterlambatan</p>
                    <p class="info-row-value mt-1" :class="Number(selectedItem?.late_minutes) > 0 ? 'text-amber-600' : ''">
                      {{ selectedItem?.late_minutes ? Math.floor(Number(selectedItem.late_minutes)) + ' Menit' : '-' }}
                    </p>
                  </div>
                </div>
              </template>

              <div class="card p-3.5">
                <p class="info-row-label">Keterangan / Laporan</p>
                <p class="mt-1.5 text-xs leading-relaxed text-slate-600 italic font-medium">"{{ selectedItem?.attendance_detail || 'Tidak ada catatan.' }}"</p>
              </div>

              <div v-if="selectedItem?.attachment" class="card p-3.5">
                <p class="info-row-label mb-2">Dokumen Lampiran</p>
                <a :href="getAttachmentUrl(selectedItem.attachment)" target="_blank" rel="noopener noreferrer"
                  class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                  <div class="flex items-center gap-2.5">
                    <div class="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><FileText :size="15" /></div>
                    <span class="text-xs font-semibold text-slate-700">Lihat Dokumen Terlampir</span>
                  </div>
                  <ExternalLink :size="13" class="text-slate-400" />
                </a>
              </div>
            </div>

            <button @click="closeModal"
              class="mt-5 w-full rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white hover:bg-slate-800 active:scale-[0.98] transition-all">
              Tutup Detail
            </button>
          </div>
        </div>
      </Transition>

      <BottomNav />
    </div>
  </div>
</template>

<script setup lang="ts">
import BottomNav from '../components/BottomNav.vue'
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  FileText, X, MapPin, ExternalLink, Fingerprint,
  CalendarCheck, Clock, LogOut, ChevronRight, CheckCircle2, UserRound
} from 'lucide-vue-next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAuthStore } from '../stores/authStore'
import { getAttendanceHistory, checkAttendanceStatus } from '../api/attendance'
import type { AttendanceRecord } from '../api/attendance'

const authStore = useAuthStore()

const namaKaryawan = computed(() => authStore.userName)
const inisial = computed(() => authStore.userInitials)
const jabatan = computed(() => authStore.userPosition)

const absensiState = ref<'loading' | 'belum_masuk' | 'sudah_masuk' | 'sudah_pulang'>('loading')
const jamMasukHariIni = ref<string | null>(null)
const jamPulangHariIni = ref<string | null>(null)
const riwayatAbsensi = ref<AttendanceRecord[]>([])
const isLoadingRiwayat = ref(true)
const waktuSekarang = ref(new Date())
let timer: number | undefined

onMounted(async () => {
  timer = window.setInterval(() => { waktuSekarang.value = new Date() }, 1000)

  try {
    const statusRes = await checkAttendanceStatus()
    if (statusRes.data?.success) {
      const d = statusRes.data.data
      absensiState.value = (d.state as any) || 'belum_masuk'
      if (d.time_in) jamMasukHariIni.value = d.time_in.substring(0, 5)
      if (d.time_out) jamPulangHariIni.value = d.time_out.substring(0, 5)
    }

    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(today.getDate() - 7)
    const sevenDaysAgoStr = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`

    const historyRes = await getAttendanceHistory({ start_date: sevenDaysAgoStr, end_date: todayStr })
    riwayatAbsensi.value = historyRes.data.data
  } catch (error) {
    console.error('Failed to load attendance data:', error)
  } finally {
    isLoadingRiwayat.value = false
  }
})

onBeforeUnmount(() => { if (timer) clearInterval(timer) })

const jamSekarang = computed(() => {
  const h = waktuSekarang.value.getHours().toString().padStart(2, '0')
  const m = waktuSekarang.value.getMinutes().toString().padStart(2, '0')
  const s = waktuSekarang.value.getSeconds().toString().padStart(2, '0')
  return `${h}:${m}:${s}`
})

const tanggalHariIni = computed(() =>
  waktuSekarang.value.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
)

const statusAbsensi = computed(() => {
  const jam = waktuSekarang.value.getHours()
  if (jam < 11) return 'Semangat Pagi! Jangan lupa absen masuk ya.'
  if (jam < 15) return 'Selamat Bekerja! Tetap fokus dan utamakan keselamatan.'
  if (jam < 18) return 'Sudah siap pulang? Jangan lupa absen keluar!'
  return 'Waktunya istirahat. Terima kasih atas kerja kerasmu!'
})

const formatTanggal = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

const formatJam = (timeStr: string | null) => (!timeStr ? '--:--' : timeStr.substring(0, 5))

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    present: 'Tepat Waktu', late: 'Terlambat', Hadir: 'Tepat Waktu', Terlambat: 'Terlambat',
    sakit: 'Sakit', izin: 'Izin', cuti: 'Cuti', sick: 'Sakit', permit: 'Izin', leave: 'Cuti',
  }
  return map[status] || status
}

const getAttachmentUrl = (path: string) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'
  return `${baseUrl}/storage/${path}`
}

const isModalOpen = ref(false)
const selectedItem = ref<AttendanceRecord | null>(null)
let detailMap: L.Map | null = null

const openDetail = async (item: AttendanceRecord) => {
  selectedItem.value = item
  isModalOpen.value = true
  if (['Hadir', 'present', 'Terlambat', 'late'].includes(item.status) && item.lat_in && item.long_in) {
    await nextTick()
    initDetailMap(item.lat_in, item.long_in)
  }
}

const closeModal = () => {
  if (detailMap) { detailMap.remove(); detailMap = null }
  isModalOpen.value = false
  setTimeout(() => { selectedItem.value = null }, 300)
}

const initDetailMap = (lat: number, lng: number) => {
  const el = document.getElementById('dashboardDetailMap')
  if (!el) return
  detailMap = L.map(el, { zoomControl: false, attributionControl: false, dragging: false, touchZoom: false, doubleClickZoom: false, scrollWheelZoom: false }).setView([lat, lng], 15)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(detailMap)
  L.marker([lat, lng], { icon: L.divIcon({ className: '', html: '<div style="width:22px;height:22px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25)"></div>', iconSize: [22, 22] }) }).addTo(detailMap)
}
</script>
