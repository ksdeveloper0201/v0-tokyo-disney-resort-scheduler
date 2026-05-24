'use client'

import { useScheduleStore } from '@/lib/store'
import { ParkType } from '@/lib/types'
import { Castle, Anchor } from 'lucide-react'

interface ParkSelectorProps {
  onSelect: (park: ParkType) => void
}

export function ParkSelector({ onSelect }: ParkSelectorProps) {
  const { parkType, setParkType, setStep } = useScheduleStore()

  const handleSelect = (park: ParkType) => {
    setParkType(park)
    onSelect(park)
    setStep(2)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
          Disney Park Scheduler
        </h1>
        <p className="text-muted-foreground text-lg">
          訪問するパークを選択してください
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* Disneyland Card */}
        <button
          onClick={() => handleSelect('land')}
          className={`group relative overflow-hidden rounded-xl border-2 p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
            parkType === 'land'
              ? 'border-primary bg-primary/5 shadow-lg'
              : 'border-border bg-card hover:border-primary/50'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Castle className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-card-foreground mb-1">
                東京ディズニーランド
              </h2>
              <p className="text-sm text-muted-foreground">
                Tokyo Disneyland
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              <span className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
                ファンタジーランド
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
                トゥモローランド
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
                アドベンチャーランド
              </span>
            </div>
          </div>
        </button>

        {/* DisneySea Card */}
        <button
          onClick={() => handleSelect('sea')}
          className={`group relative overflow-hidden rounded-xl border-2 p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
            parkType === 'sea'
              ? 'border-primary bg-primary/5 shadow-lg'
              : 'border-border bg-card hover:border-primary/50'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Anchor className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-card-foreground mb-1">
                東京ディズニーシー
              </h2>
              <p className="text-sm text-muted-foreground">
                Tokyo DisneySea
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              <span className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
                メディテレーニアンハーバー
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
                ミステリアスアイランド
              </span>
            </div>
          </div>
        </button>
      </div>

      <p className="text-sm text-muted-foreground mt-8 text-center max-w-md">
        パークを選択後、スケジュールの作成方法を選択できます
      </p>
    </div>
  )
}
