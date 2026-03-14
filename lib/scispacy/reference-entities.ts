export type MedicalEntitySeed = {
  id: string
  text: string
  label: "TREATMENT" | "CONDITION" | "SYMPTOM" | "BIOMARKER"
  canonical: string
}

export const medicalEntitySeeds: MedicalEntitySeed[] = [
  { id: "custom-treatment", text: "custom treatment", label: "TREATMENT", canonical: "Custom Treatment" },
  { id: "custom-condition", text: "custom condition", label: "CONDITION", canonical: "Custom Condition" },
  { id: "custom-symptom", text: "custom symptom", label: "SYMPTOM", canonical: "Custom Symptom" },
  { id: "custom-biomarker", text: "custom biomarker", label: "BIOMARKER", canonical: "Custom Biomarker" },
]