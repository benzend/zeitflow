import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Phone validation result for a single phone number entry
 */
export interface PhoneValidationResult {
  valid: boolean;
  formatted: string;
  isVariable?: boolean;
  error?: string;
}

/**
 * Result of processing comma-separated phone recipients
 */
export interface ProcessedPhoneRecipients {
  valid: string[];
  invalid: string[];
  variables: string[];
}

/**
 * Detects if a value contains variable syntax ({{...}})
 */
export function containsVariableSyntax(value: string): boolean {
  return /\{\{[^}]+\}\}/.test(value);
}

/**
 * Validates a single phone number entry
 * Returns validation result with formatted E.164 number or original variable
 */
export function validatePhoneEntry(entry: string): PhoneValidationResult {
  const trimmed = entry.trim();

  if (!trimmed) {
    return { valid: false, formatted: trimmed, error: 'Empty entry' };
  }

  // Variables always pass validation
  if (containsVariableSyntax(trimmed)) {
    return { valid: true, formatted: trimmed, isVariable: true };
  }

  try {
    // Try to parse the phone number
    const parsed = parsePhoneNumber(trimmed);

    if (parsed?.isValid()) {
      // Return formatted E.164 number
      return { valid: true, formatted: parsed.format('E.164') };
    }

    // Also check with the simplified validation for robustness
    if (isValidPhoneNumber(trimmed)) {
      return { valid: true, formatted: trimmed };
    }

    return {
      valid: false,
      formatted: trimmed,
      error: 'Invalid phone number format. Use international format (e.g., +12345678900)',
    };
  } catch (error) {
    return {
      valid: false,
      formatted: trimmed,
      error: 'Invalid phone number format',
    };
  }
}

/**
 * Processes comma-separated phone recipients
 * Returns categorized lists of valid numbers, invalid numbers, and variables
 */
export function processPhoneRecipients(input: string): ProcessedPhoneRecipients {
  const result: ProcessedPhoneRecipients = {
    valid: [],
    invalid: [],
    variables: [],
  };

  if (!input || !input.trim()) {
    return result;
  }

  // Split by comma and process each entry
  const entries = input.split(',').map((e) => e.trim()).filter((e) => e);

  for (const entry of entries) {
    const validation = validatePhoneEntry(entry);

    if (validation.valid) {
      if (validation.isVariable) {
        result.variables.push(validation.formatted);
      } else {
        result.valid.push(validation.formatted);
      }
    } else {
      result.invalid.push(entry);
    }
  }

  return result;
}

/**
 * Formats phone recipients for display
 * Returns a user-friendly status message
 */
export function formatPhoneRecipientsStatus(processed: ProcessedPhoneRecipients): string {
  const totalValid = processed.valid.length + processed.variables.length;
  const parts: string[] = [];

  if (totalValid > 0) {
    parts.push(`${totalValid} valid`);
  }

  if (processed.invalid.length > 0) {
    parts.push(`${processed.invalid.length} invalid`);
  }

  if (parts.length === 0) {
    return 'No recipients';
  }

  return parts.join(', ');
}

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Process comma-separated email addresses
 * Supports variables like {{contact.email}}
 */
export function processEmailRecipients(input: string): { valid: string[]; invalid: string[]; variables: string[] } {
  const emails = input
    .split(',')
    .map(e => e.trim())
    .filter(e => e.length > 0);

  const valid: string[] = [];
  const invalid: string[] = [];
  const variables: string[] = [];

  for (const email of emails) {
    // Variables always pass validation
    if (containsVariableSyntax(email)) {
      variables.push(email);
    } else if (EMAIL_REGEX.test(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  }

  return { valid, invalid, variables };
}
