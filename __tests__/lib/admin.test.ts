import { isAdmin } from '../../lib/admin';

describe('Admin Helper Function', () => {
  it('should return true for admin emails', () => {
    expect(isAdmin('benjamin.scottt.dev@gmail.com')).toBe(true);
    expect(isAdmin('benn.jscott@gmail.com')).toBe(true);
    expect(isAdmin('benn.jscott+dev@gmail.com')).toBe(true);
    expect(isAdmin('shan.asif95@gmail.com')).toBe(true);
    expect(isAdmin('dominik@seriouscode.io')).toBe(true);
  });

  it('should return false for non-admin emails', () => {
    expect(isAdmin('user@example.com')).toBe(false);
    expect(isAdmin('test@gmail.com')).toBe(false);
    expect(isAdmin('')).toBe(false);
  });
});