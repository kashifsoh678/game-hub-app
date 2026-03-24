import { ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLocation, Link } from "wouter"
import { Gamepad2, LayoutDashboard, History, Settings, LogOut, Server, BarChart3, Menu, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const [location] = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAdmin = user?.role === "admin"

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: true },
    { name: "Sessions", href: "/sessions", icon: History, show: true },
    { name: "Devices", href: "/devices", icon: Server, show: isAdmin },
    { name: "Reports", href: "/reports", icon: BarChart3, show: isAdmin },
    { name: "Settings", href: "/settings", icon: Settings, show: isAdmin },
  ]

  const NavLinks = () => (
    <>
      {navItems.filter(item => item.show).map((item) => {
        const isActive = location === item.href
        return (
          <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)}>
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative",
              isActive 
                ? "bg-primary/10 text-primary border border-primary/20" 
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_theme(colors.primary.DEFAULT)]" />
              )}
              <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_theme(colors.primary.DEFAULT)]")} />
              <span className="font-semibold">{item.name}</span>
            </div>
          </Link>
        )
      })}
    </>
  )

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row relative">
      {/* Background ambient light */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-success/5 rounded-full blur-[120px]" />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-8 h-8 text-primary" />
          <span className="font-display font-bold text-xl tracking-wider">ZONE<span className="text-primary">OS</span></span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar Navigation */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static",
        mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
            <Gamepad2 className="w-6 h-6 text-primary drop-shadow-[0_0_8px_theme(colors.primary.DEFAULT)]" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl tracking-wider leading-none">ZONE<span className="text-primary">OS</span></h1>
            <p className="text-xs text-muted-foreground font-display uppercase tracking-widest mt-1">Terminal</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          <NavLinks />
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="bg-background/50 rounded-xl p-4 border border-white/5 mb-4">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground uppercase font-display tracking-wider mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_theme(colors.success.DEFAULT)] inline-block"></span>
              {user?.role}
            </p>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto z-10 relative">
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
