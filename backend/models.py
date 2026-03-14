from pydantic import BaseModel
from typing import Optional, Literal


# ── Dashboard ─────────────────────────────────────────────────────────────────

class StatCard(BaseModel):
    title: str
    value: str
    change: str
    description: str
    color: str


class SideEffectBar(BaseModel):
    name: str
    value: int


class RecoveryPoint(BaseModel):
    week: str
    patients: int
    recovered: int


class SentimentPoint(BaseModel):
    month: str
    positive: int
    neutral: int
    negative: int


class RecentTreatment(BaseModel):
    name: str
    condition: str
    sentiment: Literal["positive", "neutral", "negative"]
    analyses: int
    trend: Literal["up", "stable", "down"]


class DashboardStats(BaseModel):
    stats: list[StatCard]
    side_effects: list[SideEffectBar]
    recovery_data: list[RecoveryPoint]
    sentiment_data: list[SentimentPoint]
    recent_treatments: list[RecentTreatment]


# ── Treatments ────────────────────────────────────────────────────────────────

class TreatmentSummary(BaseModel):
    id: int
    name: str
    condition: str
    patients: int
    rating: float


class SideEffect(BaseModel):
    name: str
    percentage: int
    severity: Literal["mild", "moderate", "severe"]


class SentimentSlice(BaseModel):
    name: str
    value: int
    fill: str


class RecoveryMilestone(BaseModel):
    week: str
    percentage: int
    milestone: str


class TreatmentDetail(BaseModel):
    id: int
    name: str
    condition: str
    total_patients: int
    avg_recovery_weeks: float
    positive_rate: int
    analyses: int
    side_effects: list[SideEffect]
    sentiment_breakdown: list[SentimentSlice]
    recovery_timeline: list[RecoveryMilestone]


# ── AI Insights ───────────────────────────────────────────────────────────────

class InsightStat(BaseModel):
    label: str
    value: str
    change: str


class Insight(BaseModel):
    id: int
    type: Literal["discovery", "alert", "trend"]
    title: str
    summary: str
    details: str
    treatment: str
    condition: str
    confidence: int
    impact: Literal["high", "medium", "low"]
    date: str
    data_points: int
    actionable: bool


# ── Patient Experiences ───────────────────────────────────────────────────────

class Experience(BaseModel):
    id: int
    author: str
    initials: str
    treatment: str
    condition: str
    date: str
    content: str
    tags: list[str]
    sentiment: Literal["positive", "neutral", "negative"]
    credibility_score: int
    likes: int
    replies: int
    verified: bool


# ── Profile ───────────────────────────────────────────────────────────────────

class UserStat(BaseModel):
    label: str
    value: str
    trend: str


class ActivityItem(BaseModel):
    action: str
    target: str
    time: str
    type: str


class UserProfile(BaseModel):
    name: str
    role: str
    organization: str
    location: str
    member_since: str
    plan: str
    avatar_seed: str
    stats: list[UserStat]
    recent_activity: list[ActivityItem]
