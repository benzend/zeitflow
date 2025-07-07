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
          className="bg-[#a3e635] bg-opacity-20 text-[#a3e635] px-1 rounded font-medium"
          title="Variable"
        >
          {part}
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
