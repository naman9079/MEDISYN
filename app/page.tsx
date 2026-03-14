"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Heart, 
  TrendingUp,
  Users,
  Shield,
  ArrowRight,
  Sparkles
} from "lucide-react"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from "recharts"

const sideEffectsData = [
  { name: "Nausea", value: 35 },
  { name: "Headache", value: 28 },
  { name: "Fatigue", value: 22 },
  { name: "Dizziness", value: 15 },
]

const recoveryData = [
  { week: "Week 1", patients: 120, recovered: 45 },
  { week: "Week 2", patients: 120, recovered: 68 },
  { week: "Week 3", patients: 120, recovered: 85 },
  { week: "Week 4", patients: 120, recovered: 102 },
  { week: "Week 5", patients: 120, recovered: 110 },
  { week: "Week 6", patients: 120, recovered: 118 },
]

const sentimentData = [
  { month: "Jan", positive: 65, neutral: 25, negative: 10 },
  { month: "Feb", positive: 68, neutral: 22, negative: 10 },
  { month: "Mar", positive: 72, neutral: 20, negative: 8 },
  { month: "Apr", positive: 75, neutral: 18, negative: 7 },
  { month: "May", positive: 78, neutral: 16, negative: 6 },
  { month: "Jun", positive: 82, neutral: 14, negative: 4 },
]

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"]

const statsCards = [
  { 
    title: "Treatment Analyses", 
    value: "2,847", 
    change: "+12.5%", 
    icon: Activity,
    description: "Total treatments analyzed"
  },
  { 
    title: "Side Effects Tracked", 
    value: "15,234", 
    change: "+8.3%", 
    icon: AlertTriangle,
    description: "Reported side effects"
  },
  { 
    title: "Avg Recovery Time", 
    value: "4.2 weeks", 
    change: "-15.2%", 
    icon: Clock,
    description: "Across all treatments"
  },
  { 
    title: "Patient Sentiment", 
    value: "82%", 
    change: "+5.7%", 
    icon: Heart,
    description: "Positive feedback rate"
  },
]

const recentTreatments = [
  { name: "Metformin", condition: "Type 2 Diabetes", sentiment: "positive", analyses: 1234 },
  { name: "Lisinopril", condition: "Hypertension", sentiment: "positive", analyses: 987 },
  { name: "Sertraline", condition: "Depression", sentiment: "neutral", analyses: 756 },
  { name: "Omeprazole", condition: "GERD", sentiment: "positive", analyses: 623 },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Search Section */}
        <section className="mb-10">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3 text-balance">
              Discover Treatment Insights
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
              AI-powered analysis of patient experiences, side effects, and recovery outcomes
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search treatment, condition, or symptom..."
                className="h-14 pl-12 pr-32 text-base rounded-xl border-border/60 bg-card shadow-sm focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              <Button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg">
                Search
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">Diabetes</Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">Hypertension</Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">Anxiety</Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">Arthritis</Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">Migraine</Badge>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="border-border/40 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-semibold mt-1 text-foreground">{stat.value}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="h-3 w-3 text-accent" />
                        <span className="text-xs text-accent font-medium">{stat.change}</span>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        {/* Charts Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Side Effects Distribution */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Side Effects Frequency</CardTitle>
                  <CardDescription>Most reported side effects across treatments</CardDescription>
                </div>
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sideEffectsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={70} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recovery Timeline */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Recovery Timeline</CardTitle>
                  <CardDescription>Patient recovery progress over 6 weeks</CardDescription>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recoveryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="recovered" 
                      stroke="hsl(var(--accent))" 
                      fill="hsl(var(--accent))" 
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Patient Sentiment */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Patient Sentiment Analysis</CardTitle>
                  <CardDescription>Treatment feedback trends over 6 months</CardDescription>
                </div>
                <Heart className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sentimentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Area type="monotone" dataKey="positive" stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="neutral" stackId="1" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="negative" stackId="1" stroke="hsl(var(--chart-5))" fill="hsl(var(--chart-5))" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-accent" />
                  <span className="text-sm text-muted-foreground">Positive</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-chart-4" />
                  <span className="text-sm text-muted-foreground">Neutral</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-chart-5" />
                  <span className="text-sm text-muted-foreground">Negative</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights Preview */}
          <Card className="border-border/40 shadow-sm bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI-Generated Insights
                  </CardTitle>
                  <CardDescription>Latest analysis from patient data</CardDescription>
                </div>
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-card border border-border/40">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Recovery Rate Improvement</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Patients using combination therapy show 23% faster recovery compared to monotherapy.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-card border border-border/40">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Potential Interaction Alert</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Increased fatigue reports when combining Metformin with beta-blockers.
                      </p>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full" asChild>
                  <a href="/ai-insights">
                    View All AI Insights
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Recent Treatments */}
        <section>
          <Card className="border-border/40 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Recent Treatment Analyses</CardTitle>
                  <CardDescription>Latest treatments with patient feedback</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/treatment-insights">
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTreatments.map((treatment) => (
                  <div 
                    key={treatment.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{treatment.name}</p>
                        <p className="text-sm text-muted-foreground">{treatment.condition}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-foreground">{treatment.analyses.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">analyses</p>
                      </div>
                      <Badge 
                        variant={treatment.sentiment === "positive" ? "default" : "secondary"}
                        className={treatment.sentiment === "positive" ? "bg-accent text-accent-foreground" : ""}
                      >
                        {treatment.sentiment}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
