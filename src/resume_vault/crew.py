from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent

from resume_vault.tools.profile_loader_tool import ProfileLoaderTool


@CrewBase
class ResumeVault():
    """ResumeVault crew — 3-agent JD-to-Resume pipeline."""

    agents: list[BaseAgent]
    tasks: list[Task]

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    # ------------------------------------------------------------------
    # Agents
    # ------------------------------------------------------------------

    @agent
    def jd_analyzer(self) -> Agent:
        return Agent(
            config=self.agents_config["jd_analyzer"],  # type: ignore[index]
            verbose=True,
        )

    @agent
    def data_strategist(self) -> Agent:
        return Agent(
            config=self.agents_config["data_strategist"],  # type: ignore[index]
            tools=[ProfileLoaderTool()],
            verbose=True,
        )

    @agent
    def resume_writer(self) -> Agent:
        return Agent(
            config=self.agents_config["resume_writer"],  # type: ignore[index]
            verbose=True,
        )

    # ------------------------------------------------------------------
    # Tasks
    # ------------------------------------------------------------------

    @task
    def analyze_jd_task(self) -> Task:
        return Task(
            config=self.tasks_config["analyze_jd_task"],  # type: ignore[index]
        )

    @task
    def filter_candidate_data_task(self) -> Task:
        return Task(
            config=self.tasks_config["filter_candidate_data_task"],  # type: ignore[index]
        )

    @task
    def write_resume_task(self) -> Task:
        return Task(
            config=self.tasks_config["write_resume_task"],  # type: ignore[index]
            output_file="resume_output.json",
        )

    # ------------------------------------------------------------------
    # Crew
    # ------------------------------------------------------------------

    @crew
    def crew(self) -> Crew:
        """Assembles the ResumeVault crew with a sequential pipeline."""
        return Crew(
            agents=self.agents,   # populated automatically by @agent decorators
            tasks=self.tasks,     # populated automatically by @task decorators
            process=Process.sequential,
            verbose=True,
        )
