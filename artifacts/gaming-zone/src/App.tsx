import { Switch, Route, Router as WouterRouter, useLocation } from "wouter"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider, useAuth } from "@/hooks/use-auth"
import { AppLayout } from "@/components/layout/AppLayout"
import NotFound from "@/pages/not-found"
import { useEffect } from "react"

// Pages
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import Sessions from "@/pages/Sessions"
import Devices from "@/pages/Devices"
import Reports from "@/pages/Reports"
import Settings from "@/pages/Settings"

const queryClient = new QueryClient()

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, token, isLoading } = useAuth()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (!isLoading && !token) {
      setLocation("/login")
    }
  }, [isLoading, token, setLocation])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary font-display font-bold tracking-widest animate-pulse">
        INITIALIZING SYSTEM...
      </div>
    )
  }

  if (!user) return null

  return (
    <AppLayout>
      <Component {...rest} />
    </AppLayout>
  )
}

function Router() {
  const { token } = useAuth()
  const [location, setLocation] = useLocation()

  // Root redirect
  useEffect(() => {
    if (location === "/") {
      setLocation(token ? "/dashboard" : "/login")
    }
  }, [location, token, setLocation])

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/sessions"><ProtectedRoute component={Sessions} /></Route>
      <Route path="/devices"><ProtectedRoute component={Devices} /></Route>
      <Route path="/reports"><ProtectedRoute component={Reports} /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
      <Route component={NotFound} />
    </Switch>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App;
