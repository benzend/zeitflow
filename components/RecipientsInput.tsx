/**
 * RecipientsInput
 *
 * A chip-based input component for email/phone recipients with validation.
 * Each recipient is displayed as a visual chip with color coding:
 * - Valid entries: green
 * - Invalid entries: red
 * - Variable syntax: blue
 *
 * Supports adding recipients via Enter, comma, or space.
 */

import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { processEmailRecipients, processPhoneRecipients, containsVariableSyntax } from '@/lib/phone-utils';

interface RecipientsInputProps {
  /** Array of recipient values */
  value: string[];
  /** Called when recipients change */
  onChange: (value: string[]) => void;
  /** Type of validation to apply */
  validationType: 'email' | 'phone';
  /** Placeholder text when empty */
  placeholder?: string;
  /** Variable suggestions for autocomplete (future enhancement) */
  variableSuggestions?: (string | { name: string; description: string })[];
  /** Custom class name */
  className?: string;
}

interface Recipient {
  value: string;
  state: 'valid' | 'invalid' | 'variable';
  errorMessage?: string;
}

export default function RecipientsInput({
  value,
  onChange,
  validationType,
  placeholder = 'Type and press Enter...',
  variableSuggestions = [],
  className = '',
}: RecipientsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Validate a single recipient
  const validateRecipient = (recipient: string): Recipient => {
    if (containsVariableSyntax(recipient)) {
      return { value: recipient, state: 'variable' };
    }

    if (validationType === 'email') {
      const { valid, invalid } = processEmailRecipients(recipient);
      return valid.length > 0
        ? { value: recipient, state: 'valid' }
        : { value: recipient, state: 'invalid', errorMessage: 'Invalid email format' };
    } else {
      const { valid, invalid } = processPhoneRecipients(recipient);
      return valid.length > 0
        ? { value: recipient, state: 'valid' }
        : { value: recipient, state: 'invalid', errorMessage: 'Invalid phone format (use +1234567890)' };
    }
  };

  // Get recipients with validation state
  const recipients: Recipient[] = value.map(validateRecipient);

  // Add recipient from input
  const addRecipient = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue('');
    }
  };

  // Handle key presses
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Stop propagation to prevent React Flow from capturing
    e.stopPropagation();

    // Enter, comma, or space adds recipient
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addRecipient();
    }

    // Backspace on empty input removes last recipient
    if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  // Remove specific recipient
  const removeRecipient = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  // Focus container clicks on input
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className={`
        flex flex-wrap gap-2 p-2 min-h-[40px]
        bg-background-extra-light border border-border rounded-lg
        cursor-text
        ${focused ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        ${className}
      `}
      onClick={handleContainerClick}
    >
      {/* Recipient chips */}
      {recipients.map((recipient, index) => (
        <div
          key={index}
          className={`
            inline-flex items-center gap-1 px-2 py-1 rounded text-xs
            ${recipient.state === 'valid' ? 'bg-green-100 text-green-800 border border-green-300' : ''}
            ${recipient.state === 'invalid' ? 'bg-red-100 text-red-800 border border-red-300' : ''}
            ${recipient.state === 'variable' ? 'bg-blue-100 text-blue-800 border border-blue-300' : ''}
          `}
          title={recipient.errorMessage}
        >
          <span>{recipient.value}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeRecipient(index);
            }}
            className="hover:text-red-600 focus:outline-none"
          >
            ✕
          </button>
        </div>
      ))}

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={value.length === 0 ? placeholder : ''}
        className="
          flex-1 min-w-[120px] bg-transparent outline-none text-sm
          placeholder-text-placeholder
        "
      />
    </div>
  );
}
