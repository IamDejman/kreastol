"use client";

import { useEffect, useState } from "react";
import type { AuditLog } from "@/types";
import { supabaseService } from "@/lib/services/supabaseService";
import { useAuthStore } from "@/store/authStore";
import { SearchBar } from "@/components/dashboard/shared/SearchBar";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Filter } from "lucide-react";

export function OwnerAuditLogPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [roleFilter, setRoleFilter] = useState<"" | "owner" | "receptionist">(
    ""
  );
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { logs, total, page: currentPage } =
        await supabaseService.getAuditLogs({
          role: roleFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page,
          pageSize,
          query: search || undefined,
        });
      setLogs(logs);
      setTotal(total);
      setPage(currentPage);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load audit logs";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, roleFilter, startDate, endDate, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-primary">
            Audit log
          </h1>
        </div>
        {currentUser && (
          <div className="hidden text-right text-xs text-gray-500 sm:block">
            <div>Signed in as</div>
            <div className="font-medium">
              {currentUser.name} ({currentUser.role})
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:flex-1">
          <SearchBar
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search name, action, context…"
          />
        </div>
        <div className="flex w-full justify-end md:w-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsFilterOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filters"
      >
        <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Role</span>
            <Select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as "" | "owner" | "receptionist")
              }
            >
              <option value="">All roles</option>
              <option value="owner">Owner</option>
              <option value="receptionist">Receptionist</option>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="From"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
            <Input
              label="To"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              className="text-sm text-gray-500 underline-offset-2 hover:underline"
              onClick={() => {
                setRoleFilter("");
                setStartDate("");
                setEndDate("");
                setPage(1);
              }}
            >
              Clear filters
            </button>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsFilterOpen(false)}
            >
              Apply
            </Button>
          </div>
        </div>
      </Modal>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="relative overflow-x-auto rounded-xl border bg-white">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {isLoading ? "Loading activity…" : "No audit entries found."}
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Context</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const date = new Date(log.createdAt);
                const formattedDate = date.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                });
                const formattedTime = date.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div>{formattedDate}</div>
                      <div className="text-[11px] text-gray-400">
                        {formattedTime}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">
                        {log.actorName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize">
                        {log.actorRole}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">
                        {log.action}
                      </code>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-xs text-gray-700">
                      {log.context || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

