<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 pb-24">
    <!-- Header -->
    <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4">
      <div class="mx-auto flex max-w-md items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Briefcase :size="20" />
          </div>
          <div>
            <h1 class="text-base font-black tracking-tight leading-none text-slate-900">Tugas Harian</h1>
            <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Jadwal Operasional</p>
          </div>
        </div>
        <button @click="router.back()" class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 active:scale-90 transition-all">
          <ArrowLeft :size="18" />
        </button>
      </div>
    </header>

    <main class="mx-auto max-w-md px-4 pt-6">
      <!-- Welcome Card -->
      <div class="relative mb-8 overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-700 to-blue-500 p-6 text-white shadow-xl shadow-blue-200">
        <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div class="relative z-10">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/80 mb-2">Semangat Bekerja!</p>
          <h2 class="text-xl font-black leading-tight">Halo, {{ authStore.userName.split(' ')[0] }}</h2>
          <p class="mt-2 text-xs font-medium text-blue-50/80 leading-relaxed">
            Periksa jadwal pengangkutan Anda hari ini dan pastikan semua tugas terselesaikan.
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="h-32 w-full animate-pulse rounded-3xl bg-slate-200"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="tasks.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-300">
          <ClipboardList :size="40" />
        </div>
        <h3 class="text-base font-bold text-slate-900">Belum Ada Tugas</h3>
        <p class="mt-1 text-sm text-slate-500 px-10">
          Saat ini belum ada tugas pengangkutan yang ditugaskan kepada Anda.
        </p>
      </div>

      <!-- Task List -->
      <div v-else class="space-y-4">
        <div 
          v-for="task in tasks" 
          :key="task.id"
          class="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Truck :size="24" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" :class="statusBadge(task.status)">
                  {{ statusLabel(task.status) }}
                </span>
                <span class="text-[11px] font-bold text-slate-400">{{ formatTime(task.time) }}</span>
              </div>
              <h4 class="mt-1.5 text-sm font-bold text-slate-900 truncate">{{ task.title }}</h4>
              <p class="text-xs font-medium text-slate-500 mt-0.5">{{ task.client_name }}</p>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            <div class="flex items-center gap-2">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                <CreditCard :size="14" />
              </div>
              <div>
                <p class="text-[9px] font-bold uppercase text-slate-400 leading-none">Nopol</p>
                <p class="text-[11px] font-bold text-slate-700 mt-0.5">{{ task.details.nopol || '-' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                <Tag :size="14" />
              </div>
              <div>
                <p class="text-[9px] font-bold uppercase text-slate-400 leading-none">Kode Limbah</p>
                <p class="text-[11px] font-bold text-slate-700 mt-0.5">{{ task.details.waste_code || '-' }}</p>
              </div>
            </div>
          </div>

          <div class="mt-4 flex gap-2">
            <button 
              v-if="task.status === 'planned'"
              @click="handleUpdateStatus(task.id, 'confirmed')"
              class="flex-1 rounded-xl bg-blue-500 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-600 active:scale-95"
            >
              Konfirmasi
            </button>
            <button 
              v-if="task.status === 'confirmed'"
              @click="handleUpdateStatus(task.id, 'completed')"
              class="flex-1 rounded-xl bg-teal-500 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-teal-600 active:scale-95"
            >
              Selesaikan
            </button>
            <button 
              @click="openDetail(task)"
              class="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200"
            >
              Detail
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal Detail Task -->
    <Transition name="modal">
      <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm px-4 pb-6 sm:items-center sm:pb-0">
        <div class="absolute inset-0" @click="closeModal"></div>
        <div class="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto scrollbar-hide">
          <button @click="closeModal" class="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <X :size="18" />
          </button>

          <div class="mb-5 pr-10">
            <span class="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" :class="statusBadge(selectedTask?.status ?? '')">
              {{ statusLabel(selectedTask?.status ?? '') }}
            </span>
            <h3 class="text-lg font-bold text-slate-900 mt-2">{{ selectedTask?.title }}</h3>
            <p class="text-xs text-slate-500 mt-1">{{ selectedTask?.client_name }}</p>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p class="text-[10px] font-bold uppercase text-slate-400">Waktu Mulai</p>
                <p class="mt-1 text-sm font-bold text-slate-900">{{ formatDate(selectedTask?.date) }} • {{ formatTime(selectedTask?.time) }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p class="text-[10px] font-bold uppercase text-slate-400">Nomor Polisi</p>
                <p class="mt-1 text-sm font-bold text-slate-900">{{ selectedTask?.details.nopol || '-' }}</p>
              </div>
            </div>

            <div class="rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <p class="text-[10px] font-bold uppercase text-slate-400 mb-2">Catatan Tugas</p>
              <p class="text-sm leading-relaxed text-slate-700 font-medium italic">
                "{{ selectedTask?.notes || 'Tidak ada catatan tambahan.' }}"
              </p>
            </div>

            <div class="rounded-2xl bg-blue-50 p-4 border border-blue-100">
              <p class="text-[10px] font-bold uppercase text-blue-400 mb-2">Detail Pengangkutan</p>
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs font-semibold">
                  <span class="text-slate-500">Kode Limbah:</span>
                  <span class="text-blue-700">{{ selectedTask?.details.waste_code || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <button @click="closeModal" class="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98]">
            Tutup
          </button>
        </div>
      </div>
    </Transition>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { getDailyTasks, updateTaskStatus, type DailyTask } from '../api/dailyTask'
import { useToast } from '../composables/useToast'
import BottomNav from '../components/BottomNav.vue'
import { 
  ArrowLeft, Truck, ClipboardList, CreditCard, Tag, X
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const tasks = ref<DailyTask[]>([])
const isLoading = ref(true)
const isModalOpen = ref(false)
const selectedTask = ref<DailyTask | null>(null)

const fetchData = async () => {
  isLoading.value = true
  try {
    const res = await getDailyTasks()
    tasks.value = res.data.data
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    showToast('Gagal memuat tugas harian.', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleUpdateStatus = async (id: number, status: string) => {
  try {
    await updateTaskStatus(id, status)
    showToast('Status tugas diperbarui.', 'success')
    fetchData()
  } catch (error) {
    showToast('Gagal memperbarui status.', 'error')
  }
}

const statusBadge = (s: string) => {
  const map: any = {
    planned: 'bg-blue-50 text-blue-600 border border-blue-100',
    confirmed: 'bg-teal-50 text-teal-600 border border-teal-100',
    completed: 'bg-slate-100 text-slate-500 border border-slate-200',
    cancelled: 'bg-rose-50 text-rose-600 border border-rose-100',
    requested: 'bg-amber-50 text-amber-600 border border-amber-100',
  }
  return map[s] || 'bg-slate-50 text-slate-500'
}

const statusLabel = (s: string) => {
  const map: any = {
    planned: 'Direncanakan',
    confirmed: 'Berjalan',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    requested: 'Menunggu',
  }
  return map[s] || s
}

const formatDate = (d?: string) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

const formatTime = (t?: string) => t || '--:--'

const openDetail = (task: DailyTask) => {
  selectedTask.value = task
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

onMounted(fetchData)
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .max-w-md, .modal-leave-to .max-w-md { transform: translateY(100px) scale(0.95); }
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
