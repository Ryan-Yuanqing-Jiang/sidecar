import type { PlatformAdapter } from '../types';
import { observeForResponse } from '../observer';

export const chatgptAdapter: PlatformAdapter = {
  detect() {
    return window.location.hostname === 'chatgpt.com';
  },
  async injectPrompt(prompt: string, _jobId: string) {
    const composer = document.querySelector('#prompt-textarea') as HTMLDivElement | null;
    if (!composer) {
      throw new Error('ChatGPT composer not found');
    }
    composer.innerHTML = `<p>${escapeHtml(prompt)}</p>`;
    composer.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 500));
  },
  async submit() {
    const submitButton = document.querySelector('#composer-submit-button') as
      | HTMLButtonElement
      | null;
    if (!submitButton) {
      throw new Error('ChatGPT submit button not found');
    }
    submitButton.click();
  },
  async observeCompletion() {
    return observeForResponse('[data-message-author-role="assistant"]');
  },
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
