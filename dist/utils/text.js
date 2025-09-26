export function truncateText(input, maxChars) {
    if (input.length <= maxChars)
        return input;
    return input.slice(0, maxChars - 3) + '...';
}
export function safeJoin(parts, sep = '\n\n') {
    return parts.filter((p) => typeof p === 'string' && p.trim().length > 0).join(sep);
}
export function dedent(input) {
    const lines = input.split('\n');
    const nonEmpty = lines.filter(l => l.trim().length > 0);
    const margin = Math.min(...nonEmpty.map(l => (l.match(/^\s*/)?.[0].length ?? 0)));
    return lines.map(l => l.slice(margin)).join('\n');
}
export function sanitizeForPrompt(text) {
    return text.replace(/\u0000/g, '').replace(/```/g, '```\u200b');
}
