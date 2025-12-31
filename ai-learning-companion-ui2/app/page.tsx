"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { StudyMode } from "@/components/study-mode"
import { Dashboard } from "@/components/dashboard"
import { History } from "@/components/history"

export type View = "study" | "dashboard" | "history"

export default function Home() {
  const [activeView, setActiveView] = useState<View>("study")

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-auto">
        {activeView === "study" && <StudyMode />}
        {activeView === "dashboard" && <Dashboard />}
        {activeView === "history" && <History />}
      </main>
    </div>
  )
}
