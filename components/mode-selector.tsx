'use client'

import { useScheduleStore } from '@/lib/store'
import { SchedulingMode } from '@/lib/types'
import { Wand2, Hand } from 'lucide-react'

interface ModeSelectorProps {
  onSelect: (mode: SchedulingMode) => void
  onBack: () => void
}

export function ModeSelector({ onSelect, onBack }: ModeSelectorProps) {
  const { schedulingMode, setSchedulingMode, setStep } = useScheduleStore()

  const handleSelect = (mode: SchedulingMode) => {
    setSchedulingMode(mode)
    onSelect(mode)
    setStep(3)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
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

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
          スケジュール作成方法
        </h1>
        <p className="text-muted-foreground text-lg">
          どのようにスケジュールを組みますか？
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* Manual Mode Card */}
        <button
          onClick={() => handleSelect('manual')}
          className={`group relative overflow-hidden rounded-xl border-2 p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
            schedulingMode === 'manual'
              ? 'border-primary bg-primary/5 shadow-lg'
              : 'border-border bg-card hover:border-primary/50'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
              <Hand className="w-10 h-10 text-accent" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-card-foreground mb-2">
                手動で作成
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                アトラクションやショーを自由に選んで、
                <br />
                タイムスケジュールボードに配置します
              </p>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 mt-2">
              <li>• 時間帯を自由に選択</li>
              <li>• 重複時はどちらを優先か選択</li>
              <li>• 細かい調整が可能</li>
            </ul>
          </div>
        </button>

        {/* Auto Mode Card */}
        <button
          onClick={() => handleSelect('auto')}
          className={`group relative overflow-hidden rounded-xl border-2 p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
            schedulingMode === 'auto'
              ? 'border-primary bg-primary/5 shadow-lg'
              : 'border-border bg-card hover:border-primary/50'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Wand2 className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-card-foreground mb-2">
                自動で作成
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                行きたい場所を選ぶだけで、
                <br />
                重複しないスケジュールを自動生成
              </p>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 mt-2">
              <li>• 選択するだけで簡単</li>
              <li>• 効率的なルート提案</li>
              <li>• 時間の重複なし</li>
            </ul>
          </div>
        </button>
      </div>
    </div>
  )
}
