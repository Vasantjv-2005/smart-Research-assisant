"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Brain, Zap, Shield, Rocket } from "lucide-react"

export function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const supabase = createClient()
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        setMessage(error.message)
      } else if (data.user && !data.user.email_confirmed_at) {
        setMessage("Please check your email for a confirmation link!")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      setMessage("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      setMessage("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background grid-pattern relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8" />
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-float opacity-60" />
      <div
        className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-3xl animate-float opacity-60"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl animate-float opacity-40"
        style={{ animationDelay: "4s" }}
      />

      <div className="relative z-10 flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
          <div className="hidden lg:flex flex-col justify-center space-y-16 px-8">
            <div className="space-y-10">
              <div className="flex items-center space-x-5">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center glow-effect shadow-2xl">
                  <Brain className="w-11 h-11 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold gradient-text text-display">ResearchAI</h1>
                  <p className="text-muted-foreground text-lg">Next-gen research platform</p>
                </div>
              </div>

              <div className="space-y-8">
                <h2 className="text-6xl font-bold text-display leading-tight">
                  AI for teams building <span className="gradient-text">the future</span>
                </h2>

                <p className="text-2xl text-muted-foreground text-body leading-relaxed max-w-2xl">
                  Empower your entire organization to research at the speed of thought, while ensuring accuracy remains
                  at the forefront.
                </p>
              </div>

              <div className="flex items-center space-x-8">
                <Button size="lg" className="btn-primary px-12 h-16 text-lg font-semibold rounded-2xl shadow-xl">
                  Start Research
                </Button>
                <Button variant="ghost" size="lg" className="h-16 px-10 text-lg rounded-2xl hover:bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-muted mr-4 flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[8px] border-l-foreground border-y-[6px] border-y-transparent ml-1" />
                  </div>
                  Watch Demo
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="glass-effect p-8 rounded-3xl card-hover">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/30 to-accent/30 rounded-2xl flex items-center justify-center">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Lightning Fast</h3>
                    <p className="text-muted-foreground text-body">Get insights in seconds, not hours</p>
                  </div>
                </div>
              </div>

              <div className="glass-effect p-8 rounded-3xl card-hover">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/30 to-accent/30 rounded-2xl flex items-center justify-center">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Secure & Private</h3>
                    <p className="text-muted-foreground text-body">Enterprise-grade security for your data</p>
                  </div>
                </div>
              </div>

              <div className="glass-effect p-8 rounded-3xl card-hover">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/30 to-accent/30 rounded-2xl flex items-center justify-center">
                    <Rocket className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Scale Infinitely</h3>
                    <p className="text-muted-foreground text-body">From startup to enterprise, we grow with you</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Card className="w-full max-w-lg glass-effect border-0 shadow-2xl glow-effect rounded-3xl">
              <CardHeader className="space-y-8 text-center pb-10 pt-12">
                <div className="lg:hidden flex items-center justify-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-xl">
                    <Brain className="w-9 h-9 text-primary-foreground" />
                  </div>
                  <h1 className="text-3xl font-bold gradient-text text-display">ResearchAI</h1>
                </div>
                <div className="space-y-4">
                  <CardTitle className="text-4xl font-bold text-display">Welcome back</CardTitle>
                  <CardDescription className="text-lg text-muted-foreground text-body">
                    Sign in to your account or create a new one to get started
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="pb-12 px-12">
                <Tabs defaultValue="signin" className="space-y-10">
                  <TabsList className="grid w-full grid-cols-2 h-16 bg-muted/30 backdrop-blur-sm rounded-2xl p-2">
                    <TabsTrigger
                      value="signin"
                      className="text-base font-semibold h-12 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all duration-300"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="text-base font-semibold h-12 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all duration-300"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="space-y-8">
                    <form onSubmit={handleSignIn} className="space-y-8">
                      <div className="space-y-4">
                        <Label htmlFor="signin-email" className="text-base font-semibold">
                          Email address
                        </Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-16 text-base bg-background/60 backdrop-blur-sm border-2 border-border/30 focus:border-primary/50 focus:bg-background rounded-2xl transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-4">
                        <Label htmlFor="signin-password" className="text-base font-semibold">
                          Password
                        </Label>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-16 text-base bg-background/60 backdrop-blur-sm border-2 border-border/30 focus:border-primary/50 focus:bg-background rounded-2xl transition-all duration-300"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-16 text-lg font-semibold btn-primary rounded-2xl shadow-xl"
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                    <div className="text-center pt-6">
                      <p className="text-sm text-muted-foreground text-body">
                        Website is maintained by J Vasant and Phannendra Sarma
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-8">
                    <form onSubmit={handleSignUp} className="space-y-8">
                      <div className="space-y-4">
                        <Label htmlFor="signup-email" className="text-base font-semibold">
                          Email address
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-16 text-base bg-background/60 backdrop-blur-sm border-2 border-border/30 focus:border-primary/50 focus:bg-background rounded-2xl transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-4">
                        <Label htmlFor="signup-password" className="text-base font-semibold">
                          Password
                        </Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-16 text-base bg-background/60 backdrop-blur-sm border-2 border-border/30 focus:border-primary/50 focus:bg-background rounded-2xl transition-all duration-300"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-16 text-lg font-semibold btn-primary rounded-2xl shadow-xl"
                        disabled={isLoading}
                      >
                        {isLoading ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {message && (
                  <div
                    className={`mt-8 p-6 rounded-2xl text-base backdrop-blur-sm border-2 transition-all duration-300 ${
                      message.includes("check your email")
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-destructive/10 text-destructive border-destructive/30"
                    }`}
                  >
                    {message}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
