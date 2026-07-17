<template>
  <div class="page-container pb-bottom-nav">
    <header class="page-header">
      <div class="page-header-inner flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button @click="$router.push('/profile')" class="text-slate-600 active:scale-95">
            <ArrowLeft :size="20" />
          </button>
          <div>
            <h1 class="text-[15px] font-black tracking-tight leading-none text-slate-900">Limbah Gudang</h1>
            <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Catatan Limbah Masuk & Keluar</p>
          </div>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-md px-4 pt-5">
      <div class="mb-5 grid grid-cols-2 gap-3">
        <!-- Button Masuk -->
        <button
          v-if="hasInPermission"
          @click="$router.push('/gudang/masuk')"
          class="flex flex-col items-center justify-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-5 text-center transition-all active:scale-95 shadow-sm"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-100">
            <Download :size="24" />
          </div>
          <div>
            <p class="text-sm font-black text-emerald-800">Limbah Masuk</p>
            <p class="text-[9px] font-bold text-emerald-500 uppercase mt-0.5">Catat Masuk</p>
          </div>
        </button>

        <!-- Button Keluar -->
        <button
          v-if="hasOutPermission"
          @click="$router.push('/gudang/keluar')"
          class="flex flex-col items-center justify-center gap-3 rounded-2xl bg-rose-50 border border-rose-100 p-5 text-center transition-all active:scale-95 shadow-sm"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-100">
            <Upload :size="24" />
          </div>
          <div>
            <p class="text-sm font-black text-rose-800">Limbah Keluar</p>
            <p class="text-[9px] font-bold text-rose-500 uppercase mt-0.5">Catat Keluar</p>
          </div>
        </button>
      </div>

      <!-- Segment Tabs -->
      <div class="flex bg-slate-100 p-1 rounded-xl mb-4">
        <button
          @click="activeTab = 'stock'"
          :class="activeTab === 'stock' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
          class="flex-1 text-center py-2.5 text-xs font-black rounded-lg transition-all"
        >
          Sisa Stok
        </button>
        <button
          @click="activeTab = 'history_in'"
          :class="activeTab === 'history_in' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
          class="flex-1 text-center py-2.5 text-xs font-black rounded-lg transition-all"
        >
          Riwayat Masuk
        </button>
        <button
          @click="activeTab = 'history_out'"
          :class="activeTab === 'history_out' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'"
          class="flex-1 text-center py-2.5 text-xs font-black rounded-lg transition-all"
        >
          Riwayat Keluar
        </button>
      </div>

      <!-- TAB 1: SISA STOK -->
      <section v-if="activeTab === 'stock'" class="card p-5 mb-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Package :size="16" class="text-blue-600" />
            <p class="section-label">Sisa Limbah di Gudang</p>
          </div>
          <span class="badge badge-info">{{ stocks.length }} Jenis</span>
        </div>

        <div class="mb-4">
          <input
            v-model="searchQuery"
            @input="fetchStock"
            type="text"
            placeholder="Cari limbah atau lokasi..."
            class="w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="skeleton h-16 w-full rounded-xl"></div>
        </div>

        <div v-else-if="stocks.length === 0" class="text-center py-8 text-slate-400 text-xs font-bold">
          Tidak ada limbah aktif di gudang.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="stock in stocks"
            :key="stock.id"
            class="flex items-center justify-between rounded-xl border border-slate-50 bg-slate-50/50 p-3.5"
          >
            <div class="flex items-center flex-1 min-w-0">
              <!-- Thumbnail Foto -->
              <div v-if="stock.foto_url" class="shrink-0 mr-3">
                <img
                  :src="stock.foto_url"
                  alt="Limbah"
                  class="h-12 w-12 rounded-lg object-cover border border-slate-100 shadow-sm active:scale-95 transition-transform"
                  @click.stop="previewImage(stock.foto_url)"
                />
              </div>
              <div class="flex-1 min-w-0 pr-3">
                <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span class="inline-block rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                    {{ stock.kode_limbah }}
                  </span>
                  <span :class="stock.days_until_expiration <= 14 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'" class="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold">
                    {{ stock.days_until_expiration < 0 ? 'Expired' : stock.days_until_expiration + ' hari lagi' }}
                  </span>
                </div>
                <h4 class="text-xs font-black text-slate-900 truncate">{{ stock.nama_limbah }}</h4>
                <p class="text-[10px] text-slate-400 mt-0.5 truncate">Sumber: {{ stock.pt_penghasil }}</p>
                <p class="text-[10px] text-slate-500 mt-0.5">
                  Lokasi: <strong>{{ stock.lokasi_simpan }}</strong>
                  <span v-if="stock.jumlah_kemasan_sisa !== null">
                    · Kemasan: <strong>{{ stock.jumlah_kemasan_sisa }} {{ stock.jenis_kemasan }}</strong>
                  </span>
                </p>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="text-sm font-black text-blue-600">
                {{ stock.satuan_berat === 'ton' ? (stock.berat_sisa / 1000).toFixed(2) : parseFloat(stock.berat_sisa).toFixed(2) }} 
                {{ stock.satuan_berat || 'kg' }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Lightbox / Fullscreen Image Preview Modal -->
      <div
        v-if="showPreviewModal"
        @click="showPreviewModal = false"
        class="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-4"
      >
        <div class="relative max-w-full max-h-full">
          <img
            :src="previewImageUrl"
            alt="Preview Limbah"
            class="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
          />
          <p class="text-center text-white/60 text-[10px] font-bold uppercase tracking-widest mt-3">Ketuk di mana saja untuk menutup</p>
        </div>
      </div>

      <!-- TAB 2: RIWAYAT MASUK -->
      <section v-if="activeTab === 'history_in'" class="card p-5 mb-5">
        <div class="flex items-center gap-2 mb-4">
          <Download :size="16" class="text-emerald-600" />
          <p class="section-label">Log Limbah Masuk</p>
        </div>

        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="skeleton h-16 w-full rounded-xl"></div>
        </div>

        <div v-else-if="historyIn.length === 0" class="text-center py-8 text-slate-400 text-xs font-bold">
          Tidak ada riwayat limbah masuk.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in historyIn"
            :key="item.id"
            class="flex items-center justify-between rounded-xl border border-slate-50 bg-slate-50/50 p-3.5"
          >
            <div class="flex-1 min-w-0 pr-2">
              <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                <span class="inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                  {{ item.transaction_code }}
                </span>
                <span class="text-[9px] text-slate-400 font-bold">{{ formatDate(item.tanggal_masuk) }}</span>
              </div>
              <h4 class="text-xs font-black text-slate-900 truncate">
                {{ item.client?.name || item.client_name_fallback || '-' }}
              </h4>
              <p class="text-[10px] text-slate-500 mt-0.5">
                Nopol: <strong>{{ item.plat_nomor_kendaraan }}</strong> · {{ item.details?.length || 0 }} Limbah
              </p>
            </div>
            <div class="text-right shrink-0 flex items-center gap-2">
              <span class="text-xs font-black text-slate-700">{{ sumWeight(item.details) }} kg</span>
              <button
                v-if="hasInPermission"
                @click="$router.push(`/gudang/masuk/edit/${item.id}`)"
                class="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 border border-amber-100 text-amber-600 active:scale-90 transition-all"
              >
                <Pencil :size="12" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB 3: RIWAYAT KELUAR -->
      <section v-if="activeTab === 'history_out'" class="card p-5 mb-5">
        <div class="flex items-center gap-2 mb-4">
          <Upload :size="16" class="text-rose-600" />
          <p class="section-label">Log Limbah Keluar</p>
        </div>

        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="skeleton h-16 w-full rounded-xl"></div>
        </div>

        <div v-else-if="historyOut.length === 0" class="text-center py-8 text-slate-400 text-xs font-bold">
          Tidak ada riwayat limbah keluar.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in historyOut"
            :key="item.id"
            class="flex items-center justify-between rounded-xl border border-slate-50 bg-slate-50/50 p-3.5"
          >
            <div class="flex-1 min-w-0 pr-2">
              <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                <span class="inline-block rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-800">
                  {{ item.transaction_code }}
                </span>
                <span class="text-[9px] text-slate-400 font-bold">{{ formatDate(item.tanggal_keluar) }}</span>
              </div>
              <h4 class="text-xs font-black text-slate-900 truncate">
                Ke: {{ item.tujuan_pengiriman }}
              </h4>
              <p class="text-[10px] text-slate-500 mt-0.5">
                Nopol: <strong>{{ item.plat_nomor_kendaraan }}</strong> · {{ item.details?.length || 0 }} Limbah
              </p>
            </div>
            <div class="text-right shrink-0 flex items-center gap-2">
              <span class="text-xs font-black text-slate-700">{{ sumWeight(item.details) }} kg</span>
              <button
                v-if="hasOutPermission"
                @click="$router.push(`/gudang/keluar/edit/${item.id}`)"
                class="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 border border-amber-100 text-amber-600 active:scale-90 transition-all"
              >
                <Pencil :size="12" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ArrowLeft, Download, Upload, Package, Pencil } from 'lucide-vue-next'
import BottomNav from '../components/BottomNav.vue'
import { getWarehouseStock, getWarehouseInHistory, getWarehouseOutHistory } from '../api/warehouse'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../composables/useToast'

const authStore = useAuthStore()
const { showToast } = useToast()

const activeTab = ref<'stock' | 'history_in' | 'history_out'>('stock')
const stocks = ref<any[]>([])
const historyIn = ref<any[]>([])
const historyOut = ref<any[]>([])
const isLoading = ref(true)
const searchQuery = ref('')

// Image lightbox preview
const showPreviewModal = ref(false)
const previewImageUrl = ref('')

const previewImage = (url: string) => {
  previewImageUrl.value = url
  showPreviewModal.value = true
}

const hasInPermission = computed(() => authStore.user?.permissions_list?.includes('warehouse.in'))
const hasOutPermission = computed(() => authStore.user?.permissions_list?.includes('warehouse.out'))

const fetchStock = async () => {
  try {
    const res = await getWarehouseStock(searchQuery.value)
    stocks.value = res.data.data
  } catch {
    showToast('Gagal mengambil data stok.', 'error')
  } finally {
    isLoading.value = false
  }
}

const fetchHistoryIn = async () => {
  isLoading.value = true
  try {
    const res = await getWarehouseInHistory()
    historyIn.value = res.data.data
  } catch {
    showToast('Gagal mengambil riwayat masuk.', 'error')
  } finally {
    isLoading.value = false
  }
}

const fetchHistoryOut = async () => {
  isLoading.value = true
  try {
    const res = await getWarehouseOutHistory()
    historyOut.value = res.data.data
  } catch {
    showToast('Gagal mengambil riwayat keluar.', 'error')
  } finally {
    isLoading.value = false
  }
}

const loadData = () => {
  if (activeTab.value === 'stock') {
    fetchStock()
  } else if (activeTab.value === 'history_in') {
    fetchHistoryIn()
  } else if (activeTab.value === 'history_out') {
    fetchHistoryOut()
  }
}

watch(activeTab, () => {
  loadData()
})

onMounted(() => {
  loadData()
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const sumWeight = (details: any[]) => {
  if (!details) return 0
  const total = details.reduce((acc, curr) => acc + parseFloat(curr.berat), 0)
  return total.toFixed(2)
}
</script>
