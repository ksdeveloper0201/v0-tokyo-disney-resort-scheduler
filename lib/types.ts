export type ParkType = 'land' | 'sea'

export type ItemType = 'attraction' | 'show' | 'parade' | 'event' | 'restaurant'

export type DiningType = 'restaurant' | 'fastfood'

export interface ScheduleItem {
  id: string
  name: string
  type: ItemType
  duration: number // in minutes
  parkType: ParkType
  area: string
  // For shows/parades with fixed times
  fixedTimes?: string[] // e.g., ['10:00', '12:30', '15:00']
  // For restaurants
  diningType?: DiningType
  // For schedule board
  selectedTime?: string
  isSelected?: boolean
}

export interface ScheduleSlot {
  id: string
  item: ScheduleItem
  startTime: string // e.g., '09:00'
  endTime: string // e.g., '10:30'
  hasConflict?: boolean
  conflictWith?: string[]
}

export interface DaySchedule {
  date: string
  parkType: ParkType
  slots: ScheduleSlot[]
}

export type SchedulingMode = 'manual' | 'auto'
export type PriorityMode = 'meal' | 'attraction'
