import type { PlatformAdapter } from '../types';

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
    const assistantSelector = 'div[data-message-author-role="assistant"]';
    const initialCount = document.querySelectorAll(assistantSelector).length;
    console.log('Knowledge Sidecar: ChatGPT observe start', { initialCount });
    await delay(3000);
    await waitForStreamingCompletion();
    console.log('Knowledge Sidecar: ChatGPT streaming completed');
    const raw = extractAssistantContent(document.querySelectorAll(assistantSelector)[
      document.querySelectorAll(assistantSelector).length - 1
    ] as HTMLElement);
    if (!raw) {
      throw new Error('ChatGPT assistant response was empty');
    }
    return { raw };
  },
};

const DEFAULT_TIMEOUT_MS = 90000;
const POLL_INTERVAL_MS = 100;


async function waitForStreamingCompletion(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  const start = Date.now();
  let sawStop = false;
  console.log('Knowledge Sidecar: ChatGPT streaming poll started');

  while (Date.now() - start < timeoutMs) {
    const stopButton = document.querySelector('button[aria-label="Stop streaming"]');
    const voiceButton = document.querySelector('button[aria-label="Start Voice"]');

    if (stopButton) {
      sawStop = true;
    }

    if (sawStop && voiceButton) {
      console.log('Knowledge Sidecar: ChatGPT detected voice button after stop');
      return;
    }

    if (!sawStop && voiceButton && !stopButton) {
      console.log('Knowledge Sidecar: ChatGPT voice button present without stop');
      return;
    }

    await delay(POLL_INTERVAL_MS);
  }

  throw new Error('Timed out waiting for streaming to finish');
}

function extractAssistantContent(element: HTMLElement) {
  const text = element.innerText?.trim();
  if (text) {
    console.log('Knowledge Sidecar: ChatGPT extracted innerText', { length: text.length });
    return text;
  }
  const fallback = (element.textContent ?? '').trim();
  console.log('Knowledge Sidecar: ChatGPT extracted textContent fallback', {
    length: fallback.length,
  });
  return fallback;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
