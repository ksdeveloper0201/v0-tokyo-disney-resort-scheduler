'use client'

import { useRef, useState } from 'react'
import { useScheduleStore, parseTime } from '@/lib/store'
import { ItemType } from '@/lib/types'
import {
  Sparkles,
  Music,
  Flag,
  Calendar,
  Utensils,
  Download,
  Camera,
  Share2,
  Clock,
  MapPin,
  RotateCcw,
} from 'lucide-react'
import html2canvas from 'html2canvas'

interface SaveScheduleProps {
  onBack: () => void
  onReset: () => void
}

const typeIcons: Record<ItemType, React.ReactNode> = {
  attraction: <Sparkles className="w-4 h-4" />,
  show: <Music className="w-4 h-4" />,
  parade: <Flag className="w-4 h-4" />,
  event: <Calendar className="w-4 h-4" />,
  restaurant: <Utensils className="w-4 h-4" />,
}

const typeColors: Record<ItemType, { bg: string; border: string; text: string }> = {
  attraction: { bg: 'bg-primary/20', border: 'border-primary', text: 'text-primary' },
  show: { bg: 'bg-chart-2/20', border: 'border-chart-2', text: 'text-chart-2' },
  parade: { bg: 'bg-chart-3/20', border: 'border-chart-3', text: 'text-chart-3' },
  event: { bg: 'bg-chart-4/20', border: 'border-chart-4', text: 'text-chart-4' },
  restaurant: { bg: 'bg-accent/20', border: 'border-accent', text: 'text-accent' },
}

const typeLabels: Record<ItemType, string> = {
  attraction: 'アトラクション',
  show: 'ショー',
  parade: 'パレード',
  event: 'イベント',
  restaurant: 'レストラン',
}

export function SaveSchedule({ onBack, onReset }: SaveScheduleProps) {
  const { scheduleSlots, parkType, reset } = useScheduleStore()
  const scheduleRef = useRef<HTMLDivElement>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  const sortedSlots = [...scheduleSlots].sort(
    (a, b) => parseTime(a.startTime) - parseTime(b.startTime)
  )

  const totalDuration = sortedSlots.reduce((sum, slot) => sum + slot.item.duration, 0)
  const hours = Math.floor(totalDuration / 60)
  const minutes = totalDuration % 60

  const handleScreenshot = async () => {
    if (!scheduleRef.current) return
    setIsCapturing(true)

    try {
      const canvas = await html2canvas(scheduleRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      })

      const link = document.createElement('a')
      link.download = `disney-schedule-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Screenshot failed:', error)
    } finally {
      setIsCapturing(false)
    }
  }

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      const text = sortedSlots
        .map((slot) => `${slot.startTime} - ${slot.item.name}`)
        .join('\n')

      try {
        await navigator.share({
          title: 'ディズニーパークスケジュール',
          text: `本日のスケジュール:\n${text}`,
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    }
  }

  const handleReset = () => {
    reset()
    onReset()
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
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
              編集
            </button>
            <h1 className="text-xl font-bold text-foreground">スケジュール完成</h1>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              最初から
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-6">
        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleScreenshot}
            disabled={isCapturing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
            {isCapturing ? '保存中...' : 'スクリーンショット'}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
          >
            <Share2 className="w-5 h-5" />
            共有
          </button>
        </div>

        {/* Schedule Card for Screenshot */}
        <div
          ref={scheduleRef}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="bg-primary/10 p-6 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {parkType === 'land' ? '東京ディズニーランド' : '東京ディズニーシー'}
            </h2>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </p>
            <div className="flex items-center justify-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-primary" />
                合計 {hours > 0 && `${hours}時間`}
                {minutes > 0 && `${minutes}分`}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-primary" />
                {sortedSlots.length}か所
              </span>
            </div>
          </div>

          {/* Schedule List */}
          <div className="divide-y divide-border">
            {sortedSlots.map((slot, index) => {
              const colors = typeColors[slot.item.type]
              return (
                <div key={slot.id} className="flex items-stretch">
                  {/* Time Column */}
                  <div className="w-20 flex-shrink-0 p-4 flex flex-col items-center justify-center border-r border-border bg-muted/30">
                    <div className="font-bold text-lg text-foreground">
                      {slot.startTime}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ~{slot.endTime}
                    </div>
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}
                      >
                        {typeIcons[slot.item.type]}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-card-foreground">
                          {slot.item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className={`px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                            {typeLabels[slot.item.type]}
                          </span>
                          <span>{slot.item.duration}分</span>
                          <span>•</span>
                          <span>{slot.item.area}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="p-4 bg-muted/30 text-center text-xs text-muted-foreground">
            Disney Park Scheduler で作成
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-card rounded-xl border border-border">
          <h3 className="font-medium text-card-foreground mb-3">凡例</h3>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(typeLabels) as ItemType[]).map((type) => {
              const colors = typeColors[type]
              return (
                <div
                  key={type}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg}`}
                >
                  <span className={colors.text}>{typeIcons[type]}</span>
                  <span className={`text-sm ${colors.text}`}>{typeLabels[type]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-accent/10 rounded-xl border border-accent/30">
          <h3 className="font-medium text-accent mb-2">ヒント</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• スクリーンショットを保存して、当日確認しやすくしましょう</li>
            <li>• 天候や混雑状況により、時間が変動する場合があります</li>
            <li>• 公式アプリで待ち時間を確認しながら行動しましょう</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
