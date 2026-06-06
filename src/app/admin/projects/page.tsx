"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit3, Trash2, Save, X, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/admin/shared/ConfirmModal";

interface Project {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  technologies: string | null;
  clientName: string | null;
  companyName: string | null;
  projectUrl: string | null;
  githubUrl: string | null;
  category: string | null;
  image: string | null;
  featured: boolean;
  order: number;
  isActive: boolean;
}

const emptyForm = {
  title: "",
  description: "",
  content: "",
  technologies: "",
  clientName: "",
  companyName: "",
  projectUrl: "",
  githubUrl: "",
  category: "",
  image: "",
  featured: false,
  order: 0,
  isActive: true,
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/projects");
      const json = await res.json();
      if (json.success) setProjects(json.data);
      else toast.error(json.error || "Failed to load projects");
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  function startCreate() {
    setEditingId(-1);
    setForm(emptyForm);
  }

  function startEdit(project: Project) {
    setEditingId(project.id);
    setForm({
      title: project.title,
      description: project.description || "",
      content: project.content || "",
      technologies: project.technologies || "",
      clientName: project.clientName || "",
      companyName: project.companyName || "",
      projectUrl: project.projectUrl || "",
      githubUrl: project.githubUrl || "",
      category: project.category || "",
      image: project.image || "",
      featured: project.featured,
      order: project.order,
      isActive: project.isActive,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const isNew = editingId === -1;
      const url = isNew ? "/api/admin/projects" : `/api/admin/projects/${editingId}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(isNew ? "Project created" : "Project updated");
        cancelEdit();
        load();
      } else {
        toast.error(json.error || "Failed to save project");
      }
    } catch {
      toast.error("Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/projects/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Project deleted");
        setDeleteTarget(null);
        load();
      } else {
        toast.error(json.error || "Failed to delete project");
      }
    } catch {
      toast.error("Failed to delete project");
    }
  }

  async function toggleActive(project: Project) {
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !project.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(project.isActive ? "Project hidden" : "Project shown");
        load();
      } else {
        toast.error(json.error || "Failed to update project");
      }
    } catch {
      toast.error("Failed to update project");
    }
  }

  async function toggleFeatured(project: Project) {
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !project.featured }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(project.featured ? "Unmarked as featured" : "Marked as featured");
        load();
      } else {
        toast.error(json.error || "Failed to update project");
      }
    } catch {
      toast.error("Failed to update project");
    }
  }

  const formField = (label: string, key: string, options?: { type?: string; rows?: number; placeholder?: string }) => {
    const value = (form as any)[key] ?? "";
    const isTextarea = options?.type === "textarea";
    return (
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1">{label}</label>
        {isTextarea ? (
          <textarea
            value={value}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            rows={options?.rows || 3}
            placeholder={options?.placeholder}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 resize-none"
          />
        ) : (
          <input
            type={options?.type || "text"}
            value={value}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={options?.placeholder}
            className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30"
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="h-96 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Projects</h1>
          <p className="text-sm text-white/40 mt-1">Manage portfolio projects</p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold hover:opacity-90 transition-all text-sm"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Edit/Create Form */}
      {editingId !== null && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold font-heading">{editingId === -1 ? "New Project" : "Edit Project"}</h3>
            <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formField("Title", "title", { placeholder: "Project title" })}
            {formField("Category", "category", { placeholder: "e.g. AI/ML, FinTech" })}
            {formField("Technologies (comma separated)", "technologies", { placeholder: "Next.js,React,TypeScript" })}
            {formField("Image URL", "image", { placeholder: "https://..." })}
            {formField("Project URL", "projectUrl", { placeholder: "https://..." })}
            {formField("GitHub URL", "githubUrl", { placeholder: "https://github.com/..." })}
            {formField("Client Name", "clientName", { placeholder: "Optional" })}
            {formField("Company Name", "companyName", { placeholder: "Optional" })}
            {formField("Order", "order", { type: "number" })}
          </div>
          {formField("Short Description", "description", { type: "textarea", rows: 2, placeholder: "Brief description for cards" })}
          {formField("Full Content", "content", { type: "textarea", rows: 4, placeholder: "Full project description" })}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="rounded border-white/20 bg-white/5"
              />
              <span className="text-sm text-white/60">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-white/20 bg-white/5"
              />
              <span className="text-sm text-white/60">Active</span>
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-neon-cyan/10 text-neon-cyan text-sm font-medium hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2 rounded-xl border border-white/[0.06] text-white/40 hover:text-white/70 text-sm transition-all"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Projects List */}
      <div className="space-y-3">
        {projects.length === 0 && (
          <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-12 text-center">
            <p className="text-sm text-white/30">No projects yet. Click &ldquo;New Project&rdquo; to create one.</p>
          </div>
        )}
        {projects.map((project) => (
          <motion.div
            key={project.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-2xl border overflow-hidden transition-all",
              project.isActive
                ? "bg-white/[0.02] border-white/[0.04]"
                : "bg-white/[0.01] border-white/[0.02] opacity-60"
            )}
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold font-heading text-white/90 truncate">
                      {project.title}
                    </h3>
                    {project.featured && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neon-orange/15 text-neon-orange border border-neon-orange/20">
                        Featured
                      </span>
                    )}
                    {project.category && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/40 border border-white/[0.06]">
                        {project.category}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/30">
                    <span>/{project.slug}</span>
                    {project.technologies && (
                      <span className="text-white/20">|</span>
                    )}
                    {project.technologies && (
                      <span className="truncate max-w-[300px]">{project.technologies}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleFeatured(project)}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      project.featured
                        ? "text-neon-orange/70 hover:text-neon-orange bg-neon-orange/5"
                        : "text-white/20 hover:text-white/60 hover:bg-white/[0.03]"
                    )}
                    title={project.featured ? "Unmark featured" : "Mark featured"}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(project)}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      project.isActive
                        ? "text-green-400/70 hover:text-green-400 bg-green-400/5"
                        : "text-white/20 hover:text-white/60 hover:bg-white/[0.03]"
                    )}
                    title={project.isActive ? "Hide project" : "Show project"}
                  >
                    {project.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => startEdit(project)}
                    className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.03] transition-all"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(project)}
                    className="p-2 rounded-lg text-red-400/30 hover:text-red-400 hover:bg-red-500/5 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {project.description && (
                <p className="text-sm text-white/40 mt-2 line-clamp-1">{project.description}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        title="Delete Project"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
