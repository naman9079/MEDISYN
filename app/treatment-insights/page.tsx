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
  Activity, 
  AlertTriangle, 
  Clock, 
  Heart, 
  TrendingUp,
  Search,
  ExternalLink,
  ChevronRight,
  Users,
  Pill,
  FileText
} from "lucide-react"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts"
import { api, type TreatmentSummary, type TreatmentDetail } from "@/lib/api"

export default function TreatmentInsightsPage() {
  const [treatments, setTreatments] = useState<TreatmentSummary[]>([])
  const [selectedId, setSelectedId] = useState<number>(1)
  const [detail, setDetail] = useState<TreatmentDetail | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [conditionFilter, setConditionFilter] = useState("all")
  const [sortBy, setSortBy] = useState("rating")

  useEffect(() => {
    api.listTreatments({ search: searchQuery, condition: conditionFilter, sort_by: sortBy })
      .then(data => {
        setTreatments(data)
        if (data.length > 0 && !data.find(t => t.id === selectedId)) {
          setSelectedId(data[0].id)
        }
      })
      .catch(console.error)
  }, [searchQuery, conditionFilter, sortBy])

  useEffect(() => {
    api.getTreatment(selectedId).then(setDetail).catch(console.error)
  }, [selectedId])

  const sideEffectsData = detail?.side_effects ?? []
  const sentimentBreakdown = detail?.sentiment_breakdown ?? []
  const recoveryTimeline = detail?.recovery_timeline ?? []

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Treatment Insights</h1>
          <p className="text-muted-foreground">Comprehensive analysis of treatments and patient outcomes</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search treatments..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              <SelectItem value="diabetes">Diabetes</SelectItem>
              <SelectItem value="hypertension">Hypertension</SelectItem>
              <SelectItem value="depression">Depression</SelectItem>
              <SelectItem value="gerd">GERD</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rating</SelectItem>
              <SelectItem value="patients">Most Patients</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Treatment List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Treatments</CardTitle>
                <CardDescription>Select a treatment to view details</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {treatments.map((treatment, index) => (
                    <div 
                      key={treatment.id}
                      className={`flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-muted/50 ${treatment.id === selectedId ? "bg-primary/5" : ""}`}
                      onClick={() => setSelectedId(treatment.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Pill className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{treatment.name}</p>
                          <p className="text-sm text-muted-foreground">{treatment.condition}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Treatment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{detail?.name ?? "—"}</CardTitle>
                    <CardDescription className="text-base">{detail?.condition ?? "—"}</CardDescription>
                  </div>
                  <Badge className="bg-accent text-accent-foreground">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <Users className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-semibold text-foreground">{(detail?.total_patients ?? 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Patients</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-semibold text-foreground">{detail?.avg_recovery_weeks ?? "—"}</p>
                    <p className="text-sm text-muted-foreground">Avg. Recovery (weeks)</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <Heart className="h-5 w-5 text-accent mx-auto mb-2" />
                    <p className="text-2xl font-semibold text-foreground">{detail?.positive_rate ?? "—"}%</p>
                    <p className="text-sm text-muted-foreground">Positive Rate</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <FileText className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-semibold text-foreground">{(detail?.analyses ?? 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Analyses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Side Effects Statistics */}
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Side Effects Statistics</CardTitle>
                    <CardDescription>Reported side effects and their frequency</CardDescription>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sideEffectsData.map((effect) => (
                    <div key={effect.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{effect.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={effect.severity === "mild" ? "border-accent text-accent" : "border-chart-4 text-chart-4"}
                          >
                            {effect.severity}
                          </Badge>
                          <span className="text-sm text-muted-foreground w-12 text-right">{effect.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${effect.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sentiment Chart */}
              <Card className="border-border/40 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Sentiment Analysis</CardTitle>
                  <CardDescription>Patient feedback distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sentimentBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {sentimentBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {sentimentBreakdown.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-xs text-muted-foreground">{item.name} ({item.value}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recovery Timeline */}
              <Card className="border-border/40 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Recovery Timeline</CardTitle>
                  <CardDescription>Patient progress over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={recoveryTimeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="week" 
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} 
                          interval={1}
                        />
                        <YAxis 
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          domain={[0, 100]}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                          formatter={(value, name, props) => [`${value}%`, "Recovery"]}
                          labelFormatter={(label, payload) => {
                            const item = recoveryTimeline.find(r => r.week === label)
                            return item ? `${label}: ${item.milestone}` : label
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="percentage" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))" 
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Source Button */}
            <Button variant="outline" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Source Discussions
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
