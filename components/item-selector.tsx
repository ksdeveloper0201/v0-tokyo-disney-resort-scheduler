'use client'

import { ScheduleItem, ItemType } from '@/lib/types'
import { useScheduleStore } from '@/lib/store'
import { getItemsByPark, getUniqueAreas, getItemsByType } from '@/lib/mock-data'
import { useState, useMemo } from 'react'
import {
  Sparkles,
  Music,
  Flag,
  Calendar,
  Utensils,
  Check,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

interface ItemSelectorProps {
  onContinue: () => void
  onBack: () => void
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

const typeColors: Record<ItemType, string> = {
  attraction: 'bg-primary/10 text-primary border-primary/30',
  show: 'bg-chart-2/10 text-chart-2 border-chart-2/30',
  parade: 'bg-chart-3/10 text-chart-3 border-chart-3/30',
  event: 'bg-chart-4/10 text-chart-4 border-chart-4/30',
  restaurant: 'bg-accent/10 text-accent border-accent/30',
}

export function ItemSelector({ onContinue, onBack }: ItemSelectorProps) {
  const { parkType, selectedItems, toggleSelectedItem, priorityMode, setPriorityMode, setStep } =
    useScheduleStore()

  const [activeType, setActiveType] = useState<ItemType>(
    priorityMode === 'meal' ? 'restaurant' : 'attraction'
  )
  const [searchQuery, setSearchQuery] = useState('')

  const allItems = useMemo(() => {
    return parkType ? getItemsByPark(parkType) : []
  }, [parkType])

  const filteredItems = useMemo(() => {
    let items = getItemsByType(allItems, activeType)
    if (searchQuery) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.area.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return items
  }, [allItems, activeType, searchQuery])

  const areas = useMemo(() => {
    return getUniqueAreas(filteredItems)
  }, [filteredItems])

  // All areas expanded by default
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set())

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

  const isSelected = (item: ScheduleItem) => {
    return selectedItems.some((i) => i.id === item.id)
  }

  const selectedCount = selectedItems.length

  const handleContinue = () => {
    if (selectedItems.length > 0) {
      setStep(5)
      onContinue()
    }
  }

  const handlePriorityChange = (mode: 'attraction' | 'meal') => {
    setPriorityMode(mode)
    setActiveType(mode === 'meal' ? 'restaurant' : 'attraction')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
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
            <div className="text-center">
              <h1 className="text-xl font-bold text-foreground">
                アイテムを選択
              </h1>
              <p className="text-sm text-muted-foreground">
                {selectedCount}個選択中
              </p>
            </div>
            <button
              onClick={handleContinue}
              disabled={selectedCount === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          </div>

          {/* Priority Toggle */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">優先:</span>
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => handlePriorityChange('attraction')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  priorityMode === 'attraction'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                アトラクション
              </button>
              <button
                onClick={() => handlePriorityChange('meal')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  priorityMode === 'meal'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                食事
              </button>
            </div>
          </div>

          {/* Type Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {(Object.keys(typeLabels) as ItemType[]).map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeType === type
                    ? typeColors[type] + ' border'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {typeIcons[type]}
                {typeLabels[type]}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mt-3">
            <input
              type="text"
              placeholder="検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        {areas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            該当するアイテムがありません
          </div>
        ) : (
          <div className="space-y-4">
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
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-card-foreground">{area}</span>
                      <span className="text-sm text-muted-foreground">
                        ({areaItems.length})
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border">
                      {areaItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => toggleSelectedItem(item)}
                          className={`w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border last:border-b-0 ${
                            isSelected(item) ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-card-foreground">
                                {item.name}
                              </span>
                              {item.diningType && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    item.diningType === 'restaurant'
                                      ? 'bg-accent/20 text-accent'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {item.diningType === 'restaurant'
                                    ? 'レストラン'
                                    : 'ファストフード'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>約{item.duration}分</span>
                              {item.fixedTimes && (
                                <span className="text-xs">
                                  公演: {item.fixedTimes.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected(item)
                                ? 'bg-primary border-primary'
                                : 'border-border'
                            }`}
                          >
                            {isSelected(item) && (
                              <Check className="w-4 h-4 text-primary-foreground" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected Items Summary (Fixed Bottom) */}
      {selectedCount > 0 && (
        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border p-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2 max-w-[70%]">
                {selectedItems.slice(0, 5).map((item) => (
                  <span
                    key={item.id}
                    className={`text-xs px-2 py-1 rounded-full ${typeColors[item.type]}`}
                  >
                    {item.name.length > 10
                      ? item.name.slice(0, 10) + '...'
                      : item.name}
                  </span>
                ))}
                {selectedItems.length > 5 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    +{selectedItems.length - 5}件
                  </span>
                )}
              </div>
              <button
                onClick={handleContinue}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                スケジュール作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
