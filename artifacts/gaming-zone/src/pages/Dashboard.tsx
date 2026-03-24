import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
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
    <div className="flex flex-col gap-3 mt-5">
      {/* Timer */}
      <div className="bg-black/60 rounded-2xl px-5 py-3 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <p className="text-[10px] font-display uppercase tracking-widest text-sky-400/80 font-bold">Time</p>
        </div>
        <p className="text-[1.2rem] font-mono tracking-widest font-bold text-white leading-none tabular-nums">
          {formatDuration(elapsed)}
        </p>
      </div>
      {/* Bill */}
      <div className="bg-black/60 rounded-2xl px-5 py-3 border border-emerald-500/25 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5 text-emerald-400" />
          <p className="text-[10px] font-display uppercase tracking-widest text-emerald-400/80 font-bold">Bill</p>
        </div>
        <p className="text-[1.2rem] font-mono tracking-widest font-bold text-emerald-400 leading-none tabular-nums">
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
    <div className={cn(
      "relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300 border-2",
      isAvailable
        ? "bg-[#0d1a12] border-emerald-500/50 shadow-[0_0_24px_rgba(16,185,129,0.12)]"
        : "bg-[#1a0d0d] border-red-500/60 shadow-[0_0_24px_rgba(239,68,68,0.18)]"
    )}>
      {/* Color status bar at top */}
      <div className={cn(
        "h-1.5 w-full",
        isAvailable ? "bg-emerald-500" : "bg-red-500"
      )} />

      {/* Decorative watermark icon */}
      <div className="absolute -right-6 -bottom-6 opacity-[0.04] pointer-events-none">
        {device.type === "PC" ? <Monitor className="w-44 h-44" /> : <MonitorSpeaker className="w-44 h-44" />}
      </div>

      <div className="p-5 flex flex-col flex-1 relative z-10">

        {/* Header row: name + rate */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-2xl font-display font-extrabold text-white tracking-tight leading-tight">
              {device.name}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-white/10 text-white/70 border border-white/10">
                {device.type}
              </span>
              <span className="inline-flex items-center rounded-lg gap-1 px-2.5 py-0.5 text-[11px] font-bold capitalize tracking-wider bg-white/10 text-white/70 border border-white/10">
                {device.hourlyRate} <span className="text-white/30 mt-0.5">/hr</span>
              </span>
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider border",
                isAvailable
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                  : "bg-red-500/15 text-red-400 border-red-500/40"
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isAvailable ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                )} />
                {isAvailable ? "Available" : "In Use"}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1">
          {isAvailable ? (
            <div className="mt-4 h-24 flex items-center justify-center rounded-xl border-2 border-dashed border-emerald-500/20 bg-emerald-500/5">
              <p className="text-emerald-500/70 font-display uppercase tracking-widest text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Ready for assignment
              </p>
            </div>
          ) : (
            <ActiveDeviceStats device={device} />
          )}
        </div>

        {/* Action button */}
        <div className="mt-5">
          {isAvailable ? (
            <button
              onClick={handleStart}
              disabled={isPending}
              className="w-full h-14 rounded-xl text-base font-display font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50 bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:shadow-[0_4px_28px_rgba(16,185,129,0.6)] active:scale-[0.98]"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Session
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={isPending}
              className="w-full h-14 rounded-xl text-base font-display font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50 bg-red-500 hover:bg-red-400 text-white shadow-[0_4px_20px_rgba(239,68,68,0.4)] hover:shadow-[0_4px_28px_rgba(239,68,68,0.6)] active:scale-[0.98]"
            >
              <Square className="w-5 h-5 fill-current" />
              Stop & Checkout
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { authOptions } = useAuth()

  // Refetch every 5 seconds to keep dashboard perfectly in sync across multiple terminals
  const { data: devices, isLoading, isFetching } = useGetDevices({
    ...authOptions,
    query: {
      queryKey: getGetDevicesQueryKey(),
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {devices?.map(device => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
    </div>
  )
}
