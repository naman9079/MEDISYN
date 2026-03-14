from fastapi import APIRouter
from models import DashboardStats

router = APIRouter()

_stats = [
    {
        "title": "Treatment Analyses",
        "value": "2,847",
        "change": "+12.5%",
        "description": "Total treatments analyzed",
        "color": "primary",
    },
    {
        "title": "Side Effects Tracked",
        "value": "15,234",
        "change": "+8.3%",
        "description": "Reported side effects",
        "color": "warm",
    },
    {
        "title": "Avg Recovery Time",
        "value": "4.2 weeks",
        "change": "-15.2%",
        "description": "Across all treatments",
        "color": "accent",
    },
    {
        "title": "Patient Sentiment",
        "value": "82%",
        "change": "+5.7%",
        "description": "Positive feedback rate",
        "color": "primary",
    },
]

_side_effects = [
    {"name": "Nausea", "value": 35},
    {"name": "Headache", "value": 28},
    {"name": "Fatigue", "value": 22},
    {"name": "Dizziness", "value": 15},
]

_recovery_data = [
    {"week": "Week 1", "patients": 120, "recovered": 45},
    {"week": "Week 2", "patients": 120, "recovered": 68},
    {"week": "Week 3", "patients": 120, "recovered": 85},
    {"week": "Week 4", "patients": 120, "recovered": 102},
    {"week": "Week 5", "patients": 120, "recovered": 110},
    {"week": "Week 6", "patients": 120, "recovered": 118},
]

_sentiment_data = [
    {"month": "Jan", "positive": 65, "neutral": 25, "negative": 10},
    {"month": "Feb", "positive": 68, "neutral": 22, "negative": 10},
    {"month": "Mar", "positive": 72, "neutral": 20, "negative": 8},
    {"month": "Apr", "positive": 75, "neutral": 18, "negative": 7},
    {"month": "May", "positive": 78, "neutral": 16, "negative": 6},
    {"month": "Jun", "positive": 82, "neutral": 14, "negative": 4},
]

_recent_treatments = [
    {"name": "Metformin", "condition": "Type 2 Diabetes", "sentiment": "positive", "analyses": 1234, "trend": "up"},
    {"name": "Lisinopril", "condition": "Hypertension", "sentiment": "positive", "analyses": 987, "trend": "up"},
    {"name": "Sertraline", "condition": "Depression", "sentiment": "neutral", "analyses": 756, "trend": "stable"},
    {"name": "Omeprazole", "condition": "GERD", "sentiment": "positive", "analyses": 623, "trend": "up"},
]


@router.get("", response_model=DashboardStats)
def get_dashboard():
    return DashboardStats(
        stats=_stats,
        side_effects=_side_effects,
        recovery_data=_recovery_data,
        sentiment_data=_sentiment_data,
        recent_treatments=_recent_treatments,
    )
