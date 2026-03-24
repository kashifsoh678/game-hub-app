import { useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useGetSessions } from "@workspace/api-client-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDuration } from "@/lib/utils"
import { format } from "date-fns"
import { Search, Filter, FileText, ChevronLeft, ChevronRight } from "lucide-react"

export default function Sessions() {
  const { authOptions } = useAuth()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<"today" | "week" | "all">("today")
  const [search, setSearch] = useState("")

  const { data, isLoading } = useGetSessions({
    page,
    limit: 10,
    filter,
    deviceName: search || undefined
  }, authOptions)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-display font-bold tracking-tight">Session Archive</h1>
        <p className="text-muted-foreground mt-1">Review past usage logs and receipts.</p>
      </div>

      <Card className="p-6 bg-card/50">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
            {(["today", "week", "all"] as const).map(f => (
              <Button 
                key={f}
                variant={filter === f ? "default" : "ghost"} 
                size="sm"
                className={cn("capitalize px-6", filter === f && "bg-primary/20 text-primary hover:bg-primary/30 shadow-none border border-primary/50")}
                onClick={() => { setFilter(f); setPage(1) }}
              >
                {f}
              </Button>
            ))}
          </div>

          <div className="relative max-w-sm w-full">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search device name..." 
              className="pl-12"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-black/40 font-display tracking-wider">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl">Device</th>
                <th className="px-6 py-4">Start Time</th>
                <th className="px-6 py-4">End Time</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Rate</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 rounded-tr-xl">Operator</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-10">Loading records...</td></tr>
              ) : data?.sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-lg">No sessions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.sessions.map((session) => (
                  <tr key={session.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{session.deviceName}</td>
                    <td className="px-6 py-4 text-muted-foreground font-mono">
                      {format(new Date(session.startTime), "MMM d, HH:mm")}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono">
                      {session.endTime ? format(new Date(session.endTime), "HH:mm") : <Badge variant="success">Active</Badge>}
                    </td>
                    <td className="px-6 py-4 font-mono text-white">
                      {session.durationMinutes ? formatDuration(session.durationMinutes * 60) : '-'}
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">{session.hourlyRate}</td>
                    <td className="px-6 py-4 font-mono font-bold text-primary drop-shadow-[0_0_8px_theme(colors.primary.DEFAULT)]">
                      {session.totalAmount !== null ? formatCurrency(session.totalAmount) : '-'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{session.operatorName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
            <p className="text-sm text-muted-foreground font-mono">
              Showing page {data.page} of {data.totalPages} ({data.total} total)
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
