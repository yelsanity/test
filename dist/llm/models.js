"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ONLINE_MODEL = exports.DEFAULT_CHAT_MODEL = void 0;
exports.selectPerplexityModel = selectPerplexityModel;
exports.selectModelCandidates = selectModelCandidates;
exports.DEFAULT_CHAT_MODEL = 'sonar';
exports.DEFAULT_ONLINE_MODEL = 'sonar';
function selectPerplexityModel(requested, needsBrowsing) {
    if (requested && requested !== 'auto')
        return requested;
    return needsBrowsing ? exports.DEFAULT_ONLINE_MODEL : exports.DEFAULT_CHAT_MODEL;
}
function selectModelCandidates(requested, needsBrowsing) {
    // Allow env-specified list
    const envList = process.env.PERPLEXITY_MODELS?.split(',').map(s => s.trim()).filter(Boolean);
    if (envList && envList.length)
        return envList;
    if (requested && requested !== 'auto')
        return [requested];
    // Prioritized candidates; keep short, most reliable first
    const base = ['sonar', 'sonar-pro'];
    return base;
}
