"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import type { User } from "@/types";
import { supabaseService } from "@/lib/services/supabaseService";
import { useAuthStore } from "@/store/authStore";
import { SearchBar } from "@/components/dashboard/shared/SearchBar";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

interface EditFormState {
  id: string;
  name: string;
  password: string;
}

export function OwnerUsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allUsers = await supabaseService.getUsers();
      setUsers(allUsers.filter((u) => u.role === "receptionist"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [users, search]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;

  const resetCreateForm = () => {
    setCreateName("");
    setCreateEmail("");
  };

  const handleCreate = async () => {
    if (!createName.trim() || !createEmail.trim()) {
      setError("Name and email are required.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const userPayload = {
        name: createName.trim(),
        email: createEmail.trim(),
        role: "receptionist" as const,
        status: "active" as const,
        dbId: "",
      };

      const body = currentUser
        ? { user: userPayload, actor: { id: currentUser.dbId, name: currentUser.name, role: currentUser.role } }
        : userPayload;

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create receptionist");
      }

      const created = data.user as User;
      setUsers((prev) => {
        const existing = prev.find((u) => u.email === created.email);
        if (existing) {
          return prev.map((u) => (u.email === created.email ? created : u));
        }
        return [created, ...prev];
      });
      setIsCreateOpen(false);
      resetCreateForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create receptionist";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (user: User) => {
    setEditForm({
      id: user.dbId,
      name: user.name,
      password: "",
    });
    setIsEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editForm) return;
    setIsLoading(true);
    setError(null);
    try {
      const updates: { name?: string; password?: string } = {};
      if (editForm.name.trim()) updates.name = editForm.name.trim();
      if (editForm.password.trim()) updates.password = editForm.password;

      const body = currentUser
        ? { user: updates, actor: { id: currentUser.dbId, name: currentUser.name, role: currentUser.role } }
        : updates;

      const response = await fetch(`/api/users/id/${encodeURIComponent(editForm.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update receptionist");
      }

      const updated = data.user as User;
      setUsers((prev) => prev.map((u) => (u.dbId === updated.dbId ? updated : u)));
      setIsEditOpen(false);
      setEditForm(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update receptionist";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (user: User) => {
    const nextStatus = user.status === "active" ? "inactive" : "active";
    setIsLoading(true);
    setError(null);
    try {
      const updates = { status: nextStatus };
      const body = currentUser
        ? { user: updates, actor: { id: currentUser.dbId, name: currentUser.name, role: currentUser.role } }
        : updates;

      const response = await fetch(`/api/users/id/${encodeURIComponent(user.dbId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      const updated = data.user as User;
      setUsers((prev) => prev.map((u) => (u.dbId === updated.dbId ? updated : u)));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-primary">
            Team
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage receptionists for this property.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add receptionist
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <SearchBar
              value={search}
              onChange={(value) => {
                setSearch(value);
                setCurrentPage(1);
              }}
              placeholder="Search by name or email…"
              icon={Search}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="relative overflow-x-auto rounded-xl border bg-white">
        {paginatedUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {isLoading ? "Loading team…" : "No receptionists yet."}
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.dbId} className="border-b last:border-0">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={user.status === "active" ? "success" : "secondary"}
                    >
                      {user.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 capitalize">{user.role}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => openEdit(user)}
                      disabled={isLoading}
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant={user.status === "active" ? "outline" : "secondary"}
                      onClick={() => toggleStatus(user)}
                      disabled={isLoading}
                    >
                      {user.status === "active" ? "Disable" : "Enable"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetCreateForm();
        }}
        title="Add receptionist"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={createEmail}
            onChange={(e) => setCreateEmail(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                resetCreateForm();
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleCreate} disabled={isLoading}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditForm(null);
        }}
        title="Edit receptionist"
      >
        {editForm && (
          <div className="space-y-4">
            <Input
              label="Name"
              value={editForm.name}
              onChange={(e) =>
                setEditForm((prev) =>
                  prev ? { ...prev, name: e.target.value } : prev
                )
              }
            />
            <Input
              label="New password (optional)"
              type="password"
              value={editForm.password}
              onChange={(e) =>
                setEditForm((prev) =>
                  prev ? { ...prev, password: e.target.value } : prev
                )
              }
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditForm(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleEditSave}
                disabled={isLoading}
              >
                Save changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

