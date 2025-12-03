import React from "react";

/**
 * Highlights variables in text by wrapping them in styled spans
 */
export function highlightVariables(text: string): React.ReactNode[] {
  const parts = text.split(/(\{\{\w+\}\})/g);

  return parts.map((part, index) => {
    if (part.match(/^\{\{\w+\}\}$/)) {
      // This is a variable, highlight it
      return (
        <span
          key={index}
          className="bg-primary/20 rounded-lg px-2 py-1 text-xs font-semibold text-primary-dark"
          title="Variable"
        >
          {part.slice(2, -2)}
        </span>
      );
    } else {
      // Regular text
      return <span key={index}>{part}</span>;
    }
  });
}

/**
 * Component that renders text with highlighted variables
 */
interface HighlightedTextProps {
  text: string;
  className?: string;
}

export function HighlightedText({
  text,
  className = "",
}: HighlightedTextProps) {
  return <span className={className}>{highlightVariables(text)}</span>;
}
