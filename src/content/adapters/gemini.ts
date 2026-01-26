import type { PlatformAdapter } from '../types';
import { observeForResponse } from '../observer';

export const geminiAdapter: PlatformAdapter = {
  detect() {
    return window.location.hostname === 'gemini.google.com';
  },
  async injectPrompt(prompt: string, _jobId: string) {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
    if (!textarea) {
      throw new Error('Gemini input not found');
    }
    textarea.value = prompt;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  },
  async submit() {
    const button = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    if (!button) {
      throw new Error('Gemini submit button not found');
    }
    button.click();
  },
  async observeCompletion() {
    return observeForResponse('model-response');
  },
};
