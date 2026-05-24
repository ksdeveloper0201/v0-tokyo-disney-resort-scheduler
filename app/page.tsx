'use client'

import { useState } from 'react'
import { useScheduleStore } from '@/lib/store'
import { ParkSelector } from '@/components/park-selector'
import { ModeSelector } from '@/components/mode-selector'
import { PrioritySelector } from '@/components/priority-selector'
import { ItemSelector } from '@/components/item-selector'
import { TimeScheduleBoard } from '@/components/time-schedule-board'
import { AutoScheduler } from '@/components/auto-scheduler'
import { SaveSchedule } from '@/components/save-schedule'

export default function HomePage() {
  const { schedulingMode, setStep, reset } = useScheduleStore()
  const [currentView, setCurrentView] = useState<string>('park-select')

  const handleParkSelect = () => {
    setCurrentView('mode-select')
  }

  const handleModeSelect = () => {
    setCurrentView('priority-select')
  }

  const handlePrioritySelect = () => {
    setCurrentView('item-select')
  }

  const handleItemSelect = () => {
    if (schedulingMode === 'manual') {
      setCurrentView('manual-schedule')
    } else {
      setCurrentView('auto-schedule')
    }
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

      case 'mode-select':
        return (
          <ModeSelector
            onSelect={handleModeSelect}
            onBack={() => {
              setCurrentView('park-select')
              setStep(1)
            }}
          />
        )

      case 'priority-select':
        return (
          <PrioritySelector
            onContinue={handlePrioritySelect}
            onBack={() => {
              setCurrentView('mode-select')
              setStep(2)
            }}
          />
        )

      case 'item-select':
        return (
          <ItemSelector
            onContinue={handleItemSelect}
            onBack={() => {
              setCurrentView('priority-select')
              setStep(3)
            }}
          />
        )

      case 'manual-schedule':
        return (
          <TimeScheduleBoard
            onBack={() => setCurrentView('item-select')}
            onSave={handleSave}
          />
        )

      case 'auto-schedule':
        return (
          <AutoScheduler
            onBack={() => setCurrentView('item-select')}
            onSave={handleSave}
          />
        )

      case 'save':
        return (
          <SaveSchedule
            onBack={() => {
              if (schedulingMode === 'manual') {
                setCurrentView('manual-schedule')
              } else {
                setCurrentView('auto-schedule')
              }
            }}
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
