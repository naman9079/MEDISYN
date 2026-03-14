# Real Data Input

Medisyn reads patient experiences from:

- data/real/patient-experiences.json

## Expected JSON schema

The file must contain an array of objects with these fields:

- id: string
- author: string
- initials: string
- treatment: string
- condition: string
- date: string (ISO date or readable text)
- content: string
- tags: string[]
- sentiment: "positive" | "neutral" | "negative"
- credibilityScore: number
- likes: number
- replies: number
- verified: boolean
- sourceUrl?: string

## How to use with your own data

1. Replace `patient-experiences.json` with your exported records.
2. Keep the same field names.
3. Refresh `/patient-experiences`.

No disease-specific sample records are preloaded.
