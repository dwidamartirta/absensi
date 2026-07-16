<template>
  <div class="page-container pb-bottom-nav">

    <!-- Header -->
    <header class="page-header">
      <div class="page-header-inner">
        <div class="flex items-center gap-3">
          <div class="icon-badge icon-badge-blue h-10 w-10 rounded-xl">
            <BadgePlus :size="20" />
          </div>
          <div>
            <h1 class="text-[15px] font-black tracking-tight leading-none text-slate-900">Pengajuan Lembur</h1>
            <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Kelola Waktu Kerja</p>
          </div>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-md px-4 pt-5 pb-4">

      <!-- CTA Card -->
      <section class="card-glass relative overflow-hidden p-5 mb-5">
        <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400/8 blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-500/8 blur-3xl pointer-events-none"></div>

        <div class="relative z-10">
          <div class="flex items-center justify-between mb-5">
            <span class="text-[10px] font-black uppercase tracking-[0.15em] text-amber-600">Batas Pengajuan</span>
            <div class="rounded-xl bg-slate-800 px-3 py-1.5 text-center text-white">
              <p class="text-[9px] font-black uppercase tracking-widest opacity-60">{{ tanggalHariIni.split(',')[1]?.split(' ')[1] || '' }}</p>
              <p class="text-xs font-black leading-tight">{{ tanggalHariIni.split(',')[1] }}</p>
            </div>
          </div>

          <div class="flex flex-col items-center justify-center py-3 text-center mb-6">
            <div class="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-3 border border-amber-100">
              <BadgePlus :size="28" />
            </div>
            <h2 class="text-base font-black tracking-tight text-slate-900">Mulai Kerja Lembur?</h2>
            <p class="mt-1.5 text-xs font-medium text-slate-500 px-4 leading-relaxed">
              Pastikan Anda mengisi detail jam dan alasan lembur dengan benar untuk proses persetujuan.
            </p>
          </div>

          <RouterLink
            to="/lembur/form"
            class="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-amber-500 py-4 text-sm font-black text-white shadow-lg shadow-amber-200 transition-all hover:bg-amber-600 active:scale-[0.97]"
          >
            <BadgePlus :size="18" />
            ISI FORM LEMBUR
          </RouterLink>
        </div>
      </section>

      <!-- Riwayat -->
      <section class="card p-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Riwayat Pengajuan</p>
            <h3 class="text-sm font-black text-slate-900 mt-0.5">7 Terakhir</h3>
          </div>
          <RouterLink to="/riwayat-lembur"
            class="text-[11px] font-bold text-amber-600 hover:text-amber-500 flex items-center gap-1">
            Lihat semua <ChevronRight :size="13" />
          </RouterLink>
        </div>

        <!-- Skeleton -->
        <div v-if="isLoading" class="space-y-2.5">
          <div v-for="i in 3" :key="i" class="skeleton h-[60px] w-full rounded-xl"></div>
        </div>

        <!-- Error -->
        <div v-else-if="loadError" class="empty-state py-8">
          <p class="text-xs text-rose-500 font-medium">{{ loadError }}</p>
          <button @click="fetchRecent" class="mt-2 text-[11px] text-amber-500 font-bold underline">Coba lagi</button>
        </div>

        <!-- Empty -->
        <div v-else-if="recentList.length === 0" class="empty-state py-8">
          <div class="empty-state-icon w-14 h-14"><Clock3 :size="28" /></div>
          <p class="empty-state-desc">Belum ada pengajuan lembur.</p>
        </div>

        <!-- List -->
        <div v-else class="space-y-2">
          <div
            v-for="item in recentList"
            :key="item.id"
            @click="openDetail(item)"
            class="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-3.5 py-3 cursor-pointer hover:bg-amber-50 hover:border-amber-100 transition-all active:scale-[0.985]"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm">
                <span class="text-[8px] font-bold uppercase text-slate-400 leading-none">{{ formatMonth(item.date) }}</span>
                <span class="text-sm font-black text-slate-900 leading-tight">{{ formatDateNum(item.date) }}</span>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-slate-900 truncate">{{ formatDay(item.date) }}</p>
                <p class="text-[10px] text-slate-500 font-medium">
                  {{ item.start_time.slice(0,5) }} – {{ item.end_time.slice(0,5) }}
                  <span v-if="item.duration" class="text-amber-600 font-bold ml-1">({{ item.duration }}j)</span>
                </p>
              </div>
            </div>
            <span class="badge shrink-0 ml-2" :class="statusBadge(item.status)">{{ statusLabel(item.status) }}</span>
          </div>
        </div>
      </section>
    </div>

    <BottomNav />

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
            <p class="info-row-label mb-1.5">Alasan / Keterangan Pekerjaan</p>
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
import { ref, onMounted } from 'vue'
import { Clock3, BadgePlus, X, FileText, ExternalLink, Trash2, ChevronRight } from 'lucide-vue-next'
import BottomNav from '../components/BottomNav.vue'
import { getOvertimeList, cancelOvertime } from '../api/overtime'
import type { OvertimeRecord } from '../api/overtime'

const tanggalHariIni = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
const formatMonth = (d: string) => new Date(d).toLocaleString('id-ID', { month: 'short' })
const formatDateNum = (d: string) => new Date(d).getDate()
const formatDay = (d: string) => new Date(d).toLocaleString('id-ID', { weekday: 'long' })
const formatFullDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

const statusLabel = (s: string) => ({ pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' }[s] ?? s)
const statusBadge = (s: string) => ({
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-error',
}[s] ?? 'badge-neutral')

const getAttachmentUrl = (path: string) => {
  const base = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'
  return `${base}/storage/${path}`
}

const isLoading = ref(true)
const loadError = ref('')
const recentList = ref<OvertimeRecord[]>([])
const isModalOpen = ref(false)
const isCancelling = ref(false)
const selectedItem = ref<OvertimeRecord | null>(null)

const fetchRecent = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const res = await getOvertimeList()
    recentList.value = res.data.data.slice(0, 7)
  } catch {
    loadError.value = 'Gagal memuat data. Periksa koneksi Anda.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchRecent)

const openDetail = (item: OvertimeRecord) => { selectedItem.value = item; isModalOpen.value = true }
const closeModal = () => { isModalOpen.value = false; setTimeout(() => { selectedItem.value = null }, 300) }

const handleCancel = async () => {
  if (!selectedItem.value || isCancelling.value) return
  if (!confirm('Yakin ingin membatalkan pengajuan lembur ini?')) return
  isCancelling.value = true
  try {
    await cancelOvertime(selectedItem.value.id)
    recentList.value = recentList.value.filter(i => i.id !== selectedItem.value!.id)
    closeModal()
  } catch (e: any) {
    alert(e.response?.data?.message || 'Gagal membatalkan. Coba lagi.')
  } finally {
    isCancelling.value = false
  }
}
</script>