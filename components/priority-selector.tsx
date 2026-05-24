'use client'

import { useScheduleStore } from '@/lib/store'
import { PriorityMode } from '@/lib/types'
import { Utensils, Sparkles } from 'lucide-react'

interface PrioritySelectorProps {
  onContinue: () => void
  onBack: () => void
}

export function PrioritySelector({ onContinue, onBack }: PrioritySelectorProps) {
  const { priorityMode, setPriorityMode, setStep } = useScheduleStore()

  const handleSelect = (mode: PriorityMode) => {
    setPriorityMode(mode)
  }

  const handleContinue = () => {
    setStep(4)
    onContinue()
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
          優先順位
        </h1>
        <p className="text-muted-foreground text-lg">
          何を基準にスケジュールを組みますか？
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          （後から変更可能です）
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* Attraction Priority Card */}
        <button
          onClick={() => handleSelect('attraction')}
          className={`group relative overflow-hidden rounded-xl border-2 p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
            priorityMode === 'attraction'
              ? 'border-primary bg-primary/5 shadow-lg'
              : 'border-border bg-card hover:border-primary/50'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-card-foreground mb-2">
                アトラクション優先
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                乗りたいアトラクションやショーを先に決めて、
                空いた時間に食事を入れます
              </p>
            </div>
          </div>
        </button>

        {/* Meal Priority Card */}
        <button
          onClick={() => handleSelect('meal')}
          className={`group relative overflow-hidden rounded-xl border-2 p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
            priorityMode === 'meal'
              ? 'border-accent bg-accent/5 shadow-lg'
              : 'border-border bg-card hover:border-accent/50'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
              <Utensils className="w-8 h-8 text-accent" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-card-foreground mb-2">
                食事優先
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                食事の時間を先に決めて、
                残りの時間でアトラクションを楽しみます
              </p>
            </div>
          </div>
        </button>
      </div>

      <button
        onClick={handleContinue}
        className="mt-10 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        次へ進む
      </button>
    </div>
  )
}
