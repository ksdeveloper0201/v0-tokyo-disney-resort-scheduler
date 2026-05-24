'use client'

import { useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useScheduleStore } from '@/lib/store'
import { ItemType } from '@/lib/types'
import { GripVertical, Sparkles, Music, Flag, Calendar, Utensils } from 'lucide-react'

interface CategoryRankingProps {
  onContinue: () => void
  onBack: () => void
}

const categoryConfig: Record<ItemType, { label: string; icon: React.ReactNode; color: string }> = {
  attraction: {
    label: 'アトラクション',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'bg-primary/10 border-primary/30 text-primary',
  },
  show: {
    label: 'ショー',
    icon: <Music className="w-5 h-5" />,
    color: 'bg-chart-2/10 border-chart-2/30 text-chart-2',
  },
  parade: {
    label: 'パレード',
    icon: <Flag className="w-5 h-5" />,
    color: 'bg-chart-3/10 border-chart-3/30 text-chart-3',
  },
  event: {
    label: 'イベント',
    icon: <Calendar className="w-5 h-5" />,
    color: 'bg-chart-4/10 border-chart-4/30 text-chart-4',
  },
  restaurant: {
    label: 'レストラン',
    icon: <Utensils className="w-5 h-5" />,
    color: 'bg-accent/10 border-accent/30 text-accent',
  },
}

function SortableCategoryItem({ type, rank }: { type: ItemType; rank: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: type })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const config = categoryConfig[type]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
        config.color
      } ${isDragging ? 'opacity-80 shadow-lg scale-[1.02] z-50' : 'shadow-sm'}`}
    >
      {/* Rank Badge */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          rank === 0
            ? 'bg-primary text-primary-foreground'
            : rank === 1
            ? 'bg-chart-2/80 text-white'
            : rank === 2
            ? 'bg-chart-3/80 text-white'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {rank + 1}
      </div>

      {/* Icon & Label */}
      <div className="flex items-center gap-2 flex-1">
        {config.icon}
        <span className="font-medium">{config.label}</span>
      </div>

      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-2 rounded-lg hover:bg-background/50 cursor-grab active:cursor-grabbing touch-none"
        aria-label="ドラッグして並び替え"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </button>
    </div>
  )
}

export function CategoryRanking({ onContinue, onBack }: CategoryRankingProps) {
  const { categoryOrder, setCategoryOrder, parkType, setStep } = useScheduleStore()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = categoryOrder.indexOf(active.id as ItemType)
      const newIndex = categoryOrder.indexOf(over.id as ItemType)
      const newOrder = arrayMove(categoryOrder, oldIndex, newIndex)
      setCategoryOrder(newOrder)
    }
  }

  const handleContinue = () => {
    setStep(3)
    onContinue()
  }

  const parkName = parkType === 'land' ? 'ディズニーランド' : 'ディズニーシー'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
              <p className="text-xs text-muted-foreground">{parkName}</p>
              <h1 className="text-lg font-bold text-foreground">優先順位を設定</h1>
            </div>
            <button
              onClick={handleContinue}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              次へ
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-md">
        <div className="text-center mb-6">
          <p className="text-muted-foreground text-sm">
            カテゴリをドラッグして優先順位を設定してください。
            <br />
            上にあるほど優先度が高くなります。
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={categoryOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {categoryOrder.map((type, index) => (
                <SortableCategoryItem key={type} type={type} rank={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="mt-8 p-4 bg-card rounded-xl border border-border">
          <h3 className="font-medium text-card-foreground mb-2">ヒント</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>- 優先度が高いカテゴリから順にスケジュールを組むと効率的です</li>
            <li>- ショーやパレードは公演時間が決まっているため、先に設定すると良いでしょう</li>
            <li>- レストランは混雑を避けるため、時間をずらして設定するのがおすすめです</li>
          </ul>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border p-4">
        <div className="container mx-auto max-w-md">
          <button
            onClick={handleContinue}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            この順番でスケジュールを作成
          </button>
        </div>
      </div>
    </div>
  )
}
