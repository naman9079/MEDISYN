export type EmergencyMedicine = {
  name: string
  useCase: string
  adultDose: string
  maxPer24h?: string
  avoidWhen: string
  note?: string
}

export type DiseaseKnowledge = {
  id: string
  name: string
  aliases: string[]
  shortDescription: string
  emergencyWarning: string
  videoUrl?: string
  videoUrls?: string[]
  precautionKeyPoints: string[]
  emergencyMedicines: EmergencyMedicine[]
}

export const diseaseKnowledgeBase: DiseaseKnowledge[] = [
  {
    id: "pancreatitis",
    name: "Pancreatitis",
    aliases: ["pancreatitis", "pancreataitis"],
    shortDescription:
      "Pancreatitis is inflammation of the pancreas. It can start suddenly and may become severe quickly, especially with persistent upper abdominal pain and vomiting.",
    emergencyWarning:
      "Severe pain, repeated vomiting, fever, or dehydration requires urgent hospital care. Do not delay treatment.",
    videoUrls: ["/pancreatitis.mp4"],
    precautionKeyPoints: [
      "Stop alcohol immediately and avoid fatty food.",
      "Stay hydrated with small, frequent sips of clean fluids.",
      "Do not take random painkillers if pain is worsening.",
      "Seek emergency evaluation for persistent abdominal pain.",
    ],
    emergencyMedicines: [
      {
        name: "Oral Rehydration Solution (ORS)",
        useCase: "Small sips only if fully conscious and not vomiting repeatedly while transport is being arranged.",
        adultDose: "Sip 100-200 ml every 15-20 minutes as tolerated.",
        avoidWhen: "Persistent vomiting, severe pain, confusion, drowsiness, breathing difficulty, or low urine output.",
        note: "Do not delay hospital care. This is only temporary hydration support.",
      },
      {
        name: "No self-medication during acute attack",
        useCase: "Acute pancreatitis attacks usually need IV fluids, monitored pain control, and urgent in-hospital care.",
        adultDose: "Go to emergency hospital immediately instead of trying home treatment.",
        avoidWhen: "Always avoid home treatment if severe abdominal pain, repeated vomiting, fever, or dehydration is present.",
        note: "Do not rely on over-the-counter painkillers for an attack.",
      },
    ],
  },
  {
    id: "cancer",
    name: "Cancer",
    aliases: ["cancer"],
    shortDescription:
      "Cancer is uncontrolled growth of abnormal cells. Symptoms and urgency vary by cancer type, stage, and current treatment status.",
    emergencyWarning:
      "If a cancer patient has high fever, breathing difficulty, severe pain, confusion, or bleeding, seek emergency care immediately.",
    precautionKeyPoints: [
      "Track fever and red-flag symptoms closely, especially during chemotherapy.",
      "Keep oncologist and emergency contact details ready.",
      "Maintain hydration and nutrition as advised by the care team.",
      "Avoid self-starting steroids or antibiotics without advice.",
    ],
    emergencyMedicines: [
      {
        name: "Paracetamol (Acetaminophen)",
        useCase: "Temporary fever or pain relief while contacting oncology/emergency services.",
        adultDose: "500-650 mg every 6-8 hours as needed.",
        maxPer24h: "3,000 mg",
        avoidWhen: "Liver disease, heavy alcohol use, allergy.",
        note: "In chemotherapy patients, fever is an emergency. Do not mask fever repeatedly.",
      },
    ],
  },
  {
    id: "asthma",
    name: "Asthma",
    aliases: ["asthma"],
    shortDescription:
      "Asthma is chronic airway inflammation that causes wheeze, chest tightness, cough, and shortness of breath. Attacks can escalate fast.",
    emergencyWarning:
      "If speech is difficult, lips turn blue, or inhaler gives poor relief, call emergency services immediately.",
    videoUrls: ["/asthma.mp4", "/asthma2.mp4"],
    precautionKeyPoints: [
      "Avoid smoke, dust, and known personal triggers.",
      "Use a spacer with inhaler for better medicine delivery.",
      "Follow your written asthma action plan.",
      "Do not delay emergency care for severe attacks.",
    ],
    emergencyMedicines: [
      {
        name: "Salbutamol (Albuterol) rescue inhaler",
        useCase: "Acute wheeze/shortness of breath in known asthma.",
        adultDose: "2 puffs, repeat every 20 minutes up to 3 times in first hour.",
        avoidWhen: "Not a substitute for emergency care in severe attacks.",
        note: "Use only if already prescribed. Overuse without medical review is unsafe.",
      },
    ],
  },
  {
    id: "migraine",
    name: "Migraine",
    aliases: ["migraine", "migrain", "migrane"],
    shortDescription:
      "Migraine is a recurrent neurological headache disorder, often with throbbing pain, nausea, light sensitivity, and reduced function.",
    emergencyWarning:
      "Sudden worst-ever headache, weakness, confusion, fever, neck stiffness, or head injury needs urgent emergency evaluation.",
    videoUrls: ["/migrane.mp4"],
    precautionKeyPoints: [
      "Rest in a dark, quiet room and hydrate early.",
      "Take approved medicine early in the attack for better response.",
      "Avoid known triggers like sleep loss and dehydration.",
      "Track attack frequency to discuss preventive therapy.",
    ],
    emergencyMedicines: [
      {
        name: "Paracetamol (Acetaminophen)",
        useCase: "Mild to moderate migraine pain.",
        adultDose: "500-1,000 mg every 6-8 hours as needed.",
        maxPer24h: "3,000 mg",
        avoidWhen: "Liver disease, allergy.",
      },
      {
        name: "Ibuprofen",
        useCase: "Migraine pain with inflammation features.",
        adultDose: "200-400 mg every 6-8 hours with food.",
        maxPer24h: "1,200 mg OTC",
        avoidWhen: "Kidney disease, peptic ulcer, pregnancy (especially 3rd trimester), blood thinner use.",
      },
    ],
  },
  {
    id: "hypertension",
    name: "Hypertension",
    aliases: ["hypertension", "high blood pressure", "bp high", "high bp", "bp is high"],
    shortDescription:
      "Hypertension is persistently elevated blood pressure. Long-term uncontrolled BP raises stroke, heart, and kidney risk.",
    emergencyWarning:
      "BP >= 180/120 with chest pain, breathlessness, weakness, severe headache, or vision change is an emergency.",
    precautionKeyPoints: [
      "Recheck BP after 5 minutes of seated rest.",
      "Limit salt intake and avoid smoking/alcohol binges.",
      "Do not double routine BP medicine without medical advice.",
      "Seek emergency care for symptom-based hypertensive crisis.",
    ],
    emergencyMedicines: [
      {
        name: "Previously prescribed rescue BP tablet",
        useCase: "Only if your doctor has given a specific emergency BP plan.",
        adultDose: "Use exactly as prescribed in your personal BP action plan.",
        avoidWhen: "If no prior doctor instruction exists.",
        note: "Do not start new BP medicines on your own during an emergency.",
      },
    ],
  },
  {
    id: "hypotension",
    name: "Hypotension",
    aliases: ["hypotension", "low blood pressure", "bp low", "low bp", "bp is low"],
    shortDescription:
      "Hypotension is low blood pressure that can cause dizziness, weakness, blurred vision, and fainting, often from dehydration or illness.",
    emergencyWarning:
      "Fainting, confusion, chest pain, breathlessness, or shock signs require emergency care.",
    precautionKeyPoints: [
      "Lay flat and raise legs if dizzy or faint.",
      "Rehydrate with oral fluids if conscious and not vomiting.",
      "Avoid sudden standing.",
      "Look for causes such as fever, blood loss, vomiting, or diarrhea.",
    ],
    emergencyMedicines: [
      {
        name: "Oral Rehydration Salts (ORS)",
        useCase: "Low BP related to dehydration when patient is awake and able to drink.",
        adultDose: "Sip frequently as per packet instructions.",
        avoidWhen: "Persistent vomiting, altered consciousness, severe kidney/heart fluid restriction.",
        note: "Supportive emergency fluid replacement, not a cure for all causes of low BP.",
      },
    ],
  },
  {
    id: "viral-fever",
    name: "Viral Fever",
    aliases: ["viral fever"],
    shortDescription:
      "Viral fever is fever due to viral infection, commonly with body ache, fatigue, sore throat, or cough.",
    emergencyWarning:
      "Persistent high fever, dehydration, breathing difficulty, confusion, seizures, or low urine output needs urgent care.",
    precautionKeyPoints: [
      "Use fluids and rest aggressively.",
      "Monitor temperature and urine output.",
      "Avoid unnecessary antibiotics unless prescribed.",
      "Escalate if fever lasts more than 3 days or red flags appear.",
    ],
    emergencyMedicines: [
      {
        name: "Paracetamol (Acetaminophen)",
        useCase: "Fever and body ache relief.",
        adultDose: "500-650 mg every 6-8 hours as needed.",
        maxPer24h: "3,000 mg",
        avoidWhen: "Liver disease, heavy alcohol use, allergy.",
      },
      {
        name: "Oral Rehydration Salts (ORS)",
        useCase: "Prevent dehydration in fever with poor intake.",
        adultDose: "Sip regularly as directed on packet.",
        avoidWhen: "Fluid restriction advised by doctor.",
      },
    ],
  },
  {
    id: "chickenpox",
    name: "Chickenpox",
    aliases: ["chickenpox", "chicken pox", "chikon pox"],
    shortDescription:
      "Chickenpox is a viral infection with itchy blister-like rash and fever. It is usually self-limited but can be serious in adults and high-risk groups.",
    emergencyWarning:
      "Breathing difficulty, confusion, severe vomiting, persistent high fever, pregnancy, or immunocompromised status needs urgent evaluation.",
    videoUrls: ["/chicken-pox.mp4"],
    precautionKeyPoints: [
      "Isolate to reduce spread until lesions crust.",
      "Keep nails short and avoid scratching to reduce skin infection.",
      "Use lukewarm baths and soothing skin care.",
      "Do not use aspirin in viral fever/chickenpox.",
    ],
    emergencyMedicines: [
      {
        name: "Paracetamol (Acetaminophen)",
        useCase: "Fever and discomfort relief.",
        adultDose: "500-650 mg every 6-8 hours as needed.",
        maxPer24h: "3,000 mg",
        avoidWhen: "Liver disease, allergy.",
      },
      {
        name: "Calamine lotion",
        useCase: "Itching relief on rash areas.",
        adultDose: "Apply thin layer 2-4 times daily.",
        avoidWhen: "Open infected wounds.",
      },
      {
        name: "Cetirizine",
        useCase: "Itch control when severe.",
        adultDose: "10 mg once daily.",
        avoidWhen: "Allergy to antihistamines.",
      },
    ],
  },
  {
    id: "leg-fracture",
    name: "Leg Fracture",
    aliases: ["leg fracture", "fracture of leg", "fractured leg"],
    shortDescription:
      "A leg fracture is a break in one or more leg bones and usually causes severe pain, swelling, and inability to bear weight.",
    emergencyWarning:
      "Open fracture, severe deformity, numbness, cold limb, or uncontrolled pain is an emergency.",
    precautionKeyPoints: [
      "Immobilize the limb and avoid weight-bearing.",
      "Apply cold pack wrapped in cloth for swelling.",
      "Do not attempt forceful realignment.",
      "Get urgent X-ray and orthopedic assessment.",
    ],
    emergencyMedicines: [
      {
        name: "Paracetamol (Acetaminophen)",
        useCase: "Initial pain relief while arranging emergency care.",
        adultDose: "500-1,000 mg every 6-8 hours as needed.",
        maxPer24h: "3,000 mg",
        avoidWhen: "Liver disease, allergy.",
      },
      {
        name: "Ibuprofen",
        useCase: "Short-term pain relief if no contraindications.",
        adultDose: "200-400 mg every 6-8 hours with food.",
        maxPer24h: "1,200 mg OTC",
        avoidWhen: "Kidney disease, ulcer disease, blood thinner use, late pregnancy.",
      },
    ],
  },
  {
    id: "hand-fracture",
    name: "Hand Fracture",
    aliases: ["hand fracture", "fracture of hand", "fractured hand"],
    shortDescription:
      "A hand fracture is a break in hand bones that may cause pain, swelling, bruising, deformity, and reduced finger movement.",
    emergencyWarning:
      "Open injury, finger numbness, color change, severe deformity, or inability to move fingers needs urgent emergency care.",
    precautionKeyPoints: [
      "Immobilize hand/wrist with a temporary splint.",
      "Keep hand elevated to reduce swelling.",
      "Use ice pack wrapped in cloth for 15-20 minutes at a time.",
      "Arrange urgent imaging and orthopedic review.",
    ],
    emergencyMedicines: [
      {
        name: "Paracetamol (Acetaminophen)",
        useCase: "Initial pain relief while awaiting clinical care.",
        adultDose: "500-1,000 mg every 6-8 hours as needed.",
        maxPer24h: "3,000 mg",
        avoidWhen: "Liver disease, allergy.",
      },
      {
        name: "Ibuprofen",
        useCase: "Short-term pain/swelling support if suitable.",
        adultDose: "200-400 mg every 6-8 hours with food.",
        maxPer24h: "1,200 mg OTC",
        avoidWhen: "Kidney disease, ulcer disease, blood thinner use, late pregnancy.",
      },
    ],
  },
]

function normalizeForMatch(value: string) {
  return ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `
}

export function getDiseaseKnowledgeByQuery(query: string) {
  const normalizedQuery = normalizeForMatch(query)

  for (const disease of diseaseKnowledgeBase) {
    for (const alias of disease.aliases) {
      const normalizedAlias = normalizeForMatch(alias)
      if (normalizedAlias.length > 2 && normalizedQuery.includes(normalizedAlias)) {
        return disease
      }
    }
  }

  return undefined
}
