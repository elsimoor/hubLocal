"use client";

import React, { useState, useRef, useEffect } from 'react';

interface Variable {
  key: string;
  label: string;
  value: string;
  category?: string;
}

interface TextFieldWithVariablesProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'textarea';
  className?: string;
  rows?: number;
}

export function TextFieldWithVariables({
  value = '',
  onChange,
  placeholder,
  type = 'text',
  className = '',
  rows = 4
}: TextFieldWithVariablesProps) {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch variables on mount
  useEffect(() => {
    fetch('/api/variables')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data?.variables)) {
          setVariables(data.variables);
        }
      })
      .catch(err => console.error('Failed to fetch variables:', err));
  }, []);

  // Check if cursor is inside {{ }} and extract search query
  const checkForVariableTrigger = (text: string, pos: number) => {
    // Find the last {{ before cursor
    const beforeCursor = text.substring(0, pos);
    const lastOpenIndex = beforeCursor.lastIndexOf('{{');
    
    if (lastOpenIndex === -1) return null;
    
    // Check if there's a closing }} after the {{
    const afterOpen = text.substring(lastOpenIndex);
    const closeIndex = afterOpen.indexOf('}}');
    
    // If cursor is between {{ and }} (or no }} yet)
    if (closeIndex === -1 || (pos - lastOpenIndex) <= closeIndex) {
      const query = text.substring(lastOpenIndex + 2, pos).trim();
      return { query, startPos: lastOpenIndex };
    }
    
    return null;
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    
    const cursorPos = inputRef.current?.selectionStart || 0;
    setCursorPosition(cursorPos);
    
    const trigger = checkForVariableTrigger(newValue, cursorPos);
    if (trigger) {
      setSearchQuery(trigger.query);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSearchQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && filteredVariables.length > 0) {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        e.preventDefault();
      }
    }
  };

  const insertVariable = (variable: Variable) => {
    const cursorPos = inputRef.current?.selectionStart || 0;
    const trigger = checkForVariableTrigger(value, cursorPos);
    
    if (trigger) {
      const beforeTrigger = value.substring(0, trigger.startPos);
      const afterCursor = value.substring(cursorPos);
      const newValue = `${beforeTrigger}{{${variable.key}}}${afterCursor}`;
      onChange(newValue);
      setShowSuggestions(false);
      
      // Set cursor after inserted variable
      setTimeout(() => {
        const newPos = trigger.startPos + variable.key.length + 4; // 4 for {{ }}
        inputRef.current?.setSelectionRange(newPos, newPos);
        inputRef.current?.focus();
      }, 0);
    }
  };

  const filteredVariables = variables.filter(v => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.key.toLowerCase().includes(query) ||
      v.label.toLowerCase().includes(query) ||
      v.value.toLowerCase().includes(query)
    );
  });

  const groupedVariables = filteredVariables.reduce((acc, v) => {
    const cat = v.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(v);
    return acc;
  }, {} as Record<string, Variable[]>);

  const inputClasses = `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`;

  return (
    <div className="relative">
      {type === 'textarea' ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className={inputClasses}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={inputClasses}
        />
      )}
      
      {showSuggestions && filteredVariables.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <div className="text-xs font-medium text-gray-600">
              Available Variables {searchQuery && `(filtering: "${searchQuery}")`}
            </div>
          </div>
          
          {Object.entries(groupedVariables).map(([category, vars]) => (
            <div key={category} className="border-b border-gray-100 last:border-b-0">
              <div className="px-3 py-1.5 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {category}
              </div>
              {vars.map((variable) => (
                <button
                  key={variable.key}
                  type="button"
                  onClick={() => insertVariable(variable)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {variable.label}
                      </div>
                      <div className="text-xs text-gray-500 font-mono truncate">
                        {`{{${variable.key}}}`}
                      </div>
                    </div>
                    {variable.value && (
                      <div className="text-xs text-gray-400 truncate max-w-[120px]">
                        {variable.value}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-1 text-xs text-gray-500">
        Type <code className="px-1 py-0.5 bg-gray-100 rounded">&#123;&#123;</code> to insert a variable
      </div>
    </div>
  );
}
