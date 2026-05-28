"use client";

import { useState } from "react";

interface ContactInfo {
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
}

interface ResumeItem {
  title?: string;
  role?: string;
  company?: string;
  degree?: string;
  institution?: string;
  name?: string;
  description?: string;
  date?: string;
  bullets?: string[]; // Added to fix your missing bullet points
}

interface ResumeData {
  candidate_name: string;
  contact?: ContactInfo;
  summary: string;
  skills: string[];
  experience?: ResumeItem[];
  projects?: ResumeItem[];
  education?: ResumeItem[];
  certifications?: ResumeItem[];
}

interface ApiResponse {
  resume: ResumeData;
}

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "json">("preview"); // JSON View Toggle State

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

  const renderItem = (item: ResumeItem, index: number) => {
    const heading = item.title || item.role || item.degree || item.name;
    const subtext = item.company || item.institution;

    return (
      <div key={index} className="experience-item" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "between", alignItems: "start" }}>
          <div>
            {heading && <h4 className="item-title" style={{ margin: 0, fontWeight: "bold" }}>{heading}</h4>}
            {subtext && <h5 className="item-subtitle" style={{ margin: "0.25rem 0", color: "#555" }}>{subtext}</h5>}
          </div>
          {item.date && <span className="item-date" style={{ marginLeft: "auto", fontSize: "0.9rem", color: "#666" }}>{item.date}</span>}
        </div>
        {item.description && <p className="item-desc" style={{ margin: "0.5rem 0" }}>{item.description}</p>}
        
        {/* Render bullet points array if it exists */}
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
    <main className="container" style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Hide controls when printing */}
      <div className="no-print">
        <header className="header" style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h1>AI Resume Builder</h1>
          <p>Paste a job description below and let AI generate a perfectly tailored ATS-friendly resume instantly.</p>
        </header>

        <section className="input-section" style={{ marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                  <div style={{ marginTop: "0.5rem" }}>
                    {resumeData.certifications.map(renderItem)}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Inject Global CSS to handle printing rules smoothly */}
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