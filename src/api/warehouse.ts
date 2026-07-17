import api from './axios'

export interface WarehouseInItem {
  kode_limbah: string
  nama_limbah: string
  berat: number
  lokasi_simpan: string
  foto?: File | null
}

export interface WarehouseOutItem {
  warehouse_in_detail_id: number
  berat: number
}

export interface WarehouseOutPayload {
  tanggal_keluar: string
  plat_nomor_kendaraan: string
  tujuan_pengiriman: string
  items: WarehouseOutItem[]
}

export const getWarehouseStock = (search?: string) => {
  return api.get('/auth/warehouse/stock', { params: { search } })
}

export const getWarehouseClients = () => {
  return api.get('/auth/warehouse/clients')
}

export const getWarehouseItems = () => {
  return api.get('/auth/warehouse/items')
}

export const storeWarehouseIn = (payload: FormData) => {
  return api.post('/auth/warehouse/in', payload, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const storeWarehouseOut = (payload: WarehouseOutPayload) => {
  return api.post('/auth/warehouse/out', payload)
}

export const getWarehouseInHistory = () => {
  return api.get('/auth/warehouse/in/history')
}

export const getWarehouseOutHistory = () => {
  return api.get('/auth/warehouse/out/history')
}

export const updateWarehouseIn = (id: number, payload: FormData) => {
  return api.post(`/auth/warehouse/in/${id}`, payload, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const updateWarehouseOut = (id: number, payload: { tanggal_keluar: string; plat_nomor_kendaraan: string; tujuan_pengiriman: string; items: { id: number; berat: number }[] }) => {
  return api.put(`/auth/warehouse/out/${id}`, payload)
}
