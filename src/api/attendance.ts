import api from './axios'

export type AttendanceType = 'clock_in' | 'clock_out'
export type AttendanceStatus = 'present' | 'late' | 'sick' | 'permit' | 'leave'

export interface AttendanceRecord {
  id: number
  date: string              // format: YYYY-MM-DD
  time_in: string | null    // format: HH:mm:ss
  time_out: string | null   // format: HH:mm:ss
  status: string
  lat_in: number | null
  long_in: number | null
  lat_out: number | null
  long_out: number | null
  attendance_detail: string | null
  daily_trip: string | null
  late_minutes: number | null
  work_hours: number | null
  attachment: string | null
  created_at: string
}

export interface AttendanceIndexResponse {
  data: AttendanceRecord[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface StoreAttendancePayload {
  status: string             // 'Hadir', 'Terlambat', 'sakit', 'izin'
  lat?: number
  long?: number
  attendance_detail?: string
  daily_trip?: string
  start_date?: string
  end_date?: string
  attachment?: File | null   // untuk sakit/izin
}

/**
 * Ambil riwayat absensi karyawan
 * GET /api/v1/auth/attendance
 * Query params: start_date, end_date, status
 */
export const getAttendanceHistory = (params?: {
  start_date?: string
  end_date?: string
  status?: string
  per_page?: number
}) => {
  return api.get<AttendanceIndexResponse>('/auth/attendance', { params })
}

/**
 * Simpan absensi (clock in atau clock out)
 * POST /api/v1/auth/attendance
 */
export const storeAttendance = (payload: StoreAttendancePayload) => {
  // Gunakan FormData agar bisa kirim file attachment
  const formData = new FormData()
  formData.append('status', payload.status)
  if (payload.lat !== undefined) formData.append('lat', String(payload.lat))
  if (payload.long !== undefined) formData.append('long', String(payload.long))
  if (payload.attendance_detail) formData.append('attendance_detail', payload.attendance_detail)
  if (payload.daily_trip) formData.append('daily_trip', payload.daily_trip)
  if (payload.start_date) formData.append('start_date', payload.start_date)
  if (payload.end_date) formData.append('end_date', payload.end_date)
  if (payload.attachment) formData.append('attachment', payload.attachment)

  return api.post<{ message: string; data: AttendanceRecord }>('/auth/attendance', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * Ambil daftar lokasi absen yang diizinkan untuk user
 * GET /api/v1/auth/locations
 */
export const getLocations = () => {
  return api.get<{ success: boolean; message: string; data: any[] }>('/auth/locations')
}

export const checkAttendanceStatus = () => {
  return api.get<{ success: boolean; data: { state: string; time_in: string | null; time_out: string | null; date: string } }>('/auth/attendance/check-status')
}

/**
 * Ambil ringkasan absensi bulanan
 * GET /api/v1/auth/attendance/summary
 */
export const getAttendanceSummary = () => {
  return api.get<{ success: boolean; data: { present: number; late: number; absent: number } }>('/auth/attendance/summary')
}

export interface AbsentEmployee {
  id: number
  nik_karyawan: string
  full_name: string
  email: string | null
  position_name: string | null
}

export interface AbsentEmployeesResponse {
  success: boolean
  message: string
  date: string
  total_absent: number
  data: AbsentEmployee[]
}

/**
 * Ambil daftar karyawan yang tidak masuk (absen) pada tanggal tertentu
 * GET /api/v1/admin/attendance/absent
 */
export const getAbsentEmployees = (params?: { date?: string }) => {
  return api.get<AbsentEmployeesResponse>('/admin/attendance/absent', { params })
}

