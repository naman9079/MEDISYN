"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Info,
  FlaskConical,
  LoaderCircle,
  Microscope,
  Network,
  PlayCircle
} from "lucide-react"
import { analyzeBiomedicalText, type AnalyzerResponse } from "@/lib/biosentvec/client"
import { analyzeMedicalEntities, type SciSpacyResponse } from "@/lib/scispacy/client"
import { analyzeSemanticMatches, type SemanticSearchResponse } from "@/lib/sentence-transformers/client"
import { diseaseKnowledgeBase } from "@/lib/disease-knowledge"
import { medisynSearchSuggestionId } from "@/lib/search-suggestions"

type LinkerChoice = "none" | "mesh" | "rxnorm" | "umls"
type AnalysisMode = "fast" | "full"

type InsightType = "all" | "discovery" | "alert" | "trend"

type ExperienceSentiment = "positive" | "neutral" | "negative"

type PatientExperience = {
  treatment: string
  condition: string
  sentiment: ExperienceSentiment
  tags: string[]
  credibilityScore: number
  date: string
  content?: string
}

type AIInsight = {
  id: number
  type: InsightType
  title: string
  summary: string
  details: string
  treatment: string
  condition: string
  confidence: number
  impact: "high" | "medium" | "low"
  sampleStatus?: "insufficient" | "limited" | "robust"
  date: string
  dataPoints: number
  actionable: boolean
  careGuidance?: string[]
  mentionedTerms?: string[]
}

const aiInsights: AIInsight[] = []

const insightStats = [
  { label: "Total Insights", value: "1,284", icon: Sparkles, change: "+24 this week" },
  { label: "Critical Alerts", value: "12", icon: AlertTriangle, change: "3 require action" },
  { label: "Discoveries", value: "847", icon: Lightbulb, change: "+156 this month" },
  { label: "Data Points", value: "2.4M", icon: Activity, change: "Analyzed today" },
]

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

const sampleStatusStyles = {
  insufficient: "bg-destructive/10 text-destructive border-destructive/20",
  limited: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  robust: "bg-accent/10 text-accent border-accent/20",
}

const sampleStatusLabels = {
  insufficient: "Insufficient Sample",
  limited: "Limited Sample",
  robust: "Robust Sample",
}

const semanticCategoryStyles: Record<"therapy" | "safety" | "adherence" | "outcome", { card: string; badge: string }> = {
  therapy: {
    card: "border-l-4 border-l-primary/50",
    badge: "bg-primary/10 text-primary border-primary/20",
  },
  safety: {
    card: "border-l-4 border-l-destructive/50",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
  },
  adherence: {
    card: "border-l-4 border-l-chart-4/60",
    badge: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  },
  outcome: {
    card: "border-l-4 border-l-accent/60",
    badge: "bg-accent/10 text-accent border-accent/20",
  },
}

function deriveInsightsFromExperiences(records: PatientExperience[]): AIInsight[] {
  const grouped = new Map<
    string,
    {
      treatment: string
      condition: string
      total: number
      positive: number
      sideEffects: number
      credibilityTotal: number
      latestDate: string
      terms: Set<string>
    }
  >()

  const termHints = [
    "fatigue",
    "nausea",
    "dizziness",
    "insomnia",
    "pain",
    "dose",
    "recovery",
    "adherence",
    "flare",
    "tolerance",
    "mobility",
    "sleep",
    "appetite",
    "quality of life",
  ]

  function getTerms(record: PatientExperience) {
    const terms = new Set<string>()
    terms.add(record.treatment.toLowerCase())
    terms.add(record.condition.toLowerCase())
    for (const tag of record.tags) {
      terms.add(tag.toLowerCase())
    }

    const content = (record.content ?? "").toLowerCase()
    for (const hint of termHints) {
      if (content.includes(hint)) {
        terms.add(hint)
      }
    }

    return terms
  }

  for (const record of records) {
    const key = `${record.treatment}::${record.condition}`
    const current = grouped.get(key)
    const hasSideEffectTag = record.tags.some((tag) => tag.toLowerCase() === "side effects")

    if (current) {
      current.total += 1
      current.positive += record.sentiment === "positive" ? 1 : 0
      current.sideEffects += hasSideEffectTag ? 1 : 0
      current.credibilityTotal += record.credibilityScore
      for (const term of getTerms(record)) {
        current.terms.add(term)
      }
      if (record.date > current.latestDate) {
        current.latestDate = record.date
      }
      continue
    }

    grouped.set(key, {
      treatment: record.treatment,
      condition: record.condition,
      total: 1,
      positive: record.sentiment === "positive" ? 1 : 0,
      sideEffects: hasSideEffectTag ? 1 : 0,
      credibilityTotal: record.credibilityScore,
      latestDate: record.date,
      terms: getTerms(record),
    })
  }

  const treatmentInsights = Array.from(grouped.values())
    .map((item, index): AIInsight => {
      const positiveRate = item.positive / item.total
      const sideEffectRate = item.sideEffects / item.total
      const confidence = Math.round(item.credibilityTotal / item.total)
      const impact: "high" | "medium" | "low" = item.total >= 5 ? "high" : item.total >= 3 ? "medium" : "low"
      const sampleStatus: "insufficient" | "limited" | "robust" = item.total < 2 ? "insufficient" : item.total < 5 ? "limited" : "robust"

      const careGuidance = [
        `Review ${item.treatment} response with a clinician before changes.`,
        `Track symptom trend and adherence for ${item.condition}.`,
      ]

      if (sideEffectRate >= 0.3) {
        careGuidance.push("Prioritize side-effect screening and medication tolerance review.")
      }

      if (positiveRate >= 0.6) {
        careGuidance.push("Continue effective regimen while monitoring stability.")
      } else {
        careGuidance.push("Consider subgroup analysis (dose timing, co-medication, co-morbidities).")
      }

      const mentionedTerms = Array.from(item.terms).slice(0, 8)

      if (sampleStatus === "insufficient") {
        return {
          id: index + 1,
          type: "trend",
          title: `${item.treatment} early signal for ${item.condition}`,
          summary: `Only ${item.total} record is available for ${item.treatment}. More data is needed before strong conclusions.`,
          details: `This is a preliminary signal from limited data for ${item.condition}.`,
          treatment: item.treatment,
          condition: item.condition,
          confidence,
          impact: "low",
          sampleStatus,
          date: item.latestDate,
          dataPoints: item.total,
          actionable: true,
          careGuidance,
          mentionedTerms,
        }
      }

      if (sideEffectRate >= 0.4) {
        return {
          id: index + 1,
          type: "alert",
          title: `${item.treatment} side-effect signal` ,
          summary: `${Math.round(sideEffectRate * 100)}% of recent experiences mention side effects for ${item.treatment}.`,
          details: `Based on ${item.total} real patient posts for ${item.condition}. Consider closer review for tolerability and dose strategy.`,
          treatment: item.treatment,
          condition: item.condition,
          confidence,
          impact,
          sampleStatus,
          date: item.latestDate,
          dataPoints: item.total,
          actionable: true,
          careGuidance,
          mentionedTerms,
        }
      }

      if (positiveRate >= 0.6) {
        return {
          id: index + 1,
          type: "discovery",
          title: `${item.treatment} showing positive outcomes`,
          summary: `${Math.round(positiveRate * 100)}% of recent experiences are positive for ${item.treatment}.`,
          details: `This trend is derived from ${item.total} real records for ${item.condition} with average credibility ${confidence}%.`,
          treatment: item.treatment,
          condition: item.condition,
          confidence,
          impact,
          sampleStatus,
          date: item.latestDate,
          dataPoints: item.total,
          actionable: false,
          careGuidance,
          mentionedTerms,
        }
      }

      return {
        id: index + 1,
        type: "trend",
        title: `${item.treatment} mixed patient trend`,
        summary: `Recent feedback for ${item.treatment} is mixed, suggesting variable patient response.`,
        details: `From ${item.total} real records in ${item.condition}. Monitor sub-groups by symptoms and co-medication patterns.`,
        treatment: item.treatment,
        condition: item.condition,
        confidence,
        impact,
        sampleStatus,
        date: item.latestDate,
        dataPoints: item.total,
        actionable: true,
        careGuidance,
        mentionedTerms,
      }
    })

  const byCondition = new Map<string, { total: number; positive: number; sideEffects: number; confidenceTotal: number; latestDate: string }>()

  for (const record of records) {
    const current = byCondition.get(record.condition)
    const hasSideEffects = record.tags.some((tag) => tag.toLowerCase() === "side effects")

    if (current) {
      current.total += 1
      current.positive += record.sentiment === "positive" ? 1 : 0
      current.sideEffects += hasSideEffects ? 1 : 0
      current.confidenceTotal += record.credibilityScore
      if (record.date > current.latestDate) {
        current.latestDate = record.date
      }
      continue
    }

    byCondition.set(record.condition, {
      total: 1,
      positive: record.sentiment === "positive" ? 1 : 0,
      sideEffects: hasSideEffects ? 1 : 0,
      confidenceTotal: record.credibilityScore,
      latestDate: record.date,
    })
  }

  const conditionInsights = Array.from(byCondition.entries()).map(([condition, stat], index): AIInsight => {
    const positiveRate = stat.positive / stat.total
    const sideEffectRate = stat.sideEffects / stat.total
    const confidence = Math.round(stat.confidenceTotal / stat.total)
    const sampleStatus: "insufficient" | "limited" | "robust" = stat.total < 2 ? "insufficient" : stat.total < 5 ? "limited" : "robust"
    const insightType: InsightType = sideEffectRate >= 0.35 ? "alert" : positiveRate >= 0.6 ? "discovery" : "trend"

    return {
      id: treatmentInsights.length + index + 1,
      type: insightType,
      title: `${condition} condition-wide trend`,
      summary: `${Math.round(positiveRate * 100)}% positive sentiment across ${stat.total} records for ${condition}.`,
      details: `Condition-level synthesis across multiple treatments for ${condition}.`,
      treatment: "All treatments",
      condition,
      confidence,
      impact: stat.total >= 5 ? "high" : stat.total >= 3 ? "medium" : "low",
      sampleStatus,
      date: stat.latestDate,
      dataPoints: stat.total,
      actionable: true,
      careGuidance: [
        `Compare treatment-level patterns within ${condition}.`,
        "Balance adverse effects with observed benefit trend.",
        "Use this summary with clinician-guided decisions.",
      ],
      mentionedTerms: [condition.toLowerCase(), "condition trend", "sentiment", "side effects"],
    }
  })

  return [...treatmentInsights, ...conditionInsights]
    .sort((left, right) => right.dataPoints - left.dataPoints)
}

export default function AIInsightsPage() {
  const resultsAnchorRef = useRef<HTMLDivElement | null>(null)
  const searchParams = useSearchParams()
  const routeQuery = searchParams.get("q")?.trim() ?? ""
  const [activeFilter, setActiveFilter] = useState<InsightType>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [analysisInput, setAnalysisInput] = useState("Patient reports symptom changes after starting a new treatment plan.")
  const [analysisResult, setAnalysisResult] = useState<AnalyzerResponse | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [semanticResult, setSemanticResult] = useState<SemanticSearchResponse | null>(null)
  const [semanticError, setSemanticError] = useState<string | null>(null)
  const [entityResult, setEntityResult] = useState<SciSpacyResponse | null>(null)
  const [entityError, setEntityError] = useState<string | null>(null)
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null)
  const [linkerChoice, setLinkerChoice] = useState<LinkerChoice>("none")
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("fast")
  const [diseaseViewMode, setDiseaseViewMode] = useState<"all-insights" | "search-ones">("all-insights")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSemanticLoading, setIsSemanticLoading] = useState(false)
  const [isEntityLoading, setIsEntityLoading] = useState(false)
  const [insightsData, setInsightsData] = useState<AIInsight[]>(aiInsights)
  const [dataSource, setDataSource] = useState<"real-file" | "fallback" | "local">("local")

  function normalizeForSearch(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
  }

  function matchesDiseaseSearch(disease: (typeof diseaseKnowledgeBase)[number], query: string) {
    const normalizedQuery = normalizeForSearch(query)
    if (!normalizedQuery) {
      return false
    }

    const normalizedName = normalizeForSearch(disease.name)
    if (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)) {
      return true
    }

    return disease.aliases.some((alias) => {
      const normalizedAlias = normalizeForSearch(alias)
      return normalizedAlias.includes(normalizedQuery) || normalizedQuery.includes(normalizedAlias)
    })
  }

  function diseaseHasVideo(disease: (typeof diseaseKnowledgeBase)[number]) {
    return Boolean(disease.videoUrl) || (Array.isArray(disease.videoUrls) && disease.videoUrls.length > 0)
  }

  const visibleDiseaseBlocks = diseaseKnowledgeBase
    .filter((disease) => {
      if (diseaseViewMode === "all-insights") {
        return true
      }

      const typedSearch = searchQuery.trim()

      if (typedSearch.length > 0) {
        return matchesDiseaseSearch(disease, typedSearch)
      }

      const routeSearch = routeQuery.trim()
      if (routeSearch.length > 0) {
        return matchesDiseaseSearch(disease, routeSearch)
      }

      return false
    })
    .sort((left, right) => {
      const rightVideoScore = Number(diseaseHasVideo(right))
      const leftVideoScore = Number(diseaseHasVideo(left))

      if (rightVideoScore !== leftVideoScore) {
        return rightVideoScore - leftVideoScore
      }

      return left.name.localeCompare(right.name)
    })

  const filteredInsights = insightsData.filter((insight) => {
    const matchesFilter = activeFilter === "all" || insight.type === activeFilter
    const matchesSearch = searchQuery === "" || 
      insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.treatment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.condition.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  function isDirectVideoFile(url: string) {
    return /\.(mp4|webm|ogg)$/i.test(url)
  }

  useEffect(() => {
    let isMounted = true

    async function loadRealInsights() {
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

        const derived = deriveInsightsFromExperiences(payload.items)

        if (derived.length > 0) {
          setInsightsData(derived)
          setDataSource(payload.source ?? "fallback")
        }
      } catch {
        if (isMounted) {
          setDataSource("local")
        }
      }
    }

    void loadRealInsights()

    return () => {
      isMounted = false
    }
  }, [])

  async function runAnalysis(text = analysisInput) {
    const trimmedText = text.trim()

    if (!trimmedText) {
      return
    }

    setAnalysisError(null)
    setSemanticError(null)
    setEntityError(null)
    setAnalysisNotice(null)
    setIsAnalyzing(true)
    setSemanticResult(null)
    setEntityResult(null)
    setSemanticError(null)
    setEntityError(null)

    try {
      const similarityResult = await analyzeBiomedicalText(trimmedText)
      setAnalysisResult(similarityResult)
    } catch (error) {
      setAnalysisResult(null)
      const message = error instanceof Error ? error.message : "BioSentVec analysis failed"
      setAnalysisError(message)
      setIsAnalyzing(false)
      return
    }

    if (analysisMode === "fast") {
      setAnalysisNotice("Fast mode: semantic search and entity extraction are skipped for faster response.")
      setIsSemanticLoading(false)
      setIsEntityLoading(false)
      setIsAnalyzing(false)
      return
    }

    setIsSemanticLoading(true)
    setIsEntityLoading(true)

    const failures: string[] = []

    const semanticPromise = analyzeSemanticMatches(trimmedText)
      .then((result) => {
        setSemanticResult(result)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Semantic search failed"
        setSemanticError(message)
        failures.push("Semantic search")
      })
      .finally(() => {
        setIsSemanticLoading(false)
      })

    const entityPromise = analyzeMedicalEntities(trimmedText, {
      linkerName: linkerChoice === "none" ? undefined : linkerChoice,
    })
      .then((result) => {
        setEntityResult(result)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Entity extraction failed"
        setEntityError(message)
        failures.push("SciSpaCy")
      })
      .finally(() => {
        setIsEntityLoading(false)
      })

    await Promise.allSettled([semanticPromise, entityPromise])

    if (failures.length > 0) {
      setAnalysisNotice(`Core analysis loaded. Some modules failed: ${failures.join(", ")}.`)
    }

    setIsAnalyzing(false)
  }

  const linkedConceptSummary = entityResult?.entities
    .flatMap((entity) => entity.links ?? [])
    .reduce((accumulator, link) => {
      const existing = accumulator.get(link.id)

      if (!existing || existing.score < link.score) {
        accumulator.set(link.id, link)
      }

      return accumulator
    }, new Map<string, { id: string; score: number; name?: string; definition?: string }>())

  const topLinkedConcepts = linkedConceptSummary
    ? Array.from(linkedConceptSummary.values())
        .sort((left, right) => right.score - left.score)
        .slice(0, 5)
    : []

  function handleAnalyze() {
    void runAnalysis()
  }

  useEffect(() => {
    if (!routeQuery) {
      return
    }

    setAnalysisInput(routeQuery)
    void runAnalysis(routeQuery)
  }, [routeQuery])

  useEffect(() => {
    if (isAnalyzing) {
      return
    }

    const hasAnyOutput =
      Boolean(analysisResult) ||
      Boolean(semanticResult) ||
      Boolean(entityResult) ||
      Boolean(analysisError) ||
      Boolean(semanticError) ||
      Boolean(entityError) ||
      Boolean(analysisNotice)

    if (!hasAnyOutput) {
      return
    }

    resultsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [
    isAnalyzing,
    analysisResult,
    semanticResult,
    entityResult,
    analysisError,
    semanticError,
    entityError,
    analysisNotice,
  ])

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
              <p className="text-xs text-muted-foreground mt-1">Data source: {dataSource}</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                list={medisynSearchSuggestionId}
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

          {/* Disease View Mode */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={diseaseViewMode === "all-insights" ? "default" : "outline"}
              size="sm"
              onClick={() => setDiseaseViewMode("all-insights")}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              All Insights
            </Button>
            <Button 
              variant={diseaseViewMode === "search-ones" ? "default" : "outline"}
              size="sm"
              onClick={() => setDiseaseViewMode("search-ones")}
            >
              <Search className="h-4 w-4 mr-1" />
              Search Ones
            </Button>
          </div>
        </div>

        <div className="space-y-8 mb-8">
          {visibleDiseaseBlocks.map((disease) => {
            const videos = disease.videoUrls ?? (disease.videoUrl ? [disease.videoUrl] : [])

            return (
              <section key={disease.id} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Microscope className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">{disease.name}</h2>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <Card className="border-border/40 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        Disease Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-foreground leading-relaxed">{disease.shortDescription}</p>
                      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                        <p className="font-medium">Emergency Warning</p>
                        <p className="mt-1">{disease.emergencyWarning}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/40 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Precautions
                      </CardTitle>
                      <CardDescription>Video + key safety points</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {videos.length > 0 ? (
                        <div className="space-y-3">
                          {videos.map((videoUrl, index) => (
                            <div key={`${disease.id}-video-${index}`} className="rounded-lg overflow-hidden border border-border/50">
                              {isDirectVideoFile(videoUrl) ? (
                                <video controls className="w-full aspect-video" preload="metadata">
                                  <source src={videoUrl} type="video/mp4" />
                                  Your browser does not support the video tag.
                                </video>
                              ) : (
                                <iframe
                                  src={videoUrl}
                                  title={`${disease.name} precaution video ${index + 1}`}
                                  className="w-full aspect-video"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2 mb-1">
                            <PlayCircle className="h-4 w-4" />
                            Video link not added yet.
                          </div>
                          Add your video URL in <span className="font-medium">lib/disease-knowledge.ts</span> for {disease.name}.
                        </div>
                      )}

                      <ul className="space-y-2">
                        {disease.precautionKeyPoints.map((point) => (
                          <li key={`${disease.id}-${point}`} className="flex items-start gap-2 text-sm text-foreground">
                            <CheckCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-border/40 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-chart-4" />
                        Emergency-Only Medicines
                      </CardTitle>
                      <CardDescription>
                        Short-term support only. Use proper medical care for definitive treatment.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive">
                        <p className="font-semibold">Hospital Alert</p>
                        <p className="mt-1 text-sm">
                          In case of a severe attack, go to the hospital emergency department immediately. Do not delay care.
                        </p>
                      </div>

                      {disease.emergencyMedicines.map((medicine) => (
                        <div key={`${disease.id}-${medicine.name}`} className="rounded-lg border border-border/40 p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="font-medium text-foreground">{medicine.name}</p>
                            <Badge variant="outline" className="bg-chart-4/15 text-chart-4 border-chart-4/30">
                              Emergency use
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{medicine.useCase}</p>
                          <p className="text-sm"><span className="font-medium">Adult dose:</span> {medicine.adultDose}</p>
                          {medicine.maxPer24h && (
                            <p className="text-sm"><span className="font-medium">Max/day:</span> {medicine.maxPer24h}</p>
                          )}
                          <p className="text-sm"><span className="font-medium">Avoid when:</span> {medicine.avoidWhen}</p>
                          {medicine.note && <p className="text-sm text-muted-foreground">{medicine.note}</p>}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </section>
            )
          })}

          {visibleDiseaseBlocks.length === 0 && (
            <Card className="border-border/40 shadow-sm">
              <CardContent className="p-4 text-sm text-muted-foreground">
                Search a disease name to view its dedicated description, precautions, videos, and emergency-only medicines.
              </CardContent>
            </Card>
          )}
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
                          {insight.sampleStatus && (
                            <Badge variant="outline" className={sampleStatusStyles[insight.sampleStatus]}>
                              {sampleStatusLabels[insight.sampleStatus]}
                            </Badge>
                          )}
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
                      {insight.dataPoints.toLocaleString()} data points
                    </span>
                    <span className="flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" />
                      {insight.condition}
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

                      {insight.mentionedTerms && insight.mentionedTerms.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-foreground mb-2">Mentioned Clinical Terms</h5>
                          <div className="flex flex-wrap gap-2">
                            {insight.mentionedTerms.map((term) => (
                              <Badge key={`${insight.id}-${term}`} variant="outline" className="bg-muted/40">
                                {term}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {insight.careGuidance && insight.careGuidance.length > 0 && (
                        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">How To Use This For Care</span>
                          </div>
                          <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                            {insight.careGuidance.map((tip, index) => (
                              <li key={`${insight.id}-tip-${index}`}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

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
