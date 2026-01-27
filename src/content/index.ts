import { chatgptAdapter } from './adapters/chatgpt';
import { geminiAdapter } from './adapters/gemini';
import { buildPrompt } from './injector';
import type { ExpandConceptRequest } from '../types';

console.log('Knowledge Sidecar: content script loaded', window.location.href);

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
  await activeAdapter.submit();

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
