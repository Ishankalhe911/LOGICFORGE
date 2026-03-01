from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import engine, Base
from api.routes import submit, problems, sessions, analytics
from dotenv import load_dotenv

load_dotenv()

# create all tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LogicForge API",
    description="AI Cognitive Remediation Engine for Engineers",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(submit.router,    prefix="/api", tags=["Submit"])
app.include_router(problems.router,  prefix="/api", tags=["Problems"])
app.include_router(sessions.router,  prefix="/api", tags=["Sessions"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])

@app.get("/")
def root():
    return {"status": "LogicForge API is running"}