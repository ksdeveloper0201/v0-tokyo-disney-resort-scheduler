'use client'

import { useState } from 'react'
import { useScheduleStore } from '@/lib/store'
import { ParkSelector } from '@/components/park-selector'
import { CategoryRanking } from '@/components/category-ranking'
import { ScheduleBuilder } from '@/components/schedule-builder'
import { SaveSchedule } from '@/components/save-schedule'

export default function HomePage() {
  const { setStep, reset } = useScheduleStore()
  const [currentView, setCurrentView] = useState<string>('park-select')

  const handleParkSelect = () => {
    setCurrentView('category-ranking')
  }

  const handleCategoryRanking = () => {
    setCurrentView('schedule-builder')
  }

  const handleSave = () => {
    setCurrentView('save')
  }

  const handleReset = () => {
    reset()
    setCurrentView('park-select')
    setStep(1)
  }

  // Render based on current view
  const renderView = () => {
    switch (currentView) {
      case 'park-select':
        return <ParkSelector onSelect={handleParkSelect} />

      case 'category-ranking':
        return (
          <CategoryRanking
            onContinue={handleCategoryRanking}
            onBack={() => {
              setCurrentView('park-select')
              setStep(1)
            }}
          />
        )

      case 'schedule-builder':
        return (
          <ScheduleBuilder
            onBack={() => {
              setCurrentView('category-ranking')
              setStep(2)
            }}
            onSave={handleSave}
          />
        )

      case 'save':
        return (
          <SaveSchedule
            onBack={() => setCurrentView('schedule-builder')}
            onReset={handleReset}
          />
        )

      default:
        return <ParkSelector onSelect={handleParkSelect} />
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {renderView()}
    </main>
  )
}
