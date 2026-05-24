'use client'

import { useMemo, useState, useCallback, useRef, DragEvent } from 'react'
import { useScheduleStore, parseTime, formatTime, calculateEndTime, checkTimeConflict, generateTimeSlots } from '@/lib/store'
import { ScheduleSlot, ScheduleItem, ItemType } from '@/lib/types'
import {
  Sparkles,
  Music,
  Flag,
  Calendar,
  Utensils,
  X,
  AlertTriangle,
  Clock,
  GripVertical,
} from 'lucide-react'

interface TimeScheduleBoardProps {
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

export function TimeScheduleBoard({ onBack, onSave }: TimeScheduleBoardProps) {
  const {
    selectedItems,
    scheduleSlots,
    addScheduleSlot,
    removeScheduleSlot,
    updateScheduleSlot,
    setStep,
  } = useScheduleStore()

  const [showTimeModal, setShowTimeModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null)
  const [conflictResolutionModal, setConflictResolutionModal] = useState<{
    newSlot: ScheduleSlot
    conflictingSlots: ScheduleSlot[]
  } | null>(null)
  const [draggedItem, setDraggedItem] = useState<ScheduleItem | null>(null)
  const [dropTargetTime, setDropTargetTime] = useState<string | null>(null)

  const boardRef = useRef<HTMLDivElement>(null)

  const timeSlots = useMemo(() => generateTimeSlots(8, 22, 30), [])
  const hourSlots = useMemo(() => {
    const hours: string[] = []
    for (let h = 8; h < 22; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`)
    }
    return hours
  }, [])

  // Items not yet scheduled
  const unscheduledItems = useMemo(() => {
    const scheduledIds = new Set(scheduleSlots.map((slot) => slot.item.id))
    return selectedItems.filter((item) => !scheduledIds.has(item.id))
  }, [selectedItems, scheduleSlots])

  // Check for conflicts
  const slotsWithConflicts = useMemo(() => {
    return scheduleSlots.map((slot) => {
      const conflicts = scheduleSlots.filter(
        (other) =>
          other.id !== slot.id &&
          checkTimeConflict(slot.startTime, slot.endTime, other.startTime, other.endTime)
      )
      return {
        ...slot,
        hasConflict: conflicts.length > 0,
        conflictWith: conflicts.map((c) => c.id),
      }
    })
  }, [scheduleSlots])

  const handleItemClick = (item: ScheduleItem) => {
    setSelectedItem(item)
    setShowTimeModal(true)
  }

  const handleTimeSelect = useCallback(
    (time: string, item?: ScheduleItem) => {
      const targetItem = item || selectedItem
      if (!targetItem) return

      const endTime = calculateEndTime(time, targetItem.duration)
      const newSlot: ScheduleSlot = {
        id: `slot-${targetItem.id}-${time}`,
        item: targetItem,
        startTime: time,
        endTime,
      }

      // Check for conflicts
      const conflicts = scheduleSlots.filter((slot) =>
        checkTimeConflict(time, endTime, slot.startTime, slot.endTime)
      )

      if (conflicts.length > 0) {
        setConflictResolutionModal({ newSlot, conflictingSlots: conflicts })
      } else {
        addScheduleSlot(newSlot)
        setShowTimeModal(false)
        setSelectedItem(null)
      }
    },
    [selectedItem, scheduleSlots, addScheduleSlot]
  )

  const handleConflictResolve = (keepNew: boolean) => {
    if (!conflictResolutionModal) return

    if (keepNew) {
      // Remove conflicting slots and add new one
      conflictResolutionModal.conflictingSlots.forEach((slot) => {
        removeScheduleSlot(slot.id)
      })
      addScheduleSlot(conflictResolutionModal.newSlot)
    }
    // If keepNew is false, we just close the modal and don't add

    setConflictResolutionModal(null)
    setShowTimeModal(false)
    setSelectedItem(null)
  }

  const handleKeepBoth = () => {
    if (!conflictResolutionModal) return
    // Add with conflict flag
    addScheduleSlot({
      ...conflictResolutionModal.newSlot,
      hasConflict: true,
      conflictWith: conflictResolutionModal.conflictingSlots.map((s) => s.id),
    })
    // Update existing slots to mark conflicts
    conflictResolutionModal.conflictingSlots.forEach((slot) => {
      updateScheduleSlot(slot.id, {
        hasConflict: true,
        conflictWith: [...(slot.conflictWith || []), conflictResolutionModal.newSlot.id],
      })
    })
    setConflictResolutionModal(null)
    setShowTimeModal(false)
    setSelectedItem(null)
  }

  const getSlotPosition = (startTime: string, endTime: string) => {
    const startMinutes = parseTime(startTime) - 8 * 60
    const endMinutes = parseTime(endTime) - 8 * 60
    const top = (startMinutes / 30) * 48 // 48px per 30-min slot
    const height = ((endMinutes - startMinutes) / 30) * 48
    return { top, height }
  }

  // Drag and Drop handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, item: ScheduleItem) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.id)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDropTargetTime(null)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>, time: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTargetTime(time)
  }

  const handleDragLeave = () => {
    setDropTargetTime(null)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>, time: string) => {
    e.preventDefault()
    setDropTargetTime(null)

    if (!draggedItem) return

    // For items with fixed times, show modal to select from available times
    if (draggedItem.fixedTimes && draggedItem.fixedTimes.length > 0) {
      setSelectedItem(draggedItem)
      setShowTimeModal(true)
      setDraggedItem(null)
      return
    }

    // For regular items, add at the dropped time
    handleTimeSelect(time, draggedItem)
    setDraggedItem(null)
  }

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
            <h1 className="text-xl font-bold text-foreground">タイムスケジュール</h1>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Unscheduled Items Panel */}
        <div className="lg:w-80 border-b lg:border-b-0 lg:border-r border-border bg-card">
          <div className="p-4">
            <h2 className="font-medium text-card-foreground mb-2">
              未配置のアイテム ({unscheduledItems.length})
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              ドラッグ&ドロップでタイムボードに配置
            </p>
            <div className="space-y-2 max-h-48 lg:max-h-[calc(100vh-200px)] overflow-y-auto">
              {unscheduledItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleItemClick(item)}
                  className={`w-full p-3 rounded-lg border text-left transition-all cursor-grab active:cursor-grabbing hover:shadow-md ${
                    typeColors[item.type].bg
                  } ${typeColors[item.type].border} ${
                    draggedItem?.id === item.id ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className={typeColors[item.type].text}>
                      {typeIcons[item.type]}
                    </span>
                    <span className="font-medium text-card-foreground text-sm truncate flex-1">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                    <Clock className="w-3 h-3" />
                    <span>{item.duration}分</span>
                    {item.fixedTimes && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        公演時間指定
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {unscheduledItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  全てのアイテムを配置済み
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Time Board */}
        <div className="flex-1 overflow-auto p-4" ref={boardRef}>
          <div className="relative min-w-[300px]">
            {/* Time labels */}
            <div className="absolute left-0 top-0 w-16">
              {hourSlots.map((hour, index) => (
                <div
                  key={hour}
                  className="h-24 flex items-start justify-end pr-2 text-xs text-muted-foreground"
                  style={{ marginTop: index === 0 ? 0 : undefined }}
                >
                  {hour}
                </div>
              ))}
            </div>

            {/* Grid and scheduled items */}
            <div className="ml-16 relative">
              {/* Grid lines with drop zones */}
              {timeSlots.map((time, index) => {
                const isHour = time.endsWith(':00')
                const isDropTarget = dropTargetTime === time
                
                return (
                  <div
                    key={time}
                    onDragOver={(e) => handleDragOver(e, time)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, time)}
                    className={`h-12 border-t transition-colors ${
                      isHour ? 'border-border' : 'border-border/50 border-dashed'
                    } ${
                      isDropTarget
                        ? 'bg-primary/20 border-primary'
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    {isDropTarget && draggedItem && (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-xs text-primary font-medium">
                          {time} に配置
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Scheduled slots */}
              <div className="absolute inset-0 pointer-events-none">
                {slotsWithConflicts.map((slot) => {
                  const { top, height } = getSlotPosition(slot.startTime, slot.endTime)
                  const colors = typeColors[slot.item.type]

                  // For overlapping items, offset them horizontally
                  const conflictIndex = slot.conflictWith
                    ? slotsWithConflicts.findIndex((s) =>
                        slot.conflictWith?.includes(s.id)
                      )
                    : -1
                  const hasConflictBefore = conflictIndex >= 0 && conflictIndex < slotsWithConflicts.indexOf(slot)

                  return (
                    <div
                      key={slot.id}
                      className={`absolute rounded-lg border-2 p-2 transition-all pointer-events-auto ${colors.bg} ${colors.border} ${
                        slot.hasConflict ? 'ring-2 ring-destructive/50' : ''
                      }`}
                      style={{
                        top: `${top}px`,
                        height: `${Math.max(height, 32)}px`,
                        left: hasConflictBefore ? '52%' : '4px',
                        right: slot.hasConflict && !hasConflictBefore ? '52%' : '4px',
                        zIndex: slot.hasConflict ? 10 : 1,
                      }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className={colors.text}>{typeIcons[slot.item.type]}</span>
                            <span className="font-medium text-xs text-card-foreground truncate">
                              {slot.item.name}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </div>
                        <button
                          onClick={() => removeScheduleSlot(slot.id)}
                          className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      {slot.hasConflict && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                          <AlertTriangle className="w-3 h-3" />
                          <span>重複あり</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Selection Modal */}
      {showTimeModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-card-foreground">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    所要時間: {selectedItem.duration}分
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowTimeModal(false)
                    setSelectedItem(null)
                  }}
                  className="p-2 rounded-lg hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-96">
              {selectedItem.fixedTimes ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    公演時間を選択してください
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedItem.fixedTimes.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        className="p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 text-center transition-colors"
                      >
                        <span className="font-medium">{time}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    開始時間を選択してください
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        className="p-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 text-center text-sm transition-colors"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conflict Resolution Modal */}
      {conflictResolutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold">時間の重複</h3>
              </div>
            </div>

            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                {conflictResolutionModal.newSlot.item.name} ({conflictResolutionModal.newSlot.startTime} - {conflictResolutionModal.newSlot.endTime}) は以下のアイテムと重複しています：
              </p>
              <ul className="space-y-2 mb-4">
                {conflictResolutionModal.conflictingSlots.map((slot) => (
                  <li
                    key={slot.id}
                    className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm"
                  >
                    <span className={typeColors[slot.item.type].text}>
                      {typeIcons[slot.item.type]}
                    </span>
                    <span>{slot.item.name}</span>
                    <span className="text-muted-foreground">
                      ({slot.startTime} - {slot.endTime})
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground mb-4">
                どのように処理しますか？
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => handleConflictResolve(true)}
                  className="w-full p-3 rounded-lg border border-primary bg-primary/5 text-primary hover:bg-primary/10 transition-colors text-sm"
                >
                  新しいアイテムを追加し、重複するものを削除
                </button>
                <button
                  onClick={handleKeepBoth}
                  className="w-full p-3 rounded-lg border border-accent bg-accent/5 text-accent hover:bg-accent/10 transition-colors text-sm"
                >
                  両方を保持（重複したまま）
                </button>
                <button
                  onClick={() => handleConflictResolve(false)}
                  className="w-full p-3 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
                >
                  キャンセル（追加しない）
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
