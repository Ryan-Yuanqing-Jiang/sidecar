import type { ExpandConceptRequest } from '../types';

export async function handleExpandConcept(payload: ExpandConceptRequest) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error('No active tab found');
  }

  await chrome.tabs.sendMessage(tab.id, {
    type: 'RUN_EXPAND_CONCEPT',
    payload,
  });
}
