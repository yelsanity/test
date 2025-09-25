export const DEFAULT_CHAT_MODEL = 'sonar-large-chat';
export const DEFAULT_ONLINE_MODEL = 'sonar-large-online';

export function selectPerplexityModel(requested?: string | null, needsBrowsing?: boolean): string {
  if (requested && requested !== 'auto') return requested;
  return needsBrowsing ? DEFAULT_ONLINE_MODEL : DEFAULT_CHAT_MODEL;
}

