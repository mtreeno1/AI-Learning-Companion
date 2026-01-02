"use client"

import { cn } from "@/lib/utils"
import { Hourglass, LayoutDashboard, Clock, LogOut } from "lucide-react";
import type { View } from "@/app/page"
import { ThemeToggle } from "./theme-toggle"
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  activeView: View
  onViewChange: (view: View) => void
}

const navItems = [
  { id: "study" as const, icon: Hourglass, label: "Study" },
  { id: "dashboard" as const, icon: LayoutDashboard, label: "Dashboard" },
  { id: "history" as const, icon: Clock, label: "History" },
]

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { user, logout } = useAuth();
   
  return (
    <aside className="w-20 h-screen bg-sidebar border-r border-sidebar-border flex flex-col items-center py-6 gap-2">
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
        <Hourglass className="w-5 h-5 text-primary" />
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "group relative flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5",
                  isActive && "drop-shadow-[0_0_8px_var(--primary)]"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-opacity",
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2">
        {user && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="w-12 h-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Logout ({user.email})</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <ThemeToggle />
      </div>
    </aside>
  );
}
