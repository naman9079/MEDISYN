export type HealthDiscussion = {
  id: string
  title: string
  body: string
  subreddit?: string
  createdAt?: string
}

export type SymptomMention = {
  id: string
  text: string
  symptoms: string[]
  context?: string
}

export type TreatmentExperience = {
  id: string
  text: string
  treatment: string
  condition?: string
  outcome?: "improved" | "no_change" | "worse"
}

export const healthDiscussions: HealthDiscussion[] = [
  {
    id: "hd_template_1",
    title: "Add your first condition discussion",
    body: "Replace this template with your own disease discussion records.",
    subreddit: "r/your-community",
    createdAt: "2026-01-01T00:00:00Z",
  },
]

export const symptomMentions: SymptomMention[] = [
  {
    id: "sm_template_1",
    text: "Describe your symptom mention here.",
    symptoms: ["custom symptom"],
    context: "custom context",
  },
]

export const treatmentExperiences: TreatmentExperience[] = [
  {
    id: "te_template_1",
    text: "Add your own treatment experience text.",
    treatment: "Custom Treatment",
    condition: "Custom Condition",
    outcome: "no_change",
  },
]

export function searchHealthDiscussions(query: string): HealthDiscussion[] {
  const normalized = query.trim().toLowerCase()

  if (!normalized) {
    return healthDiscussions
  }

  return healthDiscussions.filter((discussion) => {
    return (
      discussion.title.toLowerCase().includes(normalized) ||
      discussion.body.toLowerCase().includes(normalized) ||
      (discussion.subreddit?.toLowerCase().includes(normalized) ?? false)
    )
  })
}

export function searchTreatmentExperiences(query: string): TreatmentExperience[] {
  const normalized = query.trim().toLowerCase()

  if (!normalized) {
    return treatmentExperiences
  }

  return treatmentExperiences.filter((experience) => {
    return (
      experience.text.toLowerCase().includes(normalized) ||
      experience.treatment.toLowerCase().includes(normalized) ||
      (experience.condition?.toLowerCase().includes(normalized) ?? false)
    )
  })
}
