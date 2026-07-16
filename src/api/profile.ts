import api from './axios'

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
  detail: {
    place_of_birth: string | null
    date_of_birth: string | null
    gender: string | null
    marital_status: string | null
    identity_number: string | null
    bank_name: string | null
    bank_account_number: string | null
    emergency_contact_name: string | null
    emergency_contact_phone: string | null
    emergency_contact_relationship: string | null
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
 * Update profile data (name, phone, address, details)
 * PUT /api/v1/auth/profile
 */
export const updateProfile = (payload: any) => {
  return api.put<{ success: boolean; message: string; data: any }>('/auth/profile', payload)
}

/**
 * Change password
 * POST /api/v1/auth/change-password
 */
export const changePassword = (payload: any) => {
  return api.post<{ success: boolean; message: string }>('/auth/change-password', payload)
}
