import type { RawResponse } from './types';

const DEFAULT_TIMEOUT_MS = 30000;
const QUIET_WINDOW_MS = 1200;

export async function observeForResponse(
  assistantSelector: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<RawResponse> {
  const existingCount = document.querySelectorAll(assistantSelector).length;
  const messageEl = await waitForNewMessage(assistantSelector, existingCount, timeoutMs);
  const raw = await waitForStableText(messageEl, timeoutMs);
  return { raw };
}

function waitForNewMessage(
  selector: string,
  initialCount: number,
  timeoutMs: number
): Promise<Element> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error('Timed out waiting for assistant message'));
    }, timeoutMs);

    const observer = new MutationObserver(() => {
      const messages = document.querySelectorAll(selector);
      if (messages.length > initialCount) {
        window.clearTimeout(timeoutId);
        observer.disconnect();
        resolve(messages[messages.length - 1]);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
}

function waitForStableText(element: Element, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let lastText = element.textContent ?? '';
    let lastChange = Date.now();

    const timeoutId = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error('Timed out waiting for response to stabilize'));
    }, timeoutMs);

    const intervalId = window.setInterval(() => {
      const currentText = element.textContent ?? '';
      if (currentText !== lastText) {
        lastText = currentText;
        lastChange = Date.now();
      }

      if (Date.now() - lastChange >= QUIET_WINDOW_MS && currentText.trim().length > 0) {
        window.clearTimeout(timeoutId);
        window.clearInterval(intervalId);
        observer.disconnect();
        resolve(currentText.trim());
      }
    }, 250);

    const observer = new MutationObserver(() => {
      const currentText = element.textContent ?? '';
      if (currentText !== lastText) {
        lastText = currentText;
        lastChange = Date.now();
      }
    });

    observer.observe(element, { childList: true, subtree: true, characterData: true });
  });
}
