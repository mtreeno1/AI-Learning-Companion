"use client"

import { Card } from "@/components/ui/card"
import { Clock, Target, Calendar } from "lucide-react"

// Mock data for demo
const sessions = [
  { id: 1, date: "Today", time: "2:30 PM", duration: 25, focusScore: 92, mode: "Pomodoro" },
  { id: 2, date: "Today", time: "11:00 AM", duration: 45, focusScore: 78, mode: "Manual" },
  { id: 3, date: "Yesterday", time: "4:15 PM", duration: 25, focusScore: 85, mode: "Pomodoro" },
  { id: 4, date: "Yesterday", time: "10:30 AM", duration: 60, focusScore: 71, mode: "Manual" },
  { id: 5, date: "Dec 22", time: "3:00 PM", duration: 25, focusScore: 88, mode: "Pomodoro" },
  { id: 6, date: "Dec 22", time: "9:45 AM", duration: 30, focusScore: 82, mode: "Manual" },
  { id: 7, date: "Dec 21", time: "2:00 PM", duration: 25, focusScore: 79, mode: "Pomodoro" },
]

export function History() {
  const groupedSessions = sessions.reduce(
    (acc, session) => {
      if (!acc[session.date]) {
        acc[session.date] = []
      }
      acc[session.date].push(session)
      return acc
    },
    {} as Record<string, typeof sessions>,
  )

  return (
    <div className="h-full p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">History</h1>
        <p className="text-muted-foreground text-sm mt-1">Review your past study sessions</p>
      </div>

      {/* Session List */}
      <div className="space-y-6">
        {Object.entries(groupedSessions).map(([date, dateSessions]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground">{date}</h2>
            </div>
            <div className="space-y-2">
              {dateSessions.map((session) => (
                <Card
                  key={session.id}
                  className="p-4 bg-card/50 backdrop-blur-xl border-border/50 hover:bg-card/70 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{session.time}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{session.duration} min</span>
                      <span className="px-2 py-0.5 text-xs rounded-md bg-muted text-muted-foreground">
                        {session.mode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{session.focusScore}%</span>
                      <FocusIndicator score={session.focusScore} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FocusIndicator({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 85) return "bg-primary"
    if (score >= 70) return "bg-accent"
    return "bg-muted-foreground"
  }

  return (
    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full ${getColor()} transition-all`} style={{ width: `${score}%` }} />
    </div>
  )
}
