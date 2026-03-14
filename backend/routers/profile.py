from fastapi import APIRouter
from models import UserProfile

router = APIRouter()

_profile = UserProfile(
    name="Dr. Sarah Chen",
    role="Healthcare Data Analyst",
    organization="Stanford Medical Center",
    location="San Francisco, CA",
    member_since="Jan 2024",
    plan="Pro",
    avatar_seed="medisyn",
    stats=[
        {"label": "Analyses Run", "value": "1,847", "trend": "+124 this month"},
        {"label": "Insights Generated", "value": "423", "trend": "+38 this month"},
        {"label": "Hours Saved", "value": "156", "trend": "Estimated time savings"},
        {"label": "Accuracy Score", "value": "94.2%", "trend": "Based on feedback"},
    ],
    recent_activity=[
        {"action": "Analyzed treatment", "target": "Metformin for Type 2 Diabetes", "time": "2 hours ago", "type": "analysis"},
        {"action": "Generated insight", "target": "Drug interaction warning", "time": "4 hours ago", "type": "insight"},
        {"action": "Reviewed report", "target": "Q4 Patient Outcomes", "time": "Yesterday", "type": "report"},
        {"action": "Analyzed treatment", "target": "Sertraline for Depression", "time": "2 days ago", "type": "analysis"},
    ],
)


@router.get("", response_model=UserProfile)
def get_profile():
    return _profile
