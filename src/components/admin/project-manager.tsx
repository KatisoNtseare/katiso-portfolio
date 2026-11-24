"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Edit3,
  Eye,
  EyeOff,
  FileImage,
  FolderKanban,
  LoaderCircle,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { Project } from "@/types/project";
import { toSlug } from "@/lib/slug";

type Draft = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: string;
  year: string;
  role: string;
  problem: string;
  solution: string;
  contributions: string;
  architecture: string;
  architectureFlow: string;
  challenges: string;
  outcomes: string;
  technologies: string;
  coverImage: string;
  liveUrl: string;
  demoUrl: string;
  repoUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: string;
};

type EditorTab = "overview" | "case-study" | "media";
type ProjectFilter = "all" | "published" | "drafts" | "featured";

const emptyDraft: Draft = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  category: "Software Development",
  year: "",
  role: "",
  problem: "",
  solution: "",
  contributions: "",
  architecture: "",
  architectureFlow: "",
  challenges: "",
  outcomes: "",
  technologies: "",
  coverImage: "",
  liveUrl: "",
  demoUrl: "",
  repoUrl: "",
  isFeatured: false,
  isPublished: false,
  sortOrder: "0",
};

function fromProject(project: Project): Draft {
  return {
    ...project,
    technologies: project.technologies.join(", "),
    architectureFlow: project.architectureFlow.join(" -> "),
    sortOrder: String(project.sortOrder),
  };
}

export function ProjectManager({ initialProjects }: { initialProjects: Project[] }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>("overview");
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const publishedCount = projects.filter((project) => project.isPublished).length;
  const draftCount = projects.length - publishedCount;
  const featuredCount = projects.filter((project) => project.isFeatured).length;

  const visibleProjects = useMemo(() => {
    const normalisedSearch = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesFilter = filter === "all"
        || (filter === "published" && project.isPublished)
        || (filter === "drafts" && !project.isPublished)
        || (filter === "featured" && project.isFeatured);
      const matchesSearch = !normalisedSearch
        || project.title.toLowerCase().includes(normalisedSearch)
        || project.summary.toLowerCase().includes(normalisedSearch)
        || project.category.toLowerCase().includes(normalisedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [filter, projects, search]);

  function openNew() {
    setDraft(emptyDraft);
    setEditingId(null);
    setEditorTab("overview");
    setShowForm(true);
    setNotice("");
    setError("");
  }

  function openEdit(project: Project) {
    setDraft(fromProject(project));
    setEditingId(project.id);
    setEditorTab("overview");
    setShowForm(true);
    setNotice("");
    setError("");
  }

  function update<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setDraft(emptyDraft);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    const payload = {
      ...draft,
      slug: draft.slug.trim() || toSlug(draft.title),
      technologies: draft.technologies.split(",").map((item) => item.trim()).filter(Boolean),
      architectureFlow: draft.architectureFlow.split("->").map((item) => item.trim()).filter(Boolean),
      sortOrder: Number(draft.sortOrder) || 0,
    };

    try {
      const response = await fetch(editingId ? `/api/projects/${editingId}` : "/api/projects", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { project?: Project; message?: string };
      if (!response.ok || !result.project) throw new Error(result.message || "Could not save the project.");

      setProjects((current) => editingId
        ? current.map((item) => item.id === editingId ? result.project! : item)
        : [result.project!, ...current]);
      setNotice(editingId ? "Project updated successfully." : "Project created successfully.");
      closeForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the project.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(project: Project) {
    if (!window.confirm(`Delete “${project.title}”? This cannot be undone.`)) return;
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Could not delete the project.");
      setProjects((current) => current.filter((item) => item.id !== project.id));
      setNotice("Project deleted.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the project.");
    }
  }

  async function togglePublish(project: Project) {
    const updated = fromProject(project);
    updated.isPublished = !project.isPublished;
    const payload = {
      ...updated,
      technologies: updated.technologies.split(",").map((item) => item.trim()).filter(Boolean),
      architectureFlow: updated.architectureFlow.split("->").map((item) => item.trim()).filter(Boolean),
      sortOrder: Number(updated.sortOrder) || 0,
    };

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { project?: Project; message?: string };
      if (!response.ok || !result.project) throw new Error(result.message || "Could not update publishing status.");
      setProjects((current) => current.map((item) => item.id === project.id ? result.project! : item));
      setNotice(result.project.isPublished ? "Project published." : "Project moved back to draft.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update project.");
    }
  }

  return (
    <div className="project-manager">
      <div className="manager-toolbar">
        <div>
          <span className="eyebrow">CONTENT WORKSPACE</span>
          <h2>Projects</h2>
          <p>Manage the work visitors see. Create a case study once, then keep it up to date.</p>
        </div>
        <button className="button button-primary" onClick={openNew}><Plus size={17} /> Add project</button>
      </div>

      <div className="manager-stats">
        <article className="manager-stat-card"><span className="manager-stat-icon"><FolderKanban size={17} /></span><span className="manager-stat-label">TOTAL PROJECTS</span><strong>{projects.length}</strong><small>Across your portfolio</small></article>
        <article className="manager-stat-card"><span className="manager-stat-icon manager-stat-icon-green"><Eye size={17} /></span><span className="manager-stat-label">PUBLISHED</span><strong>{publishedCount}</strong><small>Visible to visitors</small></article>
        <article className="manager-stat-card"><span className="manager-stat-icon manager-stat-icon-muted"><FileImage size={17} /></span><span className="manager-stat-label">DRAFTS</span><strong>{draftCount}</strong><small>Still being prepared</small></article>
        <article className="manager-stat-card"><span className="manager-stat-icon manager-stat-icon-red"><Edit3 size={17} /></span><span className="manager-stat-label">FEATURED</span><strong>{featuredCount}</strong><small>Eligible for the homepage</small></article>
      </div>

      {notice ? <div className="notice success"><Check size={16} /> {notice}</div> : null}
      {error ? <div className="notice error">{error}</div> : null}

      {showForm ? (
        <form className="project-editor" onSubmit={submit}>
          <div className="editor-heading">
            <div><span className="eyebrow">{editingId ? "UPDATE ENTRY" : "NEW ENTRY"}</span><h3>{editingId ? "Edit project" : "Create a project"}</h3><p>Keep the overview concise and use the case study fields to explain your engineering work.</p></div>
            <button type="button" className="icon-button" onClick={closeForm} aria-label="Close editor"><X size={19} /></button>
          </div>

          <div className="editor-tabs" role="group" aria-label="Project editor sections">
            <button type="button" aria-pressed={editorTab === "overview"} className={editorTab === "overview" ? "active" : ""} onClick={() => setEditorTab("overview")}><span>01</span> Overview</button>
            <button type="button" aria-pressed={editorTab === "case-study"} className={editorTab === "case-study" ? "active" : ""} onClick={() => setEditorTab("case-study")}><span>02</span> Case study</button>
            <button type="button" aria-pressed={editorTab === "media"} className={editorTab === "media" ? "active" : ""} onClick={() => setEditorTab("media")}><span>03</span> Media & links</button>
          </div>

          {editorTab === "overview" ? (
            <div className="editor-panel">
              <div className="editor-section-heading"><span>PROJECT DETAILS</span><p>Start with the information visitors will see in project listings.</p></div>
              <div className="editor-grid">
                <label>Project title *<input required minLength={2} maxLength={100} value={draft.title} onChange={(event) => { update("title", event.target.value); if (!editingId) update("slug", toSlug(event.target.value)); }} placeholder="Project name" /></label>
                <label>URL slug *<input required value={draft.slug} onChange={(event) => update("slug", toSlug(event.target.value))} placeholder="project-name" /><small>Used in the public project URL.</small></label>
                <label className="span-2">Short summary *<input required minLength={10} maxLength={240} value={draft.summary} onChange={(event) => update("summary", event.target.value)} placeholder="A concise description for the project card" /><small>Keep this to one or two sentences.</small></label>
                <label>Category<input maxLength={80} value={draft.category} onChange={(event) => update("category", event.target.value)} placeholder="Web application" /></label>
                <label>Year / period<input maxLength={20} value={draft.year} onChange={(event) => update("year", event.target.value)} placeholder="2026" /></label>
                <label>My role<input maxLength={120} value={draft.role} onChange={(event) => update("role", event.target.value)} placeholder="Software Developer" /></label>
                <label>Technologies<input value={draft.technologies} onChange={(event) => update("technologies", event.target.value)} placeholder="Next.js, TypeScript, PostgreSQL" /><small>Separate technologies with commas.</small></label>
                <label className="span-2">Project overview<textarea rows={5} value={draft.description} onChange={(event) => update("description", event.target.value)} placeholder="Explain what the project does, who it helps and its main purpose." /></label>
              </div>
            </div>
          ) : null}

          {editorTab === "case-study" ? (
            <div className="editor-panel">
              <div className="editor-section-heading"><span>ENGINEERING STORY</span><p>Describe the problem, your contribution and the thinking behind the solution.</p></div>
              <div className="editor-grid">
                <label>The problem<textarea rows={5} value={draft.problem} onChange={(event) => update("problem", event.target.value)} placeholder="What problem needed to be solved?" /></label>
                <label>The solution<textarea rows={5} value={draft.solution} onChange={(event) => update("solution", event.target.value)} placeholder="How does the solution address it?" /></label>
                <label>My contributions<textarea rows={5} value={draft.contributions} onChange={(event) => update("contributions", event.target.value)} placeholder="Be specific about your individual work and responsibilities." /></label>
                <label>Architecture explanation<textarea rows={5} value={draft.architecture} onChange={(event) => update("architecture", event.target.value)} placeholder="Describe the main components and how they interact." /></label>
                <label className="span-2">Architecture diagram flow<input value={draft.architectureFlow} onChange={(event) => update("architectureFlow", event.target.value)} placeholder="Browser -> Next.js -> API -> Database" /><small>Separate up to 8 diagram nodes with the arrow text -&gt;.</small></label>
                <label>Challenges & decisions<textarea rows={5} value={draft.challenges} onChange={(event) => update("challenges", event.target.value)} placeholder="Technical challenges and the decisions you made." /></label>
                <label>Outcomes & lessons<textarea rows={5} value={draft.outcomes} onChange={(event) => update("outcomes", event.target.value)} placeholder="Verified outcomes, lessons or measurable results." /></label>
              </div>
            </div>
          ) : null}

          {editorTab === "media" ? (
            <div className="editor-panel">
              <div className="editor-section-heading"><span>VISUALS & DESTINATIONS</span><p>Add a cover image and only link to environments or repositories that can be shared publicly.</p></div>
              <div className="editor-grid">
                <label className="span-2">Cover image URL<input type="url" value={draft.coverImage} onChange={(event) => update("coverImage", event.target.value)} placeholder="https://example.com/project-cover.jpg" /><small>Use a wide image. A 16:9 crop works best.</small></label>
                {draft.coverImage ? <div className="editor-image-preview span-2" style={{ backgroundImage: `url("${draft.coverImage}")` }}><span>IMAGE PREVIEW</span></div> : <div className="editor-image-empty span-2"><FileImage size={20} /><span>Cover preview will appear here once an image URL is added.</span></div>}
                <label>Live project URL<input type="url" value={draft.liveUrl} onChange={(event) => update("liveUrl", event.target.value)} placeholder="https://…" /></label>
                <label>Demo URL<input type="url" value={draft.demoUrl} onChange={(event) => update("demoUrl", event.target.value)} placeholder="https://…" /></label>
                <label>GitHub repository URL<input type="url" value={draft.repoUrl} onChange={(event) => update("repoUrl", event.target.value)} placeholder="https://github.com/…" /></label>
                <label>Display order<input type="number" min="0" max="10000" value={draft.sortOrder} onChange={(event) => update("sortOrder", event.target.value)} /></label>
              </div>
              <div className="editor-options">
                <label className="check-label"><input type="checkbox" checked={draft.isFeatured} onChange={(event) => update("isFeatured", event.target.checked)} /><span><strong>Feature on homepage</strong><small>Give this project priority in the featured work section.</small></span></label>
                <label className="check-label"><input type="checkbox" checked={draft.isPublished} onChange={(event) => update("isPublished", event.target.checked)} /><span><strong>Publish publicly</strong><small>Make this project visible to portfolio visitors.</small></span></label>
              </div>
            </div>
          ) : null}

          <div className="editor-actions">
            <button type="button" className="button button-ghost" onClick={closeForm}>Cancel</button>
            {editorTab !== "overview" ? <button type="button" className="button button-secondary" onClick={() => setEditorTab(editorTab === "media" ? "case-study" : "overview")}>Back</button> : null}
            {editorTab !== "media" ? <button type="button" className="button button-primary" onClick={() => setEditorTab(editorTab === "overview" ? "case-study" : "media")}>Continue <ArrowRight size={15} /></button> : <button className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />} {editingId ? "Save changes" : "Create project"}</button>}
          </div>
        </form>
      ) : null}

      <section className="manager-library" aria-label="Project library">
        <div className="manager-library-heading"><div><span className="eyebrow">YOUR PORTFOLIO CONTENT</span><h3>Project library <span>{projects.length}</span></h3></div><div className="manager-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects" aria-label="Search projects" /></div></div>
        <div className="manager-filters" role="group" aria-label="Filter projects">
          {(["all", "published", "drafts", "featured"] as ProjectFilter[]).map((item) => <button key={item} type="button" className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "all" ? "All projects" : item === "drafts" ? "Drafts" : item === "featured" ? "Featured" : "Published"}<span>{item === "all" ? projects.length : item === "published" ? publishedCount : item === "drafts" ? draftCount : featuredCount}</span></button>)}
        </div>
        <div className="admin-project-list">
          {visibleProjects.length === 0 ? <div className="empty-state">{projects.length ? "No projects match this search or filter." : "No projects yet. Add your first project to get started."}</div> : visibleProjects.map((project) => (
            <article className="admin-project-row" key={project.id}>
              <div className="admin-project-thumb" style={project.coverImage ? { backgroundImage: `url("${project.coverImage}")` } : undefined}><FolderKanban size={19} /></div>
              <div className="admin-project-main">
                <div className="admin-project-title"><h3>{project.title}</h3><span className={`publish-pill ${project.isPublished ? "published" : "draft"}`}>{project.isPublished ? "Published" : "Draft"}</span>{project.isFeatured ? <span className="feature-pill">Featured</span> : null}</div>
                <p>{project.summary}</p>
                <span className="admin-project-slug">/projects/{project.slug}</span>
              </div>
              <div className="admin-project-actions">
                <button className="icon-button" onClick={() => togglePublish(project)} title={project.isPublished ? "Unpublish" : "Publish"} aria-label={project.isPublished ? "Unpublish project" : "Publish project"}>{project.isPublished ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                <button className="icon-button" onClick={() => openEdit(project)} title="Edit project" aria-label="Edit project"><Edit3 size={17} /></button>
                <button className="icon-button danger-icon" onClick={() => remove(project)} title="Delete project" aria-label="Delete project"><Trash2 size={17} /></button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

