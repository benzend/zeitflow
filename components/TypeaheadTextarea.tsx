import React, { useRef, useEffect } from "react";
import { useTypeahead } from "@/lib/use-typeahead";

interface TypeaheadTextareaProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  className?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
  name?: string;
  showHint?: boolean;
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
}: TypeaheadTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const selectionStart = e.target.selectionStart;
    onChange(newValue);
    handleTextChange(newValue, selectionStart);
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
    handleTextChange(value, selectionStart);
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
        className={className}
        placeholder={placeholder}
        required={required}
        id={id}
        name={name}
      />
      
      {showHint && suggestions.length > 0 && !isOpen && (
        <div className="absolute top-2 right-2 text-xs text-gray-400 bg-foreground px-2 py-1 rounded border border-primary/20">
          Type <span className="font-mono">{"{{"}{"}}"}</span> for variables
        </div>
      )}
      
      {isOpen && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full max-w-xs bg-foreground border border-primary/20 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto"
          style={{ top: '100%' }}
        >
          <div className="px-3 py-2 text-xs text-gray-400 border-b border-primary/20">
            Variables {query && `matching "${query}"`}
          </div>
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm transition duration-200 flex items-center gap-2 ${
                index === selectedIndex
                  ? "bg-primary/10 text-primary"
                  : "text-primary hover:bg-primary/5"
              }`}
              onClick={() => selectSuggestion(index)}
              onMouseEnter={() => {
                // Update selected index on hover
                // We can't directly call setState here, so we'll rely on mouse events
              }}
            >
              <span className="bg-[#a3e635]/20 rounded px-1 py-0.5 text-xs font-mono text-[#a3e635]">
                {suggestion}
              </span>
              <span className="text-xs text-gray-400">
                {`{{${suggestion}}}`}
              </span>
            </button>
          ))}
          {filteredSuggestions.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">
              No variables found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
