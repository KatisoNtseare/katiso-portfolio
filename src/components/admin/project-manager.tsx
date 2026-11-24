"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  FileImage,
  FolderKanban,
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { Project, ProjectImage } from "@/types/project";
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
  image?: ProjectImage;
  altText: string;
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
  year: new Date().getFullYear().toString(),
  role: "Software Developer",
  problem: "",
  solution: "",
  contributions: "",
  architecture: "",
  architectureFlow: "",
  challenges: "",
  outcomes: "",
  technologies: "",
  coverImage: "",
  image: undefined,
  altText: "",
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
    technologies: (project.technologies || []).join(", "),
    architectureFlow: (project.architectureFlow || []).join(" -> "),
    sortOrder: String(project.sortOrder ?? 0),
    coverImage: project.coverImage || project.image?.secureUrl || "",
    altText: project.altText || project.image?.altText || "",
    image: project.image,
  };
}

function formatDate(isoString?: string): string {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
}

export function ProjectManager({ initialProjects }: { initialProjects: Project[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState(initialProjects);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>("overview");
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      if (p.category?.trim()) set.add(p.category.trim());
    }
    return Array.from(set).sort();
  }, [projects]);

  const publishedCount = projects.filter((p) => p.isPublished).length;
  const draftCount = projects.length - publishedCount;
  const featuredCount = projects.filter((p) => p.isFeatured).length;
  const incompleteCount = projects.filter((p) => !p.coverImage && !p.image?.secureUrl).length;

  const visibleProjects = useMemo(() => {
    const normalisedSearch = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "published" && project.isPublished) ||
        (filter === "drafts" && !project.isPublished) ||
        (filter === "featured" && project.isFeatured);

      const matchesCategory =
        categoryFilter === "all" || project.category === categoryFilter;

      const matchesSearch =
        !normalisedSearch ||
        project.title.toLowerCase().includes(normalisedSearch) ||
        project.summary.toLowerCase().includes(normalisedSearch) ||
        project.category.toLowerCase().includes(normalisedSearch);

      return matchesFilter && matchesCategory && matchesSearch;
    });
  }, [categoryFilter, filter, projects, search]);

  function openNew() {
    setDraft(emptyDraft);
    setEditingId(null);
    setEditorTab("overview");
    setShowForm(true);
    setNotice("");
    setError("");
    setUploadError("");
  }

  function openEdit(project: Project) {
    setDraft(fromProject(project));
    setEditingId(project.id);
    setEditorTab("overview");
    setShowForm(true);
    setNotice("");
    setError("");
    setUploadError("");
  }

  function update<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setDraft(emptyDraft);
    setUploadError("");
  }

  async function handleImageFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input value so re-selecting same file triggers change
    e.target.value = "";

    // Client-side pre-validation
    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimes.includes(file.type)) {
      setUploadError("Only JPEG, PNG, and WebP images are supported.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maximum allowed size is 5 MB.`);
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("altText", draft.altText || `${draft.title || "Project"} cover image`);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { image?: ProjectImage; message?: string };

      if (!response.ok || !data.image) {
        throw new Error(data.message || "Failed to upload image to Cloudinary.");
      }

      setDraft((curr) => ({
        ...curr,
        coverImage: data.image!.secureUrl,
        image: data.image,
        altText: curr.altText || data.image!.altText || `${curr.title || "Project"} cover image`,
      }));

      setNotice("Cover image uploaded to Cloudinary successfully.");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    // Validate cover image requirement
    const hasImage = Boolean(draft.coverImage?.trim()) || Boolean(draft.image?.secureUrl?.trim());
    if (!editingId && !hasImage) {
      setError("A cover image is required to create a project. Please upload an image under the Media tab.");
      setEditorTab("media");
      setBusy(false);
      return;
    }

    if (draft.isPublished && !hasImage) {
      setError("A valid cover image is required before publishing this project.");
      setEditorTab("media");
      setBusy(false);
      return;
    }

    const payload = {
      ...draft,
      slug: draft.slug.trim() || toSlug(draft.title),
      technologies: draft.technologies
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      architectureFlow: draft.architectureFlow
        .split("->")
        .map((item) => item.trim())
        .filter(Boolean),
      sortOrder: Number(draft.sortOrder) || 0,
      image: draft.image,
      coverImage: draft.coverImage || draft.image?.secureUrl || "",
      altText: draft.altText.trim(),
    };

    try {
      const response = await fetch(editingId ? `/api/projects/${editingId}` : "/api/projects", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { project?: Project; message?: string };
      if (!response.ok || !result.project) {
        throw new Error(result.message || "Could not save the project.");
      }

      setProjects((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? result.project! : item))
          : [result.project!, ...current]
      );
      setNotice(editingId ? "Project updated successfully." : "Project created successfully.");
      closeForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the project.");
    } finally {
      setBusy(false);
    }
  }

  async function executeDelete(project: Project) {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Could not delete the project.");

      setProjects((current) => current.filter((item) => item.id !== project.id));
      setNotice(`Project “${project.title}” and associated assets were deleted successfully.`);
      setProjectToDelete(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the project.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(project: Project) {
    // Check if the project lacks a cover image
    const hasImage = Boolean(project.coverImage?.trim()) || Boolean(project.image?.secureUrl?.trim());
    if (!project.isPublished && !hasImage) {
      setError(`Cannot publish “${project.title}”: A cover image is required before publishing. Please edit the project and upload an image to Cloudinary first.`);
      return;
    }

    setError("");
    setNotice("");

    const updated = fromProject(project);
    updated.isPublished = !project.isPublished;

    const payload = {
      ...updated,
      technologies: updated.technologies
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      architectureFlow: updated.architectureFlow
        .split("->")
        .map((item) => item.trim())
        .filter(Boolean),
      sortOrder: Number(updated.sortOrder) || 0,
    };

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { project?: Project; message?: string };
      if (!response.ok || !result.project) {
        throw new Error(result.message || "Could not update publishing status.");
      }

      setProjects((current) =>
        current.map((item) => (item.id === project.id ? result.project! : item))
      );
      setNotice(result.project.isPublished ? `“${project.title}” is now published.` : `“${project.title}” moved back to draft.`);
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
          <p>Manage the portfolio projects visitors see. Add and edit projects backed by MongoDB and Cloudinary.</p>
        </div>
        <button className="button button-primary" onClick={openNew}>
          <Plus size={17} /> Add project
        </button>
      </div>

      <div className="manager-stats">
        <article className="manager-stat-card">
          <span className="manager-stat-icon">
            <FolderKanban size={17} />
          </span>
          <span className="manager-stat-label">TOTAL PROJECTS</span>
          <strong>{projects.length}</strong>
          <small>Across your portfolio</small>
        </article>
        <article className="manager-stat-card">
          <span className="manager-stat-icon manager-stat-icon-green">
            <Eye size={17} />
          </span>
          <span className="manager-stat-label">PUBLISHED</span>
          <strong>{publishedCount}</strong>
          <small>Visible on public portfolio</small>
        </article>
        <article className="manager-stat-card">
          <span className="manager-stat-icon manager-stat-icon-muted">
            <FileImage size={17} />
          </span>
          <span className="manager-stat-label">DRAFTS</span>
          <strong>{draftCount}</strong>
          <small>{incompleteCount ? `${incompleteCount} missing cover image` : "Ready to review"}</small>
        </article>
        <article className="manager-stat-card">
          <span className="manager-stat-icon manager-stat-icon-red">
            <Edit3 size={17} />
          </span>
          <span className="manager-stat-label">FEATURED</span>
          <strong>{featuredCount}</strong>
          <small>Showcased on homepage</small>
        </article>
      </div>

      {notice ? (
        <div className="notice success">
          <Check size={16} /> {notice}
        </div>
      ) : null}
      {error ? (
        <div className="notice error">
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Delete Confirmation Dialog */}
      {projectToDelete ? (
        <div className="admin-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
          <div className="admin-confirm-dialog">
            <div className="admin-confirm-icon">
              <Trash2 size={24} />
            </div>
            <h3 id="delete-dialog-title">Delete Project</h3>
            <p>
              Are you sure you want to permanently delete <strong>“{projectToDelete.title}”</strong>?
            </p>
            <p className="admin-confirm-sub">
              This will remove the project document from MongoDB and permanently delete its associated image from Cloudinary under <code>katiso-portfolio/project-pictures</code>. This action cannot be undone.
            </p>
            <div className="admin-confirm-actions">
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setProjectToDelete(null)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-primary"
                style={{ backgroundColor: "#b91f27", borderColor: "#b91f27" }}
                onClick={() => executeDelete(projectToDelete)}
                disabled={busy}
              >
                {busy ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />} Delete Permanently
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showForm ? (
        <form className="project-editor" onSubmit={submit}>
          <div className="editor-heading">
            <div>
              <span className="eyebrow">{editingId ? "UPDATE ENTRY" : "NEW ENTRY"}</span>
              <h3>{editingId ? `Edit: ${draft.title || "Project"}` : "Create a new project"}</h3>
              <p>Fill out the project details. A cover image stored in Cloudinary is required.</p>
            </div>
            <button type="button" className="icon-button" onClick={closeForm} aria-label="Close editor">
              <X size={19} />
            </button>
          </div>

          <div className="editor-tabs" role="group" aria-label="Project editor sections">
            <button
              type="button"
              aria-pressed={editorTab === "overview"}
              className={editorTab === "overview" ? "active" : ""}
              onClick={() => setEditorTab("overview")}
            >
              <span>01</span> Overview
            </button>
            <button
              type="button"
              aria-pressed={editorTab === "case-study"}
              className={editorTab === "case-study" ? "active" : ""}
              onClick={() => setEditorTab("case-study")}
            >
              <span>02</span> Case study
            </button>
            <button
              type="button"
              aria-pressed={editorTab === "media"}
              className={editorTab === "media" ? "active" : ""}
              onClick={() => setEditorTab("media")}
            >
              <span>03</span> Media & links
            </button>
          </div>

          {editorTab === "overview" ? (
            <div className="editor-panel">
              <div className="editor-section-heading">
                <span>PROJECT DETAILS</span>
                <p>Start with the information visitors will see in project listings.</p>
              </div>
              <div className="editor-grid">
                <label>
                  Project title *
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={draft.title}
                    onChange={(event) => {
                      update("title", event.target.value);
                      if (!editingId) update("slug", toSlug(event.target.value));
                    }}
                    placeholder="e.g. ManorManager"
                  />
                </label>
                <label>
                  URL slug *
                  <input
                    required
                    value={draft.slug}
                    onChange={(event) => update("slug", toSlug(event.target.value))}
                    placeholder="e.g. manormanager"
                  />
                  <small>Used in the public URL: /projects/{draft.slug || "slug"}</small>
                </label>
                <label className="span-2">
                  Short summary *
                  <input
                    required
                    minLength={10}
                    maxLength={240}
                    value={draft.summary}
                    onChange={(event) => update("summary", event.target.value)}
                    placeholder="A concise description for the project card"
                  />
                  <small>Keep this to one or two sentences (10 to 240 characters).</small>
                </label>
                <label>
                  Category
                  <input
                    maxLength={80}
                    value={draft.category}
                    onChange={(event) => update("category", event.target.value)}
                    placeholder="e.g. SaaS Platform, Web Application"
                  />
                </label>
                <label>
                  Year / period
                  <input
                    maxLength={20}
                    value={draft.year}
                    onChange={(event) => update("year", event.target.value)}
                    placeholder="2026"
                  />
                </label>
                <label>
                  My role
                  <input
                    maxLength={120}
                    value={draft.role}
                    onChange={(event) => update("role", event.target.value)}
                    placeholder="e.g. Full-Stack Developer, Lead Engineer"
                  />
                </label>
                <label>
                  Technologies
                  <input
                    value={draft.technologies}
                    onChange={(event) => update("technologies", event.target.value)}
                    placeholder="Next.js, TypeScript, MongoDB, Cloudinary"
                  />
                  <small>Separate technologies with commas.</small>
                </label>
                <label className="span-2">
                  Project overview
                  <textarea
                    rows={5}
                    value={draft.description}
                    onChange={(event) => update("description", event.target.value)}
                    placeholder="Explain what the project does, who it helps and its main purpose."
                  />
                </label>
              </div>
            </div>
          ) : null}

          {editorTab === "case-study" ? (
            <div className="editor-panel">
              <div className="editor-section-heading">
                <span>ENGINEERING STORY</span>
                <p>Describe the problem, your contribution and the technical decisions behind the solution.</p>
              </div>
              <div className="editor-grid">
                <label>
                  The problem
                  <textarea
                    rows={5}
                    value={draft.problem}
                    onChange={(event) => update("problem", event.target.value)}
                    placeholder="What problem needed to be solved?"
                  />
                </label>
                <label>
                  The solution
                  <textarea
                    rows={5}
                    value={draft.solution}
                    onChange={(event) => update("solution", event.target.value)}
                    placeholder="How does the solution address the problem?"
                  />
                </label>
                <label>
                  My contributions
                  <textarea
                    rows={5}
                    value={draft.contributions}
                    onChange={(event) => update("contributions", event.target.value)}
                    placeholder="Be specific about your individual implementation work and responsibilities."
                  />
                </label>
                <label>
                  Architecture & engineering decisions
                  <textarea
                    rows={5}
                    value={draft.architecture}
                    onChange={(event) => update("architecture", event.target.value)}
                    placeholder="Describe the application layers, components, data boundaries and architecture."
                  />
                </label>
                <label className="span-2">
                  Architecture diagram flow
                  <input
                    value={draft.architectureFlow}
                    onChange={(event) => update("architectureFlow", event.target.value)}
                    placeholder="Browser -> Next.js -> API -> MongoDB"
                  />
                  <small>Separate up to 8 diagram nodes with the arrow text -&gt;.</small>
                </label>
                <label>
                  Challenges & decisions
                  <textarea
                    rows={5}
                    value={draft.challenges}
                    onChange={(event) => update("challenges", event.target.value)}
                    placeholder="Technical hurdles encountered and how you solved them."
                  />
                </label>
                <label>
                  Outcomes & achievements
                  <textarea
                    rows={5}
                    value={draft.outcomes}
                    onChange={(event) => update("outcomes", event.target.value)}
                    placeholder="Verified outcomes, performance metrics or delivery results."
                  />
                </label>
              </div>
            </div>
          ) : null}

          {editorTab === "media" ? (
            <div className="editor-panel">
              <div className="editor-section-heading">
                <span>COVER IMAGE & PROJECT DESTINATIONS</span>
                <p>Every project requires a cover image stored in Cloudinary under <code>katiso-portfolio/project-pictures</code>.</p>
              </div>

              {/* Cloudinary Image Upload Section */}
              <div className="editor-image-section">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleImageFileChange}
                />

                <div className="editor-image-header">
                  <div>
                    <strong>Cover Image *</strong>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: "#777" }}>
                      Upload a JPEG, PNG, or WebP picture (max 5 MB). It will be saved to Cloudinary.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="button button-secondary button-small"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || busy}
                  >
                    {uploading ? <LoaderCircle className="spin" size={14} /> : <Upload size={14} />}
                    {draft.coverImage ? "Replace image" : "Upload picture"}
                  </button>
                </div>

                {uploadError ? <div className="notice error">{uploadError}</div> : null}

                {draft.coverImage ? (
                  <div className="editor-image-preview-card">
                    <div
                      className="editor-image-preview-thumb"
                      style={{ backgroundImage: `url("${draft.coverImage}")` }}
                    />
                    <div className="editor-image-preview-details">
                      <div className="editor-image-meta-badge">
                        <Check size={13} color="#24a36b" /> Stored in Cloudinary
                      </div>
                      <span className="editor-image-public-id">
                        {draft.image?.publicId || "katiso-portfolio/project-pictures"}
                      </span>
                      {draft.image?.width && draft.image?.height ? (
                        <small className="editor-image-dims">
                          {draft.image.width} × {draft.image.height} px · {draft.image.format?.toUpperCase() || "IMAGE"}
                        </small>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div
                    className="editor-image-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                  >
                    {uploading ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <LoaderCircle className="spin" size={24} color="#df3035" />
                        <span>Uploading to Cloudinary...</span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <ImageIcon size={28} color="#999" />
                        <strong>Click to select a project picture</strong>
                        <small style={{ color: "#888" }}>JPEG, PNG, or WebP up to 5 MB</small>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 14 }}>
                  <label>
                    Image alternative text (Alt text)
                    <input
                      maxLength={300}
                      value={draft.altText}
                      onChange={(event) => update("altText", event.target.value)}
                      placeholder="e.g. Screenshot of ManorManager dashboard showing occupancy rates"
                    />
                    <small>Describes the image for screen readers and accessibility.</small>
                  </label>
                </div>
              </div>

              <div className="editor-grid" style={{ marginTop: 20 }}>
                <label>
                  Live application URL
                  <input
                    type="url"
                    value={draft.liveUrl}
                    onChange={(event) => update("liveUrl", event.target.value)}
                    placeholder="https://..."
                  />
                </label>
                <label>
                  Demonstration URL
                  <input
                    type="url"
                    value={draft.demoUrl}
                    onChange={(event) => update("demoUrl", event.target.value)}
                    placeholder="https://..."
                  />
                </label>
                <label>
                  GitHub repository URL
                  <input
                    type="url"
                    value={draft.repoUrl}
                    onChange={(event) => update("repoUrl", event.target.value)}
                    placeholder="https://github.com/..."
                  />
                </label>
                <label>
                  Display order
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={draft.sortOrder}
                    onChange={(event) => update("sortOrder", event.target.value)}
                  />
                  <small>Lower numbers display first.</small>
                </label>
              </div>

              <div className="editor-options">
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={draft.isFeatured}
                    onChange={(event) => update("isFeatured", event.target.checked)}
                  />
                  <span>
                    <strong>Feature on homepage</strong>
                    <small>Showcase this project in the top featured work section.</small>
                  </span>
                </label>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={draft.isPublished}
                    onChange={(event) => update("isPublished", event.target.checked)}
                  />
                  <span>
                    <strong>Publish publicly</strong>
                    <small>Make visible to visitors. Requires a cover image.</small>
                  </span>
                </label>
              </div>
            </div>
          ) : null}

          <div className="editor-actions">
            <button type="button" className="button button-ghost" onClick={closeForm} disabled={busy || uploading}>
              Cancel
            </button>
            {editorTab !== "overview" ? (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setEditorTab(editorTab === "media" ? "case-study" : "overview")}
                disabled={busy || uploading}
              >
                Back
              </button>
            ) : null}
            {editorTab !== "media" ? (
              <button
                type="button"
                className="button button-primary"
                onClick={() => setEditorTab(editorTab === "overview" ? "case-study" : "media")}
                disabled={busy || uploading}
              >
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <button className="button button-primary" disabled={busy || uploading}>
                {busy ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}
                {editingId ? "Save changes" : "Create project"}
              </button>
            )}
          </div>
        </form>
      ) : null}

      <section className="manager-library" aria-label="Project library">
        <div className="manager-library-heading">
          <div>
            <span className="eyebrow">YOUR PORTFOLIO CONTENT</span>
            <h3>
              Project library <span>{projects.length}</span>
            </h3>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {categories.length > 1 ? (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="manager-category-select"
                aria-label="Filter by category"
              >
                <option value="all">All categories ({projects.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="manager-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects"
                aria-label="Search projects"
              />
            </div>
          </div>
        </div>

        <div className="manager-filters" role="group" aria-label="Filter projects">
          {(["all", "published", "drafts", "featured"] as ProjectFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item === "all"
                ? "All projects"
                : item === "drafts"
                ? "Drafts"
                : item === "featured"
                ? "Featured"
                : "Published"}
              <span>
                {item === "all"
                  ? projects.length
                  : item === "published"
                  ? publishedCount
                  : item === "drafts"
                  ? draftCount
                  : featuredCount}
              </span>
            </button>
          ))}
        </div>

        <div className="admin-project-list">
          {visibleProjects.length === 0 ? (
            <div className="empty-state">
              {projects.length
                ? "No projects match this search or filter."
                : "No projects yet. Click 'Add project' to create your first portfolio entry."}
            </div>
          ) : (
            visibleProjects.map((project) => {
              const hasCover = Boolean(project.coverImage || project.image?.secureUrl);
              return (
                <article className="admin-project-row" key={project.id}>
                  <div
                    className="admin-project-thumb"
                    style={hasCover ? { backgroundImage: `url("${project.coverImage || project.image?.secureUrl}")` } : undefined}
                  >
                    {!hasCover ? <FolderKanban size={19} /> : null}
                  </div>
                  <div className="admin-project-main">
                    <div className="admin-project-title">
                      <h3>{project.title}</h3>
                      <span className={`publish-pill ${project.isPublished ? "published" : "draft"}`}>
                        {project.isPublished ? "Published" : "Draft"}
                      </span>
                      {!hasCover ? (
                        <span className="publish-pill incomplete" title="A cover image must be uploaded before publishing">
                          Missing image
                        </span>
                      ) : null}
                      {project.isFeatured ? <span className="feature-pill">Featured</span> : null}
                    </div>
                    <p>{project.summary}</p>
                    <div className="admin-project-meta">
                      <span className="admin-project-slug">/projects/{project.slug}</span>
                      <span className="admin-project-category">{project.category}</span>
                      <span className="admin-project-timestamp">
                        <Clock size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                        Updated {formatDate(project.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="admin-project-actions">
                    <button
                      className="icon-button"
                      onClick={() => togglePublish(project)}
                      title={project.isPublished ? "Unpublish project" : "Publish project"}
                      aria-label={project.isPublished ? "Unpublish project" : "Publish project"}
                    >
                      {project.isPublished ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => openEdit(project)}
                      title="Edit project"
                      aria-label="Edit project"
                    >
                      <Edit3 size={17} />
                    </button>
                    <button
                      className="icon-button danger-icon"
                      onClick={() => setProjectToDelete(project)}
                      title="Delete project"
                      aria-label="Delete project"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
