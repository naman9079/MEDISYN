"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { 
  User,
  Mail,
  Building2,
  MapPin,
  Calendar,
  Shield,
  Bell,
  Sparkles,
  TrendingUp,
  Activity,
  Clock,
  Award,
  Zap,
  CreditCard,
  CheckCircle2
} from "lucide-react"

const userStats = [
  { label: "Analyses Run", value: "1,847", icon: Activity, trend: "+124 this month" },
  { label: "Insights Generated", value: "423", icon: Sparkles, trend: "+38 this month" },
  { label: "Hours Saved", value: "156", icon: Clock, trend: "Estimated time savings" },
  { label: "Accuracy Score", value: "94.2%", icon: Award, trend: "Based on feedback" },
]

const recentActivity = [
  { action: "Analyzed treatment", target: "Metformin for Type 2 Diabetes", time: "2 hours ago", type: "analysis" },
  { action: "Generated insight", target: "Drug interaction warning", time: "4 hours ago", type: "insight" },
  { action: "Reviewed report", target: "Q4 Patient Outcomes", time: "Yesterday", type: "report" },
  { action: "Analyzed treatment", target: "Sertraline for Depression", time: "2 days ago", type: "analysis" },
]

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <section className="mb-10">
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 via-warm/10 to-accent/20" />
            <CardContent className="relative px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16">
                <Avatar className="h-28 w-28 ring-4 ring-card shadow-lg">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=medisyn" alt="Dr. Sarah Chen" />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">SC</AvatarFallback>
                </Avatar>
                <div className="flex-1 sm:pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <h1 className="text-2xl font-semibold text-foreground">Dr. Sarah Chen</h1>
                    <Badge className="w-fit bg-warm/15 text-warm border-warm/30 hover:bg-warm/20">
                      <Zap className="h-3 w-3 mr-1" />
                      Pro Plan
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">Healthcare Data Analyst</p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      Stanford Medical Center
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      San Francisco, CA
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Member since Jan 2024
                    </span>
                  </div>
                </div>
                <Button className="sm:self-center shadow-sm hover:shadow transition-all duration-200">
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {userStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card 
                key={stat.label} 
                className="border-border/40 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                      <p className="text-2xl font-semibold mt-1 text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-accent" />
                        {stat.trend}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Account Information
                </CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="Sarah" className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Chen" className="rounded-lg" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" defaultValue="sarah.chen@medisyn.ai" className="pl-10 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="organization" defaultValue="Stanford Medical Center" className="pl-10 rounded-lg" />
                  </div>
                </div>
                <Button className="shadow-sm hover:shadow transition-all duration-200">Save Changes</Button>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Manage how you receive updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "AI Insight Alerts", description: "Get notified when new AI insights are generated", defaultChecked: true },
                  { title: "Treatment Updates", description: "Updates on treatments you're tracking", defaultChecked: true },
                  { title: "Weekly Digest", description: "Weekly summary of analytics and trends", defaultChecked: false },
                  { title: "Security Alerts", description: "Important security and account notifications", defaultChecked: true },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.defaultChecked} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border/40">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Badge className="bg-accent/15 text-accent border-accent/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Password</p>
                    <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-lg">Change Password</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription */}
            <Card className="border-border/40 shadow-sm overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary via-warm to-accent" />
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-warm/10 border border-warm/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold text-foreground">Pro Plan</span>
                    <Badge className="bg-warm/20 text-warm border-warm/30">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Unlimited analyses, priority AI insights, and advanced reporting</p>
                  <Separator className="my-4" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Billing Period</span>
                      <span className="font-medium text-foreground">Monthly</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next Billing</span>
                      <span className="font-medium text-foreground">Apr 15, 2026</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium text-foreground">$49/month</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full rounded-lg">Manage Subscription</Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 group">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        activity.type === "analysis" ? "bg-primary/10" :
                        activity.type === "insight" ? "bg-warm/10" :
                        "bg-accent/10"
                      }`}>
                        {activity.type === "analysis" ? (
                          <Activity className="h-4 w-4 text-primary" />
                        ) : activity.type === "insight" ? (
                          <Sparkles className="h-4 w-4 text-warm" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{activity.action}</span>
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{activity.target}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
