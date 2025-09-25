export const DEFAULT_CHAT_MODEL = 'llama-3.1-sonar-large-128k-chat';
export const DEFAULT_ONLINE_MODEL = 'llama-3.1-sonar-huge-128k-online';

export function selectPerplexityModel(requested?: string | null, needsBrowsing?: boolean): string {
  if (requested && requested !== 'auto') return requested;
  return needsBrowsing ? DEFAULT_ONLINE_MODEL : DEFAULT_CHAT_MODEL;
}

