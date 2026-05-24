'use client'

import { useMemo, useRef } from 'react'
import { useScheduleStore, parseTime, formatTime, calculateEndTime, checkTimeConflict } from '@/lib/store'
import { ScheduleSlot, ScheduleItem, ItemType } from '@/lib/types'
import {
  Sparkles,
  Music,
  Flag,
  Calendar,
  Utensils,
  Clock,
  RefreshCw,
} from 'lucide-react'

interface AutoSchedulerProps {
  onBack: () => void
  onSave: () => void
}

const typeIcons: Record<ItemType, React.ReactNode> = {
  attraction: <Sparkles className="w-3 h-3" />,
  show: <Music className="w-3 h-3" />,
  parade: <Flag className="w-3 h-3" />,
  event: <Calendar className="w-3 h-3" />,
  restaurant: <Utensils className="w-3 h-3" />,
}

const typeColors: Record<ItemType, { bg: string; border: string; text: string }> = {
  attraction: { bg: 'bg-primary/20', border: 'border-primary', text: 'text-primary' },
  show: { bg: 'bg-chart-2/20', border: 'border-chart-2', text: 'text-chart-2' },
  parade: { bg: 'bg-chart-3/20', border: 'border-chart-3', text: 'text-chart-3' },
  event: { bg: 'bg-chart-4/20', border: 'border-chart-4', text: 'text-chart-4' },
  restaurant: { bg: 'bg-accent/20', border: 'border-accent', text: 'text-accent' },
}

function generateAutoSchedule(
  items: ScheduleItem[],
  priorityMode: 'attraction' | 'meal'
): ScheduleSlot[] {
  const slots: ScheduleSlot[] = []
  const parkOpenTime = '09:00'
  const parkCloseTime = '22:00'

  // Separate items by type
  const fixedTimeItems = items.filter((item) => item.fixedTimes && item.fixedTimes.length > 0)
  const restaurants = items.filter((item) => item.type === 'restaurant')
  const flexibleItems = items.filter(
    (item) => !item.fixedTimes && item.type !== 'restaurant'
  )

  // Helper to check if time slot is available
  const isSlotAvailable = (start: string, end: string): boolean => {
    return !slots.some((slot) =>
      checkTimeConflict(start, end, slot.startTime, slot.endTime)
    )
  }

  // Helper to find next available time
  const findNextAvailableTime = (
    afterTime: string,
    duration: number,
    beforeTime: string = parkCloseTime
  ): string | null => {
    let currentTime = parseTime(afterTime)
    const maxTime = parseTime(beforeTime) - duration

    while (currentTime <= maxTime) {
      const startTime = formatTime(currentTime)
      const endTime = calculateEndTime(startTime, duration)
      if (isSlotAvailable(startTime, endTime)) {
        return startTime
      }
      currentTime += 15 // Try every 15 minutes
    }
    return null
  }

  // 1. First, schedule items with fixed times (shows, parades, events)
  fixedTimeItems.forEach((item) => {
    if (!item.fixedTimes) return
    // Find the first available fixed time
    for (const time of item.fixedTimes) {
      const endTime = calculateEndTime(time, item.duration)
      if (isSlotAvailable(time, endTime)) {
        slots.push({
          id: `auto-${item.id}-${time}`,
          item,
          startTime: time,
          endTime,
        })
        break
      }
    }
  })

  // 2. Schedule based on priority
  if (priorityMode === 'meal') {
    // Schedule meals first at standard meal times
    const mealTimes = ['12:00', '18:00'] // Lunch and Dinner
    restaurants.forEach((restaurant, index) => {
      const preferredTime = mealTimes[index] || '15:00'
      const time = findNextAvailableTime(preferredTime, restaurant.duration)
      if (time) {
        slots.push({
          id: `auto-${restaurant.id}-${time}`,
          item: restaurant,
          startTime: time,
          endTime: calculateEndTime(time, restaurant.duration),
        })
      }
    })

    // Then fill with attractions
    flexibleItems.forEach((item) => {
      const time = findNextAvailableTime(parkOpenTime, item.duration)
      if (time) {
        slots.push({
          id: `auto-${item.id}-${time}`,
          item,
          startTime: time,
          endTime: calculateEndTime(time, item.duration),
        })
      }
    })
  } else {
    // Schedule attractions first
    flexibleItems.forEach((item) => {
      const time = findNextAvailableTime(parkOpenTime, item.duration)
      if (time) {
        slots.push({
          id: `auto-${item.id}-${time}`,
          item,
          startTime: time,
          endTime: calculateEndTime(time, item.duration),
        })
      }
    })

    // Then schedule meals in gaps
    restaurants.forEach((restaurant) => {
      const time = findNextAvailableTime('11:30', restaurant.duration, '14:00') ||
        findNextAvailableTime('17:30', restaurant.duration, '20:00') ||
        findNextAvailableTime(parkOpenTime, restaurant.duration)
      if (time) {
        slots.push({
          id: `auto-${restaurant.id}-${time}`,
          item: restaurant,
          startTime: time,
          endTime: calculateEndTime(time, restaurant.duration),
        })
      }
    })
  }

  // Sort by start time
  return slots.sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))
}

export function AutoScheduler({ onBack, onSave }: AutoSchedulerProps) {
  const { selectedItems, scheduleSlots, setScheduleSlots, priorityMode, setStep } =
    useScheduleStore()

  const boardRef = useRef<HTMLDivElement>(null)

  const hourSlots = useMemo(() => {
    const hours: string[] = []
    for (let h = 8; h < 22; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`)
    }
    return hours
  }, [])

  // Generate schedule on first render or when regenerate is clicked
  const handleGenerate = () => {
    const newSlots = generateAutoSchedule(selectedItems, priorityMode)
    setScheduleSlots(newSlots)
  }

  // Auto-generate on mount if no slots
  useMemo(() => {
    if (scheduleSlots.length === 0 && selectedItems.length > 0) {
      const newSlots = generateAutoSchedule(selectedItems, priorityMode)
      setScheduleSlots(newSlots)
    }
  }, [])

  const getSlotPosition = (startTime: string, endTime: string) => {
    const startMinutes = parseTime(startTime) - 8 * 60
    const endMinutes = parseTime(endTime) - 8 * 60
    const top = (startMinutes / 30) * 48
    const height = ((endMinutes - startMinutes) / 30) * 48
    return { top, height }
  }

  const unscheduledItems = useMemo(() => {
    const scheduledIds = new Set(scheduleSlots.map((slot) => slot.item.id))
    return selectedItems.filter((item) => !scheduledIds.has(item.id))
  }, [selectedItems, scheduleSlots])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setStep(4)
                onBack()
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              戻る
            </button>
            <h1 className="text-xl font-bold text-foreground">自動スケジュール</h1>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Regenerate Button */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {scheduleSlots.length}個のアイテムをスケジュール済み
            {unscheduledItems.length > 0 && (
              <span className="text-destructive">
                （{unscheduledItems.length}個は時間が重複のため未配置）
              </span>
            )}
          </p>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            再生成
          </button>
        </div>

        {/* Unscheduled Items Warning */}
        {unscheduledItems.length > 0 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm text-destructive font-medium mb-2">
              以下のアイテムはスケジュールに入れられませんでした：
            </p>
            <div className="flex flex-wrap gap-2">
              {unscheduledItems.map((item) => (
                <span
                  key={item.id}
                  className={`text-xs px-2 py-1 rounded-full ${typeColors[item.type].bg} ${typeColors[item.type].text}`}
                >
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Schedule List View */}
        <div className="bg-card rounded-xl border border-border overflow-hidden mb-6">
          <div className="p-4 border-b border-border">
            <h2 className="font-medium text-card-foreground">本日のスケジュール</h2>
          </div>
          <div className="divide-y divide-border">
            {scheduleSlots.map((slot, index) => {
              const colors = typeColors[slot.item.type]
              return (
                <div key={slot.id} className="flex items-center gap-4 p-4">
                  <div className="text-center min-w-[60px]">
                    <div className="font-bold text-foreground">{slot.startTime}</div>
                    <div className="text-xs text-muted-foreground">{slot.endTime}</div>
                  </div>
                  <div
                    className={`flex-1 p-3 rounded-lg border ${colors.bg} ${colors.border}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={colors.text}>{typeIcons[slot.item.type]}</span>
                      <span className="font-medium text-card-foreground">
                        {slot.item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{slot.item.duration}分</span>
                      <span>•</span>
                      <span>{slot.item.area}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {scheduleSlots.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                スケジュールを生成してください
              </div>
            )}
          </div>
        </div>

        {/* Timeline View */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-medium text-card-foreground mb-4">タイムライン</h2>
          <div className="relative min-h-[600px]" ref={boardRef}>
            {/* Time labels */}
            <div className="absolute left-0 top-0 w-12">
              {hourSlots.map((hour) => (
                <div
                  key={hour}
                  className="h-24 flex items-start justify-end pr-2 text-xs text-muted-foreground"
                >
                  {hour}
                </div>
              ))}
            </div>

            {/* Grid and slots */}
            <div className="ml-14 relative">
              {/* Grid lines */}
              {hourSlots.map((hour) => (
                <div key={hour}>
                  <div className="h-12 border-t border-border" />
                  <div className="h-12 border-t border-border/50 border-dashed" />
                </div>
              ))}

              {/* Scheduled slots */}
              <div className="absolute inset-0">
                {scheduleSlots.map((slot) => {
                  const { top, height } = getSlotPosition(slot.startTime, slot.endTime)
                  const colors = typeColors[slot.item.type]

                  return (
                    <div
                      key={slot.id}
                      className={`absolute left-1 right-1 rounded-lg border-2 p-2 ${colors.bg} ${colors.border}`}
                      style={{
                        top: `${top}px`,
                        height: `${Math.max(height, 32)}px`,
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span className={colors.text}>{typeIcons[slot.item.type]}</span>
                        <span className="font-medium text-xs text-card-foreground truncate">
                          {slot.item.name}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
