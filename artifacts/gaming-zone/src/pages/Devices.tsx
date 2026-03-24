import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { 
  useGetDevices, 
  useCreateDevice, 
  useUpdateDevice, 
  useDeleteDevice,
  getGetDevicesQueryKey,
  DeviceType,
  Device
} from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit2, Trash2, Server } from "lucide-react"

export default function Devices() {
  const { authOptions, user } = useAuth()
  const queryClient = useQueryClient()
  
  const { data: devices, isLoading } = useGetDevices(authOptions)
  
  const createMutation = useCreateDevice(authOptions)
  const updateMutation = useUpdateDevice(authOptions)
  const deleteMutation = useDeleteDevice(authOptions)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    type: "PS5" as DeviceType,
    hourlyRate: 350
  })

  // Prevent non-admins from viewing
  if (user?.role !== "admin") {
    return <div className="p-8 text-center text-destructive">Unauthorized Access</div>
  }

  const openAdd = () => {
    setEditingDevice(null)
    setFormData({ name: "", type: "PS5", hourlyRate: 350 })
    setIsModalOpen(true)
  }

  const openEdit = (d: Device) => {
    setEditingDevice(d)
    setFormData({ name: d.name, type: d.type, hourlyRate: d.hourlyRate })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingDevice) {
        await updateMutation.mutateAsync({ 
          id: editingDevice.id, 
          data: formData 
        })
      } else {
        await createMutation.mutateAsync({ data: formData })
      }
      queryClient.invalidateQueries({ queryKey: getGetDevicesQueryKey() })
      setIsModalOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Delete this device? This action cannot be undone.")) {
      try {
        await deleteMutation.mutateAsync({ id })
        queryClient.invalidateQueries({ queryKey: getGetDevicesQueryKey() })
      } catch (err) {
        console.error(err)
      }
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Hardware Setup</h1>
          <p className="text-muted-foreground mt-1">Manage gaming stations and default pricing.</p>
        </div>
        <Button size="lg" onClick={openAdd}>
          <Plus className="w-5 h-5 mr-2" />
          Provision Device
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDevice ? "Reconfigure Device" : "Provision New Device"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label>Designation (Name)</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
                placeholder="e.g. PS5 Station 01"
              />
            </div>
            <div className="space-y-2">
              <Label>Hardware Class</Label>
              <select 
                className="flex h-12 w-full rounded-xl border border-white/10 bg-background/50 px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as DeviceType})}
              >
                <option value="PS5">PlayStation 5</option>
                <option value="PS4">PlayStation 4</option>
                <option value="PC">Gaming PC</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Base Hourly Rate (PKR)</Label>
              <Input 
                type="number" 
                min="0"
                value={formData.hourlyRate} 
                onChange={e => setFormData({...formData, hourlyRate: Number(e.target.value)})} 
                required 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingDevice ? "Save Configuration" : "Initialize"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">Loading registry...</div>
        ) : (
          devices?.map(device => (
            <Card key={device.id} className="p-6 relative group overflow-hidden bg-card/40 border-white/5 hover:border-white/20 transition-all">
              <div className="absolute right-0 top-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <Server className="w-24 h-24" />
              </div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold font-display text-white">{device.name}</h3>
                  <Badge variant="secondary" className="mt-2">{device.type}</Badge>
                </div>
                <Badge variant={device.status === "available" ? "success" : "destructive"}>
                  {device.status}
                </Badge>
              </div>
              
              <div className="bg-black/30 rounded-lg p-3 border border-white/5 mb-6">
                <p className="text-sm text-muted-foreground font-display uppercase tracking-wider mb-1">Assigned Rate</p>
                <p className="font-mono text-xl text-primary">{device.hourlyRate} <span className="text-sm text-muted-foreground">PKR/hr</span></p>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => openEdit(device)}>
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleDelete(device.id)} disabled={device.status === "in_use"}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
