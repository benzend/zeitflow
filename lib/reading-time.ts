export function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return '0 min read';
  }
  const words = trimmedContent.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}