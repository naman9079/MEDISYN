export type ConditionDefinition = {
  id: string
  name: string
  aliases: string[]
}

export const medisynConditions: ConditionDefinition[] = [
  {
    id: "pancreatitis",
    name: "Pancreatitis",
    aliases: ["pancreatitis", "pancreataitis"],
  },
  {
    id: "cancer",
    name: "Cancer",
    aliases: ["cancer"],
  },
  {
    id: "asthma",
    name: "Asthma",
    aliases: ["asthma"],
  },
  {
    id: "migraine",
    name: "Migraine",
    aliases: ["migraine", "migrain"],
  },
  {
    id: "hypertension",
    name: "Hypertension",
    aliases: ["hypertension", "high blood pressure", "bp high", "high bp", "bp is high"],
  },
  {
    id: "hypotension",
    name: "Hypotension",
    aliases: ["hypotension", "low blood pressure", "bp low", "low bp", "bp is low"],
  },
  {
    id: "viral-fever",
    name: "Viral Fever",
    aliases: ["viral fever"],
  },
  {
    id: "chickenpox",
    name: "Chickenpox",
    aliases: ["chickenpox", "chicken pox", "chikon pox"],
  },
  {
    id: "leg-fracture",
    name: "Leg Fracture",
    aliases: ["leg fracture", "fracture of leg", "fractured leg"],
  },
  {
    id: "hand-fracture",
    name: "Hand Fracture",
    aliases: ["hand fracture", "fracture of hand", "fractured hand"],
  },
]

export const medisynConditionNames = medisynConditions.map((condition) => condition.name)

function normalizeForMatch(value: string) {
  return ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `
}

export function inferConditionFromText(text: string) {
  const normalizedText = normalizeForMatch(text)

  for (const condition of medisynConditions) {
    for (const alias of condition.aliases) {
      const normalizedAlias = normalizeForMatch(alias)
      if (normalizedAlias.length > 2 && normalizedText.includes(normalizedAlias)) {
        return condition.name
      }
    }
  }

  return undefined
}
