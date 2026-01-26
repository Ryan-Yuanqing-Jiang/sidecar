import type { SelectorConfig } from '../types';

export const defaultSelectors: SelectorConfig = {
  version: '0.1.0',
  platforms: {
    chatgpt: {
      promptInputSelector: 'textarea',
      submitSelector: 'form button[type="submit"]',
      assistantMessageSelector: '[data-message-author-role="assistant"]',
    },
    gemini: {
      promptInputSelector: 'textarea',
      submitSelector: 'button[type="submit"]',
      assistantMessageSelector: 'model-response',
    },
  },
};
