"use client"

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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar
} from "recharts"

const treatmentData = {
  name: "Metformin",
  condition: "Type 2 Diabetes",
  totalPatients: 12847,
  avgRecoveryWeeks: 6.2,
  positiveRate: 78,
  analyses: 8934
}

const sideEffectsData = [
  { name: "Nausea", percentage: 32, severity: "mild" },
  { name: "Diarrhea", percentage: 28, severity: "mild" },
  { name: "Stomach Pain", percentage: 18, severity: "moderate" },
  { name: "Metallic Taste", percentage: 15, severity: "mild" },
  { name: "Headache", percentage: 12, severity: "mild" },
  { name: "Dizziness", percentage: 8, severity: "moderate" },
]

const sentimentBreakdown = [
  { name: "Very Positive", value: 45, fill: "hsl(var(--accent))" },
  { name: "Positive", value: 33, fill: "hsl(var(--chart-2))" },
  { name: "Neutral", value: 15, fill: "hsl(var(--chart-4))" },
  { name: "Negative", value: 7, fill: "hsl(var(--chart-5))" },
]

const recoveryTimeline = [
  { week: "Week 1", percentage: 15, milestone: "Initial adaptation" },
  { week: "Week 2", percentage: 28, milestone: "Side effects decrease" },
  { week: "Week 3", percentage: 45, milestone: "Blood sugar stabilizing" },
  { week: "Week 4", percentage: 62, milestone: "Consistent improvement" },
  { week: "Week 5", percentage: 78, milestone: "Near target levels" },
  { week: "Week 6", percentage: 89, milestone: "Stable condition" },
  { week: "Week 8", percentage: 95, milestone: "Full effectiveness" },
]

const treatments = [
  { id: 1, name: "Metformin", condition: "Type 2 Diabetes", patients: 12847, rating: 4.2 },
  { id: 2, name: "Lisinopril", condition: "Hypertension", patients: 9823, rating: 4.5 },
  { id: 3, name: "Sertraline", condition: "Depression/Anxiety", patients: 8567, rating: 3.9 },
  { id: 4, name: "Omeprazole", condition: "GERD", patients: 7234, rating: 4.3 },
  { id: 5, name: "Atorvastatin", condition: "High Cholesterol", patients: 6892, rating: 4.1 },
  { id: 6, name: "Levothyroxine", condition: "Hypothyroidism", patients: 5678, rating: 4.4 },
]

const efficacyData = [
  { name: "Effectiveness", value: 85, fill: "hsl(var(--primary))" },
]

export default function TreatmentInsightsPage() {
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
            />
          </div>
          <Select defaultValue="all">
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
          <Select defaultValue="rating">
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
                      className={`flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-muted/50 ${index === 0 ? "bg-primary/5" : ""}`}
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
                    <CardTitle className="text-2xl">{treatmentData.name}</CardTitle>
                    <CardDescription className="text-base">{treatmentData.condition}</CardDescription>
                  </div>
                  <Badge className="bg-accent text-accent-foreground">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <Users className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-semibold text-foreground">{treatmentData.totalPatients.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Patients</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-semibold text-foreground">{treatmentData.avgRecoveryWeeks}</p>
                    <p className="text-sm text-muted-foreground">Avg. Recovery (weeks)</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <Heart className="h-5 w-5 text-accent mx-auto mb-2" />
                    <p className="text-2xl font-semibold text-foreground">{treatmentData.positiveRate}%</p>
                    <p className="text-sm text-muted-foreground">Positive Rate</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <FileText className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-semibold text-foreground">{treatmentData.analyses.toLocaleString()}</p>
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
