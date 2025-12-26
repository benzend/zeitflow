import { calculateReadingTime } from '@/lib/reading-time';

describe('calculateReadingTime', () => {
  it('should return "1 min read" for content under 200 words', () => {
    const content = 'This is a short content with less than two hundred words. '.repeat(3);
    expect(calculateReadingTime(content)).toBe('1 min read');
  });

  it('should return correct reading time for content exactly at word boundaries', () => {
    const content = 'word '.repeat(200);
    expect(calculateReadingTime(content)).toBe('1 min read');
  });

  it('should return "2 min read" for content with 201 words', () => {
    const content = 'word '.repeat(201);
    expect(calculateReadingTime(content)).toBe('2 min read');
  });

  it('should handle empty content', () => {
    const content = '';
    expect(calculateReadingTime(content)).toBe('0 min read');
  });

  it('should handle whitespace-only content', () => {
    const content = '   \n\t   ';
    expect(calculateReadingTime(content)).toBe('0 min read');
  });

  it('should calculate reading time for longer content', () => {
    const content = 'word '.repeat(450);
    expect(calculateReadingTime(content)).toBe('3 min read');
  });
});