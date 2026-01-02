"use client"

import { useEffect } from "react"

interface HourglassTimerProps {
  timeRemaining: number
  totalTime: number
  isRunning: boolean
  onTimeUpdate: (time: number) => void
}

export function HourglassTimer({ timeRemaining, totalTime, isRunning, onTimeUpdate }: HourglassTimerProps) {
  const progress = 1 - timeRemaining / totalTime
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return

    const interval = setInterval(() => {
      onTimeUpdate(timeRemaining - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, timeRemaining, onTimeUpdate])

  return (
    <div className="relative flex flex-col items-center">
      {/* Glow effect */}
      <div className="absolute inset-0 blur-3xl bg-primary/20 animate-glow-pulse rounded-full" />

      {/* Hourglass container */}
      <div className="relative w-48 h-72">
        <svg viewBox="0 0 100 150" className="w-full h-full">
          {/* Outer glow */}
          <defs>
            <linearGradient id="sandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Hourglass frame */}
          <path
            d="M20 10 L80 10 L80 15 Q80 40, 50 70 Q20 40, 20 15 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-border"
          />
          <path
            d="M20 140 L80 140 L80 135 Q80 110, 50 80 Q20 110, 20 135 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-border"
          />

          {/* Top sand (decreasing) */}
          <clipPath id="topClip">
            <path d="M22 12 L78 12 L78 15 Q78 40, 50 68 Q22 40, 22 15 Z" />
          </clipPath>
          <rect
            x="20"
            y={12 + progress * 56}
            width="60"
            height={58 - progress * 56}
            fill="url(#sandGradient)"
            clipPath="url(#topClip)"
            filter="url(#glow)"
          />

          {/* Falling sand stream */}
          {isRunning && progress < 1 && (
            <line
              x1="50"
              y1="68"
              x2="50"
              y2="82"
              stroke="var(--primary)"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.8"
              className="animate-pulse"
            />
          )}

          {/* Bottom sand (increasing) */}
          <clipPath id="bottomClip">
            <path d="M22 138 L78 138 L78 135 Q78 110, 50 82 Q22 110, 22 135 Z" />
          </clipPath>
          <rect
            x="20"
            y={138 - progress * 56}
            width="60"
            height={progress * 56}
            fill="url(#sandGradient)"
            clipPath="url(#bottomClip)"
            filter="url(#glow)"
          />

          {/* Glass effect overlay */}
          <path d="M25 15 Q25 38, 50 65 Q75 38, 75 15" fill="none" stroke="white" strokeWidth="0.5" opacity="0.1" />
          <path d="M25 135 Q25 112, 50 85 Q75 112, 75 135" fill="none" stroke="white" strokeWidth="0.5" opacity="0.1" />
        </svg>
      </div>

      {/* Time display */}
      <div className="mt-4 text-center">
        <p className="text-4xl font-light text-foreground tabular-nums tracking-tight">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {isRunning ? "Stay focused..." : timeRemaining === totalTime ? "Ready to start" : "Paused"}
        </p>
      </div>
    </div>
  )
}
