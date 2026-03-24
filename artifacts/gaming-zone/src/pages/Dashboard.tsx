import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { 
  useGetDevices, 
  useStartSession, 
  useStopSession, 
  getGetDevicesQueryKey,
  Device,
  GetDevicesQueryResult
} from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDuration, calculateBill, getElapsedSeconds, formatCurrency } from "@/lib/utils"
import { Play, Square, Monitor, MonitorSpeaker, Clock, Receipt, RefreshCw } from "lucide-react"

// Extracted Timer component so only it re-renders every second, not the whole dashboard
function ActiveDeviceStats({ device }: { device: Device }) {
  const [elapsed, setElapsed] = useState(() => getElapsedSeconds(device.activeSession?.startTime))

  useEffect(() => {
    if (device.status !== "in_use") return

    const timer = setInterval(() => {
      setElapsed(getElapsedSeconds(device.activeSession?.startTime))
    }, 1000)

    return () => clearInterval(timer)
  }, [device.status, device.activeSession?.startTime])

  const bill = calculateBill(elapsed, device.hourlyRate)

  return (
    <div className="grid grid-cols-2 gap-4 mt-6">
      <div className="bg-black/40 rounded-xl p-4 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <Clock className="w-12 h-12" />
        </div>
        <p className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Time Elapsed</p>
        <p className="text-2xl font-mono tracking-wider font-bold text-white">{formatDuration(elapsed)}</p>
      </div>
      <div className="bg-black/40 rounded-xl p-4 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <Receipt className="w-12 h-12" />
        </div>
        <p className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1">Current Bill</p>
        <p className="text-2xl font-mono tracking-wider font-bold text-success drop-shadow-[0_0_8px_theme(colors.success.DEFAULT)]">
          {formatCurrency(bill)}
        </p>
      </div>
    </div>
  )
}

function DeviceCard({ device }: { device: Device }) {
  const { authOptions } = useAuth()
  const queryClient = useQueryClient()
  
  const startMutation = useStartSession(authOptions)
  const stopMutation = useStopSession(authOptions)

  const isAvailable = device.status === "available"

  const handleStart = async () => {
    await startMutation.mutateAsync({ data: { deviceId: device.id } })
    queryClient.invalidateQueries({ queryKey: getGetDevicesQueryKey() })
  }

  const handleStop = async () => {
    await stopMutation.mutateAsync({ data: { deviceId: device.id } })
    queryClient.invalidateQueries({ queryKey: getGetDevicesQueryKey() })
  }

  const isPending = startMutation.isPending || stopMutation.isPending

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      !isAvailable && "neon-border-destructive"
    )}>
      {/* Decorative type icon background */}
      <div className="absolute -right-8 -top-8 text-white/5 pointer-events-none">
        {device.type === "PC" ? <Monitor className="w-48 h-48" /> : <MonitorSpeaker className="w-48 h-48" />}
      </div>

      <div className="p-6 relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-white tracking-tight">{device.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{device.type}</Badge>
              <Badge variant={isAvailable ? "success" : "destructive"}>
                {isAvailable ? "Available" : "In Use"}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground font-display uppercase tracking-wider">Rate</p>
            <p className="text-lg font-bold font-mono text-primary">{device.hourlyRate} <span className="text-xs font-sans text-muted-foreground font-normal">PKR/hr</span></p>
          </div>
        </div>

        <div className="flex-1">
          {isAvailable ? (
            <div className="h-28 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl mt-6">
              <p className="text-muted-foreground font-display uppercase tracking-widest text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                Ready for assignment
              </p>
            </div>
          ) : (
            <ActiveDeviceStats device={device} />
          )}
        </div>

        <div className="mt-8">
          {isAvailable ? (
            <Button 
              size="xl" 
              variant="success" 
              className="w-full shadow-lg"
              onClick={handleStart}
              disabled={isPending}
            >
              <Play className="w-6 h-6 mr-3 fill-current" />
              Start Session
            </Button>
          ) : (
            <Button 
              size="xl" 
              variant="destructive" 
              className="w-full shadow-lg"
              onClick={handleStop}
              disabled={isPending}
            >
              <Square className="w-6 h-6 mr-3 fill-current" />
              Stop & Checkout
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

// Utility to merge classnames safely
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export default function Dashboard() {
  const { authOptions } = useAuth()
  
  // Refetch every 5 seconds to keep dashboard perfectly in sync across multiple terminals
  const { data: devices, isLoading, isFetching } = useGetDevices({
    ...authOptions,
    query: {
      refetchInterval: 5000,
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const availableCount = devices?.filter(d => d.status === "available").length || 0
  const inUseCount = devices?.filter(d => d.status === "in_use").length || 0

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Active Terminal</h1>
          <p className="text-muted-foreground mt-1">Real-time device monitoring and session control.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-card/50 backdrop-blur-md border border-white/10 p-3 rounded-2xl">
          <div className="px-4 border-r border-white/10">
            <p className="text-xs font-display text-muted-foreground uppercase mb-1">Available</p>
            <p className="text-2xl font-mono font-bold text-success">{availableCount}</p>
          </div>
          <div className="px-4 border-r border-white/10">
            <p className="text-xs font-display text-muted-foreground uppercase mb-1">Active</p>
            <p className="text-2xl font-mono font-bold text-destructive">{inUseCount}</p>
          </div>
          <div className="px-4 flex items-center justify-center">
            <RefreshCw className={cn("w-5 h-5 text-muted-foreground", isFetching && "animate-spin text-primary")} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {devices?.map(device => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
    </div>
  )
}
