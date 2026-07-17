<template>
  <div class="page-container pb-10">
    <header class="page-header">
      <div class="page-header-inner flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button @click="$router.push('/gudang')" class="text-slate-600 active:scale-95">
            <ArrowLeft :size="20" />
          </button>
          <div>
            <h1 class="text-[15px] font-black tracking-tight leading-none text-slate-900">Edit Limbah Keluar</h1>
            <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Koreksi Data</p>
          </div>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-md px-4 pt-5">
      <div v-if="isLoadingData" class="flex flex-col items-center justify-center py-12 text-slate-400">
        <span class="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 mb-3"></span>
        <span class="text-xs font-bold">Memuat data transaksi...</span>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-4">
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
            <div class="space-y-3">
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Batch Sumber Limbah</label>
                <div class="p-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-800">
                  <span class="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold mb-1 text-[9px]">
                    {{ item.batchCode }}
                  </span>
                  <div>{{ item.batchName }}</div>
                  <div class="text-[9px] text-slate-400 font-medium mt-1">
                    Sisa stok: {{ item.batchSisa }} {{ item.satuan_berat }} (ditambah alokasi lama: {{ item.oldBerat }} {{ item.satuan_berat }})
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Berat Keluar Baru ({{ item.satuan_berat }})</label>
                  <input
                    v-model.number="item.berat"
                    type="number"
                    step="0.01"
                    min="0.01"
                    :max="item.maxWeight"
                    placeholder="Masukkan berat"
                    class="w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold focus:outline-none"
                    required
                  />
                  <span class="block mt-1 text-[9px] text-slate-500 font-bold">
                    Max: {{ item.maxWeight }} {{ item.satuan_berat }}
                  </span>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Jumlah Kemasan Baru</label>
                  <input
                    v-model.number="item.jumlah_kemasan"
                    type="number"
                    placeholder="0"
                    class="w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold focus:outline-none"
                    required
                  />
                  <span class="block mt-1 text-[9px] text-slate-500 font-bold">
                    Max: {{ item.maxPackages }} kemasan
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-4 text-sm font-black text-white shadow-lg shadow-rose-200 transition-all active:scale-[0.97] disabled:opacity-60"
        >
          <span v-if="isSubmitting" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          <Save v-else :size="17" />
          SIMPAN PERUBAHAN
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Save } from 'lucide-vue-next'
import { getWarehouseOutHistory, updateWarehouseOut } from '../api/warehouse'
import { useToast } from '../composables/useToast'

const router = useRouter()
const route = useRoute()
const { showToast } = useToast()

const transactionId = Number(route.params.id)
const isLoadingData = ref(true)
const isSubmitting = ref(false)

const form = ref({
  tanggal_keluar: '',
  plat_nomor_kendaraan: '',
  tujuan_pengiriman: '',
  items: [] as { id: number; warehouse_in_detail_id: number; berat: number; oldBerat: number; maxWeight: number; batchCode: string; batchName: string; batchSisa: number; satuan_berat: string; jumlah_kemasan: number; oldJumlahKemasan: number; maxPackages: number }[]
})

const fetchTransaction = async () => {
  isLoadingData.value = true
  try {
    const res = await getWarehouseOutHistory()
    const tx = res.data.data.find((t: any) => t.id === transactionId)
    if (tx) {
      form.value.tanggal_keluar = tx.tanggal_keluar.split('T')[0]
      form.value.plat_nomor_kendaraan = tx.plat_nomor_kendaraan
      form.value.tujuan_pengiriman = tx.tujuan_pengiriman
      form.value.items = tx.details.map((d: any) => {
        const sisa = parseFloat(d.warehouse_in_detail?.berat_sisa || 0)
        const oldB = parseFloat(d.berat)
        const isTon = d.warehouse_in_detail?.satuan_berat === 'ton'
        
        // Convert to display units
        const oldBeratDisp = isTon ? oldB / 1000 : oldB
        const maxWeightDisp = isTon ? (sisa + oldB) / 1000 : (sisa + oldB)
        
        const oldQty = d.jumlah_kemasan || 0
        const sisaQty = d.warehouse_in_detail?.jumlah_kemasan_sisa || 0
        
        return {
          id: d.id,
          warehouse_in_detail_id: d.warehouse_in_detail_id,
          berat: oldBeratDisp,
          oldBerat: oldBeratDisp,
          maxWeight: maxWeightDisp,
          batchCode: d.warehouse_in_detail?.kode_limbah || '-',
          batchName: d.warehouse_in_detail?.nama_limbah || '-',
          batchSisa: isTon ? sisa / 1000 : sisa,
          satuan_berat: d.warehouse_in_detail?.satuan_berat || 'kg',
          jumlah_kemasan: oldQty,
          oldJumlahKemasan: oldQty,
          maxPackages: sisaQty + oldQty
        }
      })
    } else {
      showToast('Transaksi tidak ditemukan.', 'error')
      router.replace('/gudang')
    }
  } catch {
    showToast('Gagal memuat rincian transaksi.', 'error')
  } finally {
    isLoadingData.value = false
  }
}

onMounted(() => {
  fetchTransaction()
})

const handleSubmit = async () => {
  if (isSubmitting.value) return

  // Validate items
  const invalidItem = form.value.items.find(i => i.berat <= 0 || i.berat > i.maxWeight)
  if (invalidItem) {
    showToast('Harap isi berat keluar dengan benar dan tidak melebihi sisa tersedia.', 'info')
    return
  }

  const invalidQty = form.value.items.find(i => i.jumlah_kemasan < 0 || i.jumlah_kemasan > i.maxPackages)
  if (invalidQty) {
    showToast('Harap isi jumlah kemasan dengan benar dan tidak melebihi sisa kemasan tersedia.', 'info')
    return
  }

  isSubmitting.value = true

  try {
    await updateWarehouseOut(transactionId, {
      tanggal_keluar: form.value.tanggal_keluar,
      plat_nomor_kendaraan: form.value.plat_nomor_kendaraan,
      tujuan_pengiriman: form.value.tujuan_pengiriman,
      items: form.value.items.map(i => {
        const isTon = i.satuan_berat === 'ton'
        const beratKg = isTon ? i.berat * 1000 : i.berat
        return {
          id: i.id,
          berat: beratKg,
          jumlah_kemasan: i.jumlah_kemasan
        }
      })
    })
    showToast('Transaksi limbah keluar berhasil diperbarui!', 'success')
    router.replace('/gudang')
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Gagal memperbarui transaksi.'
    showToast(msg, 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>
