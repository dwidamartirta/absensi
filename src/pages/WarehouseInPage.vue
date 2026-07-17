<template>
  <div class="page-container pb-10">
    <header class="page-header">
      <div class="page-header-inner flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button @click="$router.push('/gudang')" class="text-slate-600 active:scale-95">
            <ArrowLeft :size="20" />
          </button>
          <div>
            <h1 class="text-[15px] font-black tracking-tight leading-none text-slate-900">Catat Limbah Masuk</h1>
            <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Input Limbah</p>
          </div>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-md px-4 pt-5">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="card p-5 space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Masuk</label>
            <input
              v-model="form.tanggal_masuk"
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
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">PT Penghasil / Pengirim</label>
            <select
              v-model="form.client_id"
              class="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold focus:border-blue-500 focus:outline-none mb-2"
            >
              <option :value="null">-- Pilih Dari Database --</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <input
              v-model="form.client_name_fallback"
              type="text"
              placeholder="Tulis manual jika PT tidak terdaftar di atas"
              class="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div class="border-t border-slate-200 pt-4">
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-wide mb-3">Daftar Limbah Masuk</h3>
          
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
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Template Limbah (Opsional)</label>
                <select
                  @change="fillFromTemplate(idx, $event)"
                  class="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:outline-none"
                >
                  <option value="">-- Pilih Limbah --</option>
                  <option v-for="it in itemTemplates" :key="it.id" :value="it.id" :data-code="it.item_code" :data-name="it.name" :data-loc="it.characteristics">
                    {{ it.name }} ({{ it.item_code }})
                  </option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kode Limbah</label>
                  <input
                    v-model="item.kode_limbah"
                    type="text"
                    placeholder="A102b"
                    class="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nama Limbah</label>
                  <input
                    v-model="item.nama_limbah"
                    type="text"
                    placeholder="TCE"
                    class="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Berat Limbah</label>
                  <div class="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <input
                      v-model.number="item.berat"
                      type="number"
                      step="0.01"
                      placeholder="Jumlah"
                      class="w-full p-2.5 text-xs font-semibold focus:outline-none"
                      required
                    />
                    <select
                      v-model="item.satuan_berat"
                      class="bg-slate-100 border-l border-slate-200 text-xs font-bold px-2 py-2 focus:outline-none"
                    >
                      <option value="kg">Kg</option>
                      <option value="ton">Ton</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lokasi Simpan</label>
                  <input
                    v-model="item.lokasi_simpan"
                    type="text"
                    placeholder="GUDANG 2"
                    class="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Jenis Kemasan</label>
                  <select
                    v-model="item.jenis_kemasan"
                    class="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="" disabled>-- Pilih --</option>
                    <option value="Drum">Drum</option>
                    <option value="Tangki/IBC">Tangki/IBC</option>
                    <option value="Bak Kontainer">Bak Kontainer</option>
                    <option value="Kantong/Karung (Jumbo Bag)">Kantong/Karung (Jumbo Bag)</option>
                    <option value="Jerigen">Jerigen</option>
                    <option value="Kaleng">Kaleng</option>
                    <option value="Botol">Botol</option>
                    <option value="Tabung/Silinder">Tabung/Silinder</option>
                    <option value="Curah (Bulk)">Curah (Bulk)</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Jumlah Kemasan</label>
                  <input
                    v-model.number="item.jumlah_kemasan"
                    type="number"
                    placeholder="Contoh: 10"
                    class="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Foto Limbah (Ambil Gambar)</label>
                <input
                  type="file"
                  accept="image/*"
                  @change="handlePhotoUpload(idx, $event)"
                  class="w-full text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            @click="addItem"
            class="flex items-center justify-center gap-1.5 w-full rounded-xl border-2 border-dashed border-slate-300 py-3.5 text-xs font-bold text-slate-500 hover:border-emerald-500 hover:text-emerald-600 transition-all active:scale-[0.98]"
          >
            <Plus :size="15" />
            Tambah Baris Limbah
          </button>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-200 transition-all active:scale-[0.97] disabled:opacity-60"
        >
          <span v-if="isSubmitting" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          <Save v-else :size="17" />
          SIMPAN LIMBAH MASUK
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Trash2, Plus, Save } from 'lucide-vue-next'
import { getWarehouseClients, getWarehouseItems, storeWarehouseIn } from '../api/warehouse'
import { useToast } from '../composables/useToast'

const router = useRouter()
const { showToast } = useToast()

const clients = ref<any[]>([])
const itemTemplates = ref<any[]>([])
const isSubmitting = ref(false)

const form = ref({
  tanggal_masuk: new Date().toISOString().split('T')[0],
  client_id: null as number | null,
  client_name_fallback: '',
  plat_nomor_kendaraan: '',
  items: [
    { kode_limbah: '', nama_limbah: '', berat: 0, satuan_berat: 'kg', jenis_kemasan: 'Drum', jumlah_kemasan: 0, lokasi_simpan: '', foto: null as File | null }
  ]
})

const fetchDropdowns = async () => {
  try {
    const [cRes, iRes] = await Promise.all([getWarehouseClients(), getWarehouseItems()])
    clients.value = cRes.data.data
    itemTemplates.value = iRes.data.data
  } catch {
    showToast('Gagal memuat daftar template/klien.', 'error')
  }
}

onMounted(() => {
  fetchDropdowns()
})

const addItem = () => {
  form.value.items.push({ kode_limbah: '', nama_limbah: '', berat: 0, satuan_berat: 'kg', jenis_kemasan: 'Drum', jumlah_kemasan: 0, lokasi_simpan: '', foto: null })
}

const removeItem = (idx: number) => {
  form.value.items.splice(idx, 1)
}

const handlePhotoUpload = (idx: number, event: any) => {
  const file = event.target.files[0]
  if (file) {
    form.value.items[idx].foto = file
  }
}

const fillFromTemplate = (idx: number, event: any) => {
  const selectedId = event.target.value
  if (!selectedId) return
  const tmpl = itemTemplates.value.find(t => t.id == selectedId)
  if (tmpl) {
    form.value.items[idx].kode_limbah = tmpl.item_code
    form.value.items[idx].nama_limbah = tmpl.name
    form.value.items[idx].lokasi_simpan = tmpl.characteristics || ''
  }
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  
  if (!form.value.client_id && !form.value.client_name_fallback) {
    showToast('Pilih PT Pengirim atau ketik nama manual.', 'info')
    return
  }

  if (form.value.items.length === 0) {
    showToast('Harap tambahkan minimal satu barang.', 'info')
    return
  }

  // Validate items fields
  for (const item of form.value.items) {
    if (!item.kode_limbah.trim() || !item.nama_limbah.trim() || !item.lokasi_simpan.trim()) {
      showToast('Harap lengkapi semua kolom Kode, Nama, dan Lokasi Barang.', 'info')
      return
    }
    if (item.berat <= 0) {
      showToast('Berat barang harus lebih besar dari 0 kg.', 'info')
      return
    }
  }

  isSubmitting.value = true
  
  // Construct FormData
  const formData = new FormData()
  formData.append('tanggal_masuk', form.value.tanggal_masuk)
  if (form.value.client_id) {
    formData.append('client_id', String(form.value.client_id))
  }
  if (form.value.client_name_fallback) {
    formData.append('client_name_fallback', form.value.client_name_fallback)
  }
  formData.append('plat_nomor_kendaraan', form.value.plat_nomor_kendaraan)

  form.value.items.forEach((item, idx) => {
    formData.append(`items[${idx}][kode_limbah]`, item.kode_limbah)
    formData.append(`items[${idx}][nama_limbah]`, item.nama_limbah)
    formData.append(`items[${idx}][berat]`, String(item.berat))
    formData.append(`items[${idx}][satuan_berat]`, item.satuan_berat)
    formData.append(`items[${idx}][jenis_kemasan]`, item.jenis_kemasan)
    formData.append(`items[${idx}][jumlah_kemasan]`, String(item.jumlah_kemasan))
    formData.append(`items[${idx}][lokasi_simpan]`, item.lokasi_simpan)
    if (item.foto) {
      formData.append(`items[${idx}][foto]`, item.foto)
    }
  })

  try {
    await storeWarehouseIn(formData)
    showToast('Barang masuk berhasil dicatat!', 'success')
    router.replace('/gudang')
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Gagal menyimpan data.'
    showToast(msg, 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>
