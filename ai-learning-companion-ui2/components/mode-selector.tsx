"use client"

import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Hourglass, Timer } from "lucide-react"
import type { StudyModeType } from "@/components/study-mode"

interface ModeSelectorProps {
  onSelect: (mode: StudyModeType) => void
  manualDuration: number
  onManualDurationChange: (duration: number) => void
}

export function ModeSelector({ onSelect, manualDuration, onManualDurationChange }: ModeSelectorProps) {
  return (
    <div className="max-w-2xl w-full">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold text-foreground mb-3">Ready to focus?</h1>
        <p className="text-muted-foreground">Choose a study mode to get started</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Pomodoro Mode */}
        <Card
          className="group relative p-6 cursor-pointer bg-card/50 backdrop-blur-xl border-border/50 hover:border-primary/50 hover:bg-card/80 transition-all duration-300"
          onClick={() => onSelect("pomodoro")}
        >
          <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
              <Hourglass className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Pomodoro Mode</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Classic 25-minute focus sessions with 5-minute breaks. Perfect for sustained concentration.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded-md bg-muted">25 min work</span>
              <span className="px-2 py-1 rounded-md bg-muted">5 min break</span>
            </div>
          </div>
        </Card>

        {/* Manual Mode */}
        <Card
          className="group relative p-6 cursor-pointer bg-card/50 backdrop-blur-xl border-border/50 hover:border-accent/50 hover:bg-card/80 transition-all duration-300"
          onClick={() => onSelect("manual")}
        >
          <div className="absolute inset-0 rounded-xl bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mb-4">
              <Timer className="w-7 h-7 text-accent" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Manual Mode</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Set your own duration. Great for flexible study sessions tailored to your needs.
            </p>
            <div className="mt-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Duration</span>
                <span className="text-xs font-medium text-foreground">{manualDuration} min</span>
              </div>
              <Slider
                value={[manualDuration]}
                onValueChange={([val]) => onManualDurationChange(val)}
                min={5}
                max={120}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
