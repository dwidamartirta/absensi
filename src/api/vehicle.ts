import api from './axios'

export interface Vehicle {
  id: number
  nopol: string
  brand: string | null
  model: string | null
  type: string | null
}

export interface VehicleIndexResponse {
  success: boolean
  data: Vehicle[]
  has_inspected_today: boolean
}

export interface VehicleInspectionPayload {
  vehicle_id: number
  inspection_date: string
  prev_km: number
  current_km: number
  checklist: {
    id: number
    uraian: string
    condition: 'baik' | 'rusak' | ''
    note: string
  }[]
}

/**
 * Get list of vehicles
 */
export const getVehicles = () => {
  return api.get<VehicleIndexResponse>('/vehicles')
}

/**
 * Get last inspection for a vehicle
 */
export const getLastInspection = (vehicleId: number) => {
  return api.get<{ success: boolean; data: any }>(`/vehicles/${vehicleId}/last-inspection`)
}

/**
 * Submit vehicle inspection
 */
export const submitInspection = (payload: VehicleInspectionPayload) => {
  return api.post<{ success: boolean; message: string }>('/vehicle-inspection', payload)
}

export const getInspectionHistory = () => {
  return api.get<{ success: boolean; data: any[] }>('/vehicle-inspection/history')
}
