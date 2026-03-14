from fastapi import APIRouter, Query
from models import Insight, InsightStat

router = APIRouter()

_insights: list[Insight] = [
    Insight(
        id=1,
        type="discovery",
        title="Recovery Rate Improvement Detected",
        summary="Patients using combination therapy (Metformin + Lifestyle modifications) show 23% faster recovery compared to monotherapy alone.",
        details="Analysis of 4,283 patient records over 12 months reveals statistically significant improvement in glycemic control when medication is combined with structured diet and exercise programs.",
        treatment="Metformin",
        condition="Type 2 Diabetes",
        confidence=94,
        impact="high",
        date="Today",
        data_points=4283,
        actionable=True,
    ),
    Insight(
        id=2,
        type="alert",
        title="Potential Drug Interaction Warning",
        summary="Increased fatigue reports when combining Metformin with beta-blockers. 18% higher incidence compared to baseline.",
        details="Cross-referencing patient feedback data shows correlation between concurrent beta-blocker use and increased fatigue complaints. Recommend monitoring and potential dose adjustment.",
        treatment="Metformin + Beta-blockers",
        condition="Diabetes + Hypertension",
        confidence=87,
        impact="medium",
        date="Yesterday",
        data_points=1892,
        actionable=True,
    ),
    Insight(
        id=3,
        type="trend",
        title="Positive Sentiment Trend for SSRIs",
        summary="Patient satisfaction with SSRI treatments increased 12% over the past 6 months, correlating with better dosing protocols.",
        details="Gradual titration protocols showing improved patient tolerance and adherence. Side effect complaints decreased by 28% with slow-start dosing approaches.",
        treatment="SSRIs (Sertraline, Escitalopram)",
        condition="Depression/Anxiety",
        confidence=91,
        impact="medium",
        date="2 days ago",
        data_points=6721,
        actionable=False,
    ),
    Insight(
        id=4,
        type="alert",
        title="Misinformation Pattern Detected",
        summary="Rising claims about Omeprazole causing bone fractures without proper context. Evidence suggests misinformation spread.",
        details="Analysis indicates correlation with long-term high-dose use only (>1 year). Current patient discussions lack this crucial context. Recommend educational content intervention.",
        treatment="Omeprazole",
        condition="GERD",
        confidence=82,
        impact="high",
        date="3 days ago",
        data_points=2341,
        actionable=True,
    ),
    Insight(
        id=5,
        type="discovery",
        title="Optimal Timing Pattern Identified",
        summary="Evening administration of Atorvastatin shows 15% better LDL reduction compared to morning dosing.",
        details="Analysis of cholesterol panel results across 3,456 patients indicates statistically significant improvement with evening administration, aligning with cholesterol synthesis patterns.",
        treatment="Atorvastatin",
        condition="High Cholesterol",
        confidence=89,
        impact="medium",
        date="1 week ago",
        data_points=3456,
        actionable=True,
    ),
    Insight(
        id=6,
        type="trend",
        title="Extended Release Formulation Preference",
        summary="Metformin XR showing 34% higher patient adherence rates compared to immediate release formulations.",
        details="Reduced GI side effects and once-daily dosing convenience driving preference. Healthcare providers increasingly recommending XR formulation for new patients.",
        treatment="Metformin XR",
        condition="Type 2 Diabetes",
        confidence=96,
        impact="high",
        date="1 week ago",
        data_points=5892,
        actionable=False,
    ),
]

_stats: list[InsightStat] = [
    InsightStat(label="Total Insights", value="1,284", change="+24 this week"),
    InsightStat(label="Critical Alerts", value="12", change="3 require action"),
    InsightStat(label="Discoveries", value="847", change="+156 this month"),
    InsightStat(label="Data Points", value="2.4M", change="Analyzed today"),
]


@router.get("/stats", response_model=list[InsightStat])
def get_insight_stats():
    return _stats


@router.get("", response_model=list[Insight])
def list_insights(
    type: str = Query(default="all", description="Filter: all | discovery | alert | trend"),
):
    if type == "all":
        return _insights
    return [i for i in _insights if i.type == type]


@router.get("/{insight_id}", response_model=Insight)
def get_insight(insight_id: int):
    for i in _insights:
        if i.id == insight_id:
            return i
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Insight not found")
