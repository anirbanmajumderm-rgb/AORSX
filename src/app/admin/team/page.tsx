"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Edit3, Trash2, Save, X, Eye, EyeOff, GripVertical, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/admin/shared/ConfirmModal";
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string | null;
  photo: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
  displayOrder: number;
  isFounder: boolean;
  isActive: boolean;
}

function SortableCard({
  member,
  index,
  total,
  editingId,
  editingForm,
  saving,
  onStartEdit,
  onUpdate,
  onCancelEdit,
  onDeleteClick,
  onToggleActive,
  onMove,
  onFormChange,
  uploading,
  onPhotoUpload,
}: {
  member: TeamMember;
  index: number;
  total: number;
  editingId: number | null;
  editingForm: any;
  saving: boolean;
  uploading: boolean;
  onStartEdit: (m: TeamMember) => void;
  onUpdate: (id: number) => void;
  onCancelEdit: () => void;
  onDeleteClick: (id: number) => void;
  onToggleActive: (m: TeamMember) => void;
  onMove: (index: number, dir: "up" | "down") => void;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onPhotoUpload: (file: File) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: member.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const isEditing = editingId === member.id;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-hidden group"
    >
      {isEditing ? (
        <div className="p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/50 mb-1">Name</label>
              <input name="name" value={editingForm.name} onChange={onFormChange} className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/50 mb-1">Role</label>
              <input name="role" value={editingForm.role} onChange={onFormChange} className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/50 mb-1">Bio</label>
              <textarea name="bio" value={editingForm.bio} onChange={onFormChange} rows={2} className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 resize-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/50 mb-1">Email</label>
              <input name="email" value={editingForm.email} onChange={onFormChange} className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/50 mb-1">Phone</label>
              <input name="phone" value={editingForm.phone} onChange={onFormChange} className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/50 mb-1">Photo</label>
              <div className="flex items-center gap-2">
                {editingForm.photo && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/[0.06] shrink-0 bg-white/[0.03]">
                    <img src={editingForm.photo} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 hover:text-white/70 hover:border-neon-cyan/30 cursor-pointer transition-all">
                  <Upload className="w-3 h-3" />
                  {uploading ? "..." : "Photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploading} onChange={async (e) => { const f = e.target.files?.[0]; if (f) await onPhotoUpload(f); }} />
                </label>
                {editingForm.photo && (
                  <button onClick={() => onFormChange({ target: { name: "photo", value: "" } } as any)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="isFounder-edit"
                checked={editingForm.isFounder}
                onChange={(e) => onFormChange({ target: { name: "isFounder", value: e.target.checked } } as any)}
                className="w-4 h-4 rounded border-white/[0.06] bg-white/[0.03] accent-neon-cyan"
              />
              <label htmlFor="isFounder-edit" className="text-sm text-white/60 cursor-pointer">Founder</label>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => onUpdate(member.id)} disabled={saving} className="flex-1 py-2 rounded-lg bg-neon-cyan/10 text-neon-cyan text-sm font-medium hover:bg-neon-cyan/20 transition-all">
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={onCancelEdit} className="py-2 px-4 rounded-lg border border-white/[0.06] text-white/50 text-sm hover:text-white/70 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20 border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                {member.photo ? (
                  <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold font-heading text-white/70">{getInitials(member.name)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white truncate">{member.name}</h3>
                <p className="text-sm text-neon-cyan/70 truncate">{member.role}</p>
              </div>
              <div className="flex items-center gap-1">
                <div {...attributes} {...listeners} className="p-1 rounded-lg hover:bg-white/[0.04] text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing transition-all">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
                member.isActive
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : "bg-white/5 text-white/30 border-white/[0.06]"
              )}>
                {member.isActive ? "Active" : "Hidden"}
              </span>
            </div>
            {member.bio && (
              <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{member.bio}</p>
            )}
            {member.email && (
              <p className="text-xs text-white/30 mt-2 truncate">{member.email}</p>
            )}
          </div>
          <div className="flex items-center border-t border-white/[0.04]">
            <button onClick={() => onStartEdit(member)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-white/40 hover:text-neon-cyan hover:bg-white/[0.02] transition-all">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => onToggleActive(member)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.02] transition-all border-x border-white/[0.04]">
              {member.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {member.isActive ? "Hide" : "Show"}
            </button>
            <button onClick={() => onDeleteClick(member.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-white/40 hover:text-red-400 hover:bg-red-500/[0.04] transition-all">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "", role: "", bio: "", email: "", phone: "", linkedin: "", twitter: "", github: "", photo: "", isFounder: false, isActive: true,
  });

  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      const res = await fetch("/api/admin/team");
      const json = await res.json();
      if (json.success) setMembers(json.data || json);
    } catch {
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/team/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.success) {
        setForm((prev) => ({ ...prev, photo: json.data.url }));
        toast.success("Photo uploaded");
      } else {
        toast.error(json.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.name || !form.role) {
      toast.error("Name and role are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          displayOrder: members.length,
        }),
      });
      const json = await res.json();
      if (json.success || json.id) {
        toast.success("Member added");
        setShowAdd(false);
        setForm({ name: "", role: "", bio: "", email: "", phone: "", linkedin: "", twitter: "", github: "", photo: "", isFounder: false, isActive: true });
        loadMembers();
      } else {
        toast.error("Failed to add member");
      }
    } catch {
      toast.error("Failed to add member");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: number) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/team/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success || json.id) {
        toast.success("Member updated");
        setEditingId(null);
        loadMembers();
      } else {
        toast.error("Failed to update member");
      }
    } catch {
      toast.error("Failed to update member");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/team/${deleteId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Member deleted");
        setDeleteId(null);
        loadMembers();
      } else {
        toast.error("Failed to delete member");
      }
    } catch {
      toast.error("Failed to delete member");
    }
  }

  async function toggleActive(member: TeamMember) {
    try {
      await fetch(`/api/admin/team/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      loadMembers();
    } catch {
      toast.error("Failed to toggle status");
    }
  }

  async function moveMember(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= members.length) return;
    const updated = [...members];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setMembers(updated);
    await saveOrder(updated);
  }

  async function saveOrder(ordered: TeamMember[]) {
    ordered.forEach((m, i) => { m.displayOrder = i; });
    try {
      await Promise.all(ordered.map((m) =>
        fetch(`/api/admin/team/${m.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: m.displayOrder }),
        })
      ));
    } catch {
      toast.error("Failed to reorder");
      loadMembers();
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = members.findIndex((m) => m.id === active.id);
    const newIndex = members.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const updated = arrayMove(members, oldIndex, newIndex);
    setMembers(updated);
    saveOrder(updated);
  }

  function startEdit(member: TeamMember) {
    setEditingId(member.id);
    setForm({
      name: member.name,
      role: member.role,
      bio: member.bio || "",
      email: member.email || "",
      phone: member.phone || "",
      linkedin: member.linkedin || "",
      twitter: member.twitter || "",
      github: member.github || "",
      photo: member.photo || "",
      isFounder: member.isFounder,
      isActive: member.isActive,
    });
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-white/5 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Team & Founders</h1>
          <p className="text-sm text-white/40 mt-1">Manage your team members and founders</p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold text-sm hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> {showAdd ? "Cancel" : "Add Member"}
        </button>
      </div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4 sm:p-6 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-white/70">New Team Member</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Name *</label>
              <input value={form.name} onChange={handleFormChange} name="name" className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Role *</label>
              <input value={form.role} onChange={handleFormChange} name="role" className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/50 mb-1.5">Bio</label>
              <textarea value={form.bio} onChange={handleFormChange} name="bio" rows={3} className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Email</label>
              <input value={form.email} onChange={handleFormChange} name="email" className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Phone</label>
              <input value={form.phone} onChange={handleFormChange} name="phone" className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">LinkedIn URL</label>
              <input value={form.linkedin} onChange={handleFormChange} name="linkedin" className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Twitter/X URL</label>
              <input value={form.twitter} onChange={handleFormChange} name="twitter" className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">GitHub URL</label>
              <input value={form.github} onChange={handleFormChange} name="github" className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/50 mb-1.5">Photo</label>
              <div className="flex items-center gap-3">
                {form.photo && (
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/[0.06] shrink-0 bg-white/[0.03]">
                    <img src={form.photo} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/50 hover:text-white/70 hover:border-neon-cyan/30 cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Upload"}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploading} onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handlePhotoUpload(f); }} />
                </label>
                {form.photo && (
                  <button onClick={() => setForm((p) => ({ ...p, photo: "" }))} className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="isFounder-add"
                checked={form.isFounder}
                onChange={(e) => setForm((p) => ({ ...p, isFounder: e.target.checked }))}
                className="w-4 h-4 rounded border-white/[0.06] bg-white/[0.03] accent-neon-cyan"
              />
              <label htmlFor="isFounder-add" className="text-sm text-white/60 cursor-pointer">Mark as Founder</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl border border-white/[0.06] text-sm text-white/50 hover:text-white/70 transition-all">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </motion.div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={members.map((m) => m.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member, index) => (
              <SortableCard
                key={member.id}
                member={member}
                index={index}
                total={members.length}
                editingId={editingId}
                editingForm={form}
                saving={saving}
                onStartEdit={startEdit}
                onUpdate={handleUpdate}
                onCancelEdit={() => setEditingId(null)}
                onDeleteClick={setDeleteId}
                onToggleActive={toggleActive}
                onMove={moveMember}
                onFormChange={handleFormChange}
                uploading={uploading}
                onPhotoUpload={handlePhotoUpload}
              />
            ))}
            {members.length === 0 && (
              <div className="col-span-full rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-12 text-center">
                <p className="text-sm text-white/30">No team members yet. Click &ldquo;Add Member&rdquo; to create one.</p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Member?"
        description="This action cannot be undone. The team member will be permanently removed."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}
