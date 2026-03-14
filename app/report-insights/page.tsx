"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, CheckCircle2, FileUp, HeartPulse, LoaderCircle, ShieldAlert, Sparkles, UploadCloud } from "lucide-react"

type GeminiWeakPoint = {
  metric: string
  severity: "mild" | "moderate" | "high" | "critical"
  currentStatus: string
  whyItMatters: string
  howToImprove: string
}

type GeminiInsightResult = {
  reportSummary: string
  overallAssessment: string
  weakPoints: GeminiWeakPoint[]
  actionPlan: string[]
  urgentWarnings: string[]
  disclaimer: string
}

const severityStyles: Record<GeminiWeakPoint["severity"], string> = {
  mild: "bg-accent/10 text-accent border-accent/30",
  moderate: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  high: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  critical: "bg-destructive/10 text-destructive border-destructive/30",
}

const allowedTextExtensions = ["txt", "csv", "json"]
const allowedImageExtensions = ["jpg", "jpeg", "png", "webp"]
const reportSignalPattern = /(hba1c|glucose|ldl|hdl|triglycer|creatinine|hemoglobin|platelet|vitamin|b12|wbc|urea|cholesterol|mg\/dl|g\/dl|%)/i

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? ""
}

function hasMedicalReportSignal(text: string) {
  const compact = text.replace(/\s+/g, " ").trim()
  const digitCount = (compact.match(/\d/g) ?? []).length
  return compact.length >= 30 && digitCount >= 3 && reportSignalPattern.test(compact)
}

async function fileToBase64(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      const base64 = result.includes(",") ? result.split(",")[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(new Error("Could not read image file."))
    reader.readAsDataURL(file)
  })
}

export default function ReportInsightsPage() {
  const [uploadedName, setUploadedName] = useState<string>("")
  const [reportText, setReportText] = useState<string>("")
  const [uploadedImageData, setUploadedImageData] = useState<string | null>(null)
  const [uploadedImageMimeType, setUploadedImageMimeType] = useState<string | null>(null)
  const [notice, setNotice] = useState<string>("Upload a .txt/.csv/.json or image report, then click Summarize Report.")
  const [ocrProgress, setOcrProgress] = useState<number>(0)
  const [isExtractingText, setIsExtractingText] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [insight, setInsight] = useState<GeminiInsightResult | null>(null)

  async function extractTextFromImage(file: File) {
    const { createWorker } = await import("tesseract.js")
    const worker = await createWorker("eng", 1, {
      logger: (message: { status?: string; progress?: number }) => {
        if (message.status === "recognizing text" && typeof message.progress === "number") {
          setOcrProgress(Math.round(message.progress * 100))
        }
      },
    })

    try {
      const result = await worker.recognize(file)
      return {
        text: result.data.text,
        confidence: typeof result.data.confidence === "number" ? result.data.confidence : 0,
      }
    } finally {
      await worker.terminate()
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploadedName(file.name)
    setOcrProgress(0)

    const extension = getExtension(file.name)

    if (extension === "pdf") {
      setNotice("PDF upload detected. Paste report text below, then click Summarize Report.")
      return
    }

    if (allowedTextExtensions.includes(extension)) {
      const text = await file.text()
      setReportText(text)
      setUploadedImageData(null)
      setUploadedImageMimeType(null)
      setNotice("Report uploaded. Click Summarize Report to generate full insights.")
      return
    }

    if (allowedImageExtensions.includes(extension)) {
      setIsExtractingText(true)
      setNotice("Preparing image and extracting text from report...")

      try {
        const imageBase64 = await fileToBase64(file)
        setUploadedImageData(imageBase64)
        setUploadedImageMimeType(file.type || "image/jpeg")

        const extracted = await extractTextFromImage(file)
        setReportText(extracted.text)

        if (!hasMedicalReportSignal(extracted.text) || extracted.confidence < 45) {
          setNotice(
            "OCR quality is low, but image AI analysis is ready. Click Summarize Report to analyze the image directly.",
          )
        } else {
          setNotice("Text extracted from image. Click Summarize Report for final insights.")
        }
      } catch {
        setUploadedImageData(null)
        setUploadedImageMimeType(null)
        setNotice("Could not extract text from image. Please paste report text manually and try Summarize.")
      } finally {
        setIsExtractingText(false)
      }

      return
    }

    setNotice("Unsupported file type. Upload .txt/.csv/.json/.jpg/.jpeg/.png/.webp or paste text manually.")
  }

  async function handleSummarize() {
    const trimmed = reportText.trim()
    const hasImagePayload = Boolean(uploadedImageData && uploadedImageMimeType)

    if (!trimmed && !hasImagePayload) {
      setNotice("Please upload a report image/file or paste report text before summarizing.")
      return
    }

    if (!hasImagePayload && !hasMedicalReportSignal(trimmed)) {
      setNotice(
        "The extracted text does not look like a medical lab report yet. Paste clearer report text (for example with HbA1c, glucose, LDL, creatinine values) and try again.",
      )
      return
    }

    setIsSummarizing(true)
    setNotice("Generating report summary and insights...")
    setInsight(null)

    try {
      const response = await fetch("/api/report-insights/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportText: trimmed,
          imageBase64: uploadedImageData,
          imageMimeType: uploadedImageMimeType,
        }),
      })

      const payload = (await response.json()) as {
        result?: GeminiInsightResult
        error?: string
        details?: string
        warning?: string
      }

      if (!response.ok || !payload.result) {
        const detailedMessage = payload.details ? ` ${payload.details}` : ""
        setNotice((payload.error ?? "Could not summarize this report with Gemini.") + detailedMessage)
        return
      }

      setInsight(payload.result)
      setNotice(payload.warning ?? "Summary generated successfully.")
    } finally {
      setIsSummarizing(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-muted/20 to-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <HeartPulse className="h-7 w-7 text-primary" />
              Report Insights
            </h1>
            <p className="text-muted-foreground mt-1">
              Upload a medical report and instantly view weak points, visual summaries, and actionable improvement suggestions.
            </p>
          </div>
          <Badge variant="outline" className="w-fit bg-primary/10 text-primary border-primary/20">
            Personalized AI Summary
          </Badge>
        </div>

        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <UploadCloud className="h-5 w-5 text-primary" />
              Upload Medical Report
            </CardTitle>
            <CardDescription>{notice}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input type="file" accept=".txt,.csv,.json,.pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileUpload} />
            {uploadedName && (
              <p className="text-sm text-muted-foreground">
                Selected file: <span className="font-medium text-foreground">{uploadedName}</span>
              </p>
            )}
            {isExtractingText && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                OCR in progress: {ocrProgress}%
              </div>
            )}
            <Textarea
              placeholder="Paste report text here (Example: HbA1c: 8.4, Fasting Glucose: 165, LDL: 178, Creatinine: 1.7...)"
              className="min-h-40"
              value={reportText}
              onChange={(event) => setReportText(event.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button onClick={handleSummarize} disabled={isExtractingText || isSummarizing} className="gap-2">
                {isSummarizing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isSummarizing ? "Summarizing..." : "Summarize Report"}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <FileUp className="h-4 w-4" />
              Analysis supports common report labels like HbA1c, glucose, LDL, HDL, triglycerides, creatinine, hemoglobin, vitamin D, and B12.
            </div>
          </CardContent>
        </Card>

        {insight && (
          <section className="space-y-4">
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Gemini Summary</CardTitle>
                <CardDescription>{insight.overallAssessment}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">{insight.reportSummary}</p>
              </CardContent>
            </Card>

            {insight.urgentWarnings.length > 0 && (
              <Card className="border-destructive/30 bg-destructive/10 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Urgent Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {insight.urgentWarnings.map((warning) => (
                    <div key={warning} className="rounded-lg border border-destructive/30 bg-background/70 p-3 text-sm text-destructive">
                      {warning}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-border/40 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                    Weak Points
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insight.weakPoints.length === 0 && (
                    <p className="text-sm text-muted-foreground">No clear weak points were identified from the uploaded text.</p>
                  )}
                  {insight.weakPoints.map((point, index) => (
                    <div key={`${point.metric}-${index}`} className="rounded-lg border border-border/40 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{point.metric}</p>
                        <Badge variant="outline" className={severityStyles[point.severity]}>
                          {point.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{point.currentStatus}</p>
                      <p className="text-sm text-foreground">{point.whyItMatters}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/40 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    How to Overcome
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insight.actionPlan.length > 0 && (
                    <div className="space-y-2">
                      {insight.actionPlan.map((step, index) => (
                        <div key={`${step}-${index}`} className="rounded-lg border border-border/40 p-3 text-sm text-foreground">
                          {step}
                        </div>
                      ))}
                    </div>
                  )}

                  {insight.weakPoints.length > 0 && (
                    <div className="space-y-2">
                      {insight.weakPoints.map((point, index) => (
                        <div key={`${point.metric}-improve-${index}`} className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                          <p className="text-sm font-medium text-foreground">{point.metric}</p>
                          <p className="text-sm text-muted-foreground mt-1">{point.howToImprove}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <Card className="border-border/40 shadow-sm">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">{insight.disclaimer}</p>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  )
}
