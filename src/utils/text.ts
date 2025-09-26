export function truncateText(input: string, maxChars: number): string {
  if (input.length <= maxChars) return input;
  return input.slice(0, maxChars - 3) + '...';
}

export function safeJoin(parts: Array<string | undefined | null>, sep = '\n\n'): string {
  return parts.filter((p): p is string => typeof p === 'string' && p.trim().length > 0).join(sep);
}

export function dedent(input: string): string {
  const lines = input.split('\n');
  const nonEmpty = lines.filter(l => l.trim().length > 0);
  const margin = Math.min(
    ...nonEmpty.map(l => (l.match(/^\s*/)?.[0].length ?? 0)),
  );
  return lines.map(l => l.slice(margin)).join('\n');
}

export function sanitizeForPrompt(text: string): string {
  return text.replace(/\u0000/g, '').replace(/```/g, '```\u200b');
}

