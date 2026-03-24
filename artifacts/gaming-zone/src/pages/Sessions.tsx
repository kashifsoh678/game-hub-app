import { useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useGetSessions } from "@workspace/api-client-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatDuration } from "@/lib/utils"
import { format } from "date-fns"
import { Search, FileText, ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from "lucide-react"

export default function Sessions() {
  const { authOptions } = useAuth()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [filter, setFilter] = useState<"today" | "week" | "all">("today")
  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const { data, isLoading } = useGetSessions({
    page,
    limit,
    filter,
    deviceName: search || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined
  }, authOptions)

  const clearFilters = () => {
    setSearch("")
    setFilter("today")
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Session Archive</h1>
          <p className="text-muted-foreground mt-1">Review past usage logs and receipts.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="md:self-start border-white/10 hover:bg-white/5"
        >
          <X className="w-4 h-4 mr-2" /> Reset Filters
        </Button>
      </div>

      <Card className="p-6 bg-card/50 border-white/5">
        <div className="flex flex-col space-y-4 mb-6">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            {/* Quick Filters */}
            <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10 self-start">
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

            {/* Search */}
            <div className="relative max-w-sm w-full">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search device name..."
                className="pl-12 h-11 bg-black/40 border-white/10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 pt-4 border-t border-white/5">
            {/* Date Range */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-44">
                <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-10 h-10 bg-black/40 border-white/10 text-xs"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
                />
              </div>
              <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">to</span>
              <div className="relative flex-1 md:w-44">
                <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-10 h-10 bg-black/40 border-white/10 text-xs"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
                />
              </div>
            </div>

            <div className="flex-1" />


          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-muted-foreground uppercase bg-black/60 font-display tracking-widest">
              <tr>
                <th className="px-6 py-4">Device</th>
                <th className="px-6 py-4">Start Time</th>
                <th className="px-6 py-4">End Time</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Rate</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Operator</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-20 animate-pulse text-primary font-display font-bold tracking-widest">SYNCHRONIZING RECORDS...</td></tr>
              ) : data?.sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-lg font-display font-bold text-white/40">No records found</p>
                      <p className="text-sm mt-1">Try adjusting your active filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.sessions.map((session) => (
                  <tr key={session.id} className="border-b border-white/5 hover:bg-white/2 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white group-hover:text-primary transition-colors">{session.deviceName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5 tracking-tighter">ID: {session.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono">
                      {format(new Date(session.startTime), "MMM d, HH:mm")}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono">
                      {session.endTime ? format(new Date(session.endTime), "HH:mm") : <Badge variant="success" className="animate-pulse shadow-[0_0_8px_var(--color-success)] text-[10px]">Active</Badge>}
                    </td>
                    <td className="px-6 py-4 font-mono text-white">
                      {session.durationMinutes != null ? formatDuration(session.durationMinutes * 60) : '-'}
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground text-xs">{session.hourlyRate} <span className="text-[9px]">/hr</span></td>
                    <td className="px-6 py-4 font-mono font-bold text-primary drop-shadow-[0_0_8px_var(--color-primary)]">
                      {session.totalAmount != null ? formatCurrency(session.totalAmount) : '-'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs font-semibold">{session.operatorName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && (
          <div className="flex flex-col md:flex-row items-center justify-between mt-6 pt-6 border-t border-white/5 gap-4">

            {/* Row Limit */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Show</span>
              <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1) }}>
                <SelectTrigger className="w-[80px] h-10 bg-black/40 border-white/10">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  {[10, 30, 50, 100].map(val => (
                    <SelectItem key={val} value={val.toString()}>{val}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 border-white/10"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 -mr-2" /><ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-4 border-white/10 font-bold"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>

              <div className="flex items-center gap-1 px-4 font-mono text-xs">
                <span className="text-primary font-bold">{page}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">{data.totalPages || 1}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-4 border-white/10 font-bold"
                onClick={() => setPage(p => Math.min(data.totalPages || 1, p + 1))}
                disabled={page === data.totalPages || data.totalPages === 0}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 border-white/10"
                onClick={() => setPage(data.totalPages || 1)}
                disabled={page === data.totalPages || data.totalPages === 0}
              >
                <ChevronRight className="w-4 h-4" /><ChevronRight className="w-4 h-4 -ml-2" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
