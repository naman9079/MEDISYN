export type BiomedicalReference = {
  id: string
  title: string
  category: "therapy" | "safety" | "adherence" | "outcome"
  treatment: string
  condition: string
  text: string
}

export const biomedicalReferenceCorpus: BiomedicalReference[] = [
  {
    id: "custom-outcome-template",
    title: "Custom outcome reference",
    category: "outcome",
    treatment: "Custom Treatment",
    condition: "Custom Condition",
    text: "Replace this reference with your own disease-specific treatment evidence.",
  },
]