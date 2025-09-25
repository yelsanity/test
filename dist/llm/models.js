"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ONLINE_MODEL = exports.DEFAULT_CHAT_MODEL = void 0;
exports.selectPerplexityModel = selectPerplexityModel;
exports.DEFAULT_CHAT_MODEL = 'sonar-large-chat';
exports.DEFAULT_ONLINE_MODEL = 'sonar-large-online';
function selectPerplexityModel(requested, needsBrowsing) {
    if (requested && requested !== 'auto')
        return requested;
    return needsBrowsing ? exports.DEFAULT_ONLINE_MODEL : exports.DEFAULT_CHAT_MODEL;
}
