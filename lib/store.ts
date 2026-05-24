'use client'

import { create } from 'zustand'
import { ParkType, ScheduleItem, ScheduleSlot, ItemType, DEFAULT_CATEGORY_ORDER } from './types'

// Helper functions
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

// Check if an item has fixed time (shows, parades, events)
export function isFixedTimeItem(item: ScheduleItem): boolean {
  return item.type === 'show' || item.type === 'parade' || item.type === 'event'
}

interface ScheduleState {
  // Navigation state
  step: number
  parkType: ParkType | null

  // Priority ranking (category order)
  categoryOrder: ItemType[]

  // Current active category for selection
  activeCategory: ItemType

  // Selection state
  selectedItems: ScheduleItem[]
  scheduleSlots: ScheduleSlot[]

  // Actions
  setStep: (step: number) => void
  setParkType: (type: ParkType) => void
  
  setCategoryOrder: (order: ItemType[]) => void
  setActiveCategory: (category: ItemType) => void
  
  addSelectedItem: (item: ScheduleItem) => void
  removeSelectedItem: (itemId: string) => void
  toggleSelectedItem: (item: ScheduleItem) => void
  clearSelectedItems: () => void
  
  addScheduleSlot: (slot: ScheduleSlot) => void
  removeScheduleSlot: (slotId: string) => void
  updateScheduleSlot: (slotId: string, updates: Partial<ScheduleSlot>) => void
  setScheduleSlots: (slots: ScheduleSlot[]) => void
  clearScheduleSlots: () => void
  moveSlotToTime: (slotId: string, newStartTime: string) => void
  
  reset: () => void
}

const initialState = {
  step: 1,
  parkType: null as ParkType | null,
  categoryOrder: [...DEFAULT_CATEGORY_ORDER],
  activeCategory: 'attraction' as ItemType,
  selectedItems: [] as ScheduleItem[],
  scheduleSlots: [] as ScheduleSlot[],
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  
  setParkType: (parkType) => set({ parkType }),
  
  setCategoryOrder: (categoryOrder) => set({ categoryOrder }),
  
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  
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
    
    // For shows/parades with single fixed time, auto-add to schedule
    if (item.fixedTimes && item.fixedTimes.length === 1) {
      const time = item.fixedTimes[0]
      const startMinutes = parseTime(time)
      const endTime = formatTime(startMinutes + item.duration)
      
      const newSlot: ScheduleSlot = {
        id: `slot-${item.id}-${Date.now()}`,
        item: { ...item, selectedTime: time },
        startTime: time,
        endTime,
        hasConflict: false,
        conflictWith: [],
        isLocked: true, // Fixed time items are locked
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
  
  moveSlotToTime: (slotId, newStartTime) => {
    const state = get()
    const slot = state.scheduleSlots.find((s) => s.id === slotId)
    if (!slot) return
    
    // For locked items, check if the new time is in fixedTimes
    if (slot.isLocked && slot.item.fixedTimes) {
      if (!slot.item.fixedTimes.includes(newStartTime)) {
        return // Cannot move to non-fixed time
      }
    }
    
    const newEndTime = calculateEndTime(newStartTime, slot.item.duration)
    
    set((state) => ({
      scheduleSlots: state.scheduleSlots.map((s) =>
        s.id === slotId
          ? { ...s, startTime: newStartTime, endTime: newEndTime }
          : s
      ),
    }))
  },
  
  reset: () => set(initialState),
}))
