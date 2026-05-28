import json
import os
from pathlib import Path
from typing import Type

from crewai.tools import BaseTool
from pydantic import BaseModel, Field


class ProfileLoaderInput(BaseModel):
    """Input schema for ProfileLoaderTool — no arguments needed."""
    placeholder: str = Field(
        default="load",
        description="Pass any string (e.g. 'load') to trigger profile loading.",
    )


class ProfileLoaderTool(BaseTool):
    """Loads the candidate master profile from the bundled JSON file.

    Returns the full profile as a JSON string so the agent can reason
    over it and filter relevant sections based on JD requirements.
    """

    name: str = "ProfileLoaderTool"
    description: str = (
        "Loads the candidate's complete master profile from disk and returns it "
        "as a JSON string. Call this tool once at the start of the "
        "filter_candidate_data_task to access all experience, projects, skills, "
        "education, and certifications."
    )
    args_schema: Type[BaseModel] = ProfileLoaderInput

    def _run(self, placeholder: str = "load") -> str:
        profile_path = Path(__file__).parent.parent / "candidate_profile.json"
        if not profile_path.exists():
            return json.dumps({"error": f"Profile file not found at {profile_path}"})
        with open(profile_path, "r", encoding="utf-8") as f:
            profile_data = json.load(f)
        return json.dumps(profile_data, ensure_ascii=False, indent=2)
