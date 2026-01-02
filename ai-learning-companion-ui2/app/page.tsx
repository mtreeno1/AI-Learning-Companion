"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { StudyMode } from "@/components/study-mode";
import { Dashboard } from "@/components/dashboard";
import { History } from "@/components/history";
import { AuthPage } from "@/pages/auth/auth-page";
import { useAuth } from "@/context/auth-context";

export type View = "study" | "dashboard" | "history";

export default function Home() {
  const [activeView, setActiveView] = useState<View>("study");
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-auto">
        {activeView === "study" && <StudyMode />}
        {activeView === "dashboard" && <Dashboard />}
        {activeView === "history" && <History />}
      </main>
    </div>
  );
}
