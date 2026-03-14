"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search,
  ExternalLink,
  ThumbsUp,
  MessageSquare,
  Shield,
  Clock,
  AlertTriangle,
  Heart,
  TrendingUp,
  Filter,
  CheckCircle
} from "lucide-react"

type FilterType = "all" | "side-effects" | "recovery" | "outcome"

const experiences = [
  {
    id: 1,
    author: "Anonymous User",
    initials: "AU",
    treatment: "Metformin",
    condition: "Type 2 Diabetes",
    date: "2 days ago",
    content: "Started Metformin 3 months ago. Initial nausea was tough for the first 2 weeks, but it significantly improved. My blood sugar levels are now stable and within the target range. Overall very satisfied with the treatment.",
    tags: ["Recovery", "Outcome"],
    sentiment: "positive",
    credibilityScore: 92,
    likes: 47,
    replies: 12,
    verified: true
  },
  {
    id: 2,
    author: "Patient 2847",
    initials: "P2",
    treatment: "Lisinopril",
    condition: "Hypertension",
    date: "5 days ago",
    content: "Experienced a persistent dry cough as a side effect which was quite bothersome. Doctor switched me to an ARB instead. Blood pressure control was good while on it though.",
    tags: ["Side Effects"],
    sentiment: "neutral",
    credibilityScore: 88,
    likes: 34,
    replies: 8,
    verified: true
  },
  {
    id: 3,
    author: "Anonymous User",
    initials: "AU",
    treatment: "Sertraline",
    condition: "Anxiety",
    date: "1 week ago",
    content: "The first few weeks were challenging with increased anxiety and sleep issues. But after week 4, I started noticing significant improvement in my mood and anxiety levels. Now at month 3 and feeling much better.",
    tags: ["Side Effects", "Recovery", "Outcome"],
    sentiment: "positive",
    credibilityScore: 95,
    likes: 89,
    replies: 23,
    verified: true
  },
  {
    id: 4,
    author: "Patient 1893",
    initials: "P1",
    treatment: "Omeprazole",
    condition: "GERD",
    date: "2 weeks ago",
    content: "Works well for acid reflux control. Taking it for 6 months now. Doctor mentioned concerns about long-term use and B12 absorption. Planning to discuss tapering strategy.",
    tags: ["Outcome"],
    sentiment: "positive",
    credibilityScore: 85,
    likes: 28,
    replies: 15,
    verified: false
  },
  {
    id: 5,
    author: "Anonymous User",
    initials: "AU",
    treatment: "Atorvastatin",
    condition: "High Cholesterol",
    date: "3 weeks ago",
    content: "Developed muscle pain in my legs after starting. Doctor reduced the dose and the symptoms improved. Cholesterol numbers look much better now. Monitoring liver enzymes regularly.",
    tags: ["Side Effects", "Recovery"],
    sentiment: "neutral",
    credibilityScore: 91,
    likes: 42,
    replies: 7,
    verified: true
  },
  {
    id: 6,
    author: "Patient 5621",
    initials: "P5",
    treatment: "Metformin",
    condition: "Type 2 Diabetes",
    date: "1 month ago",
    content: "Extended release version worked much better for me than regular Metformin. Less GI side effects. A1C dropped from 8.2 to 6.8 in 4 months. Very happy with the results.",
    tags: ["Outcome", "Recovery"],
    sentiment: "positive",
    credibilityScore: 94,
    likes: 67,
    replies: 19,
    verified: true
  },
]

const tagColors: Record<string, string> = {
  "Side Effects": "bg-destructive/10 text-destructive border-destructive/20",
  "Recovery": "bg-accent/10 text-accent border-accent/20",
  "Outcome": "bg-primary/10 text-primary border-primary/20"
}

export default function PatientExperiencesPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredExperiences = experiences.filter((exp) => {
    const matchesFilter = activeFilter === "all" || 
      exp.tags.some(tag => tag.toLowerCase().replace(" ", "-") === activeFilter)
    const matchesSearch = searchQuery === "" || 
      exp.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.treatment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.condition.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Patient Experience Feed</h1>
          <p className="text-muted-foreground">Real patient discussions and treatment feedback</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search experiences, treatments, or conditions..."
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
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="credibility">Highest Credibility</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tag Filters */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
              className={activeFilter === "all" ? "" : ""}
            >
              <Filter className="h-4 w-4 mr-1" />
              All
            </Button>
            <Button 
              variant={activeFilter === "side-effects" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("side-effects")}
              className={activeFilter === "side-effects" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Side Effects
            </Button>
            <Button 
              variant={activeFilter === "recovery" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("recovery")}
              className={activeFilter === "recovery" ? "bg-accent hover:bg-accent/90" : ""}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Recovery
            </Button>
            <Button 
              variant={activeFilter === "outcome" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("outcome")}
            >
              <Heart className="h-4 w-4 mr-1" />
              Outcome
            </Button>
          </div>
        </div>

        {/* Experience Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredExperiences.map((experience) => (
            <Card key={experience.id} className="border-border/40 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {experience.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{experience.author}</span>
                        {experience.verified && (
                          <CheckCircle className="h-4 w-4 text-accent" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {experience.date}
                      </div>
                    </div>
                  </div>
                  
                  {/* Credibility Score */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10">
                    <Shield className="h-3.5 w-3.5 text-accent" />
                    <span className="text-sm font-medium text-accent">{experience.credibilityScore}%</span>
                  </div>
                </div>

                {/* Treatment Info */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="font-medium">
                    {experience.treatment}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{experience.condition}</span>
                </div>

                {/* Content */}
                <p className="text-sm text-foreground leading-relaxed mb-4">
                  {experience.content}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {experience.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="outline"
                      className={tagColors[tag]}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-sm">{experience.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">{experience.replies}</span>
                    </button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Source
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        {filteredExperiences.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button variant="outline" size="lg">
              Load More Experiences
            </Button>
          </div>
        )}

        {/* Empty State */}
        {filteredExperiences.length === 0 && (
          <Card className="border-border/40 shadow-sm">
            <CardContent className="py-16 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No experiences found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
