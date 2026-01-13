// components/Inputs/HospitalAutocomplete.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/config";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  name?: string;
  minChars?: number; // start searching after this many chars
};

export default function HospitalAutocomplete({
  value,
  onChange,
  placeholder = "Start typing hospital name...",
  className = "",
  name,
  minChars = 1,
}: Props) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, string[]>>(new Map());
  const debounceRef = useRef<number | null>(null);

  // keep local query in sync when parent value changes
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    // click outside closes list
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!containerRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    // cleanup abort controller on unmount
    return () => {
      controllerRef.current?.abort();
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  async function fetchSuggestions(q: string) {
    if (!q || q.length < minChars) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    // cache
    const cached = cacheRef.current.get(q);
    if (cached) {
      setSuggestions(cached);
      setOpen(true);
      return;
    }

    controllerRef.current?.abort();
    const c = new AbortController();
    controllerRef.current = c;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/hospitals?q=${encodeURIComponent(q)}`, {
        signal: c.signal,
      });
      if (!res.ok) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      const data = await res.json();
      const list: string[] = (data.hospitals || []).filter(Boolean);
      cacheRef.current.set(q, list);
      setSuggestions(list);
      setOpen(list.length > 0);
      setActiveIndex(-1);
    } catch (err) {
      if ((err as any)?.name === "AbortError") return;
      console.error("Error fetching hospitals:", err);
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    setOpen(false);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      fetchSuggestions(v.trim());
    }, 250);
    // don't call parent on every keystroke (only when user explicitly picks or blurs),
    // but we allow immediate change if parent expects live updates:
    onChange(v);
  }

  function handleSelect(item: string) {
    setQuery(item);
    onChange(item);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (e.key === "ArrowDown") {
        // open suggestions if any cached for current query
        if (suggestions.length > 0) setOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else {
        // allow "enter" to accept typed free text
        onChange(query.trim());
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <input
        type="text"
        name={name}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
          // fetch on focus if query present
          if (query && query.length >= minChars) fetchSuggestions(query);
        }}
        placeholder={placeholder}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="hospital-autocomplete-list"
        className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* dropdown */}
      {open && (
        <ul
          id="hospital-autocomplete-list"
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white shadow-lg"
        >
          {loading && (
            <li className="px-3 py-2 text-sm text-gray-500">Searching…</li>
          )}

          {!loading && suggestions.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">No matches</li>
          )}

          {!loading &&
            suggestions.map((s, idx) => {
              const active = idx === activeIndex;
              return (
                <li
                  key={s + idx}
                  role="option"
                  aria-selected={active}
                  onMouseDown={(ev) => {
                    // prevent input blur before click
                    ev.preventDefault();
                    handleSelect(s);
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`cursor-pointer px-3 py-2 text-sm ${
                    active ? "bg-blue-600 text-white" : "text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {s}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
// app/api/inventory/hospitals/route.ts