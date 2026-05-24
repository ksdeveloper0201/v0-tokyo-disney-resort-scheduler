'use client'

import { ScheduleItem, ItemType } from '@/lib/types'
import { useScheduleStore, isFixedTimeItem, parseTime, formatTime, calculateEndTime } from '@/lib/store'
import { getItemsByPark, getUniqueAreas, getItemsByType } from '@/lib/mock-data'
import { useState, useMemo, useCallback } from 'react'
import {
  Sparkles,
  Music,
  Flag,
  Calendar,
  Utensils,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  GripVertical,
  X,
  ChevronLeft,
} from 'lucide-react'

interface ScheduleBuilderProps {
  onBack: () => void
  onSave: () => void
}

const typeIcons: Record<ItemType, React.ReactNode> = {
  attraction: <Sparkles className="w-4 h-4" />,
  show: <Music className="w-4 h-4" />,
  parade: <Flag className="w-4 h-4" />,
  event: <Calendar className="w-4 h-4" />,
  restaurant: <Utensils className="w-4 h-4" />,
}

const typeLabels: Record<ItemType, string> = {
  attraction: 'アトラクション',
  show: 'ショー',
  parade: 'パレード',
  event: 'イベント',
  restaurant: 'レストラン',
}

const typeColors: Record<ItemType, { bg: string; border: string; text: string; badge: string }> = {
  attraction: { bg: 'bg-primary/15', border: 'border-primary/40', text: 'text-primary', badge: 'bg-primary text-primary-foreground' },
  show: { bg: 'bg-chart-2/15', border: 'border-chart-2/40', text: 'text-chart-2', badge: 'bg-chart-2 text-white' },
  parade: { bg: 'bg-chart-3/15', border: 'border-chart-3/40', text: 'text-chart-3', badge: 'bg-chart-3 text-white' },
  event: { bg: 'bg-chart-4/15', border: 'border-chart-4/40', text: 'text-chart-4', badge: 'bg-chart-4 text-white' },
  restaurant: { bg: 'bg-accent/15', border: 'border-accent/40', text: 'text-accent', badge: 'bg-accent text-white' },
}

export function ScheduleBuilder({ onBack, onSave }: ScheduleBuilderProps) {
  const {
    parkType,
    categoryOrder,
    activeCategory,
    setActiveCategory,
    selectedItems,
    toggleSelectedItem,
    scheduleSlots,
    addScheduleSlot,
    removeScheduleSlot,
    setStep,
  } = useScheduleStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set())
  const [showTimeModal, setShowTimeModal] = useState(false)
  const [timeModalItem, setTimeModalItem] = useState<ScheduleItem | null>(null)
  const [view, setView] = useState<'items' | 'schedule'>('items')

  // Get all items for current park
  const allItems = useMemo(() => {
    return parkType ? getItemsByPark(parkType) : []
  }, [parkType])

  // Filter items by current category and search
  const filteredItems = useMemo(() => {
    let items = getItemsByType(allItems, activeCategory)
    if (searchQuery) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.area.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return items
  }, [allItems, activeCategory, searchQuery])

  const areas = useMemo(() => getUniqueAreas(filteredItems), [filteredItems])

  const toggleArea = (area: string) => {
    setCollapsedAreas((prev) => {
      const next = new Set(prev)
      if (next.has(area)) {
        next.delete(area)
      } else {
        next.add(area)
      }
      return next
    })
  }

  const isSelected = (item: ScheduleItem) => selectedItems.some((i) => i.id === item.id)
  const isScheduled = (item: ScheduleItem) => scheduleSlots.some((slot) => slot.item.id === item.id)

  // Count selected items per category
  const categorySelectionCounts = useMemo(() => {
    const counts: Record<ItemType, number> = {
      attraction: 0,
      show: 0,
      parade: 0,
      event: 0,
      restaurant: 0,
    }
    selectedItems.forEach((item) => {
      counts[item.type]++
    })
    return counts
  }, [selectedItems])

  // Time slots for the time picker
  const timeSlots = useMemo(() => {
    const slots: string[] = []
    for (let hour = 8; hour < 22; hour++) {
      for (let min = 0; min < 60; min += 30) {
        slots.push(formatTime(hour * 60 + min))
      }
    }
    return slots
  }, [])

  // Handle item tap - show time modal
  const handleItemTap = useCallback((item: ScheduleItem) => {
    if (isSelected(item)) {
      // If already selected, remove it
      toggleSelectedItem(item)
      return
    }

    // For items with single fixed time, just add directly
    if (item.fixedTimes && item.fixedTimes.length === 1) {
      toggleSelectedItem(item)
      return
    }

    // For items with multiple fixed times or free time items, show time modal
    setTimeModalItem(item)
    setShowTimeModal(true)
  }, [toggleSelectedItem, isSelected])

  // Handle time selection from modal
  const handleTimeSelect = useCallback((time: string) => {
    if (!timeModalItem) return

    const endTime = calculateEndTime(time, timeModalItem.duration)
    const isFixed = isFixedTimeItem(timeModalItem)

    const newSlot = {
      id: `slot-${timeModalItem.id}-${Date.now()}`,
      item: { ...timeModalItem, selectedTime: time },
      startTime: time,
      endTime,
      hasConflict: false,
      conflictWith: [],
      isLocked: isFixed,
    }

    // Add to selected items if not already
    if (!selectedItems.some((i) => i.id === timeModalItem.id)) {
      toggleSelectedItem(timeModalItem)
    }

    // Add schedule slot
    addScheduleSlot(newSlot)

    setShowTimeModal(false)
    setTimeModalItem(null)
  }, [timeModalItem, selectedItems, toggleSelectedItem, addScheduleSlot])

  // Get current category index and name
  const currentCategoryIndex = categoryOrder.indexOf(activeCategory)
  const parkName = parkType === 'land' ? 'ディズニーランド' : 'ディズニーシー'

  // Sort schedule slots by time
  const sortedSlots = useMemo(() => {
    return [...scheduleSlots].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))
  }, [scheduleSlots])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setStep(2)
                onBack()
              }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              戻る
            </button>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{parkName}</p>
              <h1 className="text-base font-bold text-foreground">スケジュール作成</h1>
            </div>
            <button
              onClick={onSave}
              disabled={scheduleSlots.length === 0}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="container mx-auto px-4 pb-3">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setView('items')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                view === 'items'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              アイテム選択
            </button>
            <button
              onClick={() => setView('schedule')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors relative ${
                view === 'schedule'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              タイムライン
              {scheduleSlots.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {scheduleSlots.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {view === 'items' ? (
        <>
          {/* Category Tabs */}
          <div className="sticky top-[108px] z-20 bg-background border-b border-border">
            <div className="container mx-auto px-4 py-2">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {categoryOrder.map((type, index) => {
                  const colors = typeColors[type]
                  const count = categorySelectionCounts[type]
                  const isActive = activeCategory === type

                  return (
                    <button
                      key={type}
                      onClick={() => setActiveCategory(type)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        isActive
                          ? `${colors.bg} ${colors.border} ${colors.text} border-2`
                          : 'bg-muted text-muted-foreground hover:bg-muted/80 border-2 border-transparent'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive ? colors.badge : 'bg-muted-foreground/20 text-muted-foreground'
                      }`}>
                        {index + 1}
                      </span>
                      {typeIcons[type]}
                      <span className="hidden sm:inline">{typeLabels[type]}</span>
                      {count > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${colors.badge}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="container mx-auto px-4 py-3">
            <input
              type="text"
              placeholder={`${typeLabels[activeCategory]}を検索...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Items List */}
          <div className="flex-1 container mx-auto px-4 pb-24">
            {areas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                該当するアイテムがありません
              </div>
            ) : (
              <div className="space-y-3">
                {areas.map((area) => {
                  const areaItems = filteredItems.filter((item) => item.area === area)
                  const isExpanded = !collapsedAreas.has(area)

                  return (
                    <div
                      key={area}
                      className="bg-card rounded-xl border border-border overflow-hidden"
                    >
                      <button
                        onClick={() => toggleArea(area)}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-card-foreground text-sm">{area}</span>
                          <span className="text-xs text-muted-foreground">
                            ({areaItems.length})
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border">
                          {areaItems.map((item) => {
                            const selected = isSelected(item)
                            const scheduled = isScheduled(item)
                            const colors = typeColors[item.type]

                            return (
                              <button
                                key={item.id}
                                onClick={() => handleItemTap(item)}
                                className={`w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors border-b border-border last:border-b-0 ${
                                  selected ? colors.bg : ''
                                }`}
                              >
                                <div className="flex-1 text-left">
                                  <div className="flex items-center gap-2">
                                    <span className={`${colors.text}`}>
                                      {typeIcons[item.type]}
                                    </span>
                                    <span className="font-medium text-card-foreground text-sm">
                                      {item.name}
                                    </span>
                                    {item.diningType && (
                                      <span
                                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                                          item.diningType === 'restaurant'
                                            ? 'bg-accent/20 text-accent'
                                            : 'bg-muted text-muted-foreground'
                                        }`}
                                      >
                                        {item.diningType === 'restaurant' ? 'レストラン' : 'ファスト'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>{item.duration}分</span>
                                    {item.fixedTimes && item.fixedTimes.length > 0 && (
                                      <span className="bg-muted px-1.5 py-0.5 rounded text-xs">
                                        {item.fixedTimes.length === 1
                                          ? item.fixedTimes[0]
                                          : `${item.fixedTimes.length}公演`}
                                      </span>
                                    )}
                                    {scheduled && (
                                      <span className={`px-1.5 py-0.5 rounded text-xs ${colors.badge}`}>
                                        配置済
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    selected
                                      ? `${colors.badge} border-transparent`
                                      : 'border-border'
                                  }`}
                                >
                                  {selected && <Check className="w-4 h-4" />}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Timeline View */
        <div className="flex-1 container mx-auto px-4 py-4 pb-24">
          {sortedSlots.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">スケジュールが空です</p>
              <p className="text-sm text-muted-foreground">
                アイテム選択タブから追加してください
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedSlots.map((slot, index) => {
                const colors = typeColors[slot.item.type]
                const prevSlot = index > 0 ? sortedSlots[index - 1] : null
                const gap = prevSlot
                  ? parseTime(slot.startTime) - parseTime(prevSlot.endTime)
                  : null

                return (
                  <div key={slot.id}>
                    {/* Gap indicator */}
                    {gap !== null && gap > 0 && (
                      <div className="flex items-center gap-2 py-2 px-4 text-xs text-muted-foreground">
                        <div className="flex-1 border-t border-dashed border-border" />
                        <span>{gap}分の空き</span>
                        <div className="flex-1 border-t border-dashed border-border" />
                      </div>
                    )}

                    <div
                      className={`p-4 rounded-xl border-2 ${colors.bg} ${colors.border} transition-all`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Time column */}
                          <div className="text-center min-w-[60px]">
                            <div className="font-bold text-foreground">{slot.startTime}</div>
                            <div className="text-xs text-muted-foreground">|</div>
                            <div className="text-sm text-muted-foreground">{slot.endTime}</div>
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={colors.text}>{typeIcons[slot.item.type]}</span>
                              <span className="font-medium text-card-foreground">
                                {slot.item.name}
                              </span>
                              {slot.isLocked && (
                                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                  時間固定
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{slot.item.area}</span>
                              <span>-</span>
                              <span>{slot.item.duration}分</span>
                            </div>
                          </div>
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={() => removeScheduleSlot(slot.id)}
                          className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Bottom Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                {scheduleSlots.length}件のスケジュール / {selectedItems.length}件選択中
              </p>
            </div>
            {view === 'items' && scheduleSlots.length > 0 && (
              <button
                onClick={() => setView('schedule')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                タイムラインを確認
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Time Selection Modal */}
      {showTimeModal && timeModalItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-md sm:mx-4 max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={typeColors[timeModalItem.type].text}>
                    {typeIcons[timeModalItem.type]}
                  </span>
                  <div>
                    <h3 className="font-bold text-card-foreground">{timeModalItem.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      所要時間: {timeModalItem.duration}分
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTimeModal(false)
                    setTimeModalItem(null)
                  }}
                  className="p-2 rounded-lg hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-96">
              {timeModalItem.fixedTimes && timeModalItem.fixedTimes.length > 1 ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    公演時間を選択してください
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {timeModalItem.fixedTimes.map((time) => {
                      const endTime = calculateEndTime(time, timeModalItem.duration)
                      return (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className={`p-4 rounded-xl border-2 ${typeColors[timeModalItem.type].border} hover:${typeColors[timeModalItem.type].bg} text-center transition-all`}
                        >
                          <span className="font-bold text-lg">{time}</span>
                          <span className="text-sm text-muted-foreground block">
                            - {endTime}
                          </span>
                        </button>
                      )
                    })}
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
                        className="p-2.5 rounded-lg border border-border hover:border-primary hover:bg-primary/5 text-center text-sm transition-colors"
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
    </div>
  )
}
