import { chatgptAdapter } from './adapters/chatgpt';
import { geminiAdapter } from './adapters/gemini';
import { buildPrompt } from './injector';
import type { ExpandConceptRequest } from '../types';

const adapters = [chatgptAdapter, geminiAdapter];
const activeAdapter = adapters.find((adapter) => adapter.detect());

if (!activeAdapter) {
  console.warn('Knowledge Sidecar: no adapter matched for this page.');
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'RUN_EXPAND_CONCEPT') {
    const payload = message.payload as ExpandConceptRequest;
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
  await activeAdapter.injectPrompt(prompt, payload.jobId);
  await activeAdapter.submit();

  let result;
  try {
    result = await activeAdapter.observeCompletion(payload.jobId);
  } catch (error) {
    result = { raw: String(error) };
  }
  await chrome.runtime.sendMessage({
    type: 'RAW_RESPONSE',
    payload: {
      jobId: payload.jobId,
      raw: result.raw,
    },
  });
}
