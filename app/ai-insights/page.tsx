"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Shield,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  ChevronRight,
  Activity,
  Brain,
  Zap,
  Info
} from "lucide-react"
import { api, type Insight, type InsightStat } from "@/lib/api"

type InsightType = "all" | "discovery" | "alert" | "trend"

const statIconMap: Record<string, React.ElementType> = {
  "Total Insights": Sparkles,
  "Critical Alerts": AlertTriangle,
  "Discoveries": Lightbulb,
  "Data Points": Activity,
}

const typeConfig = {
  discovery: {
    icon: Lightbulb,
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/20",
    label: "Discovery"
  },
  alert: {
    icon: AlertCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/20",
    label: "Alert"
  },
  trend: {
    icon: TrendingUp,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    label: "Trend"
  }
}

const impactColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  low: "bg-muted text-muted-foreground border-border"
}

export default function AIInsightsPage() {
  const [activeFilter, setActiveFilter] = useState<InsightType>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [allInsights, setAllInsights] = useState<Insight[]>([])
  const [insightStats, setInsightStats] = useState<InsightStat[]>([])

  useEffect(() => {
    api.listInsights().then(setAllInsights).catch(console.error)
    api.getInsightStats().then(setInsightStats).catch(console.error)
  }, [])

  const filteredInsights = allInsights.filter((insight) => {
    const matchesFilter = activeFilter === "all" || insight.type === activeFilter
    const matchesSearch = searchQuery === "" || 
      insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.treatment.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-foreground">AI Insights Panel</h1>
              <p className="text-muted-foreground">AI-generated analysis of treatment outcomes and patterns</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {insightStats.map((stat) => {
            const Icon = statIconMap[stat.label] ?? Activity
            return (
              <Card key={stat.label} className="border-border/40 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{stat.change}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search insights..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select defaultValue="recent">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="confidence">Highest Confidence</SelectItem>
                <SelectItem value="impact">Highest Impact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type Filters */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              All Insights
            </Button>
            <Button 
              variant={activeFilter === "discovery" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("discovery")}
              className={activeFilter === "discovery" ? "bg-accent hover:bg-accent/90" : ""}
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              Discoveries
            </Button>
            <Button 
              variant={activeFilter === "alert" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("alert")}
              className={activeFilter === "alert" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Alerts
            </Button>
            <Button 
              variant={activeFilter === "trend" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("trend")}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Trends
            </Button>
          </div>
        </div>

        {/* Insights List */}
        <div className="space-y-4">
          {filteredInsights.map((insight) => {
            const config = typeConfig[insight.type]
            const TypeIcon = config.icon
            const isExpanded = expandedId === insight.id

            return (
              <Card 
                key={insight.id} 
                className={`border-border/40 shadow-sm hover:shadow-md transition-all cursor-pointer ${config.borderColor} border-l-4`}
                onClick={() => setExpandedId(isExpanded ? null : insight.id)}
              >
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
                        <TypeIcon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0`}>
                            {config.label}
                          </Badge>
                          <Badge variant="outline" className={impactColors[insight.impact]}>
                            {insight.impact.charAt(0).toUpperCase() + insight.impact.slice(1)} Impact
                          </Badge>
                          {insight.actionable && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              <Zap className="h-3 w-3 mr-1" />
                              Actionable
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mt-2">{insight.title}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Shield className="h-4 w-4 text-accent" />
                          <span className="font-medium text-accent">{insight.confidence}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">confidence</p>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-foreground leading-relaxed mb-3">
                    {insight.summary}
                  </p>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5" />
                      {insight.treatment}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {insight.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" />
                      {insight.data_points.toLocaleString()} data points
                    </span>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border/40">
                      <h4 className="text-sm font-medium text-foreground mb-2">Detailed Analysis</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {insight.details}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{insight.condition}</Badge>
                        <Badge variant="secondary">{insight.treatment}</Badge>
                      </div>
                      {insight.actionable && (
                        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">Recommended Action</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Review this insight with your healthcare team for potential implementation.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredInsights.length === 0 && (
          <Card className="border-border/40 shadow-sm">
            <CardContent className="py-16 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No insights found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
