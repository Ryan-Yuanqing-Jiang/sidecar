import { chatgptAdapter } from './adapters/chatgpt';
import { geminiAdapter } from './adapters/gemini';
import { buildPrompt } from './injector';
import type { ExpandConceptRequest } from '../types';

console.log('Knowledge Sidecar: content script loaded', window.location.href);

const SCROLL_LOCK_TIMEOUT = 2000;
const adapters = [chatgptAdapter, geminiAdapter];
const activeAdapter = adapters.find((adapter) => adapter.detect());

if (!activeAdapter) {
  console.warn('Knowledge Sidecar: no adapter matched for this page.');
} else {
  console.log('Knowledge Sidecar: active adapter detected', activeAdapter);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'RUN_EXPAND_CONCEPT') {
    const payload = message.payload as ExpandConceptRequest;
    console.log('Knowledge Sidecar: received expand request', payload);
    handleExpandConcept(payload)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.error('Expand concept failed', error);
        sendResponse({ ok: false, error: String(error) });
      });
    return true;
  }

  sendResponse({ ok: false, error: 'Unknown message type' });
  return false;
});

async function handleExpandConcept(payload: ExpandConceptRequest) {
  if (!activeAdapter) {
    throw new Error('No adapter available for this host');
  }

  const prompt = buildPrompt(payload.concept, payload.jobId, payload.promptVersion);
  console.log('Knowledge Sidecar: injecting prompt');
  await activeAdapter.injectPrompt(prompt, payload.jobId);
  console.log('Knowledge Sidecar: submitting prompt');
  const releaseScroll = lockScroll();
  let releaseScheduled = false;
  try {
    await activeAdapter.submit();
    releaseScheduled = true;
    window.setTimeout(() => releaseScroll(), SCROLL_LOCK_TIMEOUT);
  } catch (error) {
    if (!releaseScheduled) {
      releaseScroll();
    }
    throw error;
  }

  let result;
  try {
    console.log('Knowledge Sidecar: observing response');
    result = await activeAdapter.observeCompletion(payload.jobId);
  } catch (error) {
    console.error('Knowledge Sidecar: observation failed', error);
    result = { raw: String(error) };
  }
  console.log('Knowledge Sidecar: sending raw response', result);
  await chrome.runtime.sendMessage({
    type: 'RAW_RESPONSE',
    payload: {
      jobId: payload.jobId,
      raw: result.raw,
    },
  });
}

function lockScroll() {
  const scrollY = window.scrollY;
  const html = document.documentElement;
  const body = document.body;
  const prevHtmlOverflow = html.style.overflow;
  const prevBodyOverflow = body.style.overflow;
  const prevBodyPosition = body.style.position;
  const prevBodyTop = body.style.top;
  const prevBodyWidth = body.style.width;

  html.style.overflow = 'hidden';
  body.style.overflow = 'hidden';
  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.width = '100%';

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    html.style.overflow = prevHtmlOverflow;
    body.style.overflow = prevBodyOverflow;
    body.style.position = prevBodyPosition;
    body.style.top = prevBodyTop;
    body.style.width = prevBodyWidth;
    window.scrollTo(0, scrollY);
  };
}
