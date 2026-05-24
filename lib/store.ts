'use client'

import { create } from 'zustand'
import { ParkType, ScheduleItem, ScheduleSlot, SchedulingMode, PriorityMode } from './types'

// Helper functions (defined before store to use in actions)
function parseTimeHelper(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function formatTimeHelper(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

interface ScheduleState {
  // Navigation state
  step: number
  parkType: ParkType | null
  schedulingMode: SchedulingMode | null
  priorityMode: PriorityMode

  // Selection state
  selectedItems: ScheduleItem[]
  scheduleSlots: ScheduleSlot[]

  // Actions
  setStep: (step: number) => void
  setParkType: (type: ParkType) => void
  setSchedulingMode: (mode: SchedulingMode) => void
  setPriorityMode: (mode: PriorityMode) => void
  
  addSelectedItem: (item: ScheduleItem) => void
  removeSelectedItem: (itemId: string) => void
  toggleSelectedItem: (item: ScheduleItem) => void
  clearSelectedItems: () => void
  
  addScheduleSlot: (slot: ScheduleSlot) => void
  removeScheduleSlot: (slotId: string) => void
  updateScheduleSlot: (slotId: string, updates: Partial<ScheduleSlot>) => void
  setScheduleSlots: (slots: ScheduleSlot[]) => void
  clearScheduleSlots: () => void
  
  reset: () => void
}

const initialState = {
  step: 1,
  parkType: null as ParkType | null,
  schedulingMode: null as SchedulingMode | null,
  priorityMode: 'attraction' as PriorityMode,
  selectedItems: [] as ScheduleItem[],
  scheduleSlots: [] as ScheduleSlot[],
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  
  setParkType: (parkType) => set({ parkType }),
  
  setSchedulingMode: (schedulingMode) => set({ schedulingMode }),
  
  setPriorityMode: (priorityMode) => set({ priorityMode }),
  
  addSelectedItem: (item) => set((state) => ({
    selectedItems: [...state.selectedItems, item],
  })),
  
  removeSelectedItem: (itemId) => set((state) => ({
    selectedItems: state.selectedItems.filter((item) => item.id !== itemId),
    scheduleSlots: state.scheduleSlots.filter((slot) => slot.item.id !== itemId),
  })),
  
  toggleSelectedItem: (item) => set((state) => {
    const exists = state.selectedItems.some((i) => i.id === item.id)
    if (exists) {
      return {
        selectedItems: state.selectedItems.filter((i) => i.id !== item.id),
        scheduleSlots: state.scheduleSlots.filter((slot) => slot.item.id !== item.id),
      }
    }
    
    // For shows/parades with fixed times, auto-add to schedule with first available time
    if (item.fixedTimes && item.fixedTimes.length > 0) {
      const firstTime = item.fixedTimes[0]
      const startMinutes = parseTimeHelper(firstTime)
      const endTime = formatTimeHelper(startMinutes + item.duration)
      
      const newSlot: ScheduleSlot = {
        id: `slot-${item.id}-${Date.now()}`,
        item: { ...item, selectedTime: firstTime },
        startTime: firstTime,
        endTime,
        hasConflict: false,
        conflictWith: [],
      }
      
      return {
        selectedItems: [...state.selectedItems, item],
        scheduleSlots: [...state.scheduleSlots, newSlot],
      }
    }
    
    return {
      selectedItems: [...state.selectedItems, item],
    }
  }),
  
  clearSelectedItems: () => set({ selectedItems: [], scheduleSlots: [] }),
  
  addScheduleSlot: (slot) => set((state) => ({
    scheduleSlots: [...state.scheduleSlots, slot],
  })),
  
  removeScheduleSlot: (slotId) => set((state) => ({
    scheduleSlots: state.scheduleSlots.filter((slot) => slot.id !== slotId),
  })),
  
  updateScheduleSlot: (slotId, updates) => set((state) => ({
    scheduleSlots: state.scheduleSlots.map((slot) =>
      slot.id === slotId ? { ...slot, ...updates } : slot
    ),
  })),
  
  setScheduleSlots: (slots) => set({ scheduleSlots: slots }),
  
  clearScheduleSlots: () => set({ scheduleSlots: [] }),
  
  reset: () => set(initialState),
}))

// Utility functions
export function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export function checkTimeConflict(
  slot1Start: string,
  slot1End: string,
  slot2Start: string,
  slot2End: string
): boolean {
  const s1Start = parseTime(slot1Start)
  const s1End = parseTime(slot1End)
  const s2Start = parseTime(slot2Start)
  const s2End = parseTime(slot2End)
  
  return s1Start < s2End && s2Start < s1End
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMinutes = parseTime(startTime)
  return formatTime(startMinutes + durationMinutes)
}

export function generateTimeSlots(
  startHour: number = 9,
  endHour: number = 22,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = []
  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += intervalMinutes) {
      slots.push(formatTime(hour * 60 + min))
    }
  }
  return slots
}
