"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { medisynSearchSuggestionId } from "@/lib/search-suggestions"
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
  ArrowRight,
  Sparkles,
  Zap
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

const getStartedSteps = [
  {
    id: 1,
    title: "Enter a condition or symptom",
    description: "Start with your own disease keywords, symptoms, or treatment names.",
    cta: "Try Search",
    href: "/",
    icon: Search,
    tone: "bg-primary/10 text-primary border-primary/20",
  },
  {
    id: 2,
    title: "Run AI analysis",
    description: "Open AI Insights to extract entities, semantic matches, and context.",
    cta: "Open AI Insights",
    href: "/ai-insights",
    icon: Sparkles,
    tone: "bg-accent/10 text-accent border-accent/20",
  },
  {
    id: 3,
    title: "Review treatment patterns",
    description: "Use Treatment Insights to compare side effects, trends, and outcomes.",
    cta: "View Treatments",
    href: "/treatment-insights",
    icon: Activity,
    tone: "bg-warm/10 text-warm border-warm/20",
  },
]

const statsCards = [
  { 
    title: "Treatment Analyses", 
    value: "2,847", 
    change: "+12.5%", 
    icon: Activity,
    description: "Total treatments analyzed",
    color: "primary"
  },
  { 
    title: "Side Effects Tracked", 
    value: "15,234", 
    change: "+8.3%", 
    icon: AlertTriangle,
    description: "Reported side effects",
    color: "warm"
  },
  { 
    title: "Avg Recovery Time", 
    value: "4.2 weeks", 
    change: "-15.2%", 
    icon: Clock,
    description: "Across all treatments",
    color: "accent"
  },
  { 
    title: "Patient Sentiment", 
    value: "82%", 
    change: "+5.7%", 
    icon: Heart,
    description: "Positive feedback rate",
    color: "primary"
  },
]

const recentTreatments = [
  { name: "Custom Treatment A", condition: "Custom Condition", sentiment: "positive", analyses: 0, trend: "stable" },
  { name: "Custom Treatment B", condition: "Custom Condition", sentiment: "neutral", analyses: 0, trend: "stable" },
]

type ExperienceSentiment = "positive" | "neutral" | "negative"

type PatientExperience = {
  treatment: string
  condition: string
  sentiment: ExperienceSentiment
}

type RecentTreatment = {
  name: string
  condition: string
  sentiment: "positive" | "neutral"
  analyses: number
  trend: "up" | "stable"
}

function deriveRecentTreatments(records: PatientExperience[]): RecentTreatment[] {
  const grouped = new Map<string, { name: string; condition: string; count: number; positive: number }>()

  for (const record of records) {
    const key = `${record.treatment}::${record.condition}`
    const current = grouped.get(key)

    if (current) {
      current.count += 1
      current.positive += record.sentiment === "positive" ? 1 : 0
      continue
    }

    grouped.set(key, {
      name: record.treatment,
      condition: record.condition,
      count: 1,
      positive: record.sentiment === "positive" ? 1 : 0,
    })
  }

  return Array.from(grouped.values())
    .map((item): RecentTreatment => {
      const positiveRate = item.positive / item.count

      return {
        name: item.name,
        condition: item.condition,
        sentiment: positiveRate >= 0.5 ? "positive" : "neutral",
        analyses: item.count * 1200,
        trend: positiveRate >= 0.6 ? "up" : "stable",
      }
    })
    .sort((left, right) => right.analyses - left.analyses)
    .slice(0, 4)
}

export default function DashboardPage() {
  const router = useRouter()
  const [heroQuery, setHeroQuery] = useState("")
  const [recentTreatmentsData, setRecentTreatmentsData] = useState(recentTreatments)

  useEffect(() => {
    void fetch("/api/data/patient-experiences")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Failed to load"))))
      .then((payload: { items?: PatientExperience[] }) => {
        if (!Array.isArray(payload.items) || payload.items.length === 0) {
          return
        }

        const derived = deriveRecentTreatments(payload.items)

        if (derived.length > 0) {
          setRecentTreatmentsData(derived)
        }
      })
      .catch(() => {
        // Keep local dashboard defaults when real data API is unavailable.
      })
  }, [])

  function routeToAnalysis(query: string) {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      return
    }

    router.push(`/ai-insights?q=${encodeURIComponent(trimmedQuery)}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Search Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warm/10 text-warm text-sm font-medium mb-4">
              <Zap className="h-3.5 w-3.5" />
              AI-Powered Healthcare Analytics
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4 text-balance">
              Discover Treatment Insights
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
              Analyze patient experiences, side effects, and recovery outcomes with advanced AI
            </p>
            <div className="mt-6 flex justify-center">
              <svg
                className="hero-ecg h-8 w-56 text-accent"
                viewBox="0 0 200 40"
                aria-hidden="true"
              >
                <path
                  d="M0 20 H35 L45 8 L60 32 L75 12 L90 30 L105 16 L120 26 L135 10 L150 30 L165 18 H200"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-primary/20 via-warm/20 to-accent/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  list={medisynSearchSuggestionId}
                  placeholder="Search treatment, condition, or symptom..."
                  value={heroQuery}
                  onChange={(event) => setHeroQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      routeToAnalysis(heroQuery)
                    }
                  }}
                  className="h-14 pl-12 pr-32 text-base rounded-xl border-border/60 bg-card shadow-sm focus-visible:ring-2 focus-visible:ring-primary/30 transition-all duration-300"
                />
                <Button
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg shadow-sm hover:shadow transition-all duration-200"
                  onClick={() => routeToAnalysis(heroQuery)}
                >
                  Search
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-5 justify-center">
              {["Your Disease", "Symptom Pattern", "Treatment Name", "Outcome Trend", "Safety Signal"].map((tag) => (
                <Badge 
                  key={tag}
                  variant="secondary" 
                  onClick={() => routeToAnalysis(tag)}
                  className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-all duration-200 px-3 py-1"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Beginner Walkthrough */}
        <section className="mb-10">
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Get Started in 3 Steps</CardTitle>
              <CardDescription>Quick path for first-time users to run meaningful healthcare analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {getStartedSteps.map((step) => {
                  const Icon = step.icon

                  return (
                    <div
                      key={step.id}
                      className="rounded-xl border border-border/50 bg-muted/20 p-4 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`h-9 w-9 rounded-lg border flex items-center justify-center ${step.tone}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">Step {step.id}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-1.5">{step.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
                      <Button variant="outline" size="sm" className="group w-full" asChild>
                        <a href={step.href}>
                          {step.cta}
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </a>
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon
            const bgClass = stat.color === "warm" ? "bg-warm/10" : stat.color === "accent" ? "bg-accent/10" : "bg-primary/10"
            const iconClass = stat.color === "warm" ? "text-warm" : stat.color === "accent" ? "text-accent" : "text-primary"
            return (
              <Card 
                key={stat.title} 
                className="border-border/40 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-5 relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-primary/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-start justify-between relative">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                      <p className="text-2xl lg:text-3xl font-semibold mt-1.5 text-foreground tracking-tight">{stat.value}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${stat.change.startsWith('+') ? 'bg-accent/10' : 'bg-warm/10'}`}>
                          <TrendingUp className={`h-3 w-3 ${stat.change.startsWith('+') ? 'text-accent' : 'text-warm rotate-180'}`} />
                          <span className={`text-xs font-semibold ${stat.change.startsWith('+') ? 'text-accent' : 'text-warm'}`}>{stat.change}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className={`h-11 w-11 rounded-xl ${bgClass} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`h-5 w-5 ${iconClass}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        {/* Charts Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Side Effects Distribution */}
          <Card className="border-border/40 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Side Effects Frequency</CardTitle>
                  <CardDescription>Most reported side effects across treatments</CardDescription>
                </div>
                <div className="h-9 w-9 rounded-lg bg-warm/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-warm" />
                </div>
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
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                      }} 
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recovery Timeline */}
          <Card className="border-border/40 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Recovery Timeline</CardTitle>
                  <CardDescription>Patient recovery progress over 6 weeks</CardDescription>
                </div>
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-accent" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recoveryData}>
                    <defs>
                      <linearGradient id="recoveryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="recovered" 
                      stroke="hsl(var(--accent))" 
                      fill="url(#recoveryGradient)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Patient Sentiment */}
          <Card className="border-border/40 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Patient Sentiment Analysis</CardTitle>
                  <CardDescription>Treatment feedback trends over 6 months</CardDescription>
                </div>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sentimentData}>
                    <defs>
                      <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                      }} 
                    />
                    <Area type="monotone" dataKey="positive" stackId="1" stroke="hsl(var(--accent))" fill="url(#positiveGradient)" strokeWidth={2} />
                    <Area type="monotone" dataKey="neutral" stackId="1" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.3} strokeWidth={2} />
                    <Area type="monotone" dataKey="negative" stackId="1" stroke="hsl(var(--warm))" fill="hsl(var(--warm))" fillOpacity={0.3} strokeWidth={2} />
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
                  <div className="h-3 w-3 rounded-full bg-warm" />
                  <span className="text-sm text-muted-foreground">Negative</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights Preview */}
          <Card className="border-border/40 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-bl from-primary/10 via-warm/5 to-transparent rounded-bl-full" />
            <CardHeader className="pb-2 relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <div className="relative">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-warm animate-pulse" />
                    </div>
                    AI-Generated Insights
                  </CardTitle>
                  <CardDescription>Latest analysis from patient data</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 hover:border-accent/40 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <TrendingUp className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Recovery Rate Improvement</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Patients using combination therapy show 23% faster recovery compared to monotherapy.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-warm/5 border border-warm/20 hover:border-warm/40 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-warm/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <AlertTriangle className="h-4 w-4 text-warm" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Potential Interaction Alert</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Interaction warning generated from your custom treatment dataset.
                      </p>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full group/btn rounded-xl hover:bg-primary/5 hover:border-primary/40 transition-all duration-200" asChild>
                  <a href="/ai-insights">
                    View All AI Insights
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
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
                <Button variant="ghost" size="sm" className="group" asChild>
                  <a href="/treatment-insights">
                    View All
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTreatmentsData.map((treatment, index) => (
                  <div 
                    key={treatment.name}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 cursor-pointer group hover:shadow-sm"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{treatment.name}</p>
                        <p className="text-sm text-muted-foreground">{treatment.condition}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-foreground">{treatment.analyses.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">analyses</p>
                      </div>
                      <Badge 
                        className={`${
                          treatment.sentiment === "positive" 
                            ? "bg-accent/15 text-accent border-accent/30 hover:bg-accent/20" 
                            : "bg-muted text-muted-foreground"
                        } transition-colors duration-200`}
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
