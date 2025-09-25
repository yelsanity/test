export const DEFAULT_CHAT_MODEL = 'sonar';
export const DEFAULT_ONLINE_MODEL = 'sonar';

export function selectPerplexityModel(requested?: string | null, needsBrowsing?: boolean): string {
  if (requested && requested !== 'auto') return requested;
  return needsBrowsing ? DEFAULT_ONLINE_MODEL : DEFAULT_CHAT_MODEL;
}

export function selectModelCandidates(requested?: string | null, needsBrowsing?: boolean): string[] {
  // Allow env-specified list
  const envList = process.env.PERPLEXITY_MODELS?.split(',').map(s => s.trim()).filter(Boolean);
  if (envList && envList.length) return envList;

  if (requested && requested !== 'auto') return [requested];
  // Prioritized candidates; keep short, most reliable first
  const base = ['sonar', 'sonar-pro'];
  return base;
}

