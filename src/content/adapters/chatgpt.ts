import type { PlatformAdapter } from '../types';
import { observeForResponse } from '../observer';

export const chatgptAdapter: PlatformAdapter = {
  detect() {
    return window.location.hostname === 'chatgpt.com';
  },
  async injectPrompt(prompt: string, _jobId: string) {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
    if (!textarea) {
      throw new Error('ChatGPT input not found');
    }
    textarea.value = prompt;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  },
  async submit() {
    const form = document.querySelector('form') as HTMLFormElement | null;
    if (!form) {
      throw new Error('ChatGPT form not found');
    }
    form.dispatchEvent(new Event('submit', { bubbles: true }));
  },
  async observeCompletion() {
    return observeForResponse('[data-message-author-role="assistant"]');
  },
};
