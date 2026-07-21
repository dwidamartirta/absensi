<template>
  <div class="page-container pb-10">
    <header class="page-header">
      <div class="page-header-inner flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button @click="$router.push('/gudang')" class="text-slate-600 active:scale-95">
            <ArrowLeft :size="20" />
          </button>
          <div>
            <h1 class="text-[15px] font-black tracking-tight leading-none text-slate-900">Catat Limbah Keluar</h1>
            <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Pengeluaran Limbah</p>
          </div>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-md px-4 pt-5">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="card p-5 space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Keluar</label>
            <input
              v-model="form.tanggal_keluar"
              type="date"
              class="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nomor Plat Mobil</label>
            <input
              v-model="form.plat_nomor_kendaraan"
              type="text"
              placeholder="Contoh: BP 9511 DU"
              class="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tujuan Pengiriman</label>
            <input
              v-model="form.tujuan_pengiriman"
              type="text"
              placeholder="Contoh: PT Pemanfaat Lestari"
              class="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div class="border-t border-slate-200 pt-4">
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-wide mb-3">Daftar Pengeluaran Limbah</h3>
          
          <div v-for="(item, idx) in form.items" :key="idx" class="card p-4 mb-4 relative bg-slate-50/50 border-slate-100">
            <button
              v-if="form.items.length > 1"
              type="button"
              @click="removeItem(idx)"
              class="absolute top-3 right-3 text-rose-500 hover:text-rose-700"
            >
              <Trash2 :size="16" />
            </button>

            <div class="space-y-3">
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cari & Pilih Batch Limbah di Gudang</label>
                <div class="relative">
                  <input
                    type="text"
                    v-model="item.searchQuery"
                    @input="onStockSearchInput(idx)"
                    @focus="item.showSuggestions = true"
                    @blur="hideStockSuggestionsDelayed(idx)"
                    placeholder="Ketik kode atau nama limbah..."
                    class="w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold focus:outline-none"
                    required
                  />
                  <ul v-if="item.showSuggestions && item.suggestions && item.suggestions.length > 0" class="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100">
                    <li
                      v-for="s in item.suggestions" :key="s.id"
                      @mousedown="selectStockBatch(idx, s)"
                      class="p-3 text-[11px] font-semibold hover:bg-slate-50 cursor-pointer text-slate-700"
                    >
                      <div class="font-bold text-slate-900">{{ s.kode_limbah }} - {{ s.nama_limbah }}</div>
                      <div class="text-[10px] text-slate-400 mt-0.5">
                        Sisa: {{ s.satuan_berat === 'ton' ? s.berat_sisa/1000 : s.berat_sisa }} {{ s.satuan_berat }} / {{ s.jumlah_kemasan_sisa || 0 }} {{ s.jenis_kemasan }}
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Berat Keluar ({{ getWeightUnit(idx) }})</label>
                  <input
                    v-model.number="item.berat"
                    type="number"
                    step="0.01"
                    min="0.01"
                    :max="getMaxWeight(idx)"
                    placeholder="Masukkan berat"
                    class="w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold focus:outline-none"
                    required
                  />
                  <span v-if="getMaxWeight(idx) > 0" class="block mt-1 text-[9px] text-slate-500 font-bold">
                    Max: {{ getMaxWeight(idx) }} {{ getWeightUnit(idx) }}
                  </span>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Jumlah Kemasan</label>
                  <input
                    v-model.number="item.jumlah_kemasan"
                    type="number"
                    placeholder="0"
                    class="w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold focus:outline-none"
                    required
                  />
                  <span v-if="getMaxPackages(idx) > 0" class="block mt-1 text-[9px] text-slate-500 font-bold">
                    Max: {{ getMaxPackages(idx) }} kemasan
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            @click="addItem"
            class="flex items-center justify-center gap-1.5 w-full rounded-xl border-2 border-dashed border-slate-300 py-3.5 text-xs font-bold text-slate-500 hover:border-rose-500 hover:text-rose-600 transition-all active:scale-[0.98]"
          >
            <Plus :size="15" />
            Tambah Baris Pengeluaran
          </button>
        </div>

        <!-- Jika stok kosong -->
        <div v-if="!isLoading && stocks.length === 0" class="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-800 text-xs font-bold text-center mb-4">
          Data limbah di gudang kosong! Tidak ada limbah yang bisa dikeluarkan saat ini.
        </div>

        <button
          type="submit"
          :disabled="isSubmitting || stocks.length === 0"
          class="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-4 text-sm font-black text-white shadow-lg shadow-rose-200 transition-all active:scale-[0.97] disabled:opacity-60"
        >
          <span v-if="isSubmitting" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          <Save v-else :size="17" />
          SIMPAN LIMBAH KELUAR
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Trash2, Plus, Save } from 'lucide-vue-next'
import { getWarehouseStock, storeWarehouseOut } from '../api/warehouse'
import { useToast } from '../composables/useToast'

const router = useRouter()
const { showToast } = useToast()

const stocks = ref<any[]>([])
const isSubmitting = ref(false)
const isLoading = ref(true)

const form = ref({
  tanggal_keluar: new Date().toISOString().split('T')[0],
  plat_nomor_kendaraan: '',
  tujuan_pengiriman: '',
  items: [
    { warehouse_in_detail_id: 0, berat: 0, jumlah_kemasan: 0, searchQuery: '', showSuggestions: false, suggestions: [] as any[] }
  ]
})

const fetchStock = async () => {
  isLoading.value = true
  try {
    const res = await getWarehouseStock()
    stocks.value = res.data.data
  } catch {
    showToast('Gagal memuat stok aktif.', 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchStock()
})

const addItem = () => {
  form.value.items.push({ warehouse_in_detail_id: 0, berat: 0, jumlah_kemasan: 0, searchQuery: '', showSuggestions: false, suggestions: [] })
}

const removeItem = (idx: number) => {
  form.value.items.splice(idx, 1)
}

const onStockSearchInput = (idx: number) => {
  const item = form.value.items[idx]
  if (!item.searchQuery) {
    item.suggestions = []
    return
  }
  
  const query = item.searchQuery.toLowerCase()
  item.suggestions = stocks.value.filter(s => 
    s.kode_limbah.toLowerCase().includes(query) || 
    s.nama_limbah.toLowerCase().includes(query)
  )
}

const selectStockBatch = (idx: number, s: any) => {
  const item = form.value.items[idx]
  item.warehouse_in_detail_id = s.id
  item.searchQuery = `${s.kode_limbah} - ${s.nama_limbah}`
  
  const isTon = s.satuan_berat === 'ton'
  item.berat = isTon ? s.berat_sisa / 1000 : s.berat_sisa
  item.jumlah_kemasan = s.jumlah_kemasan_sisa || 0
  item.showSuggestions = false
}

const hideStockSuggestionsDelayed = (idx: number) => {
  setTimeout(() => {
    form.value.items[idx].showSuggestions = false
  }, 200)
}

const getMaxWeight = (idx: number) => {
  const batchId = form.value.items[idx].warehouse_in_detail_id
  const stock = stocks.value.find(s => s.id === batchId)
  if (!stock) return 0
  return stock.satuan_berat === 'ton' ? stock.berat_sisa / 1000 : stock.berat_sisa
}

const getWeightUnit = (idx: number) => {
  const batchId = form.value.items[idx].warehouse_in_detail_id
  const stock = stocks.value.find(s => s.id === batchId)
  return stock?.satuan_berat || 'kg'
}

const getMaxPackages = (idx: number) => {
  const batchId = form.value.items[idx].warehouse_in_detail_id
  const stock = stocks.value.find(s => s.id === batchId)
  return stock ? stock.jumlah_kemasan_sisa || 0 : 0
}

const handleSubmit = async () => {
  if (isSubmitting.value) return

  // Validate items selection
  const invalidItem = form.value.items.find(i => i.warehouse_in_detail_id === 0 || i.berat <= 0)
  if (invalidItem) {
    showToast('Harap pilih batch dan masukkan berat keluar dengan benar.', 'info')
    return
  }

  // Double check max limits
  for (const item of form.value.items) {
    const stock = stocks.value.find(s => s.id === item.warehouse_in_detail_id)
    if (stock) {
      const isTon = stock.satuan_berat === 'ton'
      const beratKg = isTon ? item.berat * 1000 : item.berat
      if (beratKg > stock.berat_sisa) {
        showToast(`Berat keluar (${item.berat} ${stock.satuan_berat}) melebihi stok yang tersedia (${isTon ? stock.berat_sisa/1000 : stock.berat_sisa} ${stock.satuan_berat}).`, 'error')
        return
      }
      if (stock.jumlah_kemasan_sisa !== null && item.jumlah_kemasan > stock.jumlah_kemasan_sisa) {
        showToast(`Jumlah kemasan keluar (${item.jumlah_kemasan}) melebihi kemasan sisa yang tersedia (${stock.jumlah_kemasan_sisa}).`, 'error')
        return
      }
    }
  }

  isSubmitting.value = true

  const itemsPayload = form.value.items.map(item => {
    const stock = stocks.value.find(s => s.id === item.warehouse_in_detail_id)
    const isTon = stock?.satuan_berat === 'ton'
    const beratKg = isTon ? item.berat * 1000 : item.berat
    return {
      warehouse_in_detail_id: item.warehouse_in_detail_id,
      berat: beratKg,
      jumlah_kemasan: item.jumlah_kemasan
    }
  })

  try {
    await storeWarehouseOut({
      tanggal_keluar: form.value.tanggal_keluar,
      plat_nomor_kendaraan: form.value.plat_nomor_kendaraan,
      tujuan_pengiriman: form.value.tujuan_pengiriman,
      items: itemsPayload
    })
    showToast('Barang keluar berhasil dicatat!', 'success')
    router.replace('/gudang')
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Gagal menyimpan data.'
    showToast(msg, 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>
