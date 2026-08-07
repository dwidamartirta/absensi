<template>
  <div class="page-container pb-bottom-nav">

    <!-- Header -->
    <header class="page-header">
      <div class="page-header-inner">
        <div class="flex items-center gap-3">
          <div class="icon-badge h-10 w-10 rounded-xl" :class="isApprover ? 'icon-badge-teal' : 'icon-badge-blue'">
            <component :is="isApprover ? ShieldCheck : BadgePlus" :size="20" />
          </div>
          <div>
            <h1 class="text-[15px] font-black tracking-tight leading-none text-slate-900">
              {{ isApprover ? 'Persetujuan Lembur' : 'Pengajuan Lembur' }}
            </h1>
            <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
              {{ isApprover ? 'Kelola Pengajuan Tim' : 'Kelola Waktu Kerja' }}
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- ========================================== -->
    <!-- APPROVER VIEW (HSE, IT, ADMIN, DIREKTUR)   -->
    <!-- ========================================== -->
    <div v-if="isApprover" class="mx-auto max-w-md px-4 pt-5 pb-4">

      <!-- Summary Cards -->
      <div class="grid grid-cols-3 gap-2.5 mb-5">
        <div class="card p-3 text-center">
          <div class="flex items-center justify-center mx-auto mb-1.5 h-9 w-9 rounded-xl bg-amber-50 border border-amber-100">
            <Clock3 :size="16" class="text-amber-500" />
          </div>
          <p class="text-lg font-black text-amber-600 leading-none">{{ pendingCount }}</p>
          <p class="text-[9px] font-bold uppercase text-slate-400 mt-1 tracking-wide">Menunggu</p>
        </div>
        <div class="card p-3 text-center">
          <div class="flex items-center justify-center mx-auto mb-1.5 h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100">
            <CheckCircle2 :size="16" class="text-emerald-500" />
          </div>
          <p class="text-lg font-black text-emerald-600 leading-none">{{ approvedCount }}</p>
          <p class="text-[9px] font-bold uppercase text-slate-400 mt-1 tracking-wide">Disetujui</p>
        </div>
        <div class="card p-3 text-center">
          <div class="flex items-center justify-center mx-auto mb-1.5 h-9 w-9 rounded-xl bg-rose-50 border border-rose-100">
            <XCircle :size="16" class="text-rose-500" />
          </div>
          <p class="text-lg font-black text-rose-600 leading-none">{{ rejectedCount }}</p>
          <p class="text-[9px] font-bold uppercase text-slate-400 mt-1 tracking-wide">Ditolak</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex bg-white rounded-2xl border border-slate-100 p-1 mb-4 shadow-sm">
        <button
          @click="activeTab = 'pending'"
          class="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
          :class="activeTab === 'pending'
            ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
            : 'text-slate-400 hover:text-slate-600'"
        >
          Pengajuan
          <span v-if="pendingCount > 0" class="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[9px] font-black"
            :class="activeTab === 'pending' ? 'bg-white/30 text-white' : 'bg-amber-100 text-amber-600'"
          >{{ pendingCount }}</span>
        </button>
        <button
          @click="activeTab = 'history'"
          class="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
          :class="activeTab === 'history'
            ? 'bg-slate-800 text-white shadow-md'
            : 'text-slate-400 hover:text-slate-600'"
        >
          Histori
        </button>
      </div>

      <!-- Filter (History only) -->
      <section v-if="activeTab === 'history'" class="card p-3.5 mb-4">
        <div class="flex items-center gap-2 mb-3">
          <Filter :size="14" class="text-teal-500" />
          <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Filter Data</span>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <select v-model="approvalFilters.status" @change="fetchApprovalData" class="input-base py-2 text-[11px]">
              <option value="">Semua</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
          <div>
            <select v-model="approvalFilters.month" @change="fetchApprovalData" class="input-base py-2 text-[11px]">
              <option value="">Bulan</option>
              <option v-for="m in months" :key="m.val" :value="m.val">{{ m.label }}</option>
            </select>
          </div>
          <div>
            <select v-model="approvalFilters.year" @change="fetchApprovalData" class="input-base py-2 text-[11px]">
              <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Loading -->
      <div v-if="isApprovalLoading" class="space-y-2.5">
        <div v-for="i in 4" :key="i" class="skeleton h-[76px] w-full rounded-2xl"></div>
      </div>

      <!-- Error -->
      <div v-else-if="approvalError" class="empty-state py-8">
        <div class="empty-state-icon w-14 h-14"><AlertCircle :size="28" /></div>
        <p class="text-xs text-rose-500 font-medium">{{ approvalError }}</p>
        <button @click="fetchApprovalData" class="mt-2 text-[11px] text-teal-500 font-bold underline">Coba lagi</button>
      </div>

      <!-- Empty -->
      <div v-else-if="displayedApprovalList.length === 0" class="empty-state py-10">
        <div class="empty-state-icon w-16 h-16">
          <component :is="activeTab === 'pending' ? Clock3 : CheckCircle2" :size="32" />
        </div>
        <h3 class="empty-state-title">{{ activeTab === 'pending' ? 'Tidak Ada Pengajuan' : 'Belum Ada Histori' }}</h3>
        <p class="empty-state-desc">
          {{ activeTab === 'pending'
              ? 'Semua pengajuan lembur sudah diproses.'
              : 'Belum ada data lembur yang diproses.' }}
        </p>
      </div>

      <!-- Approval List -->
      <div v-else class="space-y-2.5">
        <div
          v-for="item in displayedApprovalList"
          :key="item.id"
          @click="openApprovalDetail(item)"
          class="card p-4 cursor-pointer hover:border-teal-200 hover:bg-teal-50/30 active:scale-[0.98] transition-all"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3 min-w-0">
              <!-- Avatar Initials -->
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white text-xs font-black"
                :style="{ background: stringToColor(item.employee_name) }">
                {{ getInitials(item.employee_name) }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-slate-900 truncate">{{ item.employee_name }}</p>
                <p class="text-[10px] font-medium text-slate-400">{{ item.position }}</p>
                <p class="text-[10px] text-slate-500 mt-0.5 font-medium">
                  {{ formatFullDate(item.date) }} · {{ item.start_time?.toString().slice(0,5) }} – {{ item.end_time?.toString().slice(0,5) }}
                  <span v-if="item.duration" class="text-amber-600 font-bold ml-0.5">({{ item.duration }}j)</span>
                </p>
              </div>
            </div>
            <span class="badge shrink-0 ml-2" :class="statusBadge(item.status)">{{ statusLabel(item.status) }}</span>
          </div>

          <!-- Quick Actions (pending only) -->
          <div v-if="item.status === 'pending'" class="flex gap-2 mt-3 pt-3 border-t border-slate-100">
            <button
              @click.stop="handleQuickApprove(item)"
              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-600 active:scale-[0.96] transition-all"
            >
              <Check :size="14" /> Setujui
            </button>
            <button
              @click.stop="handleQuickReject(item)"
              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-bold shadow-sm shadow-rose-200 hover:bg-rose-600 active:scale-[0.96] transition-all"
            >
              <X :size="14" /> Tolak
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- REGULAR EMPLOYEE VIEW (unchanged)          -->
    <!-- ========================================== -->
    <div v-else class="mx-auto max-w-md px-4 pt-5 pb-4">

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

    <!-- ============================================ -->
    <!-- MODAL: Employee Detail (regular view)        -->
    <!-- ============================================ -->
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

    <!-- ============================================ -->
    <!-- MODAL: Approval Detail (approver view)       -->
    <!-- ============================================ -->
    <Transition name="modal">
      <div v-if="isApprovalModalOpen" class="modal-overlay" @click.self="closeApprovalModal">
        <div class="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-hide">
          <button @click="closeApprovalModal" class="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <X :size="16" />
          </button>

          <div class="mb-5 pr-10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-teal-600">Detail Pengajuan Lembur</p>
            <h3 class="text-base font-bold text-slate-900 mt-1">{{ selectedApprovalItem?.employee_name }}</h3>
            <p class="text-xs text-slate-400 font-medium">{{ selectedApprovalItem?.position }}</p>
            <span class="badge mt-2" :class="statusBadge(selectedApprovalItem?.status ?? '')">{{ statusLabel(selectedApprovalItem?.status ?? '') }}</span>
          </div>

          <!-- Date & Time Info -->
          <div class="card p-3.5 mb-3">
            <p class="info-row-label mb-1.5">Tanggal Lembur</p>
            <p class="text-sm font-bold text-slate-900">{{ formatDay(selectedApprovalItem?.date ?? '') }}, {{ formatFullDate(selectedApprovalItem?.date ?? '') }}</p>
          </div>

          <div class="grid grid-cols-3 gap-2.5 mb-3">
            <div class="card p-3 text-center">
              <p class="info-row-label">Mulai</p>
              <p class="info-row-value mt-1">{{ selectedApprovalItem?.start_time?.toString().slice(0,5) }}</p>
            </div>
            <div class="card p-3 text-center">
              <p class="info-row-label">Selesai</p>
              <p class="info-row-value mt-1">{{ selectedApprovalItem?.end_time?.toString().slice(0,5) }}</p>
            </div>
            <div class="rounded-2xl bg-amber-50 border border-amber-100 p-3 text-center">
              <p class="text-[10px] font-bold uppercase text-amber-400">Durasi</p>
              <p class="mt-1 text-sm font-bold text-amber-600">{{ selectedApprovalItem?.duration ? selectedApprovalItem.duration + ' Jam' : '-' }}</p>
            </div>
          </div>

          <div class="card p-3.5 mb-3">
            <p class="info-row-label mb-1.5">Alasan / Keterangan Pekerjaan</p>
            <p class="text-sm leading-relaxed text-slate-700 font-medium whitespace-pre-line">{{ selectedApprovalItem?.reason || '-' }}</p>
          </div>

          <div v-if="selectedApprovalItem?.attachment" class="card p-3.5 mb-3">
            <p class="info-row-label mb-2">Dokumen Lampiran</p>
            <a :href="getAttachmentUrl(selectedApprovalItem.attachment)" target="_blank" rel="noopener noreferrer"
              class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-200 hover:bg-teal-50 transition-colors">
              <div class="flex items-center gap-2.5">
                <div class="p-1.5 bg-teal-100 text-teal-600 rounded-lg"><FileText :size="15" /></div>
                <span class="text-xs font-semibold text-slate-700">Lihat Dokumen Terlampir</span>
              </div>
              <ExternalLink :size="13" class="text-slate-400" />
            </a>
          </div>

          <!-- Approve / Reject Buttons (pending only) -->
          <div v-if="selectedApprovalItem?.status === 'pending'" class="flex gap-2.5 mb-3">
            <button
              @click="handleModalApprove"
              :disabled="isProcessing"
              class="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-[0.96] transition-all disabled:opacity-60"
            >
              <span v-if="isProcessing && processAction === 'approve'" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              <Check v-else :size="16" />
              Setujui
            </button>
            <button
              @click="handleModalReject"
              :disabled="isProcessing"
              class="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-[0.96] transition-all disabled:opacity-60"
            >
              <span v-if="isProcessing && processAction === 'reject'" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              <X v-else :size="16" />
              Tolak
            </button>
          </div>

          <button @click="closeApprovalModal" class="w-full rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white hover:bg-slate-800 active:scale-[0.98] transition-all">
            Tutup
          </button>
        </div>
      </div>
    </Transition>

    <!-- ============================================ -->
    <!-- TOAST NOTIFICATION                           -->
    <!-- ============================================ -->
    <Transition name="toast">
      <div v-if="toastMsg" class="fixed top-5 left-1/2 -translate-x-1/2 z-[200] max-w-[90%]">
        <div class="flex items-center gap-2.5 rounded-2xl px-5 py-3.5 shadow-xl text-sm font-bold text-white"
          :class="toastType === 'success' ? 'bg-emerald-600' : 'bg-rose-600'">
          <component :is="toastType === 'success' ? CheckCircle2 : AlertCircle" :size="18" />
          {{ toastMsg }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Clock3, BadgePlus, X, FileText, ExternalLink, Trash2, ChevronRight,
  ShieldCheck, CheckCircle2, XCircle, Check, Filter, AlertCircle
} from 'lucide-vue-next'
import BottomNav from '../components/BottomNav.vue'
import { useAuthStore } from '../stores/authStore'
import { getOvertimeList, cancelOvertime, getApprovalList, approveOvertime, rejectOvertime } from '../api/overtime'
import type { OvertimeRecord, ApprovalOvertimeRecord } from '../api/overtime'

// =========================================================================
// Auth & Role Detection
// =========================================================================
const authStore = useAuthStore()

// Jabatan yang TIDAK BISA approve (hanya karyawan biasa / lapangan / gudang / driver)
const EXCLUDED_POSITIONS = ['GUDANG', 'DRIVER', 'SUPIR', 'SOPIR', 'LAPANGAN']

const isApprover = computed(() => {
  const posName = (authStore.user?.employee?.position?.name ?? '').toUpperCase()
  // Jika tidak punya jabatan/posisi kosong, anggap karyawan biasa
  if (!posName) return false
  
  // Jika jabatannya mengandung kata yang di-exclude, maka BUKAN approver
  const isExcluded = EXCLUDED_POSITIONS.some(p => posName.includes(p))
  return !isExcluded
})

// =========================================================================
// Shared Helpers
// =========================================================================
const tanggalHariIni = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
const formatMonth = (d: string) => new Date(d).toLocaleString('id-ID', { month: 'short' })
const formatDateNum = (d: string) => new Date(d).getDate()
const formatDay = (d: string) => new Date(d).toLocaleString('id-ID', { weekday: 'long' })
const formatFullDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

const statusLabel = (s: string) => ({ pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' }[s] ?? s)
const statusBadge = (s: string) => {
  const status = (s || '').toLowerCase()
  switch (status) {
    case 'approved': case 'disetujui': return 'badge-success'
    case 'pending': case 'menunggu': return 'badge-warning'
    case 'rejected': case 'ditolak': return 'badge-error'
    default: return 'badge-neutral'
  }
}

const getAttachmentUrl = (path: string) => {
  const base = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'
  return `${base}/storage/${path}`
}

const getInitials = (name: string) => {
  if (!name || name === '-') return '?'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const stringToColor = (str: string) => {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
    '#3b82f6', '#2563eb', '#7c3aed', '#a855f7', '#d946ef',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// =========================================================================
// Toast
// =========================================================================
const toastMsg = ref('')
const toastType = ref<'success' | 'error'>('success')
let toastTimer: ReturnType<typeof setTimeout>

const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
  clearTimeout(toastTimer)
  toastMsg.value = msg
  toastType.value = type
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 3000)
}

// =========================================================================
// Regular Employee — overtime list
// =========================================================================
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

// =========================================================================
// Approver — approval list
// =========================================================================
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 3 }, (_, i) => currentYear - i)
const months = [
  { val: 1, label: 'Jan' }, { val: 2, label: 'Feb' }, { val: 3, label: 'Mar' },
  { val: 4, label: 'Apr' }, { val: 5, label: 'Mei' }, { val: 6, label: 'Jun' },
  { val: 7, label: 'Jul' }, { val: 8, label: 'Agt' }, { val: 9, label: 'Sep' },
  { val: 10, label: 'Okt' }, { val: 11, label: 'Nov' }, { val: 12, label: 'Des' },
]

const activeTab = ref<'pending' | 'history'>('pending')
const isApprovalLoading = ref(true)
const approvalError = ref('')
const approvalList = ref<ApprovalOvertimeRecord[]>([])
const isApprovalModalOpen = ref(false)
const selectedApprovalItem = ref<ApprovalOvertimeRecord | null>(null)
const isProcessing = ref(false)
const processAction = ref<'approve' | 'reject'>('approve')

const approvalFilters = ref({ status: '' as string, month: '' as number | '', year: currentYear as number })

const pendingCount = computed(() => approvalList.value.filter(i => i.status === 'pending').length)
const approvedCount = computed(() => approvalList.value.filter(i => i.status === 'approved').length)
const rejectedCount = computed(() => approvalList.value.filter(i => i.status === 'rejected').length)

const displayedApprovalList = computed(() => {
  if (activeTab.value === 'pending') {
    return approvalList.value.filter(i => i.status === 'pending')
  }
  return approvalList.value.filter(i => i.status !== 'pending')
})

const fetchApprovalData = async () => {
  isApprovalLoading.value = true
  approvalError.value = ''
  try {
    const params: any = {}
    if (activeTab.value === 'history') {
      if (approvalFilters.value.status) params.status = approvalFilters.value.status
      if (approvalFilters.value.month) {
        params.month = approvalFilters.value.month
        params.year = approvalFilters.value.year
      }
    }
    const res = await getApprovalList(params)
    approvalList.value = res.data.data
  } catch {
    approvalError.value = 'Gagal memuat data. Periksa koneksi Anda.'
  } finally {
    isApprovalLoading.value = false
  }
}

const openApprovalDetail = (item: ApprovalOvertimeRecord) => {
  selectedApprovalItem.value = item
  isApprovalModalOpen.value = true
}

const closeApprovalModal = () => {
  isApprovalModalOpen.value = false
  setTimeout(() => { selectedApprovalItem.value = null }, 300)
}

const processApproval = async (item: ApprovalOvertimeRecord, action: 'approve' | 'reject') => {
  isProcessing.value = true
  processAction.value = action
  try {
    if (action === 'approve') {
      await approveOvertime(item.id)
    } else {
      await rejectOvertime(item.id)
    }
    // Update local data
    const idx = approvalList.value.findIndex(i => i.id === item.id)
    if (idx !== -1) {
      approvalList.value[idx] = { ...approvalList.value[idx], status: action === 'approve' ? 'approved' : 'rejected' }
    }
    showToast(action === 'approve' ? 'Pengajuan lembur disetujui' : 'Pengajuan lembur ditolak', 'success')
    closeApprovalModal()
  } catch (e: any) {
    showToast(e.response?.data?.message || 'Terjadi kesalahan.', 'error')
  } finally {
    isProcessing.value = false
  }
}

const handleQuickApprove = (item: ApprovalOvertimeRecord) => {
  if (confirm(`Setujui lembur ${item.employee_name}?`)) processApproval(item, 'approve')
}

const handleQuickReject = (item: ApprovalOvertimeRecord) => {
  if (confirm(`Tolak lembur ${item.employee_name}?`)) processApproval(item, 'reject')
}

const handleModalApprove = () => {
  if (selectedApprovalItem.value) processApproval(selectedApprovalItem.value, 'approve')
}

const handleModalReject = () => {
  if (selectedApprovalItem.value) processApproval(selectedApprovalItem.value, 'reject')
}

// =========================================================================
// Mount
// =========================================================================
onMounted(() => {
  if (isApprover.value) {
    fetchApprovalData()
  } else {
    fetchRecent()
  }
})
</script>