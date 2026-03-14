from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import dashboard, treatments, insights, experiences, profile

app = FastAPI(
    title="Medisyn API",
    description="Backend API for Medisyn – medical treatment analytics platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(treatments.router, prefix="/api/treatments", tags=["Treatments"])
app.include_router(insights.router, prefix="/api/insights", tags=["AI Insights"])
app.include_router(experiences.router, prefix="/api/experiences", tags=["Patient Experiences"])
app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])


@app.get("/")
def root():
    return {"message": "Medisyn API is running"}
