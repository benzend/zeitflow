import { useState, useCallback, useRef } from "react";

interface TypeaheadState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  cursorPosition: number;
  suggestions: (string | { name: string; description: string })[];
}

interface TypeaheadResult {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  suggestions: (string | { name: string; description: string })[];
  filteredSuggestions: (string | { name: string; description: string })[];
  handleTextChange: (text: string, selectionStart: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => boolean;
  selectSuggestion: (index: number) => void;
  closeSuggestions: () => void;
  setTextareaRef: (ref: HTMLTextAreaElement | null) => void;
}

export function useTypeahead(
  value: string,
  onChange: (value: string) => void,
  suggestions: (string | { name: string; description: string })[],
): TypeaheadResult {
  const [state, setState] = useState<TypeaheadState>({
    isOpen: false,
    query: "",
    selectedIndex: 0,
    cursorPosition: 0,
    suggestions: [],
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const setTextareaRef = useCallback((ref: HTMLTextAreaElement | null) => {
    textareaRef.current = ref;
  }, []);

  const suggestionFilter = (suggestion: string | {name: string, description: string}) => {
    if (typeof suggestion === "string") {
      return suggestion.toLowerCase().includes(state.query.toLowerCase());
    } else {
      return suggestion.name.toLowerCase().includes(state.query.toLowerCase());
    }
  };

  const filteredSuggestions = state.suggestions.filter(suggestionFilter);

  const handleTextChange = useCallback((text: string, selectionStart: number) => {
    // Check if cursor is after {{ pattern
    const beforeCursor = text.substring(0, selectionStart);
    const match = beforeCursor.match(/\{\{(\w*)$/);
    
    if (match) {
      const query = match[1];
      setState({
        isOpen: true,
        query,
        selectedIndex: 0,
        cursorPosition: selectionStart,
        suggestions,
      });
    } else {
      setState(prev => ({ ...prev, isOpen: false, query: "", selectedIndex: 0 }));
    }
  }, [suggestions]);

  const selectSuggestion = useCallback((index: number) => {
    debugger
    const suggestion = filteredSuggestions[index];
    if (!suggestion) return;

    // Find the {{ pattern before cursor
    const beforeCursor = value.substring(0, state.cursorPosition);
    const afterCursor = value.substring(state.cursorPosition);
    
    // Find the last {{ pattern - use a more specific approach
    const lastBraceIndex = beforeCursor.lastIndexOf('{{');
    if (lastBraceIndex === -1) {
      console.log('No {{ found in beforeCursor');
      return;
    }
    
    const beforeLastBrace = beforeCursor.substring(0, lastBraceIndex);
    const afterLastBrace = beforeCursor.substring(lastBraceIndex + 2);
    
    // Check if what comes after {{ is only word characters (the partial variable name)
    const match = afterLastBrace.match(/^(\w*)$/);
    
    console.log({ beforeCursor, afterCursor, lastBraceIndex, beforeLastBrace, afterLastBrace, match, suggestion });
    
    if (match) {
      const suggestionName = typeof suggestion === "string" ? suggestion : suggestion.name;
      const newValue = beforeLastBrace + `{{${suggestionName}}}` + afterCursor;
      onChange(newValue);

      // Set cursor after the inserted variable
      const newCursorPos = beforeLastBrace.length + suggestionName.length + 4; // 4 for {{}}
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    } else {
      console.warn("No valid {{ pattern found for suggestion insertion");
    }
    
    setState(prev => ({ ...prev, isOpen: false, query: "", selectedIndex: 0 }));
  }, [filteredSuggestions, state.cursorPosition, value, onChange, textareaRef]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent): boolean => {
    if (!state.isOpen || filteredSuggestions.length === 0) return false;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setState(prev => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, filteredSuggestions.length - 1),
        }));
        return true;

      case "ArrowUp":
        e.preventDefault();
        setState(prev => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, 0),
        }));
        return true;

      case "Enter":
      case "Tab":
        e.preventDefault();
        selectSuggestion(state.selectedIndex);
        return true;

      case "Escape":
        setState(prev => ({ ...prev, isOpen: false, query: "", selectedIndex: 0 }));
        return true;

      default:
        return false;
    }
  }, [state.isOpen, state.selectedIndex, filteredSuggestions.length, selectSuggestion]);

  const closeSuggestions = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false, query: "", selectedIndex: 0 }));
  }, []);

  return {
    isOpen: state.isOpen && filteredSuggestions.length > 0,
    query: state.query,
    selectedIndex: state.selectedIndex,
    suggestions,
    filteredSuggestions,
    handleTextChange,
    handleKeyDown,
    selectSuggestion,
    closeSuggestions,
    setTextareaRef,
  };
}
