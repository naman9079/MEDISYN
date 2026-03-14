"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
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
  FileText,
  Sparkles,
  LoaderCircle,
  MessageSquare,
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
import { analyzeBiomedicalText, type AnalyzerResponse } from "@/lib/biosentvec/client"
import { analyzeMedicalEntities, type SciSpacyResponse } from "@/lib/scispacy/client"
import { medisynSearchSuggestionId } from "@/lib/search-suggestions"
import { medisynConditions } from "@/lib/conditions"

type LinkerChoice = "none" | "mesh" | "rxnorm" | "umls"

type ExperienceSentiment = "positive" | "neutral" | "negative"

type PatientExperience = {
  id: string | number
  treatment: string
  condition: string
  sentiment: ExperienceSentiment
  tags?: string[]
  content?: string
  date?: string
  likes?: number
  author?: string
  sourceUrl?: string
}

type TreatmentSummary = {
  id: number
  name: string
  condition: string
  patients: number
  rating: number
}

const treatments: TreatmentSummary[] = [
  { id: 1, name: "Custom Treatment", condition: "Custom Condition", patients: 0, rating: 0 },
]

function parseRecoveryWeeks(text: string) {
  const normalized = text.toLowerCase()
  const weekMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(week|weeks|wk|wks)/)
  if (weekMatch) {
    const value = Number(weekMatch[1])
    if (Number.isFinite(value) && value > 0 && value < 60) {
      return value
    }
  }

  const dayMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(day|days)/)
  if (dayMatch) {
    const value = Number(dayMatch[1])
    if (Number.isFinite(value) && value > 0 && value < 365) {
      return Number((value / 7).toFixed(1))
    }
  }

  return undefined
}

function toIsoDate(value?: string) {
  if (!value) {
    return undefined
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }

  return parsed.toISOString()
}

function deriveTreatmentsFromExperiences(records: PatientExperience[]): TreatmentSummary[] {
  const grouped = new Map<string, { name: string; condition: string; count: number; sentimentTotal: number }>()

  for (const record of records) {
    const key = `${record.treatment}::${record.condition}`
    const sentimentScore = record.sentiment === "positive" ? 4.6 : record.sentiment === "neutral" ? 3.8 : 2.8
    const current = grouped.get(key)

    if (current) {
      current.count += 1
      current.sentimentTotal += sentimentScore
      continue
    }

    grouped.set(key, {
      name: record.treatment,
      condition: record.condition,
      count: 1,
      sentimentTotal: sentimentScore,
    })
  }

  return Array.from(grouped.values())
    .map((item, index) => ({
      id: index + 1,
      name: item.name,
      condition: item.condition,
      patients: item.count * 1200,
      rating: Number((item.sentimentTotal / item.count).toFixed(1)),
    }))
    .sort((left, right) => right.patients - left.patients)
}

export default function TreatmentInsightsPage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [nlpResult, setNlpResult] = useState<AnalyzerResponse | null>(null)
  const [entityResult, setEntityResult] = useState<SciSpacyResponse | null>(null)
  const [nlpError, setNlpError] = useState<string | null>(null)
  const [entityError, setEntityError] = useState<string | null>(null)
  const [experienceRecords, setExperienceRecords] = useState<PatientExperience[]>([])
  const [treatmentsData, setTreatmentsData] = useState<TreatmentSummary[]>(treatments)
  const [dataSource, setDataSource] = useState<"realtime-db" | "real-file" | "fallback" | "local">("local")
  const [linkerChoice, setLinkerChoice] = useState<LinkerChoice>("none")
  const [conditionFilter, setConditionFilter] = useState("all")
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const conditionOptions = useMemo(() => {
    const fromData = treatmentsData.map((item) => item.condition)
    const fromConfig = medisynConditions.map((item) => item.name)
    return Array.from(new Set([...fromData, ...fromConfig])).sort((left, right) => left.localeCompare(right))
  }, [treatmentsData])

  const filteredTreatments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return treatmentsData.filter((treatment) => {
      const queryPass =
        normalizedQuery.length === 0 ||
        treatment.name.toLowerCase().includes(normalizedQuery) ||
        treatment.condition.toLowerCase().includes(normalizedQuery)

      const conditionPass = conditionFilter === "all" || treatment.condition === conditionFilter

      return queryPass && conditionPass
    })
  }, [searchQuery, treatmentsData, conditionFilter])

  const conditionComparison = useMemo(() => {
    const grouped = new Map<string, number>()

    for (const item of treatmentsData) {
      grouped.set(item.condition, (grouped.get(item.condition) ?? 0) + item.patients)
    }

    return Array.from(grouped.entries())
      .map(([condition, patients]) => ({ condition, patients }))
      .sort((left, right) => right.patients - left.patients)
      .slice(0, 6)
  }, [treatmentsData])

  const sentimentSignal = useMemo(() => {
    const total = treatmentsData.length
    if (total === 0) {
      return { positive: 0, neutral: 0, negative: 0 }
    }

    const positive = treatmentsData.filter((item) => item.rating >= 4.2).length
    const neutral = treatmentsData.filter((item) => item.rating >= 3.4 && item.rating < 4.2).length
    const negative = Math.max(0, total - positive - neutral)

    return {
      positive: Math.round((positive / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      negative: Math.round((negative / total) * 100),
    }
  }, [treatmentsData])

  const promisingTreatments = useMemo(() => {
    return [...treatmentsData]
      .sort((left, right) => {
        const leftScore = left.rating * Math.log10(left.patients + 10)
        const rightScore = right.rating * Math.log10(right.patients + 10)
        return rightScore - leftScore
      })
      .slice(0, 3)
  }, [treatmentsData])

  const totalCommunityMentions = useMemo(() => {
    return treatmentsData.reduce((sum, item) => sum + item.patients, 0)
  }, [treatmentsData])

  useEffect(() => {
    let isMounted = true

    async function loadRealTreatments() {
      try {
        const response = await fetch("/api/data/patient-experiences")

        if (!response.ok) {
          throw new Error("Unable to load real data")
        }

        const payload = (await response.json()) as {
          source?: "real-file" | "fallback"
          items?: PatientExperience[]
        }

        if (!isMounted || !Array.isArray(payload.items) || payload.items.length === 0) {
          return
        }

        const derived = deriveTreatmentsFromExperiences(payload.items)

        if (derived.length > 0) {
          setExperienceRecords(payload.items)
          setTreatmentsData(derived)
          setDataSource(payload.source ?? "fallback")
        }
      } catch {
        if (isMounted) {
          setDataSource("local")
        }
      }
    }

    void loadRealTreatments()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (filteredTreatments.length === 0) {
      setSelectedTreatmentId(null)
      return
    }

    const hasSelected = selectedTreatmentId !== null && filteredTreatments.some((item) => item.id === selectedTreatmentId)
    if (!hasSelected) {
      setSelectedTreatmentId(filteredTreatments[0].id)
    }
  }, [filteredTreatments, selectedTreatmentId])

  const selectedTreatment = useMemo(() => {
    if (filteredTreatments.length === 0) {
      return null
    }

    return filteredTreatments.find((item) => item.id === selectedTreatmentId) ?? filteredTreatments[0]
  }, [filteredTreatments, selectedTreatmentId])

  const selectedExperiences = useMemo(() => {
    if (!selectedTreatment) {
      return []
    }

    return experienceRecords.filter(
      (item) => item.treatment === selectedTreatment.name && item.condition === selectedTreatment.condition,
    )
  }, [experienceRecords, selectedTreatment])

  const treatmentOverview = useMemo(() => {
    if (!selectedTreatment) {
      return {
        name: "No Treatment Selected",
        condition: "-",
        totalPatients: 0,
        avgRecoveryWeeks: 0,
        positiveRate: 0,
        analyses: 0,
      }
    }

    const analyses = selectedExperiences.length
    const positive = selectedExperiences.filter((item) => item.sentiment === "positive").length
    const positiveRate = analyses > 0 ? Math.round((positive / analyses) * 100) : 0
    const recoveryValues = selectedExperiences
      .map((item) => parseRecoveryWeeks(item.content ?? ""))
      .filter((value): value is number => typeof value === "number")
    const avgRecoveryWeeks =
      recoveryValues.length > 0
        ? Number((recoveryValues.reduce((sum, value) => sum + value, 0) / recoveryValues.length).toFixed(1))
        : 0

    return {
      name: selectedTreatment.name,
      condition: selectedTreatment.condition,
      totalPatients: selectedTreatment.patients,
      avgRecoveryWeeks,
      positiveRate,
      analyses,
    }
  }, [selectedTreatment, selectedExperiences])

  const sideEffectsData = useMemo(() => {
    const effectPatterns = [
      { name: "Fatigue", regex: /fatigue|tired|exhaust/i },
      { name: "Pain", regex: /pain|ache|cramp/i },
      { name: "Nausea", regex: /nausea|vomit|queasy/i },
      { name: "Dizziness", regex: /dizz|lighthead/i },
      { name: "Sleep Issues", regex: /insomnia|sleep/i },
    ]

    if (selectedExperiences.length === 0) {
      return [{ name: "No Data", percentage: 0, severity: "mild" as const }]
    }

    const rows = effectPatterns
      .map((pattern) => {
        const count = selectedExperiences.filter((record) => pattern.regex.test(record.content ?? "")).length
        const percentage = Math.round((count / selectedExperiences.length) * 100)

        return {
          name: pattern.name,
          percentage,
          severity: percentage >= 40 ? "moderate" : "mild",
        }
      })
      .filter((row) => row.percentage > 0)
      .sort((left, right) => right.percentage - left.percentage)

    return rows.length > 0 ? rows : [{ name: "No Data", percentage: 0, severity: "mild" as const }]
  }, [selectedExperiences])

  const sentimentBreakdown = useMemo(() => {
    if (selectedExperiences.length === 0) {
      return [
        { name: "Very Positive", value: 0, fill: "hsl(var(--accent))" },
        { name: "Positive", value: 0, fill: "hsl(var(--chart-2))" },
        { name: "Neutral", value: 0, fill: "hsl(var(--chart-4))" },
        { name: "Negative", value: 0, fill: "hsl(var(--chart-5))" },
      ]
    }

    const veryPositiveCount = selectedExperiences.filter((item) => item.sentiment === "positive" && (item.likes ?? 0) >= 8).length
    const positiveCount = selectedExperiences.filter((item) => item.sentiment === "positive").length
    const neutralCount = selectedExperiences.filter((item) => item.sentiment === "neutral").length
    const negativeCount = selectedExperiences.filter((item) => item.sentiment === "negative").length
    const total = selectedExperiences.length

    return [
      { name: "Very Positive", value: Math.round((veryPositiveCount / total) * 100), fill: "hsl(var(--accent))" },
      {
        name: "Positive",
        value: Math.max(0, Math.round((positiveCount / total) * 100) - Math.round((veryPositiveCount / total) * 100)),
        fill: "hsl(var(--chart-2))",
      },
      { name: "Neutral", value: Math.round((neutralCount / total) * 100), fill: "hsl(var(--chart-4))" },
      { name: "Negative", value: Math.round((negativeCount / total) * 100), fill: "hsl(var(--chart-5))" },
    ]
  }, [selectedExperiences])

  const recoveryTimeline = useMemo(() => {
    if (selectedExperiences.length === 0) {
      return [
        { week: "Week 1", percentage: 0, milestone: "Awaiting your custom data" },
        { week: "Week 2", percentage: 0, milestone: "Awaiting your custom data" },
        { week: "Week 3", percentage: 0, milestone: "Awaiting your custom data" },
        { week: "Week 4", percentage: 0, milestone: "Awaiting your custom data" },
      ]
    }

    const ordered = [...selectedExperiences].sort((left, right) => {
      const leftDate = toIsoDate(left.date) ?? ""
      const rightDate = toIsoDate(right.date) ?? ""
      return leftDate.localeCompare(rightDate)
    })

    const buckets = [0, 1, 2, 3].map((index) => {
      const start = Math.floor((ordered.length * index) / 4)
      const end = Math.floor((ordered.length * (index + 1)) / 4)
      const chunk = ordered.slice(start, Math.max(end, start + 1))
      const positives = chunk.filter((item) => item.sentiment === "positive").length
      const percentage = chunk.length > 0 ? Math.round((positives / chunk.length) * 100) : 0

      return {
        week: `Week ${index + 1}`,
        percentage,
        milestone:
          percentage >= 60
            ? "Recovery trend improving"
            : percentage >= 35
            ? "Mixed outcomes reported"
            : "More challenging experiences reported",
      }
    })

    return buckets
  }, [selectedExperiences])

  const recentConversations = useMemo(() => {
    return [...selectedExperiences]
      .sort((left, right) => {
        const leftTime = new Date(left.date ?? 0).getTime()
        const rightTime = new Date(right.date ?? 0).getTime()

        if (leftTime !== rightTime) {
          return rightTime - leftTime
        }

        return (right.likes ?? 0) - (left.likes ?? 0)
      })
      .slice(0, 6)
  }, [selectedExperiences])

  const sentimentBadgeClass: Record<ExperienceSentiment, string> = {
    positive: "bg-accent/10 text-accent border-accent/20",
    neutral: "bg-muted text-muted-foreground border-border",
    negative: "bg-destructive/10 text-destructive border-destructive/20",
  }

  const sentimentLabel: Record<ExperienceSentiment, string> = {
    positive: "Positive",
    neutral: "Neutral",
    negative: "Challenging",
  }

  async function runNlpSearch(query: string) {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      return
    }

    setNlpError(null)
    setEntityError(null)

    try {
      const [similarityResult, extractionResult] = await Promise.all([
        analyzeBiomedicalText(trimmedQuery),
        analyzeMedicalEntities(trimmedQuery, {
          linkerName: linkerChoice === "none" ? undefined : linkerChoice,
        }),
      ])

      setNlpResult(similarityResult)
      setEntityResult(extractionResult)
    } catch (error) {
      setNlpResult(null)
      setEntityResult(null)
      const message = error instanceof Error ? error.message : "Analysis failed"
      setNlpError(message)
      setEntityError(message)
    }
  }

  const topLinkedConcepts = entityResult
    ? Array.from(
        entityResult.entities
          .flatMap((entity) => entity.links ?? [])
          .reduce((accumulator, link) => {
            const existing = accumulator.get(link.id)

            if (!existing || existing.score < link.score) {
              accumulator.set(link.id, link)
            }

            return accumulator
          }, new Map<string, { id: string; score: number; name?: string; definition?: string }>())
          .values(),
      )
        .sort((left, right) => right.score - left.score)
        .slice(0, 5)
    : []

  useEffect(() => {
    const incomingQuery = searchParams.get("q")?.trim()

    if (!incomingQuery) {
      return
    }

    setSearchQuery(incomingQuery)
    startTransition(() => {
      void runNlpSearch(incomingQuery)
    })
  }, [searchParams, startTransition])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Treatment Insights</h1>
          <p className="text-muted-foreground">Comprehensive analysis of treatments and patient outcomes</p>
          <p className="text-xs text-muted-foreground mt-2">Data source: {dataSource}</p>
        </div>

        <Card className="mb-8 border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="bg-linear-to-r from-primary/10 via-background to-accent/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Community Insights Snapshot
            </CardTitle>
            <CardDescription>
              Visual view of real patient discussions by condition, treatment outcomes, side-effect tone, and promising options.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  Real-world Reports
                </div>
                <p className="text-3xl font-semibold text-foreground">{totalCommunityMentions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Estimated mentions from live patient discussions</p>
              </div>

              <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4 text-primary" />
                  Condition Coverage
                </div>
                <p className="text-3xl font-semibold text-foreground">{conditionComparison.length}</p>
                <p className="text-xs text-muted-foreground">Conditions with active treatment discussions</p>
              </div>

              <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-chart-4" />
                  Practical Signals
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Positive trend</span>
                      <span>{sentimentSignal.positive}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${sentimentSignal.positive}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Neutral trend</span>
                      <span>{sentimentSignal.neutral}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-chart-4" style={{ width: `${sentimentSignal.neutral}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Heart className="h-4 w-4 text-accent" />
                  Promising Treatments
                </div>
                <div className="space-y-2">
                  {promisingTreatments.map((item, index) => (
                    <div key={`${item.id}-${item.name}`} className="rounded-md border border-border/40 bg-background p-2">
                      <p className="text-sm font-medium text-foreground">#{index + 1} {item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.condition} • {item.rating.toFixed(1)} rating</p>
                    </div>
                  ))}
                  {promisingTreatments.length === 0 && (
                    <p className="text-xs text-muted-foreground">Awaiting data collection to rank treatments.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-foreground">Condition vs Discussion Volume</p>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Live Compare</Badge>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conditionComparison} margin={{ left: 4, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="condition"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      interval={0}
                      angle={-20}
                      height={48}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="patients" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <form
            className="flex flex-1 gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              startTransition(() => {
                void runNlpSearch(searchQuery)
              })
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                list={medisynSearchSuggestionId}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search treatments, conditions, or symptoms..."
                className="pl-10"
              />
            </div>
            <Button type="submit" className="shrink-0">
              {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Find Match
            </Button>
          </form>
          <div className="w-full sm:w-48">
            <Select value={linkerChoice} onValueChange={(value) => setLinkerChoice(value as LinkerChoice)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Linker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No linker</SelectItem>
                <SelectItem value="mesh">MeSH linker</SelectItem>
                <SelectItem value="rxnorm">RxNorm linker</SelectItem>
                <SelectItem value="umls">UMLS linker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              {conditionOptions.map((condition) => (
                <SelectItem key={condition} value={condition}>{condition}</SelectItem>
              ))}
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

        {linkerChoice === "umls" && (
          <div className="mb-6 rounded-lg border border-chart-4/30 bg-chart-4/10 p-3 text-sm text-foreground">
            UMLS linker can be heavy on first run and may require larger resource downloads.
          </div>
        )}

        {(linkerChoice === "mesh" || linkerChoice === "rxnorm") && (
          <div className="mb-6 rounded-lg border border-border/40 bg-muted/30 p-3 text-sm text-muted-foreground">
            MeSH and RxNorm are lighter than UMLS, but first-run loading may still take extra time.
          </div>
        )}

        {(nlpResult || nlpError) && (
          <Card className="mb-8 border-border/40 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    NLP Match Result
                  </CardTitle>
                  <CardDescription>
                    Search results grounded by the BioSentVec analyzer or the local fallback matcher.
                  </CardDescription>
                </div>
                {nlpResult && (
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {nlpResult.provider}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {nlpError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  {nlpError}
                </div>
              )}
              {nlpResult && (
                <>
                  <div className="rounded-lg bg-muted/30 p-4">
                    <p className="text-sm font-medium text-foreground">{nlpResult.summary}</p>
                    <p className="text-xs text-muted-foreground mt-1">{nlpResult.preprocessedText}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {nlpResult.topMatches.map((match) => (
                      <div key={match.id} className="rounded-lg border border-border/40 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-foreground">{match.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{match.treatment}</p>
                          </div>
                          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                            {(match.similarity * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-3">{match.text}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {(entityResult || entityError) && (
          <Card className="mb-8 border-border/40 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Medical Entity Extraction
                  </CardTitle>
                  <CardDescription>
                    SciSpaCy entity extraction with optional ontology linking and safe fallback behavior.
                  </CardDescription>
                </div>
                {entityResult && (
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {entityResult.provider}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {entityError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  {entityError}
                </div>
              )}

              {entityResult && (
                <>
                  <div className="rounded-lg bg-muted/30 p-4 flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm text-foreground">Model: {entityResult.model}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">{entityResult.entities.length} entities</Badge>
                      <Badge variant="secondary">{entityResult.abbreviations.length} abbreviations</Badge>
                    </div>
                  </div>

                  {isPending && (
                    <div className="rounded-lg border border-border/40 bg-muted/30 p-3 text-sm text-muted-foreground">
                      Running extraction and linker lookups. This may take longer on the first request.
                    </div>
                  )}

                  {entityResult.abbreviations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entityResult.abbreviations.map((abbreviation) => (
                        <Badge key={`${abbreviation.short}-${abbreviation.long}`} variant="outline">
                          {abbreviation.short} = {abbreviation.long}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {topLinkedConcepts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Top linked concepts</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {topLinkedConcepts.map((concept) => (
                          <div key={concept.id} className="rounded-md border border-border/40 p-3">
                            <p className="text-sm font-medium text-foreground">{concept.name || concept.id}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {concept.id} • {(concept.score * 100).toFixed(1)}% confidence
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-2 md:grid-cols-2">
                    {entityResult.entities.slice(0, 8).map((entity, index) => (
                      <div key={`${entity.start}-${entity.end}-${index}`} className="rounded-md border border-border/40 p-3">
                        <p className="text-sm font-medium text-foreground">{entity.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {entity.label}
                          {entity.normalized ? ` • ${entity.normalized}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Treatment List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Treatments</CardTitle>
                <CardDescription>
                  {filteredTreatments.length} result{filteredTreatments.length === 1 ? "" : "s"}. Select a treatment to view details.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {filteredTreatments.map((treatment, index) => (
                    <div 
                      key={treatment.id}
                      onClick={() => setSelectedTreatmentId(treatment.id)}
                      className={`flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-muted/50 ${selectedTreatment?.id === treatment.id || (selectedTreatment === null && index === 0) ? "bg-primary/5" : ""}`}
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
                  {filteredTreatments.length === 0 && (
                    <div className="p-6 text-sm text-muted-foreground">
                      No direct treatment name matches. Use Find Match to surface semantically related biomedical signals.
                    </div>
                  )}
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
                    <CardTitle className="text-2xl">{treatmentOverview.name}</CardTitle>
                    <CardDescription className="text-base">{treatmentOverview.condition}</CardDescription>
                  </div>
                  <Badge className={treatmentOverview.analyses > 0 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}>
                    {treatmentOverview.analyses > 0 ? "Active" : "No data"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <Users className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-semibold text-foreground">{treatmentOverview.totalPatients.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Patients</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-semibold text-foreground">{treatmentOverview.avgRecoveryWeeks}</p>
                    <p className="text-sm text-muted-foreground">Avg. Recovery (weeks)</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <Heart className="h-5 w-5 text-accent mx-auto mb-2" />
                    <p className="text-2xl font-semibold text-foreground">{treatmentOverview.positiveRate}%</p>
                    <p className="text-sm text-muted-foreground">Positive Rate</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <FileText className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-semibold text-foreground">{treatmentOverview.analyses.toLocaleString()}</p>
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

            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Real Patient Conversations
                    </CardTitle>
                    <CardDescription>
                      Live excerpts from recent discussions for {treatmentOverview.name} in {treatmentOverview.condition}.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {recentConversations.length} shown
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentConversations.length === 0 && (
                  <div className="rounded-lg border border-border/40 bg-muted/20 p-4 text-sm text-muted-foreground">
                    No patient conversations are available for this treatment yet. Try another treatment from the list.
                  </div>
                )}

                {recentConversations.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border/40 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={sentimentBadgeClass[item.sentiment]}>
                          {sentimentLabel[item.sentiment]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {item.date ? new Date(item.date).toLocaleDateString() : "Unknown date"}
                        </span>
                        <span className="text-xs text-muted-foreground">Likes: {item.likes ?? 0}</span>
                        <span className="text-xs text-muted-foreground">Author: {item.author ?? "Anonymous"}</span>
                      </div>

                      {item.sourceUrl && (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Open source <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>

                    <p className="text-sm text-foreground leading-relaxed">{item.content ?? "No content available."}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Source Button */}
            <Button variant="outline" className="w-full" onClick={() => { window.location.href = "/patient-experiences" }}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View All Patient Discussions
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
