<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 pb-24">
    <!-- Header -->
    <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4">
      <div class="mx-auto flex max-w-md items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <CarFront :size="20" />
          </div>
          <div>
            <h1 class="text-base font-black tracking-tight leading-none text-slate-900">Cek Kendaraan</h1>
            <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Inspeksi Harian</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="showHistory = true" class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 active:scale-90 transition-all">
            <History :size="20" />
          </button>
          <button @click="router.back()" class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 active:scale-90 transition-all">
            <ArrowLeft :size="18" />
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-md px-4 pt-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-6">
        <div class="h-40 w-full animate-pulse rounded-[32px] bg-slate-200"></div>
        <div class="h-80 w-full animate-pulse rounded-[32px] bg-slate-200"></div>
      </div>

      <!-- User Already Inspected Today State -->
      <div v-else-if="hasUserInspectedToday" class="flex flex-col items-center justify-center py-12 text-center">
        <div class="relative mb-10 flex h-32 w-32 items-center justify-center rounded-[40px] bg-blue-50 text-blue-600 shadow-inner">
          <div class="absolute inset-0 animate-ping rounded-[40px] bg-blue-400 opacity-20"></div>
          <CheckCircle2 :size="64" stroke-width="2.5" />
        </div>
        <h2 class="text-2xl font-black text-slate-900 tracking-tight">Inspeksi Selesai!</h2>
        <p class="mt-3 text-xs font-medium text-slate-400 px-6 leading-relaxed uppercase tracking-wider">
          Terima kasih telah menjaga keselamatan armada untuk operasional hari ini.
        </p>
        <div class="flex flex-col w-full gap-4 mt-12">
          <button 
            @click="router.push('/absensi')"
            class="w-full rounded-2xl bg-slate-900 py-4.5 text-sm font-black text-white shadow-xl active:scale-95 transition-all"
          >
            KEMBALI KE HOME
          </button>
          <button 
            @click="showHistory = true"
            class="w-full rounded-2xl bg-white border border-slate-200 py-4.5 text-sm font-black text-slate-600 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <History :size="18" />
            <span>RIWAYAT INSPEKSI</span>
          </button>
        </div>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Metadata Section -->
        <div class="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          <div class="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Calendar :size="20" />
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase text-slate-400">Tanggal Pemeriksaan</p>
              <p class="text-sm font-bold text-slate-900">{{ todayDisplay }}</p>
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">Pilih Kendaraan (Nopol)</label>
            <div class="relative">
              <select 
                v-model="form.vehicle_id" 
                @change="onVehicleChange"
                required
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none text-slate-900"
              >
                <option value="" disabled>Pilih Nopol Kendaraan</option>
                <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.nopol }} - {{ v.brand }} {{ v.model }}</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                <ChevronRight :size="18" class="rotate-90" />
              </div>
            </div>
          </div>

          <div v-if="form.vehicle_id && !hasInspectedToday" class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">KM Sebelumnya</label>
              <input 
                v-model="form.prev_km" 
                type="number" 
                :readonly="form.prev_km > 0" 
                :class="form.prev_km > 0 ? 'bg-slate-100 text-slate-500 border-slate-100' : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-blue-500 focus:bg-white'"
                class="w-full rounded-2xl border px-4 py-3.5 text-sm font-bold outline-none transition-all" 
              />
            </div>
            <div>
              <label class="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">KM Sekarang</label>
              <input v-model="form.current_km" type="number" required placeholder="0" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all" />
            </div>
          </div>

          <!-- Already Inspected State -->
          <div v-if="hasInspectedToday" class="rounded-2xl bg-blue-50 border border-blue-100 p-4 flex items-center gap-3">
            <div class="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 :size="16" />
            </div>
            <p class="text-xs font-bold text-blue-700 leading-tight">
              Kendaraan ini sudah selesai diperiksa untuk hari ini.
            </p>
          </div>
        </div>

        <!-- Checklist Section with Table -->
        <div v-if="form.vehicle_id && !hasInspectedToday" class="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div class="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500">Daftar Pemeriksaan</h2>
            <span class="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{{ checklistItems.length }} Item</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/50">
                  <th class="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Uraian</th>
                  <th class="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Kondisi</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(item, index) in form.checklist" :key="item.id">
                  <tr :class="index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'">
                    <td class="py-3 px-4 border-b border-slate-50">
                      <div class="flex flex-col">
                        <span class="text-xs font-bold text-slate-700 leading-tight mb-1">{{ index + 1 }}. {{ item.uraian }}</span>
                        <input 
                          v-if="item.condition === 'rusak'"
                          v-model="item.note" 
                          type="text" 
                          placeholder="Ket. rusak..."
                          class="mt-1 w-full rounded-lg border border-rose-100 bg-rose-50/30 px-2 py-1 text-[10px] font-medium outline-none focus:border-rose-300 focus:bg-white transition-all"
                        />
                      </div>
                    </td>
                    <td class="py-3 px-4 border-b border-slate-50 align-top">
                      <div class="flex flex-col gap-1 items-center">
                        <button 
                          type="button"
                          @click="item.condition = 'baik'"
                          :class="item.condition === 'baik' ? 'bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-100' : 'bg-slate-50 text-slate-400 border-slate-100'"
                          class="w-16 rounded-lg border py-1.5 text-[10px] font-bold transition-all active:scale-95"
                        >
                          Baik
                        </button>
                        <button 
                          type="button"
                          @click="item.condition = 'rusak'"
                          :class="item.condition === 'rusak' ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'"
                          class="w-16 rounded-lg border py-1.5 text-[10px] font-bold transition-all active:scale-95"
                        >
                          Rusak
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Submit Button -->
        <button 
          v-if="form.vehicle_id && !hasInspectedToday"
          type="submit" 
          :disabled="isSaving"
          class="w-full rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none"
        >
          <span v-if="isSaving" class="flex items-center justify-center gap-2">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
            Menyimpan...
          </span>
          <span v-else>Simpan Laporan</span>
        </button>
      </form>
    </main>

    <!-- History Modal -->
    <Transition name="fade">
      <div v-if="showHistory" class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-4" @click.self="showHistory = false">
        <Transition name="slide-up">
          <div class="w-full max-w-md overflow-hidden rounded-t-[32px] bg-white shadow-2xl transition-all h-[85vh] flex flex-col">
            <div class="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 class="text-lg font-bold text-slate-900">Riwayat Inspeksi</h3>
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">30 Pemeriksaan Terakhir</p>
              </div>
              <button @click="showHistory = false" class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-90 transition-all">
                <CloseIcon :size="20" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              <div v-if="inspectionHistory.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
                <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                  <History :size="32" />
                </div>
                <p class="text-sm font-bold text-slate-400">Belum ada riwayat pemeriksaan</p>
              </div>
              
              <button 
                v-for="item in inspectionHistory" 
                :key="item.id"
                @click="openDetail(item)"
                class="w-full flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm active:scale-[0.98] transition-all hover:border-blue-100 hover:bg-blue-50/20"
              >
                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shrink-0">
                  <div class="text-center">
                    <p class="text-[8px] font-bold uppercase leading-none opacity-50">{{ new Date(item.inspection_date).toLocaleDateString('id-ID', { month: 'short' }) }}</p>
                    <p class="text-base font-black leading-none">{{ new Date(item.inspection_date).getDate() }}</p>
                  </div>
                </div>
                <div class="flex-1 text-left min-w-0">
                  <p class="text-sm font-bold text-slate-900 truncate">{{ item.vehicle?.nopol }}</p>
                  <p class="text-[10px] text-slate-500 truncate">{{ item.vehicle?.brand }} {{ item.vehicle?.model }}</p>
                </div>
                <div class="text-right flex flex-col items-end gap-1">
                  <span class="text-[10px] font-bold text-slate-400">{{ item.current_km.toLocaleString() }} KM</span>
                  <div class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <ChevronRight :size="14" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Detail Modal -->
    <Transition name="fade">
      <div v-if="showDetail && selectedHistory" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4" @click.self="closeDetail">
        <div class="w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl flex flex-col max-h-[90vh]">
          <div class="relative h-24 bg-blue-600 p-6 flex flex-col justify-end overflow-hidden">
            <div class="absolute top-0 right-0 p-4">
              <button @click="closeDetail" class="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-all">
                <CloseIcon :size="18" />
              </button>
            </div>
            <div class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"></div>
            <h3 class="text-white font-bold text-lg leading-tight">{{ selectedHistory.vehicle?.nopol }}</h3>
            <p class="text-white/70 text-xs">{{ selectedHistory.vehicle?.brand }} {{ selectedHistory.vehicle?.model }}</p>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-center">
                <p class="text-[9px] font-bold uppercase text-slate-400 mb-1">Tanggal</p>
                <p class="text-xs font-bold text-slate-900">{{ new Date(selectedHistory.inspection_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-center">
                <p class="text-[9px] font-bold uppercase text-slate-400 mb-1">Odometer</p>
                <p class="text-xs font-bold text-blue-600">{{ selectedHistory.current_km.toLocaleString() }} KM</p>
              </div>
            </div>

            <div class="space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">Hasil Pemeriksaan</h4>
              <div class="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
                <div v-for="check in selectedHistory.checklist" :key="check.id" class="flex items-start gap-3 p-3 border-b border-slate-50 last:border-0">
                  <div :class="check.condition === 'baik' ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'" class="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 v-if="check.condition === 'baik'" :size="12" />
                    <Info v-else :size="12" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-slate-700 leading-tight">{{ check.uraian }}</p>
                    <p v-if="check.condition === 'rusak' && check.note" class="mt-1 text-[10px] text-rose-500 font-medium italic">
                      Ket: {{ check.note }}
                    </p>
                    <p v-else class="text-[10px] text-slate-400 capitalize">{{ check.condition || 'Tidak diperiksa' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="p-6 bg-slate-50/50 border-t border-slate-100">
            <button @click="closeDetail" class="w-full rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-lg active:scale-95 transition-all">
              Tutup Detail
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <BottomNav />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }

.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '../composables/useToast'
import { getVehicles, getLastInspection, submitInspection, getInspectionHistory, type Vehicle } from '../api/vehicle'
import BottomNav from '../components/BottomNav.vue'
import { 
  ArrowLeft, Calendar, CheckCircle2, History, ChevronRight, X as CloseIcon, Info
} from 'lucide-vue-next'

const router = useRouter()
const { showToast } = useToast()

const isLoading = ref(true)
const isSaving = ref(false)
const hasUserInspectedToday = ref(false) // Cek apakah USER sudah inspeksi apapun hari ini
const hasInspectedToday = ref(false)     // Cek apakah MOBIL ini sudah inspeksi hari ini
const vehicles = ref<Vehicle[]>([])

const showHistory = ref(false)
const inspectionHistory = ref<any[]>([])
const selectedHistory = ref<any>(null)
const showDetail = ref(false)

const todayDisplay = computed(() => {
  return new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})

const checklistItems = [
  'Kebersihan', 'Alat Pemadam Api', 'Tangga / Pijakan', 'Ban / Roda', 'Mur yang hilang / Kendur',
  'Permukaan Oli Mesin', 'Permukaan Oli Kemudi', 'Permukaan Oli Rem', 'Permukaan Oli Kopling',
  'Permukaan Air Radiator', 'Permukaan Air Aki', 'Permukaan Air Pembersih Kaca', 'Permukaan Bahan Bakar',
  'Tali Kipas / Selang-selang', 'Sistim Pembuangan Gas', 'Kebocoran-kebocoran Oli', 'Kebocoran-kebocoran Air',
  'Rem Kaki / Service', 'Rem Parkir', 'Kemudi', 'Meteran Petunjuk & Lampu', 'Lampu - Lampu',
  'Lampu Petunjuk', 'Kaca Spion', 'Pembersih Kaca', 'Klakson', 'Sabuk Pengaman', 'Dongkrak & Kunci roda',
  'Peralatan Yang Rusak', 'Segitiga pengaman', 'Foto Copy Dokumen Operasional Kendaraan',
  'Tali Pengikat', 'Terpal Penutup', 'Stiker Limbah'
]

const form = ref({
  vehicle_id: '',
  inspection_date: new Date().toISOString().split('T')[0],
  prev_km: 0,
  current_km: null as number | null,
  checklist: checklistItems.map((uraian, i) => ({
    id: i + 1,
    uraian,
    condition: '' as 'baik' | 'rusak' | '',
    note: ''
  }))
})

const fetchData = async () => {
  try {
    const res = await getVehicles()
    vehicles.value = res.data.data
    hasUserInspectedToday.value = res.data.has_inspected_today
    
    // Ambil riwayat juga
    fetchHistory()
  } catch (error) {
    showToast('Gagal memuat daftar kendaraan.', 'error')
  } finally {
    isLoading.value = false
  }
}

const fetchHistory = async () => {
  try {
    const res = await getInspectionHistory()
    inspectionHistory.value = res.data.data
  } catch (error) {
    console.error('Gagal mengambil riwayat:', error)
  }
}

const openDetail = (item: any) => {
  selectedHistory.value = item
  showDetail.value = true
}

const closeDetail = () => {
  showDetail.value = false
  setTimeout(() => {
    selectedHistory.value = null
  }, 300)
}

const onVehicleChange = async () => {
  if (!form.value.vehicle_id) return
  
  try {
    const res = await getLastInspection(Number(form.value.vehicle_id))
    const data = res.data.data
    
    // Backend mengembalikan current_km (bisa dari last inspection atau initial_odometer)
    if (data) {
      form.value.prev_km = data.current_km
      
      // Cek apakah sudah diperiksa hari ini
      if (data.last_inspection && data.last_inspection.inspection_date === form.value.inspection_date) {
        showToast('Kendaraan ini sudah diperiksa hari ini.', 'info')
        hasInspectedToday.value = true
      } else {
        hasInspectedToday.value = false
      }
    } else {
      form.value.prev_km = 0
      hasInspectedToday.value = false
    }
  } catch (error) {
    console.error('Error fetching last inspection:', error)
    form.value.prev_km = 0
    hasInspectedToday.value = false
  }
}

const handleSubmit = async () => {
  if (!form.value.vehicle_id) {
    showToast('Silakan pilih kendaraan.', 'error')
    return
  }

  const unfinished = form.value.checklist.find(item => !item.condition)
  if (unfinished) {
    showToast(`Item "${unfinished.uraian}" belum diperiksa.`, 'error')
    return
  }

  if (form.value.current_km === null || form.value.current_km < form.value.prev_km) {
    showToast('KM sekarang tidak boleh lebih kecil dari KM sebelumnya.', 'error')
    return
  }

  isSaving.value = true
  try {
    await submitInspection({
      ...form.value,
      vehicle_id: Number(form.value.vehicle_id),
      current_km: Number(form.value.current_km),
      checklist: form.value.checklist as any
    })
    showToast('Laporan berhasil disimpan!', 'success')
    router.push('/absensi')
  } catch (error) {
    showToast('Gagal menyimpan laporan.', 'error')
  } finally {
    isSaving.value = false
  }
}

onMounted(fetchData)
</script>