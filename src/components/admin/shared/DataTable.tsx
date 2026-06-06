"use client";

import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { SearchInput } from "./SearchInput";
import { useState, useMemo } from "react";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: any;
  className?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  searchable = true,
  searchKeys,
  searchPlaceholder = "Search...",
  emptyTitle = "No data found",
  emptyDescription,
  emptyIcon,
  className,
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    const keys = searchKeys || (data.length > 0 ? Object.keys(data[0]) as (keyof T)[] : []);
    return data.filter((item) =>
      keys.some((key) => {
        const val = item[key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {searchable && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={searchPlaceholder}
            className="w-full sm:max-w-xs"
          />
          <span className="text-[11px] text-white/20 shrink-0">{sorted.length} results</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/[0.04] bg-white/[0.02]">
        {sorted.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription || (search ? `No results for "${search}"` : undefined)}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    className={cn(
                      "text-left py-3.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-white/20",
                      col.sortable && "cursor-pointer hover:text-white/40 transition-colors select-none",
                      col.className
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.header}
                      {col.sortable && sortKey === col.key && (
                        <span className="text-neon-cyan">{sortDir === "asc" ? "↑" : "↓"}</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, index) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={cn(
                    "border-b border-white/[0.02] transition-colors",
                    onRowClick && "cursor-pointer",
                    "hover:bg-white/[0.01]"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("py-3 px-4", col.className)}>
                      {col.render(item, index)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
