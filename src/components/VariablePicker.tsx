"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check, Search, X } from "lucide-react";

interface Variable {
  _id: string;
  key: string;
  value: string;
  label: string;
  category: string;
  description?: string;
}

interface VariablePickerProps {
  onSelect?: (mustache: string) => void;
  trigger?: React.ReactNode;
  position?: "bottom" | "top" | "left" | "right";
}

export function VariablePicker({ onSelect, trigger, position = "bottom" }: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [filteredVariables, setFilteredVariables] = useState<Variable[]>([]);
  const [search, setSearch] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && variables.length === 0) {
      loadVariables();
    }
  }, [isOpen]);

  useEffect(() => {
    if (search) {
      const filtered = variables.filter(
        (v) =>
          v.key.toLowerCase().includes(search.toLowerCase()) ||
          v.label.toLowerCase().includes(search.toLowerCase()) ||
          v.value.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredVariables(filtered);
    } else {
      setFilteredVariables(variables);
    }
  }, [search, variables]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const loadVariables = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/variables");
      if (res.ok) {
        const data = await res.json();
        setVariables(data.variables || []);
        setFilteredVariables(data.variables || []);
      }
    } catch (error) {
      console.error("Failed to load variables:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (key: string) => {
    const mustache = `{{${key}}}`;
    try {
      await navigator.clipboard.writeText(mustache);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      
      if (onSelect) {
        onSelect(mustache);
      }
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const groupedVariables = filteredVariables.reduce((acc, variable) => {
    const category = variable.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(variable);
    return acc;
  }, {} as Record<string, Variable[]>);

  const positionClasses = {
    bottom: "top-full mt-2",
    top: "bottom-full mb-2",
    left: "right-full mr-2",
    right: "left-full ml-2",
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="font-mono text-xs">{"{{ }}"}</span>
          Variables
        </button>
      )}

      {isOpen && (
        <div
          className={`absolute ${positionClasses[position]} right-0 z-50 w-96 rounded-xl border border-gray-200 bg-white shadow-xl`}
        >
          {/* Header */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Global Variables</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search variables..."
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Variables List */}
          <div className="max-h-96 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                Loading variables...
              </div>
            ) : filteredVariables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm font-medium text-gray-900">No variables found</p>
                <p className="text-xs text-gray-500 mt-1">
                  {search ? "Try a different search term" : "Add data in Profile Manager to create variables"}
                </p>
              </div>
            ) : (
              Object.entries(groupedVariables).map(([category, vars]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {vars.map((variable) => (
                      <button
                        key={variable._id}
                        type="button"
                        onClick={() => handleCopy(variable.key)}
                        className="w-full rounded-lg p-3 text-left hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{variable.label}</span>
                              <code className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                {`{{${variable.key}}}`}
                              </code>
                            </div>
                            {variable.value && (
                              <p className="text-xs text-gray-600 mt-1 truncate">{variable.value}</p>
                            )}
                            {variable.description && (
                              <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {copiedKey === variable.key ? (
                              <Check size={16} className="text-green-600" />
                            ) : (
                              <Copy size={16} className="text-gray-400 group-hover:text-gray-600" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              Click any variable to copy it to clipboard
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
