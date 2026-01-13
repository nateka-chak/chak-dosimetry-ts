// components/DosimeterPicker.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, CheckSquare, XSquare, Upload, Plus } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

export type Option = {
  id: number;
  serial_number: string;
  model?: string;
  type?: string;
  status?: string;
  hospital_name?: string;
};

type Props = {
  selected: Option[];
  onChange: (selected: Option[]) => void;
  initialQuery?: string;
  statusFilter?: string | string[];
  pageSize?: number;
  placeholder?: string;
};

export default function DosimeterPicker({
  selected,
  onChange,
  initialQuery = "",
  statusFilter = "available",
  pageSize = 50,
  placeholder = "Search serial / model / type...",
}: Props) {
  const [q, setQ] = useState(initialQuery);
  const [results, setResults] = useState<Option[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedSet, setSelectedSet] = useState<Set<number>>(
    new Set(selected.map((s) => s.id))
  );

  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bulkRef = useRef<HTMLTextAreaElement | null>(null);
  const quickAddRef = useRef<HTMLInputElement | null>(null);
  const internalChangeRef = useRef(false);

  // 🔄 Sync with parent
  useEffect(
    () => setSelectedSet(new Set(selected.map((s) => s.id))),
    [selected]
  );

  useEffect(() => {
    if (internalChangeRef.current) {
      internalChangeRef.current = false;
      const updated = results.filter((r) => selectedSet.has(r.id));
      onChange(updated);
    }
  }, [selectedSet, onChange, results]);

  useEffect(() => {
    fetchPage(0, true).catch(() => {});
  }, [statusFilter]);

  async function fetchPage(newOffset = 0, replace = false) {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);

    try {
      // 🧠 Handle both string and string[] for statusFilter
const statusParam = Array.isArray(statusFilter)
  ? statusFilter.join(",")
  : statusFilter || "";

const url = `${API_BASE_URL}/api/inventory/search?q=${encodeURIComponent(
  q
)}&status=${encodeURIComponent(statusParam)}&limit=${pageSize}&offset=${newOffset}`;

      console.log("🔍 Fetching:", url);

      const res = await fetch(url, { signal: abortRef.current.signal });
      const contentType = res.headers.get("content-type") || "";

      if (!res.ok || !contentType.includes("application/json")) {
        const txt = await res.text();
        throw new Error(`Bad response from ${url}: ${txt.slice(0, 200)}`);
      }

      const data = await res.json();
      const rows: Option[] = data.rows || [];
      setResults(replace ? rows : [...results, ...rows]);
      setOffset(newOffset);
      setHasMore(!!data.hasMore);
    } catch (err) {
      if ((err as any).name !== "AbortError") {
        console.error("❌ DosimeterPicker — search error:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  // 🔍 Fetch by serial(s) directly
  async function fetchBySerial(serials: string[]): Promise<Option[]> {
    if (!serials.length) return [];
    const url = `${API_BASE_URL}/api/inventory/search?serials=${encodeURIComponent(
      serials.join(",")
    )}`;
    console.log("📦 Fetching serials:", url);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch serials: ${res.status}`);
      const data = await res.json();
      return data.rows || [];
    } catch (err) {
      console.error("❌ fetchBySerial error:", err);
      return [];
    }
  }

  function onQueryChange(next: string) {
    setQ(next);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchPage(0, true), 300);
  }

  function toggle(opt: Option) {
    setSelectedSet((prev) => {
      const copy = new Set(prev);
      copy.has(opt.id) ? copy.delete(opt.id) : copy.add(opt.id);
      internalChangeRef.current = true;
      return copy;
    });
  }

  function selectLoaded() {
    setSelectedSet((prev) => {
      const copy = new Set(prev);
      results.forEach((r) => copy.add(r.id));
      internalChangeRef.current = true;
      return copy;
    });
  }

  function deselectLoaded() {
    setSelectedSet((prev) => {
      const copy = new Set(prev);
      results.forEach((r) => copy.delete(r.id));
      internalChangeRef.current = true;
      return copy;
    });
  }

  function normalizeSerials(text: string): string[] {
  return text
    .replace(/\s+/g, " ") // collapse all whitespace into spaces
    .replace(/[, ]+/g, ",") // turn commas/spaces groups into a single comma
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}


  // 📥 Bulk Paste (with fetch)
  async function handlePasteBulk(text: string) {
    const parsed = normalizeSerials(text);
    if (!parsed.length) return;

    // find already-loaded matches
    const existing = results.filter((r) => parsed.includes(r.serial_number));
    const missingSerials = parsed.filter(
      (s) => !existing.some((r) => r.serial_number === s)
    );

    // fetch missing ones
    const fetched = await fetchBySerial(missingSerials);

    // merge into results
    setResults((prev) => [...prev, ...fetched]);

    // select everything
    setSelectedSet((prev) => {
      const copy = new Set(prev);
      [...existing, ...fetched].forEach((m) => copy.add(m.id));
      internalChangeRef.current = true;
      return copy;
    });
  }

  // ➕ Quick Add (with fetch)
  async function addManual(serial: string) {
    const s = serial.trim();
    if (!s) return;

    let found = results.find((r) => r.serial_number === s);
    if (!found) {
      const rows = await fetchBySerial([s]);
      if (rows.length) {
        found = rows[0];
        if (found) {
          setResults((prev) => found ? [...prev, found] : prev);
        }
      }
    }

    if (found) {
      setSelectedSet((prev) => {
        const copy = new Set(prev);
        copy.add(found!.id);
        internalChangeRef.current = true;
        return copy;
      });
    }
  }

 return (
  <div className="space-y-6">
    {/* 🔎 Search Bar */}
    <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 rounded-xl shadow-sm border sticky top-0 z-10">
      <div className="flex items-center flex-1 gap-2">
        <Search className="h-5 w-5 text-gray-400 shrink-0" />
        <input
          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder={placeholder}
          value={q}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition text-sm"
        onClick={() => fetchPage(0, true)}
      >
        Search
      </button>
    </div>

    {/* ✅ Actions */}
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center text-sm">
      <button
        type="button"
        className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border bg-gray-50 hover:bg-gray-100 transition w-full sm:w-auto"
        onClick={selectLoaded}
      >
        <CheckSquare className="h-4 w-4" /> Select all ({results.length})
      </button>
      <button
        type="button"
        className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border bg-gray-50 hover:bg-gray-100 transition w-full sm:w-auto"
        onClick={deselectLoaded}
      >
        <XSquare className="h-4 w-4" /> Deselect all
      </button>
      <span className="sm:ml-auto text-center sm:text-right text-gray-600">
        Selected:{" "}
        <span className="font-semibold text-blue-600">{selectedSet.size}</span>
      </span>
    </div>

    {/* 📋 Results */}
    <div className="border rounded-xl shadow-sm max-h-72 overflow-y-auto bg-white">
      {loading && results.length === 0 ? (
        <div className="p-4 text-center text-gray-500">Loading…</div>
      ) : results.length === 0 ? (
        <div className="p-4 text-center text-gray-500">No results</div>
      ) : (
        <ul className="divide-y">
          {results.map((r) => (
            <li
              key={r.id}
              className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-blue-50 transition"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 rounded"
                  checked={selectedSet.has(r.id)}
                  onChange={() => toggle(r)}
                />
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {r.serial_number}
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-1">
                    {r.model ?? r.type ?? ""}
                    {r.hospital_name && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {r.hospital_name}
                      </span>
                    )}
                    {r.status && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          r.status === "available"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>

    {hasMore && (
      <div className="text-center">
        <button
          type="button"
          onClick={() => fetchPage(offset + pageSize, false)}
          className="w-full sm:w-auto px-4 py-2 rounded-lg border bg-gray-50 hover:bg-gray-100 transition text-sm"
        >
          Load more
        </button>
      </div>
    )}
  </div>
);
}