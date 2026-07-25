<template>
  <div class="page-container pb-bottom-nav">
    <!-- Header -->
    <header class="page-header">
      <div class="page-header-inner">
        <div class="flex items-center gap-3">
          <div class="icon-badge icon-badge-blue h-10 w-10 rounded-xl">
            <Users :size="20" />
          </div>
          <div>
            <h1 class="text-[15px] font-black tracking-tight leading-none text-slate-900">Absensi Tim Operasional</h1>
            <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Gudang, Driver, CS & Security</p>
          </div>
        </div>
        <RouterLink to="/absensi" class="btn-back">
          <ArrowLeft :size="18" />
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto max-w-md px-4 pt-5">
      <!-- Date Selector Card -->
      <section class="card p-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <label class="label mb-1 flex items-center gap-1.5 text-slate-500">
              <Calendar :size="14" class="text-blue-600" />
              <span>Tanggal Pemantauan</span>
            </label>
            <input
              v-model="selectedDate"
              type="date"
              class="input-base w-full py-2.5 px-3.5 text-xs font-semibold text-slate-800"
              @change="fetchData"
            />
          </div>
          <button
            @click="setToday"
            class="shrink-0 rounded-2xl bg-blue-50 border border-blue-100 px-3.5 py-3 text-center transition-all active:scale-95 hover:bg-blue-100/70"
          >
            <p class="text-[9px] font-extrabold text-blue-600 uppercase tracking-wider leading-none">Hari Ini</p>
            <p class="text-xs font-black text-blue-800 mt-1 leading-none">{{ formatDayShort(getLocalDateString()) }}</p>
          </button>
        </div>
      </section>

      <!-- Summary Statistics Grid -->
      <section class="mb-4 grid grid-cols-4 gap-2">
        <div
          @click="activeTab = 'masuk'"
          class="cursor-pointer rounded-2xl border p-2.5 text-center transition-all active:scale-95"
          :class="activeTab === 'masuk' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20' : 'bg-white border-slate-100 hover:border-emerald-200'"
        >
          <div class="flex items-center justify-center text-emerald-600 mb-1">
            <UserCheck :size="16" />
          </div>
          <p class="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Masuk</p>
          <p class="text-base font-black text-emerald-700 leading-tight mt-0.5">{{ summary.present }}</p>
        </div>

        <div
          @click="activeTab = 'izin_sakit'"
          class="cursor-pointer rounded-2xl border p-2.5 text-center transition-all active:scale-95"
          :class="activeTab === 'izin_sakit' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20' : 'bg-white border-slate-100 hover:border-amber-200'"
        >
          <div class="flex items-center justify-center text-amber-600 mb-1">
            <FileText :size="16" />
          </div>
          <p class="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Izin/Cuti</p>
          <p class="text-base font-black text-amber-700 leading-tight mt-0.5">{{ summary.sick + summary.permit + summary.leave }}</p>
        </div>

        <div
          @click="activeTab = 'absent'"
          class="cursor-pointer rounded-2xl border p-2.5 text-center transition-all active:scale-95"
          :class="activeTab === 'absent' ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/20' : 'bg-white border-slate-100 hover:border-rose-200'"
        >
          <div class="flex items-center justify-center text-rose-600 mb-1">
            <UserX :size="16" />
          </div>
          <p class="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Belum Absen</p>
          <p class="text-base font-black text-rose-700 leading-tight mt-0.5">{{ summary.absent }}</p>
        </div>

        <div
          @click="activeTab = 'all'"
          class="cursor-pointer rounded-2xl border p-2.5 text-center transition-all active:scale-95"
          :class="activeTab === 'all' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/20' : 'bg-white border-slate-100 hover:border-blue-200'"
        >
          <div class="flex items-center justify-center text-blue-600 mb-1">
            <Users :size="16" />
          </div>
          <p class="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Total</p>
          <p class="text-base font-black text-blue-700 leading-tight mt-0.5">{{ summary.total }}</p>
        </div>
      </section>

      <!-- Search & Filter Tab Section -->
      <section class="mb-4 space-y-3">
        <!-- Search Bar -->
        <div class="relative flex items-center">
          <span class="absolute left-3.5 text-slate-400">
            <Search :size="15" />
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama karyawan, NIK, atau posisi..."
            class="input-base w-full py-2.5 pl-10 pr-10 text-xs"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors"
          >
            <X :size="12" />
          </button>
        </div>

        <!-- Filter Pills -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="rounded-full px-3 py-1.5 text-[11px] font-bold transition-all shrink-0 border"
            :class="activeTab === tab.id
              ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'"
          >
            {{ tab.label }}
          </button>
        </div>
      </section>

      <!-- Employee List Section -->
      <section class="space-y-3">
        <!-- Skeleton Loading -->
        <div v-if="isLoading" class="space-y-2.5">
          <div v-for="i in 5" :key="i" class="skeleton h-20 w-full rounded-2xl"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="card p-5 text-center border-rose-100 bg-rose-50/50">
          <div class="flex justify-center text-rose-500 mb-3">
            <AlertTriangle :size="32" />
          </div>
          <h3 class="text-sm font-bold text-rose-800">Gagal Memuat Data</h3>
          <p class="text-xs text-rose-600 mt-1">{{ error }}</p>
          <button
            @click="fetchData"
            class="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
          >
            Coba Lagi
          </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredEmployees.length === 0" class="card p-8 text-center text-slate-500">
          <div class="flex justify-center text-slate-300 mb-3">
            <Search :size="32" />
          </div>
          <h3 class="text-xs font-bold text-slate-700">Tidak Ada Data Karyawan</h3>
          <p class="text-[11px] text-slate-400 mt-1">Tidak ada karyawan yang sesuai dengan kriteria filter.</p>
        </div>

        <!-- Employee Cards -->
        <div v-else class="space-y-2.5">
          <div
            v-for="employee in filteredEmployees"
            :key="employee.employee_id"
            @click="openModal(employee)"
            class="group w-full flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm transition-all hover:border-blue-100 hover:bg-blue-50/10 active:scale-[0.99] cursor-pointer"
          >
            <div class="flex items-center gap-3 overflow-hidden">
              <!-- Avatar -->
              <div
                class="flex h-11 w-11 items-center justify-center rounded-2xl font-black text-xs shrink-0 transition-colors border"
                :class="getAvatarClass(employee.status)"
              >
                {{ getInitials(employee.full_name) }}
              </div>

              <!-- Employee Details -->
              <div class="text-left overflow-hidden">
                <div class="flex items-center gap-2">
                  <h3 class="text-xs font-black text-slate-900 leading-tight truncate">{{ employee.full_name }}</h3>
                </div>
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1 leading-none">
                  {{ employee.position_name || 'Karyawan' }}
                </p>

                <!-- Clock / Status detail line -->
                <div class="flex items-center gap-2 mt-1.5 text-[10px] font-medium text-slate-400">
                  <span v-if="['hadir','present','terlambat','late'].includes(employee.status)" class="flex items-center gap-1 text-slate-500">
                    <Clock :size="10" class="text-blue-500" />
                    <span>In: {{ formatTime(employee.time_in) }}</span>
                    <span v-if="employee.time_out" class="ml-1">Out: {{ formatTime(employee.time_out) }}</span>
                  </span>
                  <span v-else-if="['sakit','sick','izin','permit','cuti','leave'].includes(employee.status)" class="text-slate-500 truncate max-w-[170px]">
                    "{{ employee.attendance_detail || 'Pengajuan ' + getStatusLabel(employee.status) }}"
                  </span>
                  <span v-else class="text-slate-400">
                    Belum Absen
                  </span>
                </div>
              </div>
            </div>

            <!-- Status Badge & Action -->
            <div class="flex items-center gap-2 shrink-0 ml-2">
              <span class="badge" :class="getStatusBadgeClass(employee.status)">
                {{ getStatusLabel(employee.status) }}
              </span>
              <ChevronRight :size="14" class="text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Detail Modal -->
    <Transition name="modal">
      <div v-if="selectedEmployee" class="modal-overlay" @click.self="selectedEmployee = null">
        <div class="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto scrollbar-hide">
          <button @click="selectedEmployee = null" class="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <X :size="16" />
          </button>

          <div class="flex items-center gap-3.5 mb-5 pr-8">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl font-black text-sm border" :class="getAvatarClass(selectedEmployee.status)">
              {{ getInitials(selectedEmployee.full_name) }}
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900 leading-tight">{{ selectedEmployee.full_name }}</h3>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{{ selectedEmployee.position_name || 'Karyawan' }}</p>
              <span class="badge mt-1.5" :class="getStatusBadgeClass(selectedEmployee.status)">
                {{ getStatusLabel(selectedEmployee.status) }}
              </span>
            </div>
          </div>

          <div class="space-y-3 border-t border-slate-100 pt-4">
            <div class="grid grid-cols-2 gap-2.5">
              <div class="card p-3">
                <p class="text-[9px] font-bold uppercase text-slate-400">NIK Karyawan</p>
                <p class="text-xs font-black text-slate-800 mt-1">{{ selectedEmployee.nik_karyawan }}</p>
              </div>
              <div class="card p-3">
                <p class="text-[9px] font-bold uppercase text-slate-400">Tanggal</p>
                <p class="text-xs font-black text-slate-800 mt-1">{{ formatDateLabel(selectedDate) }}</p>
              </div>
            </div>

            <div v-if="['hadir','present','terlambat','late'].includes(selectedEmployee.status)" class="grid grid-cols-2 gap-2.5">
              <div class="card p-3">
                <p class="text-[9px] font-bold uppercase text-slate-400">Jam Masuk</p>
                <p class="text-xs font-black text-blue-600 mt-1">{{ formatTime(selectedEmployee.time_in) }}</p>
              </div>
              <div class="card p-3">
                <p class="text-[9px] font-bold uppercase text-slate-400">Jam Pulang</p>
                <p class="text-xs font-black text-blue-600 mt-1">{{ formatTime(selectedEmployee.time_out) }}</p>
              </div>
            </div>

            <div v-if="selectedEmployee.attendance_detail" class="card p-3.5">
              <p class="text-[9px] font-bold uppercase text-slate-400">Keterangan / Catatan</p>
              <p class="text-xs font-medium text-slate-700 italic mt-1 font-mono">"{{ selectedEmployee.attendance_detail }}"</p>
            </div>

            <div v-if="selectedEmployee.email" class="card p-3 flex items-center justify-between">
              <span class="text-xs text-slate-600 truncate">{{ selectedEmployee.email }}</span>
              <a
                :href="'mailto:' + selectedEmployee.email"
                class="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold hover:bg-blue-100 transition-colors"
              >
                Email
              </a>
            </div>
          </div>

          <button @click="selectedEmployee = null" class="mt-5 w-full rounded-2xl bg-slate-900 py-3.5 text-xs font-bold text-white hover:bg-slate-800 active:scale-[0.98] transition-all">
            Tutup
          </button>
        </div>
      </div>
    </Transition>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ArrowLeft, Users, Calendar, Search, X, AlertTriangle,
  UserCheck, UserX, FileText, Clock, ChevronRight
} from 'lucide-vue-next'
import { getDailyTeamAttendance, getAbsentEmployees } from '../api/attendance'
import type { DailyTeamEmployee, DailyTeamSummary } from '../api/attendance'
import BottomNav from '../components/BottomNav.vue'

const getLocalDateString = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const selectedDate = ref(getLocalDateString())
const searchQuery = ref('')
const activeTab = ref('all')
const isLoading = ref(true)
const error = ref<string | null>(null)
const selectedEmployee = ref<DailyTeamEmployee | null>(null)

const summary = ref<DailyTeamSummary>({
  total: 0,
  present: 0,
  late: 0,
  sick: 0,
  permit: 0,
  leave: 0,
  absent: 0
})

const employees = ref<DailyTeamEmployee[]>([])

const tabs = [
  { id: 'all', label: 'Semua Status' },
  { id: 'masuk', label: 'Masuk / Hadir' },
  { id: 'izin_sakit', label: 'Sakit / Izin / Cuti' },
  { id: 'absent', label: 'Belum Absen' }
]

const setToday = () => {
  selectedDate.value = getLocalDateString()
  fetchData()
}

const fetchData = async () => {
  isLoading.value = true
  error.value = null
  try {
    const response = await getDailyTeamAttendance({ date: selectedDate.value })
    if (response.data?.success) {
      employees.value = response.data.data
      summary.value = response.data.summary
    } else {
      await fallbackFetchAbsent()
    }
  } catch (err: any) {
    // If route doesn't exist or fails, fallback to getAbsentEmployees
    await fallbackFetchAbsent()
  } finally {
    isLoading.value = false
  }
}

const allowedPosKeywords = ['gudang', 'warehouse', 'driver', 'sopir', 'supir', 'cleaning', 'cs', 'kebersihan', 'security', 'satpam', 'keamanan']

const fallbackFetchAbsent = async () => {
  try {
    const res = await getAbsentEmployees({ date: selectedDate.value })
    if (res.data?.success) {
      let absentList = res.data.data.map(emp => ({
        employee_id: emp.id,
        nik_karyawan: emp.nik_karyawan,
        full_name: emp.full_name,
        email: emp.email,
        position_name: emp.position_name,
        status: 'absent',
        time_in: null,
        time_out: null,
        attendance_detail: null,
        attachment: null
      }))

      const filtered = absentList.filter(emp => {
        const pos = (emp.position_name || '').toLowerCase()
        return allowedPosKeywords.some(kw => pos.includes(kw))
      })

      if (filtered.length > 0) {
        absentList = filtered
      }

      employees.value = absentList
      summary.value = {
        total: absentList.length,
        present: 0,
        late: 0,
        sick: 0,
        permit: 0,
        leave: 0,
        absent: absentList.length
      }
    } else {
      error.value = res.data?.message || 'Gagal memuat data.'
    }
  } catch (err: any) {
    error.value = 'Gagal terhubung dengan server.'
  }
}

onMounted(fetchData)

const filteredEmployees = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return employees.value.filter(emp => {
    // Search query match
    const matchesSearch = !query ||
      emp.full_name.toLowerCase().includes(query) ||
      emp.nik_karyawan.toLowerCase().includes(query) ||
      (emp.position_name && emp.position_name.toLowerCase().includes(query))

    // Tab filter match
    let matchesTab = true
    const s = emp.status.toLowerCase()
    if (activeTab.value === 'masuk') {
      matchesTab = ['hadir', 'present', 'terlambat', 'late'].includes(s)
    } else if (activeTab.value === 'izin_sakit') {
      matchesTab = ['sakit', 'sick', 'izin', 'permit', 'cuti', 'leave'].includes(s)
    } else if (activeTab.value === 'absent') {
      matchesTab = ['absent', 'alpa', 'alpha'].includes(s)
    }

    return matchesSearch && matchesTab
  })
})

const getInitials = (name: string) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const getAvatarClass = (status: string) => {
  const s = (status || '').toLowerCase()
  if (['hadir', 'present', 'terlambat', 'late'].includes(s)) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  } else if (['sakit', 'sick'].includes(s)) {
    return 'bg-rose-50 text-rose-700 border-rose-100'
  } else if (['izin', 'permit'].includes(s)) {
    return 'bg-amber-50 text-amber-700 border-amber-100'
  } else if (['cuti', 'leave'].includes(s)) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-100'
  } else {
    return 'bg-slate-100 text-slate-500 border-slate-200'
  }
}

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
      return 'badge-neutral'
    default:
      return 'badge-neutral'
  }
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    present: 'Tepat Waktu', late: 'Terlambat', Hadir: 'Tepat Waktu', Terlambat: 'Terlambat',
    sakit: 'Sakit', izin: 'Izin', cuti: 'Cuti', sick: 'Sakit', permit: 'Izin', leave: 'Cuti',
    alpa: 'Belum Absen', alpha: 'Belum Absen', absent: 'Belum Absen'
  }
  return map[status] || status
}

const formatTime = (timeStr: string | null) => (!timeStr ? '--:--' : timeStr.substring(0, 5))

const formatDayShort = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'short' })
  } catch {
    return ''
  }
}

const formatDateLabel = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

const openModal = (emp: DailyTeamEmployee) => {
  selectedEmployee.value = emp
}
</script>
