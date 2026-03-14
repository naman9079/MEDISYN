from fastapi import APIRouter, HTTPException, Query
from models import Experience

router = APIRouter()

_experiences: list[Experience] = [
    Experience(
        id=1,
        author="Anonymous User",
        initials="AU",
        treatment="Metformin",
        condition="Type 2 Diabetes",
        date="2 days ago",
        content="Started Metformin 3 months ago. Initial nausea was tough for the first 2 weeks, but it significantly improved. My blood sugar levels are now stable and within the target range. Overall very satisfied with the treatment.",
        tags=["Recovery", "Outcome"],
        sentiment="positive",
        credibility_score=92,
        likes=47,
        replies=12,
        verified=True,
    ),
    Experience(
        id=2,
        author="Patient 2847",
        initials="P2",
        treatment="Lisinopril",
        condition="Hypertension",
        date="5 days ago",
        content="Experienced a persistent dry cough as a side effect which was quite bothersome. Doctor switched me to an ARB instead. Blood pressure control was good while on it though.",
        tags=["Side Effects"],
        sentiment="neutral",
        credibility_score=88,
        likes=34,
        replies=8,
        verified=True,
    ),
    Experience(
        id=3,
        author="Anonymous User",
        initials="AU",
        treatment="Sertraline",
        condition="Anxiety",
        date="1 week ago",
        content="The first few weeks were challenging with increased anxiety and sleep issues. But after week 4, I started noticing significant improvement in my mood and anxiety levels. Now at month 3 and feeling much better.",
        tags=["Side Effects", "Recovery", "Outcome"],
        sentiment="positive",
        credibility_score=95,
        likes=89,
        replies=23,
        verified=True,
    ),
    Experience(
        id=4,
        author="Patient 1893",
        initials="P1",
        treatment="Omeprazole",
        condition="GERD",
        date="2 weeks ago",
        content="Works well for acid reflux control. Taking it for 6 months now. Doctor mentioned concerns about long-term use and B12 absorption. Planning to discuss tapering strategy.",
        tags=["Outcome"],
        sentiment="positive",
        credibility_score=85,
        likes=28,
        replies=15,
        verified=False,
    ),
    Experience(
        id=5,
        author="Anonymous User",
        initials="AU",
        treatment="Atorvastatin",
        condition="High Cholesterol",
        date="3 weeks ago",
        content="Developed muscle pain in my legs after starting. Doctor reduced the dose and the symptoms improved. Cholesterol numbers look much better now. Monitoring liver enzymes regularly.",
        tags=["Side Effects", "Recovery"],
        sentiment="neutral",
        credibility_score=91,
        likes=42,
        replies=7,
        verified=True,
    ),
    Experience(
        id=6,
        author="Patient 5621",
        initials="P5",
        treatment="Metformin",
        condition="Type 2 Diabetes",
        date="1 month ago",
        content="Extended release version worked much better for me than regular Metformin. Less GI side effects. A1C dropped from 8.2 to 6.8 in 4 months. Very happy with the results.",
        tags=["Outcome", "Recovery"],
        sentiment="positive",
        credibility_score=94,
        likes=67,
        replies=19,
        verified=True,
    ),
]

# In-memory like tracking (keyed by experience id)
_liked: dict[int, int] = {}


@router.get("", response_model=list[Experience])
def list_experiences(
    search: str = Query(default="", description="Search by content, treatment, or condition"),
    tag: str = Query(default="all", description="Filter: all | side-effects | recovery | outcome"),
    sort_by: str = Query(default="recent", description="Sort: recent | popular | credibility"),
):
    results = list(_experiences)

    if search:
        q = search.lower()
        results = [
            e for e in results
            if q in e.content.lower() or q in e.treatment.lower() or q in e.condition.lower()
        ]

    if tag != "all":
        normalized = tag.replace("-", " ").title()
        results = [e for e in results if normalized in e.tags]

    if sort_by == "popular":
        results.sort(key=lambda e: e.likes, reverse=True)
    elif sort_by == "credibility":
        results.sort(key=lambda e: e.credibility_score, reverse=True)

    return results


@router.post("/{experience_id}/like", response_model=Experience)
def like_experience(experience_id: int):
    for exp in _experiences:
        if exp.id == experience_id:
            exp.likes += 1
            return exp
    raise HTTPException(status_code=404, detail="Experience not found")
