/**
 * Unit tests for phone-utils
 */

import {
  containsVariableSyntax,
  validatePhoneEntry,
  processPhoneRecipients,
  formatPhoneRecipientsStatus,
  processEmailRecipients,
} from '@/lib/phone-utils';

describe('phone-utils', () => {
  describe('containsVariableSyntax', () => {
    test('detects variable syntax', () => {
      expect(containsVariableSyntax('{{contact.phone}}')).toBe(true);
      expect(containsVariableSyntax('{{var}}')).toBe(true);
      expect(containsVariableSyntax('text {{var}} text')).toBe(true);
    });

    test('returns false for non-variable strings', () => {
      expect(containsVariableSyntax('+12345678900')).toBe(false);
      expect(containsVariableSyntax('plain text')).toBe(false);
      expect(containsVariableSyntax('{var}')).toBe(false);
      expect(containsVariableSyntax('{{}')).toBe(false);
    });
  });

  describe('validatePhoneEntry', () => {
    test('validates E.164 format', () => {
      const result = validatePhoneEntry('+14155552671');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('+14155552671');
      expect(result.isVariable).toBeUndefined();
    });

    test('validates international numbers', () => {
      // UK number
      const uk = validatePhoneEntry('+442071234567');
      expect(uk.valid).toBe(true);
      expect(uk.formatted).toBe('+442071234567');

      // German number
      const de = validatePhoneEntry('+4930123456');
      expect(de.valid).toBe(true);
    });

    test('validates properly formatted US number', () => {
      // Valid US number with proper area code
      const result = validatePhoneEntry('+14155552671');
      expect(result.valid).toBe(true);
    });

    test('accepts variables as valid', () => {
      const result = validatePhoneEntry('{{contact.phone}}');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('{{contact.phone}}');
      expect(result.isVariable).toBe(true);
    });

    test('rejects invalid phone numbers', () => {
      const invalid1 = validatePhoneEntry('123');
      expect(invalid1.valid).toBe(false);
      expect(invalid1.error).toBeDefined();

      const invalid2 = validatePhoneEntry('not-a-phone');
      expect(invalid2.valid).toBe(false);

      const invalid3 = validatePhoneEntry('+1');
      expect(invalid3.valid).toBe(false);
    });

    test('rejects empty entries', () => {
      const result = validatePhoneEntry('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Empty entry');
    });

    test('trims whitespace', () => {
      const result = validatePhoneEntry('  +14155552671  ');
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('+14155552671');
    });
  });

  describe('processPhoneRecipients', () => {
    test('processes single valid phone number', () => {
      const result = processPhoneRecipients('+14155552671');
      expect(result.valid).toEqual(['+14155552671']);
      expect(result.invalid).toEqual([]);
      expect(result.variables).toEqual([]);
    });

    test('processes multiple valid phone numbers', () => {
      const result = processPhoneRecipients('+14155552671, +442071234567');
      expect(result.valid).toEqual(['+14155552671', '+442071234567']);
      expect(result.invalid).toEqual([]);
      expect(result.variables).toEqual([]);
    });

    test('processes single variable', () => {
      const result = processPhoneRecipients('{{contact.phone}}');
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
      expect(result.variables).toEqual(['{{contact.phone}}']);
    });

    test('processes mixed valid numbers and variables', () => {
      const result = processPhoneRecipients('{{contact.phone}}, +14155552671');
      expect(result.valid).toEqual(['+14155552671']);
      expect(result.invalid).toEqual([]);
      expect(result.variables).toEqual(['{{contact.phone}}']);
    });

    test('separates valid and invalid entries', () => {
      const result = processPhoneRecipients('+14155552671, invalid, +442071234567');
      expect(result.valid).toEqual(['+14155552671', '+442071234567']);
      expect(result.invalid).toEqual(['invalid']);
      expect(result.variables).toEqual([]);
    });

    test('handles empty input', () => {
      const result1 = processPhoneRecipients('');
      expect(result1.valid).toEqual([]);
      expect(result1.invalid).toEqual([]);
      expect(result1.variables).toEqual([]);

      const result2 = processPhoneRecipients('   ');
      expect(result2.valid).toEqual([]);
      expect(result2.invalid).toEqual([]);
      expect(result2.variables).toEqual([]);
    });

    test('handles whitespace around entries', () => {
      const result = processPhoneRecipients('  +14155552671  ,  {{var}}  ,  +442071234567  ');
      expect(result.valid).toEqual(['+14155552671', '+442071234567']);
      expect(result.variables).toEqual(['{{var}}']);
      expect(result.invalid).toEqual([]);
    });

    test('filters out empty entries from comma-separated list', () => {
      const result = processPhoneRecipients('+14155552671, , ,+442071234567');
      expect(result.valid).toEqual(['+14155552671', '+442071234567']);
      expect(result.invalid).toEqual([]);
    });

    test('handles international phone numbers', () => {
      const result = processPhoneRecipients('+442071234567, +4930123456, +14155552671');
      expect(result.valid.length).toBe(3);
      expect(result.invalid).toEqual([]);
    });

    test('auto-formats valid numbers to E.164', () => {
      const result = processPhoneRecipients('+14155552671');
      expect(result.valid).toEqual(['+14155552671']);
    });
  });

  describe('formatPhoneRecipientsStatus', () => {
    test('formats status with valid numbers only', () => {
      const result = formatPhoneRecipientsStatus({
        valid: ['+14155552671', '+442071234567'],
        invalid: [],
        variables: [],
      });
      expect(result).toBe('2 valid');
    });

    test('formats status with variables only', () => {
      const result = formatPhoneRecipientsStatus({
        valid: [],
        invalid: [],
        variables: ['{{contact.phone}}'],
      });
      expect(result).toBe('1 valid');
    });

    test('formats status with valid numbers and variables', () => {
      const result = formatPhoneRecipientsStatus({
        valid: ['+14155552671'],
        invalid: [],
        variables: ['{{contact.phone}}'],
      });
      expect(result).toBe('2 valid');
    });

    test('formats status with invalid entries', () => {
      const result = formatPhoneRecipientsStatus({
        valid: ['+14155552671'],
        invalid: ['invalid'],
        variables: [],
      });
      expect(result).toBe('1 valid, 1 invalid');
    });

    test('formats status with all types', () => {
      const result = formatPhoneRecipientsStatus({
        valid: ['+14155552671'],
        invalid: ['invalid', '123'],
        variables: ['{{var}}'],
      });
      expect(result).toBe('2 valid, 2 invalid');
    });

    test('formats status with no recipients', () => {
      const result = formatPhoneRecipientsStatus({
        valid: [],
        invalid: [],
        variables: [],
      });
      expect(result).toBe('No recipients');
    });
  });

  describe('processEmailRecipients', () => {
    test('validates email with periods in local part', () => {
      const result = processEmailRecipients('user.name@example.com');
      expect(result.valid).toEqual(['user.name@example.com']);
      expect(result.invalid).toEqual([]);
    });

    test('validates email with multiple periods in local part', () => {
      const result = processEmailRecipients('first.middle.last@example.com');
      expect(result.valid).toEqual(['first.middle.last@example.com']);
      expect(result.invalid).toEqual([]);
    });

    test('validates email with periods in domain', () => {
      const result = processEmailRecipients('user@mail.example.co.uk');
      expect(result.valid).toEqual(['user@mail.example.co.uk']);
      expect(result.invalid).toEqual([]);
    });

    test('validates simple email', () => {
      const result = processEmailRecipients('user@example.com');
      expect(result.valid).toEqual(['user@example.com']);
      expect(result.invalid).toEqual([]);
    });

    test('processes multiple comma-separated emails', () => {
      const result = processEmailRecipients('a.b@example.com, c.d@example.com');
      expect(result.valid).toEqual(['a.b@example.com', 'c.d@example.com']);
      expect(result.invalid).toEqual([]);
    });

    test('detects variables', () => {
      const result = processEmailRecipients('{{contact.email}}');
      expect(result.variables).toEqual(['{{contact.email}}']);
      expect(result.valid).toEqual([]);
    });

    test('separates valid, invalid, and variables', () => {
      const result = processEmailRecipients('good.user@example.com, bad-email, {{var}}');
      expect(result.valid).toEqual(['good.user@example.com']);
      expect(result.invalid).toEqual(['bad-email']);
      expect(result.variables).toEqual(['{{var}}']);
    });

    test('handles empty input', () => {
      const result = processEmailRecipients('');
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
      expect(result.variables).toEqual([]);
    });

    test('rejects email without domain', () => {
      const result = processEmailRecipients('user@');
      expect(result.invalid).toEqual(['user@']);
    });

    test('does not split on periods', () => {
      const result = processEmailRecipients('john.doe@example.com');
      expect(result.valid).toHaveLength(1);
      expect(result.valid[0]).toBe('john.doe@example.com');
    });
  });
});
