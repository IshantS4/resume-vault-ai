#!/usr/bin/env python
"""
main.py — ResumeVault entry points.

CLI usage (crewai run / pyproject scripts):
    resume_vault                  → uses a built-in sample JD
    run_crew                      → same as above

FastAPI usage (for Next.js frontend integration):
    uvicorn resume_vault.main:app --reload --port 8000

    POST /generate-resume
    Body: { "job_description": "<full JD text>" }
    Returns: { "resume": <ResumeOutput JSON object> }
"""

import json
import sys
import warnings
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from resume_vault.crew import ResumeVault

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

# Monkey patch to kill the CrewAI cache_breakpoint bug for Groq
import crewai.llms.cache as _crewai_cache
_crewai_cache.mark_cache_breakpoint = lambda msg: msg
# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="ResumeVault API",
    description="AI-powered resume generation pipeline backed by CrewAI.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateResumeRequest(BaseModel):
    job_description: str


class GenerateResumeResponse(BaseModel):
    resume: dict


@app.post("/generate-resume", response_model=GenerateResumeResponse)
async def generate_resume(request: GenerateResumeRequest):
    """
    Runs the 3-agent CrewAI pipeline and returns a structured JSON resume
    ready for the Next.js frontend to render into a PDF.
    """
    if not request.job_description.strip():
        raise HTTPException(status_code=400, detail="job_description cannot be empty.")

    inputs = {"job_description": request.job_description}

    try:
        result = await ResumeVault().crew().kickoff_async(inputs=inputs)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    # crew().kickoff returns a CrewOutput object; .raw is the final task's string output
    raw_output: str = result.raw if hasattr(result, "raw") else str(result)

    # Strip accidental markdown fences if the LLM wrapped the JSON
    raw_output = raw_output.strip()
    if raw_output.startswith("```"):
        lines = raw_output.splitlines()
        raw_output = "\n".join(
            line for line in lines if not line.strip().startswith("```")
        ).strip()

    try:
        resume_json = json.loads(raw_output)
    except json.JSONDecodeError:
        # Return raw string wrapped so the frontend can still display it
        resume_json = {"raw_markdown": raw_output}

    return GenerateResumeResponse(resume=resume_json)


@app.get("/health")
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# CLI entry points (used by pyproject.toml scripts)
# ---------------------------------------------------------------------------

SAMPLE_JD = """
Senior Software Engineer — Distributed Systems
Company: HyperScale Inc.

We are looking for a Senior Software Engineer to join our Platform team.

Requirements:
- 4+ years of professional software engineering experience
- Strong proficiency in Python and Go
- Experience building and operating microservices at scale
- Deep understanding of distributed systems concepts: consensus, CAP theorem,
  event-driven architecture, message queues (Kafka preferred)
- Hands-on experience with Kubernetes and container orchestration
- Familiarity with AWS cloud services (ECS, SQS, RDS, S3)
- Experience with PostgreSQL and Redis in production
- Proficiency with CI/CD pipelines (GitHub Actions preferred)

Nice to have:
- Experience with LLM integrations or AI/ML pipelines
- Knowledge of gRPC and protocol buffers
- Open-source contributions

You will design, build, and maintain high-throughput backend services serving
millions of requests per day, lead system design discussions, and mentor junior
engineers.
"""


def run():
    """Run the crew with the sample JD (CLI entry point)."""
    inputs = {"job_description": SAMPLE_JD}
    try:
        result = ResumeVault().crew().kickoff(inputs=inputs)
        print("\n========== RESUME OUTPUT ==========\n")
        print(result.raw if hasattr(result, "raw") else str(result))
    except Exception as e:
        raise Exception(f"An error occurred while running the crew: {e}")


def train():
    inputs = {"job_description": SAMPLE_JD}
    try:
        ResumeVault().crew().train(
            n_iterations=int(sys.argv[1]),
            filename=sys.argv[2],
            inputs=inputs,
        )
    except Exception as e:
        raise Exception(f"An error occurred while training the crew: {e}")


def replay():
    try:
        ResumeVault().crew().replay(task_id=sys.argv[1])
    except Exception as e:
        raise Exception(f"An error occurred while replaying the crew: {e}")


def test():
    inputs = {"job_description": SAMPLE_JD}
    try:
        ResumeVault().crew().test(
            n_iterations=int(sys.argv[1]),
            eval_llm=sys.argv[2],
            inputs=inputs,
        )
    except Exception as e:
        raise Exception(f"An error occurred while testing the crew: {e}")


if __name__ == "__main__":
    uvicorn.run("resume_vault.main:app", host="0.0.0.0", port=8000, reload=True)
