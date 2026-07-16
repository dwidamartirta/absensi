<template>
  <div class="page-container pb-bottom-nav">
    <!-- Header -->
    <header class="page-header">
      <div class="page-header-inner">
        <div class="flex items-center gap-3">
          <div class="icon-badge icon-badge-rose h-10 w-10 rounded-xl">
            <Users :size="20" />
          </div>
          <div>
            <h1 class="text-[15px] font-black tracking-tight leading-none text-slate-900">Karyawan Absen</h1>
            <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Tidak Masuk Kerja</p>
          </div>
        </div>
        <RouterLink to="/profile" class="btn-back">
          <ArrowLeft :size="18" />
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto max-w-md px-4 pt-5">
      <!-- Date Filter Card -->
      <section class="card p-4 mb-4">
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <label class="label mb-1.5 flex items-center gap-1.5 text-slate-500">
              <Calendar :size="14" />
              <span>Tanggal Pemantauan</span>
            </label>
            <input
              v-model="selectedDate"
              type="date"
              class="input-base w-full py-2.5 px-3.5 text-xs font-semibold text-slate-800"
              @change="fetchData"
            />
          </div>
          <div class="shrink-0 text-center bg-rose-50 border border-rose-100 rounded-2xl p-3 px-4">
            <p class="text-[9px] font-extrabold text-rose-500 uppercase tracking-widest leading-none">Total Absen</p>
            <p class="text-xl font-black text-rose-700 leading-none mt-1.5">{{ totalAbsent }}</p>
          </div>
        </div>
      </section>

      <!-- Search Bar -->
      <section class="mb-4">
        <div class="relative flex items-center">
          <span class="absolute left-3.5 text-slate-400">
            <Search :size="15" />
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama karyawan..."
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
      </section>

      <!-- Content Area -->
      <section class="space-y-3">
        <!-- Skeleton Loader -->
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 4" :key="i" class="skeleton h-20 w-full rounded-2xl"></div>
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

        <!-- Empty State (All Present) -->
        <div v-else-if="filteredEmployees.length === 0 && !searchQuery" class="card p-8 text-center bg-teal-50/30 border-teal-100">
          <div class="flex justify-center text-teal-600 mb-3">
            <CheckCircle :size="36" />
          </div>
          <h3 class="text-sm font-black text-teal-800 uppercase tracking-wide">Semua Karyawan Masuk</h3>
          <p class="text-xs text-teal-600 mt-1 font-medium">Tidak ada karyawan yang absen untuk tanggal terpilih.</p>
        </div>

        <!-- No Search Results -->
        <div v-else-if="filteredEmployees.length === 0 && searchQuery" class="card p-6 text-center text-slate-500">
          <div class="flex justify-center text-slate-300 mb-3">
            <Search :size="30" />
          </div>
          <h3 class="text-xs font-bold text-slate-700">Hasil tidak ditemukan</h3>
          <p class="text-[11px] text-slate-400 mt-1">Tidak ada karyawan dengan nama "{{ searchQuery }}" yang absen.</p>
        </div>

        <!-- Absent Employees List -->
        <div v-else class="space-y-2.5">
          <div
            v-for="karyawan in filteredEmployees"
            :key="karyawan.id"
            class="group w-full flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-rose-100 hover:bg-rose-50/10 active:scale-[0.99]"
          >
            <div class="flex items-center gap-3.5 overflow-hidden">
              <!-- Avatar Initials -->
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100/50 font-black text-sm select-none shrink-0 transition-colors group-hover:bg-rose-100/60">
                {{ getInitials(karyawan.full_name) }}
              </div>
              <!-- Text Details -->
              <div class="text-left overflow-hidden">
                <h3 class="text-xs font-black text-slate-900 leading-tight truncate">{{ karyawan.full_name }}</h3>
                <p class="text-[9px] font-bold text-blue-600 uppercase tracking-wider mt-1.5 leading-none">
                  {{ karyawan.position_name || 'Tanpa Posisi' }}
                </p>
                <div class="flex items-center gap-1.5 mt-2">
                  <span class="badge badge-neutral text-[9px] px-1.5 py-0.5 font-bold">{{ karyawan.nik_karyawan }}</span>
                  <span v-if="karyawan.email" class="text-[10px] text-slate-400 truncate max-w-[120px] font-medium">{{ karyawan.email }}</span>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-2 shrink-0 ml-2">
              <a
                v-if="karyawan.email"
                :href="'mailto:' + karyawan.email + '?subject=Keterangan Absensi ' + formatDateLabel(selectedDate)"
                class="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100 active:scale-90 transition-all"
                title="Kirim Email"
              >
                <Mail :size="14" />
              </a>
              <button
                @click="copyNik(karyawan.nik_karyawan)"
                class="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100 active:scale-90 transition-all"
                title="Salin NIK"
              >
                <span class="text-[9px] font-extrabold">NIK</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, Users, Calendar, Search, Mail, X, AlertTriangle, CheckCircle } from 'lucide-vue-next'
import { getAbsentEmployees } from '../api/attendance'
import type { AbsentEmployee } from '../api/attendance'
import BottomNav from '../components/BottomNav.vue'
import { useToast } from '../composables/useToast'

const { showToast } = useToast()

// Default date to today in local timezone
const getLocalDateString = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const selectedDate = ref(getLocalDateString())
const searchQuery = ref('')
const isLoading = ref(true)
const error = ref<string | null>(null)
const absentEmployees = ref<AbsentEmployee[]>([])
const totalAbsent = ref(0)

const fetchData = async () => {
  isLoading.value = true
  error.value = null
  try {
    const response = await getAbsentEmployees({ date: selectedDate.value })
    if (response.data?.success) {
      absentEmployees.value = response.data.data
      totalAbsent.value = response.data.total_absent ?? response.data.data.length
    } else {
      error.value = response.data?.message || 'Terjadi kesalahan pada respon server.'
    }
  } catch (err: any) {
    console.error('Failed to load absent employees:', err)
    error.value = err?.response?.data?.message || 'Gagal terhubung dengan server.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchData)

// Filters list of employees on the client-side
const filteredEmployees = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return absentEmployees.value
  return absentEmployees.value.filter(emp =>
    emp.full_name.toLowerCase().includes(query) ||
    emp.nik_karyawan.toLowerCase().includes(query) ||
    (emp.position_name && emp.position_name.toLowerCase().includes(query))
  )
})

// Gets initials of name (e.g. John Doe -> JD)
const getInitials = (name: string) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Formats date into readable string for email subject
const formatDateLabel = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

// Copies employee NIK to clipboard
const copyNik = async (nik: string) => {
  try {
    await navigator.clipboard.writeText(nik)
    showToast('NIK berhasil disalin ke papan klip!', 'success')
  } catch (err) {
    showToast('Gagal menyalin NIK.', 'error')
  }
}
</script>

<style scoped>
/* Transisi scale dan fade halus untuk list items */
.group {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
