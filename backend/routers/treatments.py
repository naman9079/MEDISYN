from fastapi import APIRouter, HTTPException, Query
from models import TreatmentSummary, TreatmentDetail

router = APIRouter()

_treatments: list[TreatmentDetail] = [
    TreatmentDetail(
        id=1,
        name="Metformin",
        condition="Type 2 Diabetes",
        total_patients=12847,
        avg_recovery_weeks=6.2,
        positive_rate=78,
        analyses=8934,
        side_effects=[
            {"name": "Nausea", "percentage": 32, "severity": "mild"},
            {"name": "Diarrhea", "percentage": 28, "severity": "mild"},
            {"name": "Stomach Pain", "percentage": 18, "severity": "moderate"},
            {"name": "Metallic Taste", "percentage": 15, "severity": "mild"},
            {"name": "Headache", "percentage": 12, "severity": "mild"},
            {"name": "Dizziness", "percentage": 8, "severity": "moderate"},
        ],
        sentiment_breakdown=[
            {"name": "Very Positive", "value": 45, "fill": "hsl(var(--accent))"},
            {"name": "Positive", "value": 33, "fill": "hsl(var(--chart-2))"},
            {"name": "Neutral", "value": 15, "fill": "hsl(var(--chart-4))"},
            {"name": "Negative", "value": 7, "fill": "hsl(var(--chart-5))"},
        ],
        recovery_timeline=[
            {"week": "Week 1", "percentage": 15, "milestone": "Initial adaptation"},
            {"week": "Week 2", "percentage": 28, "milestone": "Side effects decrease"},
            {"week": "Week 3", "percentage": 45, "milestone": "Blood sugar stabilizing"},
            {"week": "Week 4", "percentage": 62, "milestone": "Consistent improvement"},
            {"week": "Week 5", "percentage": 78, "milestone": "Near target levels"},
            {"week": "Week 6", "percentage": 89, "milestone": "Stable condition"},
            {"week": "Week 8", "percentage": 95, "milestone": "Full effectiveness"},
        ],
    ),
    TreatmentDetail(
        id=2,
        name="Lisinopril",
        condition="Hypertension",
        total_patients=9823,
        avg_recovery_weeks=4.5,
        positive_rate=84,
        analyses=6712,
        side_effects=[
            {"name": "Dry Cough", "percentage": 20, "severity": "mild"},
            {"name": "Dizziness", "percentage": 14, "severity": "moderate"},
            {"name": "Headache", "percentage": 11, "severity": "mild"},
            {"name": "Fatigue", "percentage": 9, "severity": "mild"},
        ],
        sentiment_breakdown=[
            {"name": "Very Positive", "value": 52, "fill": "hsl(var(--accent))"},
            {"name": "Positive", "value": 32, "fill": "hsl(var(--chart-2))"},
            {"name": "Neutral", "value": 10, "fill": "hsl(var(--chart-4))"},
            {"name": "Negative", "value": 6, "fill": "hsl(var(--chart-5))"},
        ],
        recovery_timeline=[
            {"week": "Week 1", "percentage": 20, "milestone": "BP begins lowering"},
            {"week": "Week 2", "percentage": 40, "milestone": "Consistent readings"},
            {"week": "Week 3", "percentage": 60, "milestone": "Target range reached"},
            {"week": "Week 4", "percentage": 80, "milestone": "Stable BP control"},
            {"week": "Week 6", "percentage": 92, "milestone": "Full effectiveness"},
        ],
    ),
    TreatmentDetail(
        id=3,
        name="Sertraline",
        condition="Depression/Anxiety",
        total_patients=8567,
        avg_recovery_weeks=8.0,
        positive_rate=69,
        analyses=5420,
        side_effects=[
            {"name": "Nausea", "percentage": 26, "severity": "mild"},
            {"name": "Insomnia", "percentage": 21, "severity": "moderate"},
            {"name": "Fatigue", "percentage": 18, "severity": "mild"},
            {"name": "Headache", "percentage": 15, "severity": "mild"},
            {"name": "Decreased Libido", "percentage": 12, "severity": "moderate"},
        ],
        sentiment_breakdown=[
            {"name": "Very Positive", "value": 38, "fill": "hsl(var(--accent))"},
            {"name": "Positive", "value": 31, "fill": "hsl(var(--chart-2))"},
            {"name": "Neutral", "value": 20, "fill": "hsl(var(--chart-4))"},
            {"name": "Negative", "value": 11, "fill": "hsl(var(--chart-5))"},
        ],
        recovery_timeline=[
            {"week": "Week 1", "percentage": 5, "milestone": "Adjustment phase"},
            {"week": "Week 2", "percentage": 12, "milestone": "Side effects peak"},
            {"week": "Week 4", "percentage": 35, "milestone": "Mood improvement begins"},
            {"week": "Week 6", "percentage": 58, "milestone": "Notable improvement"},
            {"week": "Week 8", "percentage": 75, "milestone": "Significant relief"},
            {"week": "Week 12", "percentage": 88, "milestone": "Sustained response"},
        ],
    ),
    TreatmentDetail(
        id=4,
        name="Omeprazole",
        condition="GERD",
        total_patients=7234,
        avg_recovery_weeks=3.0,
        positive_rate=81,
        analyses=4891,
        side_effects=[
            {"name": "Headache", "percentage": 14, "severity": "mild"},
            {"name": "Nausea", "percentage": 8, "severity": "mild"},
            {"name": "B12 Deficiency", "percentage": 6, "severity": "moderate"},
            {"name": "Diarrhea", "percentage": 5, "severity": "mild"},
        ],
        sentiment_breakdown=[
            {"name": "Very Positive", "value": 48, "fill": "hsl(var(--accent))"},
            {"name": "Positive", "value": 33, "fill": "hsl(var(--chart-2))"},
            {"name": "Neutral", "value": 13, "fill": "hsl(var(--chart-4))"},
            {"name": "Negative", "value": 6, "fill": "hsl(var(--chart-5))"},
        ],
        recovery_timeline=[
            {"week": "Week 1", "percentage": 45, "milestone": "Acid reduction begins"},
            {"week": "Week 2", "percentage": 70, "milestone": "Heartburn relief"},
            {"week": "Week 3", "percentage": 85, "milestone": "Esophagus healing"},
            {"week": "Week 4", "percentage": 93, "milestone": "Full relief"},
        ],
    ),
    TreatmentDetail(
        id=5,
        name="Atorvastatin",
        condition="High Cholesterol",
        total_patients=6892,
        avg_recovery_weeks=12.0,
        positive_rate=76,
        analyses=4230,
        side_effects=[
            {"name": "Muscle Pain", "percentage": 10, "severity": "moderate"},
            {"name": "Fatigue", "percentage": 8, "severity": "mild"},
            {"name": "Nausea", "percentage": 6, "severity": "mild"},
            {"name": "Liver Enzyme Elevation", "percentage": 3, "severity": "severe"},
        ],
        sentiment_breakdown=[
            {"name": "Very Positive", "value": 40, "fill": "hsl(var(--accent))"},
            {"name": "Positive", "value": 36, "fill": "hsl(var(--chart-2))"},
            {"name": "Neutral", "value": 16, "fill": "hsl(var(--chart-4))"},
            {"name": "Negative", "value": 8, "fill": "hsl(var(--chart-5))"},
        ],
        recovery_timeline=[
            {"week": "Week 2", "percentage": 10, "milestone": "Treatment initiated"},
            {"week": "Week 4", "percentage": 30, "milestone": "LDL reduction starts"},
            {"week": "Week 6", "percentage": 55, "milestone": "Measurable improvement"},
            {"week": "Week 8", "percentage": 70, "milestone": "Significant LDL drop"},
            {"week": "Week 12", "percentage": 85, "milestone": "Target LDL reached"},
        ],
    ),
    TreatmentDetail(
        id=6,
        name="Levothyroxine",
        condition="Hypothyroidism",
        total_patients=5678,
        avg_recovery_weeks=10.0,
        positive_rate=86,
        analyses=3670,
        side_effects=[
            {"name": "Palpitations", "percentage": 9, "severity": "moderate"},
            {"name": "Insomnia", "percentage": 7, "severity": "mild"},
            {"name": "Weight Change", "percentage": 6, "severity": "mild"},
            {"name": "Anxiety", "percentage": 5, "severity": "mild"},
        ],
        sentiment_breakdown=[
            {"name": "Very Positive", "value": 55, "fill": "hsl(var(--accent))"},
            {"name": "Positive", "value": 31, "fill": "hsl(var(--chart-2))"},
            {"name": "Neutral", "value": 9, "fill": "hsl(var(--chart-4))"},
            {"name": "Negative", "value": 5, "fill": "hsl(var(--chart-5))"},
        ],
        recovery_timeline=[
            {"week": "Week 2", "percentage": 15, "milestone": "Hormone levels adjusting"},
            {"week": "Week 4", "percentage": 35, "milestone": "Energy improving"},
            {"week": "Week 6", "percentage": 58, "milestone": "Fatigue reducing"},
            {"week": "Week 8", "percentage": 74, "milestone": "TSH normalizing"},
            {"week": "Week 12", "percentage": 90, "milestone": "Full thyroid function"},
        ],
    ),
]


@router.get("", response_model=list[TreatmentSummary])
def list_treatments(
    search: str = Query(default="", description="Search by name or condition"),
    condition: str = Query(default="all", description="Filter by condition"),
    sort_by: str = Query(default="rating", description="Sort by: rating | patients | recent"),
):
    results = _treatments

    if search:
        q = search.lower()
        results = [t for t in results if q in t.name.lower() or q in t.condition.lower()]

    if condition != "all":
        results = [t for t in results if condition.lower() in t.condition.lower()]

    summaries = [
        TreatmentSummary(
            id=t.id,
            name=t.name,
            condition=t.condition,
            patients=t.total_patients,
            rating=round(t.positive_rate / 25, 1),
        )
        for t in results
    ]

    if sort_by == "patients":
        summaries.sort(key=lambda x: x.patients, reverse=True)
    else:
        summaries.sort(key=lambda x: x.rating, reverse=True)

    return summaries


@router.get("/{treatment_id}", response_model=TreatmentDetail)
def get_treatment(treatment_id: int):
    for t in _treatments:
        if t.id == treatment_id:
            return t
    raise HTTPException(status_code=404, detail="Treatment not found")
