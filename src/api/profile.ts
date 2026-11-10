import api from './axios'

export interface PersonalData {
  name: string | null
  nik_ktp: string | null
  npwp: string | null
  tempat_lahir: string | null
  tanggal_lahir: string | null
  jenis_kelamin: string | null
  status_pernikahan: string | null
  jumlah_anak?: number | string | null
  agama: string | null
  phone_number: string | null
  address: string | null
  bank_name: string | null
  bank_account_number: string | null
  bank_account_name: string | null
  emergency_contact_name: string | null
  emergency_contact_relationship: string | null
  emergency_contact_phone: string | null
}

export interface ProfileData {
  user_id: number
  name: string
  email: string
  employee_id: number
  employee_number: string | null
  phone_number: string | null
  address: string | null
  employment_status: string | null
  join_date: string | null
  is_active: boolean
  position: string | null
  photo_url: string | null
  foto_ktp_url?: string | null
  ktp_document?: {
    id: number
    file_url: string
    verification_status: 'unverified' | 'verified' | 'rejected'
    verified_at: string | null
    ocr_status: string | null
    created_at: string | null
  } | null
  personal: PersonalData
  completeness: number
  last_updated_at: string | null
  detail: {
    place_of_birth: string | null
    date_of_birth: string | null
    gender: string | null
    marital_status: string | null
    identity_number: string | null
    bank_name: string | null
    bank_account_number: string | null
    bank_account_name: string | null
    emergency_contact_name: string | null
    emergency_contact_phone: string | null
    emergency_contact_relationship: string | null
  } | null
  leave_stats?: {
    entitlement: number
    used_cuti: number
    used_izin: number
    used_alpa: number
    total_used: number
    balance: number
  } | null
}

/**
 * Get full profile
 * GET /api/v1/auth/profile
 */
export const getProfile = () => {
  return api.get<{ success: boolean; message: string; data: ProfileData }>('/auth/profile')
}

/**
 * Update data pribadi (tanpa data kepegawaian)
 * PUT /api/v1/auth/profile
 */
export const updateProfile = (payload: Partial<PersonalData>) => {
  return api.put<{ success: boolean; message: string; data: { changed: number; fields?: string[] } }>('/auth/profile', payload)
}

/**
 * Upload foto profil
 * POST /api/v1/auth/profile/photo
 */
export const updateProfilePhoto = (file: File) => {
  const fd = new FormData()
  fd.append('photo', file)
  return api.post<{ success: boolean; message: string; data: { photo_url: string } }>('/auth/profile/photo', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * Change password
 * POST /api/v1/auth/change-password
 */
export const changePassword = (payload: any) => {
  return api.post<{ success: boolean; message: string }>('/auth/change-password', payload)
}

/**
 * Upload berkas e-KTP dan simpan metadata audit trail
 * POST /api/v1/auth/profile/ktp
 */
export const uploadKtp = (file: File, ocrData?: any, ocrRawText?: string, ocrConfidence?: number) => {
  const fd = new FormData()
  fd.append('ktp_image', file)
  if (ocrData) {
    fd.append('ocr_data', typeof ocrData === 'string' ? ocrData : JSON.stringify(ocrData))
  }
  if (ocrRawText) {
    fd.append('ocr_raw_text', ocrRawText)
  }
  if (ocrConfidence !== undefined) {
    fd.append('ocr_confidence', String(ocrConfidence))
  }
  return api.post<{
    success: boolean
    message: string
    data: {
      document_id: number
      file_url: string
      extracted_data: any
    }
  }>('/auth/profile/ktp', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * Parse teks e-KTP via backend
 * POST /api/v1/auth/profile/ktp/parse
 */
export const parseKtpText = (rawText: string) => {
  return api.post<{ success: boolean; message: string; data: any }>('/auth/profile/ktp/parse', { raw_text: rawText })
}
