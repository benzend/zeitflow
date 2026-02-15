import React, { useRef, useEffect, useState } from "react";
import { useTypeahead } from "@/lib/use-typeahead";
import { findInvalidVariables } from "@/lib/variables-client";
import { AlertTriangle } from "lucide-react";
import { Tooltip } from "react-tippy";

interface TypeaheadTextareaProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: (string | { name: string, description: string })[];
  className?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
  name?: string;
  showHint?: boolean;
  hintDuration?: number;
  hintNoSuggestionsMessage?: string;
  showVariableValidation?: boolean;
}

export default function TypeaheadTextarea({
  value,
  onChange,
  suggestions,
  className = "",
  placeholder,
  required,
  id,
  name,
  showHint = true,
  hintDuration = 2000,
  hintNoSuggestionsMessage = "No suggestions found",
  showVariableValidation = true,
}: TypeaheadTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showTimedHint, setShowTimedHint] = useState(false);

  const invalidVars = showVariableValidation ? findInvalidVariables(value, suggestions) : [];
  const hasInvalidVars = invalidVars.length > 0;

  const {
    isOpen,
    query,
    selectedIndex,
    filteredSuggestions,
    handleTextChange,
    handleKeyDown,
    selectSuggestion,
    closeSuggestions,
    setTextareaRef,
  } = useTypeahead(value, onChange, suggestions);

  // Set the ref when the component mounts or updates
  useEffect(() => {
    if (textareaRef.current) {
      setTextareaRef(textareaRef.current);
    }
  }, [setTextareaRef]);

  // Handle hint timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (showTimedHint) {
      timer = setTimeout(() => {
        setShowTimedHint(false);
      }, hintDuration);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showTimedHint, hintDuration]);

  const handleFocus = () => {
    setShowTimedHint(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const selectionStart = e.target.selectionStart;
    onChange(newValue);
    handleTextChange(newValue, selectionStart ?? 0);
  };

  const handleKeyDownEvent = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const handled = handleKeyDown(e);
    if (!handled && isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      // Prevent cursor movement in textarea when suggestions are open
      e.preventDefault();
    }
  };

  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.target as HTMLTextAreaElement;
    const selectionStart = textarea.selectionStart;
    handleTextChange(value, selectionStart ?? 0);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        closeSuggestions();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, closeSuggestions]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDownEvent}
        onClick={handleTextareaClick}
        onFocus={handleFocus}
        onBlur={() => setShowTimedHint(false)}
        className={className}
        placeholder={placeholder}
        required={required}
        id={id}
        name={name}
      />
      
      {hasInvalidVars && (
        <Tooltip title={`Invalid: ${invalidVars.map(v => `{{${v}}}`).join(', ')}`} position="top" theme="dark" size="small">
          <div className="absolute top-2 right-2 cursor-help">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </div>
        </Tooltip>
      )}
      
      {showHint && !isOpen && !hasInvalidVars && (
        <div
          className={`absolute top-2 right-2 text-xs text-inverted bg-background-light px-2 py-1 rounded border border-primary/20 transition-opacity ${showTimedHint ? 'opacity-100' : 'opacity-20'}`}>
          {suggestions.length > 0 ? (
            <>Type <span className="font-mono">{"{{"}{"}}"}</span> for variables</>
          ) : (
            <span className="text-xs text-foreground-light">
              {hintNoSuggestionsMessage}
            </span>
          )}
        </div>
      )}
      
      {isOpen && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full max-w-sm bg-background-light border border-primary/20 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto"
          style={{ top: '100%' }}
        >
          <div className="px-3 py-2 text-xs text-foreground-light border-b border-primary/20">
            Variables {query && `matching "${query}"`}
          </div>
          {filteredSuggestions.map((suggestion, index) => {
            const suggestionName = typeof suggestion === "string" ? suggestion : suggestion.name;
            const suggestionDescription = typeof suggestion === "string" ? "" : suggestion.description;
            return (
            <button
              key={suggestionName}
              type="button"
              className={`w-full cursor-pointer text-left px-3 py-4 text-sm transition duration-200 flex justify-start items-center gap-2 ${
                index === selectedIndex
                  ? "bg-primary/50 text-primary"
                  : "text-primary hover:bg-primary/50"
              }`}
              onClick={() => selectSuggestion(index)}
            >
              <span className="bg-[#a3e635]/20 rounded px-1 py-0.5 text-xs font-mono text-[#a3e635]">
                {suggestionName}
              </span>
              <span className="text-xs text-white">
                {`{{${suggestionName}}}`}
              </span>
              {suggestionDescription && (
                <span className="text-xs text-white min-w-30">
                  {suggestionDescription}
                </span>
               )}
             </button>
          )})}
          {filteredSuggestions.length === 0 && (
            <div className="px-3 py-2 text-sm text-foreground-light">
              No variables found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
