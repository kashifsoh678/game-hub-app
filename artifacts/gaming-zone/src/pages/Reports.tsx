import { useAuth } from "@/hooks/use-auth"
import { useGetDailyReport, useGetMonthlyReport } from "@workspace/api-client-react"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts"
import { Activity, CreditCard, Users, Trophy } from "lucide-react"

export default function Reports() {
  const { authOptions, user } = useAuth()

  const { data: daily } = useGetDailyReport({ days: 7 }, authOptions)
  const { data: monthly } = useGetMonthlyReport(authOptions)

  if (user?.role !== "admin") {
    return <div className="p-8 text-center text-destructive">Unauthorized Access</div>
  }

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card className="p-6 relative overflow-hidden group">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-10 group-hover:scale-110 transition-transform duration-500">
        <Icon className={`w-32 h-32 text-${color}`} />
      </div>
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-${color}/10 border border-${color}/20 text-${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <p className="text-muted-foreground font-display uppercase tracking-wider text-sm">{title}</p>
        <p className="text-2xl font-mono font-bold mt-1 tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]">{value}</p>
      </div>
    </Card>
  )

  // Custom tooltips for Recharts to match dark theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="font-display font-bold text-muted-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="font-mono font-bold" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-display font-bold tracking-tight">Telemetry & Analytics</h1>
        <p className="text-muted-foreground mt-1">Business performance metrics and usage data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(daily?.todayEarnings || 0)}
          icon={Activity}
          color="success"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(monthly?.monthlyEarnings || 0)}
          icon={CreditCard}
          color="primary"
        />
        <StatCard
          title="Today's Sessions"
          value={daily?.todaySessions || 0}
          icon={Users}
          color="accent"
        />
        {/* <StatCard 
          title="Top Device" 
          value={daily?.mostUsedDevice || 'N/A'} 
          icon={Trophy} 
          color="secondary" 
        /> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="p-6 bg-card/40 border-white/5">
          <h3 className="font-display font-bold text-xl mb-6 tracking-wide">Revenue Stream (7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily?.dailyRevenue || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(val) => format(parseISO(val), 'MMM d')}
                  tick={{ fontFamily: 'monospace', fontSize: 12 }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontFamily: 'monospace', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="hsl(var(--success))"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 bg-card/40 border-white/5">
          <h3 className="font-display font-bold text-xl mb-6 tracking-wide">Device Utilization (Today)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily?.deviceUsage || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="deviceName" stroke="hsl(var(--muted-foreground))" tick={{ fontFamily: 'monospace', fontSize: 12 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontFamily: 'monospace', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="sessions" name="Sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
