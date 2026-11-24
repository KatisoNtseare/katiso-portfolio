"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileImage,
  Film,
  FolderKanban,
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  Save,
  Search,
  Star,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import type { Project, ProjectImage, ProjectImageMedia, ProjectMedia, ProjectVideoMedia } from "@/types/project";
import { toSlug } from "@/lib/slug";
import {
  buildGoogleDriveEmbedUrl,
  extractGoogleDriveFileId,
  getPrimaryImage,
  MAX_PROJECT_IMAGES,
  MAX_PROJECT_VIDEOS,
} from "@/lib/media";
import { addProjectMedia, removeProjectMedia, reorderProjectMedia, setPrimaryProjectImage } from "@/lib/project-media";

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
  media: ProjectMedia[];
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
  media: [],
  liveUrl: "",
  demoUrl: "",
  repoUrl: "",
  isFeatured: false,
  isPublished: false,
  sortOrder: "0",
};

function fromProject(project: Project): Draft {
  let media: ProjectMedia[] = Array.isArray(project.media) && project.media.length > 0 ? [...project.media] : [];

  if (media.length === 0 && (project.coverImage || project.image?.secureUrl)) {
    media = [
      {
        id: `img-${Date.now()}-legacy`,
        type: "image",
        secureUrl: project.coverImage || project.image?.secureUrl || "",
        publicId: project.image?.publicId || "",
        altText: project.altText || project.image?.altText || `${project.title} cover image`,
        width: project.image?.width,
        height: project.image?.height,
        format: project.image?.format,
        displayOrder: 1,
        isPrimary: true,
      },
    ];
  }

  const primary = getPrimaryImage(media);

  return {
    ...project,
    technologies: (project.technologies || []).join(", "),
    architectureFlow: (project.architectureFlow || []).join(" -> "),
    sortOrder: String(project.sortOrder ?? 0),
    coverImage: primary?.secureUrl || project.coverImage || project.image?.secureUrl || "",
    altText: primary?.altText || project.altText || project.image?.altText || "",
    image: project.image,
    media,
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

  // Video addition state
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [videoTitleInput, setVideoTitleInput] = useState("");
  const [videoDescInput, setVideoDescInput] = useState("");
  const [videoError, setVideoError] = useState("");
  const [videoPreviewId, setVideoPreviewId] = useState<string | null>(null);

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
  const incompleteCount = projects.filter((p) => !p.coverImage && !p.image?.secureUrl && (!p.media || p.media.length === 0)).length;

  const currentImages = useMemo(() => {
    return (draft.media || []).filter((m): m is ProjectImageMedia => m.type === "image");
  }, [draft.media]);

  const currentVideos = useMemo(() => {
    return (draft.media || []).filter((m): m is ProjectVideoMedia => m.type === "video");
  }, [draft.media]);

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
    setShowAddVideo(false);
  }

  function openEdit(project: Project) {
    setDraft(fromProject(project));
    setEditingId(project.id);
    setEditorTab("overview");
    setShowForm(true);
    setNotice("");
    setError("");
    setUploadError("");
    setShowAddVideo(false);
  }

  function update<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setDraft(emptyDraft);
    setUploadError("");
    setShowAddVideo(false);
  }

  async function handleImageFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (currentImages.length >= MAX_PROJECT_IMAGES) {
      setUploadError(`Maximum image limit reached (${MAX_PROJECT_IMAGES} images max). Remove an image before uploading another.`);
      return;
    }

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
      formData.append("altText", `${draft.title || "Project"} screenshot`);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { image?: ProjectImage; message?: string };

      if (!response.ok || !data.image) {
        throw new Error(data.message || "Failed to upload image to Cloudinary.");
      }

      const isFirstImage = currentImages.length === 0;
      const newImageItem: ProjectImageMedia = {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: "image",
        secureUrl: data.image.secureUrl,
        publicId: data.image.publicId,
        altText: `${draft.title || "Project"} screenshot`,
        width: data.image.width,
        height: data.image.height,
        format: data.image.format,
        displayOrder: draft.media.length + 1,
        isPrimary: isFirstImage,
      };

      const updatedMedia = addProjectMedia(draft.media, newImageItem);

      setDraft((curr) => {
        const primary = getPrimaryImage(updatedMedia);
        return {
          ...curr,
          media: updatedMedia,
          coverImage: primary?.secureUrl || curr.coverImage,
          altText: primary?.altText || curr.altText,
          image: primary
            ? {
                secureUrl: primary.secureUrl,
                publicId: primary.publicId,
                altText: primary.altText,
                width: primary.width,
                height: primary.height,
                format: primary.format,
              }
            : curr.image,
        };
      });

      setNotice("Image uploaded to Cloudinary successfully.");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  }

  function handleVideoUrlChange(val: string) {
    setVideoUrlInput(val);
    const extractedId = extractGoogleDriveFileId(val);
    setVideoPreviewId(extractedId);
    if (val.trim() && !extractedId) {
      setVideoError("Unrecognised Google Drive URL. Paste a link like https://drive.google.com/file/d/FILE_ID/view?usp=sharing");
    } else {
      setVideoError("");
    }
  }

  function handleAddVideo() {
    setVideoError("");

    if (currentVideos.length >= MAX_PROJECT_VIDEOS) {
      setVideoError(`Maximum video limit reached (${MAX_PROJECT_VIDEOS} videos max).`);
      return;
    }

    const fileId = extractGoogleDriveFileId(videoUrlInput);
    if (!fileId) {
      setVideoError("Please provide a valid Google Drive file URL.");
      return;
    }

    if (!videoTitleInput.trim()) {
      setVideoError("A video title is required.");
      return;
    }

    const newVideoItem: ProjectVideoMedia = {
      id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "video",
      provider: "google-drive",
      fileId,
      originalUrl: videoUrlInput.trim(),
      embedUrl: buildGoogleDriveEmbedUrl(fileId),
      title: videoTitleInput.trim(),
      description: videoDescInput.trim() || undefined,
      displayOrder: draft.media.length + 1,
    };

    const updatedMedia = addProjectMedia(draft.media, newVideoItem);

    setDraft((curr) => ({
      ...curr,
      media: updatedMedia,
    }));

    setVideoUrlInput("");
    setVideoTitleInput("");
    setVideoDescInput("");
    setVideoPreviewId(null);
    setShowAddVideo(false);
    setNotice("Google Drive video added to project.");
  }

  function setPrimaryImage(mediaId: string) {
    const updatedMedia = setPrimaryProjectImage(draft.media, mediaId);

    const primary = getPrimaryImage(updatedMedia);

    setDraft((curr) => ({
      ...curr,
      media: updatedMedia,
      coverImage: primary?.secureUrl || curr.coverImage,
      altText: primary?.altText || curr.altText,
      image: primary
        ? {
            secureUrl: primary.secureUrl,
            publicId: primary.publicId,
            altText: primary.altText,
            width: primary.width,
            height: primary.height,
            format: primary.format,
          }
        : curr.image,
    }));
  }

  function removeMediaItem(mediaId: string) {
    const normalized = removeProjectMedia(draft.media, mediaId);
    const primary = getPrimaryImage(normalized);

    setDraft((curr) => ({
      ...curr,
      media: normalized,
      coverImage: primary?.secureUrl || "",
      altText: primary?.altText || "",
      image: primary
        ? {
            secureUrl: primary.secureUrl,
            publicId: primary.publicId,
            altText: primary.altText,
            width: primary.width,
            height: primary.height,
            format: primary.format,
          }
        : undefined,
    }));
  }

  function moveMediaItem(index: number, direction: "up" | "down") {
    const normalized = reorderProjectMedia(draft.media, index, direction);
    setDraft((curr) => ({
      ...curr,
      media: normalized,
    }));
  }

  function updateImageAlt(mediaId: string, altText: string) {
    setDraft((curr) => {
      const updatedMedia = curr.media.map((item) => {
        if (item.id === mediaId && item.type === "image") {
          return { ...item, altText };
        }
        return item;
      });
      const primary = getPrimaryImage(updatedMedia);
      return {
        ...curr,
        media: updatedMedia,
        altText: primary ? primary.altText : curr.altText,
      };
    });
  }

  function updateVideoFields(mediaId: string, title: string, description?: string) {
    setDraft((curr) => ({
      ...curr,
      media: curr.media.map((item) => {
        if (item.id === mediaId && item.type === "video") {
          return { ...item, title, description };
        }
        return item;
      }),
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    const images = draft.media.filter((m): m is ProjectImageMedia => m.type === "image");
    const videos = draft.media.filter((m): m is ProjectVideoMedia => m.type === "video");

    if (images.length > MAX_PROJECT_IMAGES) {
      setError(`Project cannot have more than ${MAX_PROJECT_IMAGES} images (currently ${images.length}).`);
      setEditorTab("media");
      setBusy(false);
      return;
    }

    if (videos.length > MAX_PROJECT_VIDEOS) {
      setError(`Project cannot have more than ${MAX_PROJECT_VIDEOS} videos (currently ${videos.length}).`);
      setEditorTab("media");
      setBusy(false);
      return;
    }

    // Validate cover image requirement
    const hasImage = images.length > 0 || Boolean(draft.coverImage?.trim()) || Boolean(draft.image?.secureUrl?.trim());
    if (!editingId && !hasImage) {
      setError("A cover image is required to create a project. Please upload an image under the Media tab.");
      setEditorTab("media");
      setBusy(false);
      return;
    }

    const primaryImage = getPrimaryImage(draft.media);
    if (draft.isPublished && !primaryImage && !draft.coverImage?.trim()) {
      setError("A valid primary cover image is required before publishing this project.");
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
      media: draft.media,
      image: primaryImage
        ? {
            secureUrl: primaryImage.secureUrl,
            publicId: primaryImage.publicId,
            altText: primaryImage.altText,
            width: primaryImage.width,
            height: primaryImage.height,
            format: primaryImage.format,
          }
        : draft.image,
      coverImage: primaryImage?.secureUrl || draft.coverImage || draft.image?.secureUrl || "",
      altText: primaryImage?.altText || draft.altText.trim(),
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
      setNotice(`Project “${project.title}” and associated Cloudinary assets were deleted successfully.`);
      setProjectToDelete(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the project.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(project: Project) {
    const hasImage = Boolean(project.coverImage?.trim()) || Boolean(project.image?.secureUrl?.trim()) || (project.media || []).some(m => m.type === "image");
    if (!project.isPublished && !hasImage) {
      setError(`Cannot publish “${project.title}”: A cover image is required before publishing. Please edit the project and upload an image first.`);
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
      media: updated.media,
    };

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { project?: Project; message?: string };
      if (!response.ok || !result.project) {
        throw new Error(result.message || "Could not update publication status.");
      }

      setProjects((current) =>
        current.map((item) => (item.id === project.id ? result.project! : item))
      );
      setNotice(
        result.project.isPublished
          ? `“${result.project.title}” is now published and visible to the public.`
          : `“${result.project.title}” has been returned to drafts.`
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update project status.");
    }
  }

  return (
    <>
      <section className="manager-toolbar">
        <div>
          <span className="eyebrow">PORTFOLIO CONTROL CENTER</span>
          <h2>Project Manager</h2>
          <p>
            Create, edit, feature and organize your software engineering case studies and project media galleries.
          </p>
        </div>
        <button
          type="button"
          className="button button-primary"
          onClick={openNew}
          disabled={busy || uploading}
        >
          <Plus size={16} /> New project
        </button>
      </section>

      <section className="manager-stats" aria-label="Project statistics">
        <div className="manager-stat-card">
          <span className="manager-stat-icon">
            <FolderKanban size={17} />
          </span>
          <span className="manager-stat-label">TOTAL PROJECTS</span>
          <strong>{projects.length}</strong>
          <small>In database</small>
        </div>
        <div className="manager-stat-card">
          <span className="manager-stat-icon manager-stat-icon-green">
            <Eye size={17} />
          </span>
          <span className="manager-stat-label">PUBLISHED</span>
          <strong>{publishedCount}</strong>
          <small>Publicly visible</small>
        </div>
        <div className="manager-stat-card">
          <span className="manager-stat-icon manager-stat-icon-muted">
            <EyeOff size={17} />
          </span>
          <span className="manager-stat-label">DRAFTS</span>
          <strong>{draftCount}</strong>
          <small>Hidden from public</small>
        </div>
        <div className="manager-stat-card">
          <span className="manager-stat-icon manager-stat-icon-red">
            <FileImage size={17} />
          </span>
          <span className="manager-stat-label">FEATURED</span>
          <strong>{featuredCount}</strong>
          <small>On homepage</small>
        </div>
      </section>

      {notice ? (
        <div className="notice success" role="status">
          <Check size={16} /> {notice}
        </div>
      ) : null}
      {error ? (
        <div className="notice error" role="alert">
          <AlertTriangle size={16} /> {error}
        </div>
      ) : null}

      {showForm ? (
        <form className="project-editor" onSubmit={submit}>
          <div className="editor-heading">
            <div>
              <span className="eyebrow">
                {editingId ? "EDITING PROJECT" : "NEW PORTFOLIO ENTRY"}
              </span>
              <h3>{draft.title || (editingId ? "Edit project" : "Draft project")}</h3>
              <p>Fill out the project details, engineering story and media assets.</p>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={closeForm}
              aria-label="Close form"
            >
              <X size={16} />
            </button>
          </div>

          <div className="editor-tabs" role="tablist">
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
              <span>03</span> Media & links ({draft.media.length})
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
                <span>PROJECT MEDIA GALLERY & LINKS</span>
                <p>Manage up to 20 images on Cloudinary and up to 5 embedded Google Drive videos. Exactly 1 primary image is required to publish.</p>
              </div>

              {/* Media Quota Indicators */}
              <div className="media-quota-bar">
                <div className={`media-quota-badge ${currentImages.length >= MAX_PROJECT_IMAGES ? "at-limit" : ""}`}>
                  <ImageIcon size={14} /> Images: <strong>{currentImages.length} / {MAX_PROJECT_IMAGES}</strong>
                </div>
                <div className={`media-quota-badge ${currentVideos.length >= MAX_PROJECT_VIDEOS ? "at-limit" : ""}`}>
                  <Video size={14} /> Videos: <strong>{currentVideos.length} / {MAX_PROJECT_VIDEOS}</strong>
                </div>
                <div className="media-quota-badge primary-status">
                  <Star size={14} color="#df3035" /> Primary image: <strong>{getPrimaryImage(draft.media)?.altText ? "Selected" : currentImages.length > 0 ? "Default selected" : "None"}</strong>
                </div>
              </div>

              {/* Action Toolbar for Media */}
              <div className="media-actions-bar">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleImageFileChange}
                />
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || busy || currentImages.length >= MAX_PROJECT_IMAGES}
                >
                  {uploading ? <LoaderCircle className="spin" size={14} /> : <Upload size={14} />}
                  Upload Cloudinary picture ({currentImages.length}/{MAX_PROJECT_IMAGES})
                </button>
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => setShowAddVideo(!showAddVideo)}
                  disabled={currentVideos.length >= MAX_PROJECT_VIDEOS}
                >
                  <Plus size={14} /> Add Google Drive video ({currentVideos.length}/{MAX_PROJECT_VIDEOS})
                </button>
              </div>

              {uploadError ? <div className="notice error">{uploadError}</div> : null}

              {/* Inline Add Video Form */}
              {showAddVideo ? (
                <div className="admin-video-adder-card">
                  <div className="admin-video-adder-header">
                    <h4>Add Google Drive Video</h4>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => setShowAddVideo(false)}
                      aria-label="Cancel adding video"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="admin-video-note">
                    Share links from Google Drive (e.g. <code>https://drive.google.com/file/d/FILE_ID/view?usp=sharing</code>).
                    Important: Set Google Drive link permissions to <strong>“Anyone with the link can view”</strong> so your portfolio visitors can view the video.
                  </p>

                  {videoError ? <div className="notice error" style={{ margin: "8px 0" }}>{videoError}</div> : null}

                  <div className="editor-grid">
                    <label className="span-2">
                      Google Drive sharing link *
                      <input
                        type="url"
                        value={videoUrlInput}
                        onChange={(e) => handleVideoUrlChange(e.target.value)}
                        placeholder="https://drive.google.com/file/d/1a2b3c4d5e.../view?usp=sharing"
                      />
                    </label>
                    <label>
                      Video title *
                      <input
                        maxLength={200}
                        value={videoTitleInput}
                        onChange={(e) => setVideoTitleInput(e.target.value)}
                        placeholder="e.g. System Demonstration & Workflow Walkthrough"
                      />
                    </label>
                    <label>
                      Description / notes (optional)
                      <input
                        maxLength={2000}
                        value={videoDescInput}
                        onChange={(e) => setVideoDescInput(e.target.value)}
                        placeholder="Key features showcased in this video"
                      />
                    </label>
                  </div>

                  {videoPreviewId ? (
                    <div className="admin-video-preview-box">
                      <span className="admin-video-preview-label">Live Google Drive Embed Preview:</span>
                      <div className="admin-video-preview-iframe-wrap">
                        <iframe
                          src={buildGoogleDriveEmbedUrl(videoPreviewId)}
                          title="Embed Preview"
                          className="admin-video-preview-iframe"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  ) : null}

                  <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      className="button button-primary button-small"
                      onClick={handleAddVideo}
                      disabled={!videoPreviewId || !videoTitleInput.trim()}
                    >
                      <Plus size={14} /> Add to project media
                    </button>
                    <button
                      type="button"
                      className="button button-ghost button-small"
                      onClick={() => setShowAddVideo(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Media Collection List */}
              <div className="media-collection-list">
                <div className="media-collection-header">
                  <strong>Configured project media ({draft.media.length})</strong>
                  <small>Ordered by display sequence. The item marked Primary will appear as the case study hero snapshot.</small>
                </div>

                {draft.media.length === 0 ? (
                  <div className="editor-image-dropzone" onClick={() => fileInputRef.current?.click()}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <ImageIcon size={28} color="#999" />
                      <strong>No media added yet</strong>
                      <small style={{ color: "#888" }}>Upload an image (up to 20) or add a Google Drive video (up to 5)</small>
                    </div>
                  </div>
                ) : (
                  <div className="media-items-grid">
                    {draft.media.map((item, idx) => {
                      if (item.type === "image") {
                        return (
                          <div key={item.id} className={`media-item-card ${item.isPrimary ? "is-primary-card" : ""}`}>
                            <div className="media-item-thumb-col">
                              <div
                                className="media-item-thumb"
                                style={{ backgroundImage: `url("${item.secureUrl}")` }}
                              />
                              <div className="media-item-order-controls">
                                <button
                                  type="button"
                                  className="media-order-btn"
                                  onClick={() => moveMediaItem(idx, "up")}
                                  disabled={idx === 0}
                                  title="Move up"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <span className="media-order-num">#{item.displayOrder}</span>
                                <button
                                  type="button"
                                  className="media-order-btn"
                                  onClick={() => moveMediaItem(idx, "down")}
                                  disabled={idx === draft.media.length - 1}
                                  title="Move down"
                                >
                                  <ArrowDown size={12} />
                                </button>
                              </div>
                            </div>

                            <div className="media-item-body">
                              <div className="media-item-top">
                                <div className="media-type-badges">
                                  <span className="badge-media-type image">IMAGE</span>
                                  {item.isPrimary ? (
                                    <span className="badge-primary-image">
                                      <Star size={11} fill="#df3035" /> Primary Cover Image
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      className="button-make-primary"
                                      onClick={() => setPrimaryImage(item.id)}
                                    >
                                      Set as primary
                                    </button>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="media-remove-btn"
                                  onClick={() => removeMediaItem(item.id)}
                                  title="Remove image"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              <label className="media-alt-label">
                                Alternative text (Alt text)
                                <input
                                  type="text"
                                  value={item.altText}
                                  onChange={(e) => updateImageAlt(item.id, e.target.value)}
                                  placeholder="Describe the image content for accessibility"
                                />
                              </label>

                              <div className="media-item-meta">
                                <span className="meta-public-id" title={item.publicId}>
                                  Cloudinary: {item.publicId}
                                </span>
                                {item.width && item.height ? (
                                  <span className="meta-dims">
                                    {item.width} × {item.height} px · {item.format?.toUpperCase() || "IMG"}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (item.type === "video") {
                        return (
                          <div key={item.id} className="media-item-card video-card">
                            <div className="media-item-thumb-col">
                              <div className="media-video-thumb-icon">
                                <Film size={26} color="#d92f36" />
                              </div>
                              <div className="media-item-order-controls">
                                <button
                                  type="button"
                                  className="media-order-btn"
                                  onClick={() => moveMediaItem(idx, "up")}
                                  disabled={idx === 0}
                                  title="Move up"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <span className="media-order-num">#{item.displayOrder}</span>
                                <button
                                  type="button"
                                  className="media-order-btn"
                                  onClick={() => moveMediaItem(idx, "down")}
                                  disabled={idx === draft.media.length - 1}
                                  title="Move down"
                                >
                                  <ArrowDown size={12} />
                                </button>
                              </div>
                            </div>

                            <div className="media-item-body">
                              <div className="media-item-top">
                                <div className="media-type-badges">
                                  <span className="badge-media-type video">GOOGLE DRIVE VIDEO</span>
                                  <span className="badge-video-embed">
                                    <Check size={11} color="#24a36b" /> Embed Validated
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="media-remove-btn"
                                  onClick={() => removeMediaItem(item.id)}
                                  title="Remove video"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              <div className="media-video-edit-grid">
                                <label>
                                  Video title
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => updateVideoFields(item.id, e.target.value, item.description)}
                                    placeholder="Video title"
                                  />
                                </label>
                                <label>
                                  Description (optional)
                                  <input
                                    type="text"
                                    value={item.description || ""}
                                    onChange={(e) => updateVideoFields(item.id, item.title, e.target.value)}
                                    placeholder="Brief description"
                                  />
                                </label>
                              </div>

                              <div className="media-item-meta">
                                <a
                                  href={item.originalUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="meta-link"
                                >
                                  Drive Link <ExternalLink size={11} />
                                </a>
                                <span className="meta-file-id">File ID: {item.fileId}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                )}
              </div>

              {/* Links section */}
              <div className="editor-grid" style={{ marginTop: 24 }}>
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
                    <small>Make visible to visitors. Requires exactly one primary image.</small>
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
            <label className="manager-search">
              <Search size={15} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects..."
              />
            </label>
          </div>
        </div>

        <div className="manager-filters">
          <button
            type="button"
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All <span>{projects.length}</span>
          </button>
          <button
            type="button"
            className={filter === "published" ? "active" : ""}
            onClick={() => setFilter("published")}
          >
            Published <span>{publishedCount}</span>
          </button>
          <button
            type="button"
            className={filter === "drafts" ? "active" : ""}
            onClick={() => setFilter("drafts")}
          >
            Drafts <span>{draftCount}</span>
          </button>
          <button
            type="button"
            className={filter === "featured" ? "active" : ""}
            onClick={() => setFilter("featured")}
          >
            Featured <span>{featuredCount}</span>
          </button>
        </div>

        {visibleProjects.length ? (
          <div className="admin-project-list">
            {visibleProjects.map((project) => {
              const coverUrl = project.coverImage || project.image?.secureUrl;
              const hasNoImage = !coverUrl;

              return (
                <article key={project.id} className="admin-project-row">
                  <div
                    className="admin-project-thumb"
                    style={coverUrl ? { backgroundImage: `url("${coverUrl}")` } : undefined}
                  >
                    <FolderKanban size={20} />
                  </div>
                  <div className="admin-project-main">
                    <div className="admin-project-title">
                      <h3>{project.title}</h3>
                      {project.isPublished ? (
                        <span className="publish-pill">Published</span>
                      ) : (
                        <span className="publish-pill draft">Draft</span>
                      )}
                      {project.isFeatured ? (
                        <span className="feature-pill">Featured</span>
                      ) : null}
                      {hasNoImage ? (
                        <span className="feature-pill" style={{ background: "#fee2e2", color: "#b91f27", borderColor: "#fca5a5" }}>
                          Missing Image
                        </span>
                      ) : null}
                      {project.media && project.media.length > 0 ? (
                        <span className="admin-project-category" style={{ background: "#edf6f0", color: "#167a50" }}>
                          {project.media.length} media
                        </span>
                      ) : null}
                    </div>
                    <p>{project.summary}</p>
                    <div className="admin-project-meta">
                      <span className="admin-project-slug">/projects/{project.slug}</span>
                      {project.category ? (
                        <span className="admin-project-category">{project.category}</span>
                      ) : null}
                      <span className="admin-project-timestamp">
                        <Clock size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />
                        Updated {formatDate(project.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="admin-project-actions">
                    <button
                      type="button"
                      className="icon-button"
                      title={project.isPublished ? "Unpublish to draft" : "Publish to live site"}
                      onClick={() => togglePublish(project)}
                      disabled={busy}
                    >
                      {project.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      title="Edit project"
                      onClick={() => openEdit(project)}
                      disabled={busy}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-button danger-icon"
                      title="Delete project"
                      onClick={() => setProjectToDelete(project)}
                      disabled={busy}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            No projects found matching the selected filters.
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {projectToDelete ? (
        <div className="admin-confirm-overlay" role="dialog" aria-modal="true">
          <div className="admin-confirm-dialog">
            <div className="admin-confirm-icon">
              <Trash2 size={24} />
            </div>
            <h3>Delete “{projectToDelete.title}”?</h3>
            <p>
              This will permanently remove the project from MongoDB and delete any associated Cloudinary image assets.
            </p>
            <p className="admin-confirm-sub">This action cannot be undone.</p>
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
                className="button button-primary danger-btn"
                onClick={() => executeDelete(projectToDelete)}
                disabled={busy}
              >
                {busy ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
