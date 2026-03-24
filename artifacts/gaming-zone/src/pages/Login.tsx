import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLogin } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Gamepad2, Lock, Mail, AlertCircle } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { login } = useAuth()
  const loginMutation = useLogin()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await loginMutation.mutateAsync({ data: { email, password } })
      login(res.token, res.user)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] mix-blend-screen pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-card border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-2xl relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <Gamepad2 className="w-10 h-10 text-primary relative z-10" />
          </div>
          <h1 className="text-4xl font-display font-bold tracking-widest">ZONE<span className="text-primary">OS</span></h1>
          <p className="text-muted-foreground mt-2 font-display uppercase tracking-widest text-sm">System Terminal Login</p>
        </div>

        <Card className="p-8 backdrop-blur-2xl bg-card/40 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {loginMutation.isError && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-3 text-destructive">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">Invalid credentials. Access denied.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Operator ID / Email</Label>
              <div className="relative group">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@zone.com"
                  className="pl-12 bg-black/40 border-white/10 h-14 text-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passcode</Label>
              <div className="relative group">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-12 bg-black/40 border-white/10 h-14 text-lg font-mono tracking-widest"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              size="xl" 
              className="w-full mt-8"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Authenticating..." : "Initialize Session"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
