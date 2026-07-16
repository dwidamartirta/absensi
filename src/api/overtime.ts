import api from './axios'

export interface OvertimeRecord {
  id: number
  employee_id: number
  date: string           // YYYY-MM-DD
  start_time: string     // HH:MM
  end_time: string       // HH:MM
  duration: number | null // hours
  reason: string
  attachment: string | null
  status: 'pending' | 'approved' | 'rejected'
  approved_by: number | null
  approved_at: string | null
  created_at: string
}

export interface StoreOvertimePayload {
  date: string        // YYYY-MM-DD
  start_time: string  // HH:MM
  end_time: string    // HH:MM
  reason: string
  attachment?: File | null
}

/**
 * Daftar pengajuan lembur milik karyawan
 * GET /api/v1/auth/overtime?month=04&year=2026
 */
export const getOvertimeList = (params?: { month?: number; year?: number }) => {
  return api.get<{ success: boolean; message: string; data: OvertimeRecord[] }>(
    '/auth/overtime',
    { params }
  )
}

/**
 * Ajukan lembur baru
 * POST /api/v1/auth/overtime
 */
export const storeOvertime = (payload: StoreOvertimePayload) => {
  const formData = new FormData()
  formData.append('date', payload.date)
  formData.append('start_time', payload.start_time)
  formData.append('end_time', payload.end_time)
  formData.append('reason', payload.reason)
  if (payload.attachment) formData.append('attachment', payload.attachment)

  return api.post<{ success: boolean; message: string; data: OvertimeRecord }>(
    '/auth/overtime',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
}

/**
 * Detail satu pengajuan lembur
 * GET /api/v1/auth/overtime/{id}
 */
export const getOvertimeDetail = (id: number) => {
  return api.get<{ success: boolean; message: string; data: OvertimeRecord }>(
    `/auth/overtime/${id}`
  )
}

/**
 * Batalkan pengajuan lembur (hanya jika status pending)
 * DELETE /api/v1/auth/overtime/{id}
 */
export const cancelOvertime = (id: number) => {
  return api.delete<{ success: boolean; message: string }>(
    `/auth/overtime/${id}`
  )
}
