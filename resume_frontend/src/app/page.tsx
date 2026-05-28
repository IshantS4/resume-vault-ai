 "use client";

import { useEffect, useState } from "react";

interface ContactInfo {
  email: string;
  phone: string;
  linkedin: string;
  github: string;
}

interface ExperienceItem {
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  location: string;
  bullets: string[];
}

interface ProjectItem {
  name: string;
  tech_stack: string[];
  description: string;
  bullets: string[];
  github: string;
  live?: string;
}

interface EducationItem {
  institution: string;
  degree: string;
  year: string;
  gpa?: string;
}

interface ResumeData {
  candidate_name: string;
  contact: ContactInfo;
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: string[];
  achievements: string[];
}

interface ApiResponse {
  resume: ResumeData;
}

const createEmptyExperience = (): ExperienceItem => ({
  company: "",
  title: "",
  start_date: "",
  end_date: "",
  location: "",
  bullets: [""],
});

const createEmptyProject = (): ProjectItem => ({
  name: "",
  tech_stack: [""],
  description: "",
  bullets: [""],
  github: "",
  live: "",
});

const defaultProfile: ResumeData = {
  candidate_name: "",
  contact: {
    email: "",
    phone: "",
    linkedin: "",
    github: "",
  },
  summary: "",
  skills: [""],
  experience: [createEmptyExperience()],
  projects: [createEmptyProject()],
  education: [],
  certifications: [],
  achievements: [],
};

export default function Home() {
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "json">("preview");
  const [profile, setProfile] = useState<ResumeData>(defaultProfile);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste a job description first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/generate-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ job_description: jobDescription }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate resume. Please check the backend server.");
      }

      const data: ApiResponse = await response.json();
      if (data.resume) {
        setResumeData(data.resume);
      } else {
        setResumeData(data as unknown as ResumeData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print(); // Triggers high-quality, native OS PDF rendering
  };
  const fetchProfile = async () => {
    setIsProfileLoading(true);
    setProfileMessage(null);
    try {
      const response = await fetch("/api/profile", { method: "GET" });
      if (!response.ok) {
        throw new Error("Failed to load candidate profile.");
      }
      const data = (await response.json()) as Partial<ResumeData>;
      setProfile({
        candidate_name: data.candidate_name ?? "",
        contact: {
          email: data.contact?.email ?? "",
          phone: data.contact?.phone ?? "",
          linkedin: data.contact?.linkedin ?? "",
          github: data.contact?.github ?? "",
        },
        summary: data.summary ?? "",
        skills: Array.isArray(data.skills) && data.skills.length > 0 ? data.skills : [""],
        experience:
          Array.isArray(data.experience) && data.experience.length > 0
            ? data.experience.map((item) => ({
                company: item.company ?? "",
                title: item.title ?? "",
                start_date: item.start_date ?? "",
                end_date: item.end_date ?? "",
                location: item.location ?? "",
                bullets: Array.isArray(item.bullets) && item.bullets.length > 0 ? item.bullets : [""],
              }))
            : [createEmptyExperience()],
        projects:
          Array.isArray(data.projects) && data.projects.length > 0
            ? data.projects.map((item) => ({
                name: item.name ?? "",
                tech_stack:
                  Array.isArray(item.tech_stack) && item.tech_stack.length > 0 ? item.tech_stack : [""],
                description: item.description ?? "",
                bullets: Array.isArray(item.bullets) && item.bullets.length > 0 ? item.bullets : [""],
                github: item.github ?? "",
                live: item.live ?? "",
              }))
            : [createEmptyProject()],
        education: Array.isArray(data.education) ? data.education : [],
        certifications: Array.isArray(data.certifications) ? data.certifications : [],
        achievements: Array.isArray(data.achievements) ? data.achievements : [],
      });
    } catch (err) {
      setProfileMessage(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
  }, []);

  const saveProfile = async () => {
    setIsProfileSaving(true);
    setProfileMessage(null);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!response.ok) {
        throw new Error("Failed to save profile.");
      }
      setProfileMessage("Profile saved successfully.");
    } catch (err) {
      setProfileMessage(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const updateContact = (key: keyof ContactInfo, value: string) => {
    setProfile((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        [key]: value,
      },
    }));
  };

  const updateSkill = (index: number, value: string) => {
    setProfile((prev) => {
      const skills = [...prev.skills];
      skills[index] = value;
      return { ...prev, skills };
    });
  };

  const addSkill = () => setProfile((prev) => ({ ...prev, skills: [...prev.skills, ""] }));
  const removeSkill = (index: number) =>
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));

  const updateExperience = (index: number, key: keyof ExperienceItem, value: string) => {
    setProfile((prev) => {
      const experience = [...prev.experience];
      experience[index] = { ...experience[index], [key]: value };
      return { ...prev, experience };
    });
  };

  const updateExperienceBullet = (experienceIndex: number, bulletIndex: number, value: string) => {
    setProfile((prev) => {
      const experience = [...prev.experience];
      const bullets = [...experience[experienceIndex].bullets];
      bullets[bulletIndex] = value;
      experience[experienceIndex] = { ...experience[experienceIndex], bullets };
      return { ...prev, experience };
    });
  };

  const addExperience = () =>
    setProfile((prev) => ({
      ...prev,
      experience: [...prev.experience, createEmptyExperience()],
    }));

  const removeExperience = (index: number) =>
    setProfile((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));

  const addExperienceBullet = (index: number) =>
    setProfile((prev) => {
      const experience = [...prev.experience];
      experience[index] = { ...experience[index], bullets: [...experience[index].bullets, ""] };
      return { ...prev, experience };
    });

  const removeExperienceBullet = (experienceIndex: number, bulletIndex: number) =>
    setProfile((prev) => {
      const experience = [...prev.experience];
      experience[experienceIndex] = {
        ...experience[experienceIndex],
        bullets: experience[experienceIndex].bullets.filter((_, i) => i !== bulletIndex),
      };
      return { ...prev, experience };
    });

  const updateProject = (index: number, key: keyof ProjectItem, value: string) => {
    setProfile((prev) => {
      const projects = [...prev.projects];
      projects[index] = { ...projects[index], [key]: value };
      return { ...prev, projects };
    });
  };

  const updateProjectBullet = (projectIndex: number, bulletIndex: number, value: string) => {
    setProfile((prev) => {
      const projects = [...prev.projects];
      const bullets = [...projects[projectIndex].bullets];
      bullets[bulletIndex] = value;
      projects[projectIndex] = { ...projects[projectIndex], bullets };
      return { ...prev, projects };
    });
  };

  const updateProjectTech = (projectIndex: number, techIndex: number, value: string) => {
    setProfile((prev) => {
      const projects = [...prev.projects];
      const tech = [...projects[projectIndex].tech_stack];
      tech[techIndex] = value;
      projects[projectIndex] = { ...projects[projectIndex], tech_stack: tech };
      return { ...prev, projects };
    });
  };

  const addProject = () =>
    setProfile((prev) => ({
      ...prev,
      projects: [...prev.projects, createEmptyProject()],
    }));

  const removeProject = (index: number) =>
    setProfile((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));

  const addProjectBullet = (index: number) =>
    setProfile((prev) => {
      const projects = [...prev.projects];
      projects[index] = { ...projects[index], bullets: [...projects[index].bullets, ""] };
      return { ...prev, projects };
    });

  const removeProjectBullet = (projectIndex: number, bulletIndex: number) =>
    setProfile((prev) => {
      const projects = [...prev.projects];
      projects[projectIndex] = {
        ...projects[projectIndex],
        bullets: projects[projectIndex].bullets.filter((_, i) => i !== bulletIndex),
      };
      return { ...prev, projects };
    });

  const addProjectTech = (index: number) =>
    setProfile((prev) => {
      const projects = [...prev.projects];
      projects[index] = { ...projects[index], tech_stack: [...projects[index].tech_stack, ""] };
      return { ...prev, projects };
    });

  const removeProjectTech = (projectIndex: number, techIndex: number) =>
    setProfile((prev) => {
      const projects = [...prev.projects];
      projects[projectIndex] = {
        ...projects[projectIndex],
        tech_stack: projects[projectIndex].tech_stack.filter((_, i) => i !== techIndex),
      };
      return { ...prev, projects };
    });

  const renderItem = (
    item: {
      title?: string;
      company?: string;
      degree?: string;
      institution?: string;
      name?: string;
      description?: string;
      start_date?: string;
      end_date?: string;
      bullets?: string[];
    },
    index: number
  ) => {
    const heading = item.title || item.degree || item.name;
    const subtext = item.company || item.institution;
    const dateText =
      item.start_date || item.end_date ? `${item.start_date ?? ""} - ${item.end_date ?? ""}` : "";

    return (
      <div key={index} className="experience-item" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div>
            {heading && <h4 className="item-title" style={{ margin: 0, fontWeight: "bold" }}>{heading}</h4>}
            {subtext && <h5 className="item-subtitle" style={{ margin: "0.25rem 0", color: "#555" }}>{subtext}</h5>}
          </div>
          {dateText && (
            <span className="item-date" style={{ marginLeft: "auto", fontSize: "0.9rem", color: "#666" }}>
              {dateText}
            </span>
          )}
        </div>
        {item.description && <p className="item-desc" style={{ margin: "0.5rem 0" }}>{item.description}</p>}

        {item.bullets && item.bullets.length > 0 && (
          <ul className="item-bullets-list" style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
            {item.bullets.map((bullet, bIndex) => (
              <li key={bIndex} className="resume-bullet" style={{ marginBottom: "0.25rem" }}>
                {bullet}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <main className="container mx-auto max-w-5xl bg-slate-950 px-4 py-8 text-slate-100">
      <div className="no-print">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">AI Resume Builder</h1>
          <p className="mt-2 text-slate-400">
            Build your profile first, then generate a tailored ATS-friendly resume.
          </p>
        </header>

        <div className="mb-6 flex gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2">
          <button
            onClick={() => setActiveStep(1)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeStep === 1
                ? "bg-slate-800 text-blue-300 shadow"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            Step 1: Profile Builder
          </button>
          <button
            onClick={() => setActiveStep(2)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeStep === 2
                ? "bg-slate-800 text-blue-300 shadow"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            Step 2: Resume Generator
          </button>
        </div>

        {activeStep === 1 && (
          <section className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white">Candidate Profile</h2>
            {isProfileLoading ? (
              <p className="text-slate-400">Loading profile...</p>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-slate-300">Candidate Name</span>
                    <input
                      className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={profile.candidate_name}
                      onChange={(e) => setProfile((prev) => ({ ...prev, candidate_name: e.target.value }))}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-300">Email</span>
                    <input
                      className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={profile.contact.email}
                      onChange={(e) => updateContact("email", e.target.value)}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-300">Phone</span>
                    <input
                      className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={profile.contact.phone}
                      onChange={(e) => updateContact("phone", e.target.value)}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-300">LinkedIn</span>
                    <input
                      className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={profile.contact.linkedin}
                      onChange={(e) => updateContact("linkedin", e.target.value)}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-slate-300">GitHub</span>
                    <input
                      className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={profile.contact.github}
                      onChange={(e) => updateContact("github", e.target.value)}
                    />
                  </label>
                </div>

                <label className="space-y-1 mt-4 block">
                  <span className="text-sm font-medium text-slate-300">Summary</span>
                  <textarea
                    className="min-h-24 w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={profile.summary}
                    onChange={(e) => setProfile((prev) => ({ ...prev, summary: e.target.value }))}
                  />
                </label>

                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-100">Skills</h3>
                    <button
                      type="button"
                      onClick={addSkill}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
                    >
                      Add Skill
                    </button>
                  </div>
                  {profile.skills.map((skill, index) => (
                    <div key={`skill-${index}`} className="flex gap-2">
                      <input
                        className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={skill}
                        onChange={(e) => updateSkill(index, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30 font-medium py-1 px-2 rounded text-sm transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-900 rounded-lg p-6 mb-6 shadow-lg border border-gray-800 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-100">Experience</h3>
                    <button
                      type="button"
                      onClick={addExperience}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
                    >
                      Add Experience
                    </button>
                  </div>
                  <div className="space-y-4">
                    {profile.experience.map((item, expIndex) => (
                      <div key={`exp-${expIndex}`} className="space-y-3 rounded-lg border border-slate-700 bg-gray-800 p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <input className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Company" value={item.company} onChange={(e) => updateExperience(expIndex, "company", e.target.value)} />
                          <input className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Title" value={item.title} onChange={(e) => updateExperience(expIndex, "title", e.target.value)} />
                          <input className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Start Date (YYYY-MM)" value={item.start_date} onChange={(e) => updateExperience(expIndex, "start_date", e.target.value)} />
                          <input className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="End Date" value={item.end_date} onChange={(e) => updateExperience(expIndex, "end_date", e.target.value)} />
                          <input className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none md:col-span-2" placeholder="Location" value={item.location} onChange={(e) => updateExperience(expIndex, "location", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-300">Bullets</p>
                            <button type="button" onClick={() => addExperienceBullet(expIndex)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-sm transition-colors">Add Bullet</button>
                          </div>
                          {item.bullets.map((bullet, bulletIndex) => (
                            <div key={`exp-${expIndex}-bullet-${bulletIndex}`} className="flex gap-2">
                              <input className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={bullet} onChange={(e) => updateExperienceBullet(expIndex, bulletIndex, e.target.value)} />
                              <button type="button" onClick={() => removeExperienceBullet(expIndex, bulletIndex)} className="text-red-400 hover:text-red-300 hover:bg-red-900/30 font-medium py-1 px-2 rounded text-sm transition-colors">Remove</button>
                            </div>
                          ))}
                        </div>
                        <button type="button" onClick={() => removeExperience(expIndex)} className="text-red-400 hover:text-red-300 hover:bg-red-900/30 font-medium py-1 px-2 rounded text-sm transition-colors">Remove Experience</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-6 mb-6 shadow-lg border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-100">Projects</h3>
                    <button
                      type="button"
                      onClick={addProject}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
                    >
                      Add Project
                    </button>
                  </div>
                  <div className="space-y-4">
                    {profile.projects.map((item, projectIndex) => (
                      <div key={`project-${projectIndex}`} className="space-y-3 rounded-lg border border-slate-700 bg-gray-800 p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <input className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Project Name" value={item.name} onChange={(e) => updateProject(projectIndex, "name", e.target.value)} />
                          <input className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="GitHub URL" value={item.github} onChange={(e) => updateProject(projectIndex, "github", e.target.value)} />
                          <input className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none md:col-span-2" placeholder="Live URL (optional)" value={item.live ?? ""} onChange={(e) => updateProject(projectIndex, "live", e.target.value)} />
                        </div>
                        <textarea className="min-h-20 w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Description" value={item.description} onChange={(e) => updateProject(projectIndex, "description", e.target.value)} />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-300">Tech Stack</p>
                            <button type="button" onClick={() => addProjectTech(projectIndex)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-sm transition-colors">Add Tech</button>
                          </div>
                          {item.tech_stack.map((tech, techIndex) => (
                            <div key={`project-${projectIndex}-tech-${techIndex}`} className="flex gap-2">
                              <input className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={tech} onChange={(e) => updateProjectTech(projectIndex, techIndex, e.target.value)} />
                              <button type="button" onClick={() => removeProjectTech(projectIndex, techIndex)} className="text-red-400 hover:text-red-300 hover:bg-red-900/30 font-medium py-1 px-2 rounded text-sm transition-colors">Remove</button>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-300">Bullets</p>
                            <button type="button" onClick={() => addProjectBullet(projectIndex)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-sm transition-colors">Add Bullet</button>
                          </div>
                          {item.bullets.map((bullet, bulletIndex) => (
                            <div key={`project-${projectIndex}-bullet-${bulletIndex}`} className="flex gap-2">
                              <input className="w-full bg-gray-800 text-white rounded-md border border-gray-700 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={bullet} onChange={(e) => updateProjectBullet(projectIndex, bulletIndex, e.target.value)} />
                              <button type="button" onClick={() => removeProjectBullet(projectIndex, bulletIndex)} className="text-red-400 hover:text-red-300 hover:bg-red-900/30 font-medium py-1 px-2 rounded text-sm transition-colors">Remove</button>
                            </div>
                          ))}
                        </div>
                        <button type="button" onClick={() => removeProject(projectIndex)} className="text-red-400 hover:text-red-300 hover:bg-red-900/30 font-medium py-1 px-2 rounded text-sm transition-colors">Remove Project</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={isProfileSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-sm transition-colors disabled:opacity-70"
                  >
                    {isProfileSaving ? "Saving..." : "Save Profile"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded text-sm transition-colors border border-gray-600"
                  >
                    Continue to Resume Generator
                  </button>
                  {profileMessage && <p className="text-sm text-slate-400">{profileMessage}</p>}
                </div>
              </>
            )}
          </section>
        )}

        {activeStep === 2 && (
          <section className="input-section mb-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Resume Generator</h2>
            <textarea
              style={{ width: "100%", minHeight: "150px", padding: "1rem", borderRadius: "6px", border: "1px solid #ccc" }}
              placeholder="Paste the target job description here... (e.g. 'We are looking for a Senior Frontend Engineer with Next.js experience...')"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isLoading}
            />

            <button
              className="generate-btn"
              style={{ padding: "0.75rem 1.5rem", borderRadius: "6px", backgroundColor: "#0070f3", color: "white", border: "none", fontWeight: "bold", cursor: "pointer" }}
              onClick={handleGenerate}
              disabled={isLoading || !jobDescription.trim()}
            >
              {isLoading ? "Generating Resume..." : "Generate Resume"}
            </button>

            {error && <div className="error-message" style={{ color: "red", marginTop: "0.5rem" }}>{error}</div>}
          </section>
        )}
      </div>

      {resumeData && (
        <section className="resume-result">
          {/* Action controls (Hidden during print) */}
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button 
                onClick={() => setViewMode("preview")}
                style={{ padding: "0.5rem 1rem", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: viewMode === "preview" ? "#0070f3" : "white", color: viewMode === "preview" ? "white" : "black" }}
              >
                Document View
              </button>
              <button 
                onClick={() => setViewMode("json")}
                style={{ padding: "0.5rem 1rem", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: viewMode === "json" ? "#0070f3" : "white", color: viewMode === "json" ? "white" : "black" }}
              >
                View Raw JSON
              </button>
            </div>
            
            <button 
              onClick={handlePrint}
              style={{ padding: "0.5rem 1rem", borderRadius: "4px", backgroundColor: "#10b981", color: "white", border: "none", fontWeight: "bold", cursor: "pointer" }}
            >
              Export to PDF
            </button>
          </div>

          {/* Conditional Rendering Based on Toggle */}
          {viewMode === "json" ? (
            <div className="json-container" style={{ backgroundColor: "#f5f5f5", padding: "1rem", borderRadius: "6px", overflowX: "auto" }}>
              <pre><code>{JSON.stringify(resumeData, null, 2)}</code></pre>
            </div>
          ) : (
            <div id="resume-document-pane" className="print-area" style={{ backgroundColor: "white", padding: "1rem", color: "black" }}>
              <div className="resume-header" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <h2 className="resume-name" style={{ margin: "0 0 0.5rem 0", fontSize: "2rem" }}>{resumeData.candidate_name || "Applicant Name"}</h2>

                {resumeData.contact && (
                  <div className="contact-info" style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem", fontSize: "0.9rem" }}>
                    {resumeData.contact.email && <a href={`mailto:${resumeData.contact.email}`} className="contact-link">{resumeData.contact.email}</a>}
                    {resumeData.contact.phone && <span className="contact-link">{resumeData.contact.phone}</span>}
                    {resumeData.contact.linkedin && <a href={resumeData.contact.linkedin} target="_blank" rel="noopener noreferrer" className="contact-link">LinkedIn</a>}
                    {resumeData.contact.github && <a href={resumeData.contact.github} target="_blank" rel="noopener noreferrer" className="contact-link">GitHub</a>}
                  </div>
                )}

                {resumeData.summary && <p className="resume-summary" style={{ textAlign: "justify", lineHeight: "1.5" }}>{resumeData.summary}</p>}
              </div>

              {resumeData.skills && resumeData.skills.length > 0 && (
                <div className="resume-section" style={{ marginBottom: "1.5rem" }}>
                  <h3 className="section-title" style={{ borderBottom: "2px solid #333", paddingBottom: "0.25rem", textTransform: "uppercase", fontSize: "1.2rem" }}>Core Competencies</h3>
                  <div className="skills-list" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                    {resumeData.skills.map((skill, index) => (
                      <span key={index} className="skill-tag" style={{ backgroundColor: "#e5e7eb", padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.85rem" }}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {resumeData.experience && resumeData.experience.length > 0 && (
                <div className="resume-section" style={{ marginBottom: "1.5rem" }}>
                  <h3 className="section-title" style={{ borderBottom: "2px solid #333", paddingBottom: "0.25rem", textTransform: "uppercase", fontSize: "1.2rem" }}>Professional Experience</h3>
                  <div style={{ marginTop: "0.5rem" }}>
                    {resumeData.experience.map(renderItem)}
                  </div>
                </div>
              )}

              {resumeData.projects && resumeData.projects.length > 0 && (
                <div className="resume-section" style={{ marginBottom: "1.5rem" }}>
                  <h3 className="section-title" style={{ borderBottom: "2px solid #333", paddingBottom: "0.25rem", textTransform: "uppercase", fontSize: "1.2rem" }}>Notable Projects</h3>
                  <div style={{ marginTop: "0.5rem" }}>
                    {resumeData.projects.map(renderItem)}
                  </div>
                </div>
              )}

              {resumeData.education && resumeData.education.length > 0 && (
                <div className="resume-section" style={{ marginBottom: "1.5rem" }}>
                  <h3 className="section-title" style={{ borderBottom: "2px solid #333", paddingBottom: "0.25rem", textTransform: "uppercase", fontSize: "1.2rem" }}>Education</h3>
                  <div style={{ marginTop: "0.5rem" }}>
                    {resumeData.education.map(renderItem)}
                  </div>
                </div>
              )}

              {resumeData.certifications && resumeData.certifications.length > 0 && (
                <div className="resume-section" style={{ marginBottom: "1.5rem" }}>
                  <h3 className="section-title" style={{ borderBottom: "2px solid #333", paddingBottom: "0.25rem", textTransform: "uppercase", fontSize: "1.2rem" }}>Certifications</h3>
                  <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                    {resumeData.certifications.map((certification, index) => (
                      <li key={index}>{certification}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </main>
  );
}