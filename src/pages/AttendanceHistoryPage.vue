<template>
  <div class="page-container pb-bottom-nav">

    <!-- Header -->
    <header class="page-header">
      <div class="page-header-inner">
        <div class="flex items-center gap-3">
          <div class="icon-badge icon-badge-blue h-10 w-10 rounded-xl">
            <Clock3 :size="20" />
          </div>
          <div>
            <h1 class="text-[15px] font-black tracking-tight leading-none text-slate-900">Riwayat Absensi</h1>
            <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Aktivitas Personal</p>
          </div>
        </div>
        <RouterLink to="/absensi" class="btn-back">
          <ArrowLeft :size="18" />
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto max-w-md px-4 pt-5">

      <!-- Filter Card -->
      <section class="card p-4 mb-4">
        <div class="flex items-center justify-between cursor-pointer" @click="isFilterOpen = !isFilterOpen">
          <div class="flex items-center gap-2 text-blue-600">
            <Filter :size="16" />
            <h2 class="text-sm font-bold">Filter Data</h2>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="filters.status.length > 0 || filters.startDate"
              class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">!</span>
            <ChevronDown :size="16" class="text-slate-400 transition-transform duration-200" :class="isFilterOpen ? 'rotate-180' : ''" />
          </div>
        </div>

        <div v-show="isFilterOpen" class="mt-4 space-y-4 border-t border-slate-100 pt-4">
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="label">Dari Tanggal</label>
              <input v-model="filters.startDate" type="date" class="input-base py-2.5 text-xs" />
            </div>
            <div>
              <label class="label">Sampai Tanggal</label>
              <input v-model="filters.endDate" type="date" class="input-base py-2.5 text-xs" />
            </div>
          </div>

          <div>
            <label class="label mb-2">Status Kehadiran</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="status in statusOptions"
                :key="status.id"
                @click="toggleStatus(status.id)"
                class="rounded-full px-3.5 py-1.5 text-xs font-bold transition-all border"
                :class="filters.status.includes(status.id)
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'"
              >{{ status.label }}</button>
            </div>
          </div>

          <button @click="resetFilter" class="text-[11px] font-bold text-rose-500 hover:underline">Reset Filter</button>
        </div>
      </section>

      <!-- List -->
      <section class="space-y-2.5">
        <!-- Skeleton -->
        <div v-if="isLoading" class="space-y-2.5">
          <div v-for="i in 5" :key="i" class="skeleton h-[68px] w-full rounded-2xl"></div>
        </div>

        <template v-else-if="filteredHistory.length > 0">
          <div
            v-for="item in filteredHistory"
            :key="item.id"
            @click="openDetail(item)"
            class="list-item"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100 shrink-0">
                <span class="text-[9px] font-bold uppercase leading-none">{{ formatMonth(item.date) }}</span>
                <span class="text-base font-black text-slate-900 leading-tight">{{ formatDate(item.date) }}</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-slate-900">{{ formatHari(item.date) }}</span>
                  <span class="h-1 w-1 rounded-full bg-slate-300"></span>
                  <span class="badge" :class="getStatusBadgeClass(item.status)">{{ getStatusLabel(item.status) }}</span>
                </div>
                <p v-if="!['sakit','izin','cuti','sick','permit','leave'].includes(item.status)" class="mt-0.5 text-xs font-medium text-slate-400">
                  {{ formatJam(item.time_in) }} - {{ formatJam(item.time_out) }}
                </p>
              </div>
            </div>
            <ChevronRight :size="16" class="text-slate-300" />
          </div>
        </template>

        <div v-else class="empty-state">
          <div class="empty-state-icon"><Filter :size="36" /></div>
          <h3 class="empty-state-title">Tidak Ada Data</h3>
          <p class="empty-state-desc">Sesuaikan filter untuk melihat riwayat lainnya.</p>
        </div>
      </section>
    </main>

    <!-- Modal Detail -->
    <Transition name="modal">
      <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
        <div class="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-hide">
          <button @click="closeModal" class="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <X :size="16" />
          </button>

          <div class="mb-5 pr-10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-blue-600">Detail Kehadiran</p>
            <h3 class="text-base font-bold text-slate-900 mt-1">{{ formatHari(selectedItem?.date ?? '') }}, {{ selectedItem?.date }}</h3>
            <span class="badge mt-2" :class="getStatusBadgeClass(selectedItem?.status ?? '')">{{ getStatusLabel(selectedItem?.status ?? '') }}</span>
          </div>

          <!-- Map -->
          <div v-if="['Hadir','present','Terlambat','late'].includes(selectedItem?.status ?? '') && selectedItem?.lat_in && selectedItem?.long_in"
            class="mb-5 overflow-hidden rounded-2xl border border-slate-100">
            <div id="detailMap" class="h-40 w-full bg-slate-100"></div>
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
                <div class="flex items-center gap-2.5 overflow-hidden">
                  <div class="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><FileText :size="15" /></div>
                  <span class="text-xs font-semibold text-slate-700 truncate">Lihat Dokumen Terlampir</span>
                </div>
                <ExternalLink :size="13" class="text-slate-400 shrink-0" />
              </a>
            </div>
          </div>

          <button @click="closeModal" class="mt-5 w-full rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white hover:bg-slate-800 active:scale-[0.98] transition-all">
            Tutup Detail
          </button>
        </div>
      </div>
    </Transition>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ArrowLeft, Filter, ChevronRight, X, MapPin, ChevronDown, Clock3, FileText, ExternalLink } from 'lucide-vue-next'
import BottomNav from '../components/BottomNav.vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getAttendanceHistory } from '../api/attendance'
import type { AttendanceRecord } from '../api/attendance'

const getAttachmentUrl = (path: string) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'
  return `${baseUrl}/storage/${path}`
}

const isFilterOpen = ref(false)
const isLoading = ref(true)

const statusOptions = [
  { id: 'Hadir', label: 'Hadir' },
  { id: 'Terlambat', label: 'Terlambat' },
  { id: 'sakit', label: 'Sakit' },
  { id: 'izin', label: 'Izin' },
  { id: 'cuti', label: 'Cuti' },
]

const filters = ref({ startDate: '', endDate: '', status: [] as string[] })

const toggleStatus = (id: string) => {
  const index = filters.value.status.indexOf(id)
  if (index === -1) filters.value.status.push(id)
  else filters.value.status.splice(index, 1)
}

const resetFilter = () => {
  filters.value = { startDate: '', endDate: '', status: [] }
  fetchHistory()
}

const allHistory = ref<AttendanceRecord[]>([])

const fetchHistory = async () => {
  isLoading.value = true
  try {
    const response = await getAttendanceHistory({
      start_date: filters.value.startDate || undefined,
      end_date: filters.value.endDate || undefined,
      status: filters.value.status.length > 0 ? filters.value.status.join(',') : undefined,
    })
    allHistory.value = response.data.data
  } catch {
    allHistory.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchHistory)

const filteredHistory = computed(() => {
  return allHistory.value.filter(item => {
    const dateMatch = (!filters.value.startDate || item.date >= filters.value.startDate) &&
                      (!filters.value.endDate || item.date <= filters.value.endDate)
    const statusMatch = filters.value.status.length === 0 || filters.value.status.includes(item.status)
    return dateMatch && statusMatch
  })
})

const getStatusBadgeClass = (status: string) => {
  const s = (status || '').toLowerCase()
  switch (s) {
    case 'present':
    case 'hadir':
      return 'badge-success'
    case 'late':
    case 'terlambat':
      return 'badge-warning'
    case 'sakit':
    case 'sick':
      return 'badge-pink'
    case 'izin':
    case 'permit':
      return 'badge-info'
    case 'cuti':
    case 'leave':
      return 'badge-purple'
    case 'alpa':
    case 'alpha':
    case 'absent':
      return 'badge-error'
    default:
      return 'badge-neutral'
  }
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    present: 'Tepat Waktu', late: 'Terlambat', Hadir: 'Tepat Waktu', Terlambat: 'Terlambat',
    sakit: 'Sakit', izin: 'Izin', cuti: 'Cuti', sick: 'Sakit', permit: 'Izin', leave: 'Cuti', alpa: 'Alpa', alpha: 'Alpa', absent: 'Alpa'
  }
  return map[status] || status
}

const formatMonth = (dateStr: string) => new Date(dateStr).toLocaleString('id-ID', { month: 'short' })
const formatDate = (dateStr: string) => new Date(dateStr).getDate()
const formatHari = (dateStr: string) => new Date(dateStr).toLocaleString('id-ID', { weekday: 'long' })
const formatJam = (timeStr: string | null) => timeStr ? timeStr.substring(0, 5) : '--:--'

const isModalOpen = ref(false)
const selectedItem = ref<AttendanceRecord | null>(null)
let detailMap: L.Map | null = null

const openDetail = async (item: AttendanceRecord) => {
  selectedItem.value = item
  isModalOpen.value = true
  await nextTick()
  if (item.lat_in && item.long_in) initDetailMap(item.lat_in, item.long_in)
}

const closeModal = () => {
  if (detailMap) { detailMap.remove(); detailMap = null }
  isModalOpen.value = false
  setTimeout(() => { selectedItem.value = null }, 300)
}

const initDetailMap = (lat: number, lng: number) => {
  const el = document.getElementById('detailMap')
  if (!el) return
  detailMap = L.map(el, { zoomControl: false, attributionControl: false, dragging: false, touchZoom: false, doubleClickZoom: false, scrollWheelZoom: false }).setView([lat, lng], 15)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(detailMap)
  L.marker([lat, lng], { icon: L.divIcon({ className: '', html: '<div style="width:22px;height:22px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25)"></div>', iconSize: [22, 22] }) }).addTo(detailMap)
}
</script>