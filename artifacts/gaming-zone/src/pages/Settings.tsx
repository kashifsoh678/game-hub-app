import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Settings as SettingsIcon, Save } from "lucide-react"

export default function Settings() {
  const { authOptions, user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const { data: settings, isLoading } = useGetSettings(authOptions)
  const updateMutation = useUpdateSettings(authOptions)

  const [formData, setFormData] = useState({
    businessName: "",
    defaultHourlyRate: 0,
    currency: "PKR",
    timezone: "UTC"
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        businessName: settings.businessName,
        defaultHourlyRate: settings.defaultHourlyRate,
        currency: settings.currency,
        timezone: settings.timezone
      })
    }
  }, [settings])

  if (user?.role !== "admin") {
    return <div className="p-8 text-center text-destructive">Unauthorized Access</div>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateMutation.mutateAsync({ data: formData })
      queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() })
      toast({
        title: "Settings Updated",
        description: "System configuration saved successfully.",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update configuration.",
      })
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
      <div>
        <h1 className="text-4xl font-display font-bold tracking-tight">System Config</h1>
        <p className="text-muted-foreground mt-1">Core operational parameters and globals.</p>
      </div>

      <Card className="p-8 bg-card/40 border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <SettingsIcon className="w-64 h-64" />
        </div>
        
        {isLoading ? (
          <div className="py-10 text-center">Loading parameters...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <Label>Operating Entity Name</Label>
              <Input 
                value={formData.businessName}
                onChange={e => setFormData({...formData, businessName: e.target.value})}
                className="max-w-md h-14 text-lg"
              />
              <p className="text-xs text-muted-foreground">Displayed on receipts and login screen.</p>
            </div>

            <div className="space-y-2">
              <Label>Global Default Rate (Per Hour)</Label>
              <div className="relative max-w-md">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold">PKR</span>
                <Input 
                  type="number"
                  value={formData.defaultHourlyRate}
                  onChange={e => setFormData({...formData, defaultHourlyRate: Number(e.target.value)})}
                  className="pl-14 h-14 text-lg font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">Fallback rate for newly provisioned devices.</p>
            </div>

            <div className="grid grid-cols-2 gap-6 max-w-md">
              <div className="space-y-2">
                <Label>Currency Code</Label>
                <Input 
                  value={formData.currency}
                  onChange={e => setFormData({...formData, currency: e.target.value})}
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input 
                  value={formData.timezone}
                  onChange={e => setFormData({...formData, timezone: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <Button type="submit" size="lg" disabled={updateMutation.isPending}>
                <Save className="w-5 h-5 mr-2" />
                {updateMutation.isPending ? "Committing..." : "Commit Configuration"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
