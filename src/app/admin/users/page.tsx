"use client";

import { useState, useEffect } from "react";
import { Search, Download, ChevronUp, ChevronDown, MoreHorizontal, Ban, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/admin/shared/ConfirmModal";

interface User {
  id: number;
  name: string;
  email: string;
  role?: { id: number; name: string } | null;
  roleId?: number | null;
  status: string;
  createdAt: string;
  lastActive: string | null;
  avatar?: string | null;
}

const roles = ["all", "viewer", "editor", "admin", "founder"];
const statuses = ["all", "active", "suspended"];

const SortIcon = ({ field, sortField, sortDir }: { field: string; sortField: string; sortDir: "asc" | "desc" }) => {
  if (sortField !== field) return <ChevronUp className="w-3 h-3 text-white/20" />;
  return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-neon-cyan" /> : <ChevronDown className="w-3 h-3 text-neon-cyan" />;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const pageSize = 10;

  useEffect(() => {
    loadUsers();
  }, [page, search, roleFilter, statusFilter, sortField, sortDir]);

  async function loadUsers() {
    try {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(page * pageSize),
        search,
        role: roleFilter,
        status: statusFilter,
        sort: sortField,
        dir: sortDir,
      });
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.success) {
        const data = json.data || json;
        setUsers(data.users || data.data || data);
        setTotal(data.total || (data.users || []).length);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: number, newRole: string) {
    if (newRole === "founder" && !confirm("Are you sure you want to make this user a founder?")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if ((await res.json()).success) {
        toast.success("Role updated");
        loadUsers();
      }
    } catch {
      toast.error("Failed to update role");
    }
  }

  async function handleStatusToggle(userId: number, current: string) {
    const newStatus = current === "active" ? "suspended" : "active";
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if ((await res.json()).success) {
        toast.success(`User ${newStatus}`);
        loadUsers();
      }
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleDelete(userId: number) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if ((await res.json()).success) {
        toast.success("User deleted");
        setDeleteConfirm(null);
        loadUsers();
      }
    } catch {
      toast.error("Failed to delete user");
    }
  }

  function handleSort(field: string) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  const filtered = users.filter(u => {
    if (roleFilter !== "all" && u.role?.name !== roleFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (search && !u.name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
          <h1 className="text-2xl font-bold font-heading">Users</h1>
          <p className="text-sm text-white/40 mt-1">Manage all registered users</p>
        </div>
        <a
          href="/api/admin/users/export"
          download
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/60 hover:text-white/80 transition-all"
        >
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by name or email..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30"
          />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }} className="h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/60 outline-none focus:border-neon-cyan/30">
          {roles.map(r => <option key={r} value={r}>{r === "all" ? "All Roles" : r}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className="h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/60 outline-none focus:border-neon-cyan/30">
          {statuses.map(s => <option key={s} value={s}>{s === "all" ? "All Status" : s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left px-5 py-4 text-xs font-medium text-white/30 uppercase tracking-wider cursor-pointer hover:text-white/50" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-1">User <SortIcon field="name" sortField={sortField} sortDir={sortDir} /></div>
                </th>
                <th className="text-left px-5 py-4 text-xs font-medium text-white/30 uppercase tracking-wider cursor-pointer hover:text-white/50" onClick={() => handleSort("email")}>
                  <div className="flex items-center gap-1">Email <SortIcon field="email" sortField={sortField} sortDir={sortDir} /></div>
                </th>
                <th className="text-left px-5 py-4 text-xs font-medium text-white/30 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-4 text-xs font-medium text-white/30 uppercase tracking-wider cursor-pointer hover:text-white/50" onClick={() => handleSort("status")}>
                  <div className="flex items-center gap-1">Status <SortIcon field="status" sortField={sortField} sortDir={sortDir} /></div>
                </th>
                <th className="text-left px-5 py-4 text-xs font-medium text-white/30 uppercase tracking-wider cursor-pointer hover:text-white/50" onClick={() => handleSort("createdAt")}>
                  <div className="flex items-center gap-1">Joined <SortIcon field="createdAt" sortField={sortField} sortDir={sortDir} /></div>
                </th>
                <th className="text-left px-5 py-4 text-xs font-medium text-white/30 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <tr key={user.id} className={cn("border-b border-white/[0.02] transition-colors hover:bg-white/[0.01]", i % 2 === 0 ? "bg-white/[0.005]" : "")}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20 border border-white/[0.06] flex items-center justify-center">
                        <span className="text-xs font-bold text-white/60">{user.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "U"}</span>
                      </div>
                      <span className="text-sm font-medium text-white/80">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-white/50">{user.email}</td>
                  <td className="px-5 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border",
                      user.role?.name === "founder" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                      user.role?.name === "admin" ? "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20" :
                      user.role?.name === "editor" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      "bg-white/5 text-white/40 border-white/[0.06]"
                    )}>{user.role?.name || "viewer"}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 text-xs",
                      user.status === "active" ? "text-green-400" : "text-red-400"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", user.status === "active" ? "bg-green-400" : "bg-red-400")} />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-white/40">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <div className="relative group">
                        <button className="p-1.5 rounded-lg hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-all">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-[#0a0a0a] border border-white/[0.06] shadow-2xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                          <select
                            value={user.role?.name || "viewer"}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="w-full px-3 py-2 text-xs text-white/60 hover:bg-white/[0.03] bg-transparent outline-none cursor-pointer"
                          >
                            <option value="viewer">Set Viewer</option>
                            <option value="editor">Set Editor</option>
                            <option value="admin">Set Admin</option>
                            <option value="founder" disabled={user.role?.name === "founder"}>Set Founder</option>
                          </select>
                          <button
                            onClick={() => handleStatusToggle(user.id, user.status)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/[0.03]"
                          >
                            {user.status === "active" ? <Ban className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                            {user.status === "active" ? "Suspend" : "Activate"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400/60 hover:bg-red-500/[0.04]"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-white/30">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.04]">
          <p className="text-xs text-white/30">Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} of {total}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 hover:text-white/70 disabled:opacity-30 transition-all">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * pageSize >= total} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 hover:text-white/70 disabled:opacity-30 transition-all">Next</button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm!)}
        title="Delete User?"
        description="This action cannot be undone. The user will be permanently removed."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
