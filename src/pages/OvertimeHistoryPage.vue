<template>
  <div class="page-container pb-bottom-nav">

    <!-- Header -->
    <header class="page-header">
      <div class="page-header-inner">
        <RouterLink to="/lembur" class="btn-back">
          <ArrowLeft :size="18" />
        </RouterLink>
        <div>
          <h1 class="text-[15px] font-black tracking-tight leading-none text-slate-900">Riwayat Lembur</h1>
          <p class="text-[10px] font-bold text-slate-400 mt-1">Semua pengajuan lembur Anda</p>
        </div>
        <div class="w-10"></div>
      </div>
    </header>

    <main class="mx-auto max-w-md px-4 pt-5">

      <!-- Filter -->
      <section class="card p-4 mb-4">
        <div class="flex items-center justify-between cursor-pointer" @click="isFilterOpen = !isFilterOpen">
          <div class="flex items-center gap-2 text-amber-600">
            <Filter :size="16" />
            <h2 class="text-sm font-bold">Filter Data</h2>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="hasActiveFilter" class="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-600">!</span>
            <ChevronDown :size="16" class="text-slate-400 transition-transform duration-200" :class="isFilterOpen ? 'rotate-180' : ''" />
          </div>
        </div>

        <div v-show="isFilterOpen" class="mt-4 space-y-4 border-t border-slate-100 pt-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Bulan</label>
              <select v-model="filters.month" class="input-base py-2.5 text-xs">
                <option value="">Semua</option>
                <option v-for="m in months" :key="m.val" :value="m.val">{{ m.label }}</option>
              </select>
            </div>
            <div>
              <label class="label">Tahun</label>
              <select v-model="filters.year" class="input-base py-2.5 text-xs">
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="label mb-2">Status</label>
            <div class="flex flex-wrap gap-2">
              <button v-for="opt in statusOptions" :key="opt.id" @click="toggleStatus(opt.id)"
                class="rounded-full px-3.5 py-1.5 text-xs font-bold transition-all border"
                :class="filters.status.includes(opt.id)
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'"
              >{{ opt.label }}</button>
            </div>
          </div>

          <div class="flex items-center gap-4 pt-1">
            <button @click="applyFilter" class="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white hover:bg-amber-400 transition-colors">
              Terapkan Filter
            </button>
            <button @click="resetFilter" class="text-xs font-bold text-rose-500 underline">Reset</button>
          </div>
        </div>
      </section>

      <!-- Skeleton -->
      <div v-if="isLoading" class="space-y-2.5">
        <div v-for="i in 5" :key="i" class="skeleton h-[72px] w-full rounded-2xl"></div>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="empty-state">
        <div class="empty-state-icon"><AlertCircle :size="32" /></div>
        <h3 class="empty-state-title">Gagal Memuat Data</h3>
        <p class="empty-state-desc">{{ loadError }}</p>
        <button @click="fetchData" class="mt-4 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-400">
          Coba Lagi
        </button>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredList.length === 0" class="empty-state">
        <div class="empty-state-icon"><Clock3 :size="32" /></div>
        <h3 class="empty-state-title">Tidak Ada Data</h3>
        <p class="empty-state-desc">Belum ada pengajuan lembur{{ hasActiveFilter ? ' sesuai filter ini' : '' }}.</p>
      </div>

      <!-- List -->
      <section v-else class="space-y-2.5">
        <div v-for="item in filteredList" :key="item.id" @click="openDetail(item)"
          class="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:border-amber-100 hover:bg-amber-50/20 active:scale-[0.98] transition-all cursor-pointer">
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
              <span class="text-[9px] font-bold uppercase text-slate-400">{{ formatMonth(item.date) }}</span>
              <span class="text-lg font-black text-slate-900 leading-none">{{ formatDateNum(item.date) }}</span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-bold text-slate-900">{{ formatDay(item.date) }}</span>
              </div>
              <p class="mt-0.5 text-xs font-medium text-slate-500">
                {{ item.start_time.slice(0,5) }} – {{ item.end_time.slice(0,5) }}
                <span v-if="item.duration" class="text-amber-500 font-bold ml-1">· {{ item.duration }}j</span>
              </p>
              <p class="mt-0.5 text-[11px] text-slate-400 truncate max-w-[160px]">{{ item.reason }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 ml-2">
            <span class="badge" :class="statusBadge(item.status)">{{ statusLabel(item.status) }}</span>
            <ChevronRight :size="15" class="text-slate-300" />
          </div>
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
            <p class="text-[10px] font-bold uppercase tracking-widest text-amber-600">Detail Lembur</p>
            <h3 class="text-base font-bold text-slate-900 mt-1">{{ formatDay(selectedItem?.date ?? '') }}, {{ formatFullDate(selectedItem?.date ?? '') }}</h3>
            <span class="badge mt-2" :class="statusBadge(selectedItem?.status ?? '')">{{ statusLabel(selectedItem?.status ?? '') }}</span>
          </div>

          <div class="grid grid-cols-3 gap-2.5 mb-4">
            <div class="card p-3 text-center">
              <p class="info-row-label">Mulai</p>
              <p class="info-row-value mt-1">{{ selectedItem?.start_time?.slice(0,5) }}</p>
            </div>
            <div class="card p-3 text-center">
              <p class="info-row-label">Selesai</p>
              <p class="info-row-value mt-1">{{ selectedItem?.end_time?.slice(0,5) }}</p>
            </div>
            <div class="rounded-2xl bg-amber-50 border border-amber-100 p-3 text-center">
              <p class="text-[10px] font-bold uppercase text-amber-400">Durasi</p>
              <p class="mt-1 text-sm font-bold text-amber-600">{{ selectedItem?.duration ? selectedItem.duration + ' Jam' : '-' }}</p>
            </div>
          </div>

          <div class="card p-3.5 mb-3">
            <p class="info-row-label mb-1.5">Alasan / Keterangan</p>
            <p class="text-sm leading-relaxed text-slate-700 font-medium whitespace-pre-line">{{ selectedItem?.reason || '-' }}</p>
          </div>

          <div v-if="selectedItem?.attachment" class="card p-3.5 mb-3">
            <p class="info-row-label mb-2">Dokumen Lampiran</p>
            <a :href="getAttachmentUrl(selectedItem.attachment)" target="_blank" rel="noopener noreferrer"
              class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-200 hover:bg-amber-50 transition-colors">
              <div class="flex items-center gap-2.5">
                <div class="p-1.5 bg-amber-100 text-amber-600 rounded-lg"><FileText :size="15" /></div>
                <span class="text-xs font-semibold text-slate-700">Lihat Dokumen Terlampir</span>
              </div>
              <ExternalLink :size="13" class="text-slate-400" />
            </a>
          </div>

          <button
            v-if="selectedItem?.status === 'pending'"
            @click="handleCancel"
            :disabled="isCancelling"
            class="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 py-3.5 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all disabled:opacity-60"
          >
            <span v-if="isCancelling" class="h-4 w-4 animate-spin rounded-full border-2 border-rose-400 border-t-transparent"></span>
            <Trash2 v-else :size="15" />
            {{ isCancelling ? 'Membatalkan...' : 'Batalkan Pengajuan' }}
          </button>

          <button @click="closeModal" class="w-full rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white hover:bg-slate-800 active:scale-[0.98] transition-all">
            Tutup
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, Filter, ChevronDown, ChevronRight, X, Clock3, FileText, ExternalLink, AlertCircle, Trash2 } from 'lucide-vue-next'
import { getOvertimeList, cancelOvertime } from '../api/overtime'
import type { OvertimeRecord } from '../api/overtime'

const formatMonth = (d: string) => new Date(d).toLocaleString('id-ID', { month: 'short' })
const formatDateNum = (d: string) => new Date(d).getDate()
const formatDay = (d: string) => new Date(d).toLocaleString('id-ID', { weekday: 'long' })
const formatFullDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

const statusLabel = (s: string) => ({ pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' }[s] ?? s)
const statusBadge = (s: string) => ({ pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-error' }[s] ?? 'badge-neutral')
const getAttachmentUrl = (path: string) => {
  const base = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'
  return `${base}/storage/${path}`
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 3 }, (_, i) => currentYear - i)
const months = [
  { val: 1, label: 'Januari' }, { val: 2, label: 'Februari' }, { val: 3, label: 'Maret' },
  { val: 4, label: 'April' }, { val: 5, label: 'Mei' }, { val: 6, label: 'Juni' },
  { val: 7, label: 'Juli' }, { val: 8, label: 'Agustus' }, { val: 9, label: 'September' },
  { val: 10, label: 'Oktober' }, { val: 11, label: 'November' }, { val: 12, label: 'Desember' },
]
const statusOptions = [
  { id: 'pending', label: 'Menunggu' }, { id: 'approved', label: 'Disetujui' }, { id: 'rejected', label: 'Ditolak' },
]

const isLoading = ref(true)
const loadError = ref('')
const allData = ref<OvertimeRecord[]>([])
const isFilterOpen = ref(false)
const isModalOpen = ref(false)
const isCancelling = ref(false)
const selectedItem = ref<OvertimeRecord | null>(null)
const filters = ref({ month: '' as number | '', year: currentYear as number, status: [] as string[] })
const hasActiveFilter = computed(() => filters.value.month !== '' || filters.value.status.length > 0)
const filteredList = computed(() => {
  if (filters.value.status.length === 0) return allData.value
  return allData.value.filter(i => filters.value.status.includes(i.status))
})

const fetchData = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const params: any = {}
    if (filters.value.month) { params.month = filters.value.month; params.year = filters.value.year }
    const res = await getOvertimeList(params)
    allData.value = res.data.data
  } catch {
    loadError.value = 'Gagal memuat data. Periksa koneksi Anda.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchData)

const toggleStatus = (id: string) => {
  const idx = filters.value.status.indexOf(id)
  if (idx === -1) filters.value.status.push(id)
  else filters.value.status.splice(idx, 1)
}
const applyFilter = () => { isFilterOpen.value = false; fetchData() }
const resetFilter = () => { filters.value = { month: '', year: currentYear, status: [] }; fetchData() }
const openDetail = (item: OvertimeRecord) => { selectedItem.value = item; isModalOpen.value = true }
const closeModal = () => { isModalOpen.value = false; setTimeout(() => { selectedItem.value = null }, 300) }

const handleCancel = async () => {
  if (!selectedItem.value || isCancelling.value) return
  if (!confirm('Yakin ingin membatalkan pengajuan lembur ini?')) return
  isCancelling.value = true
  try {
    await cancelOvertime(selectedItem.value.id)
    allData.value = allData.value.filter(i => i.id !== selectedItem.value!.id)
    closeModal()
  } catch (e: any) {
    alert(e.response?.data?.message || 'Gagal membatalkan. Coba lagi.')
  } finally {
    isCancelling.value = false
  }
}
</script>