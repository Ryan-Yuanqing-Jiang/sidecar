import { handleExpandConcept } from './jobs';

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'EXPAND_CONCEPT') {
    handleExpandConcept(message.payload)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.error('Job failed', error);
        sendResponse({ ok: false, error: String(error) });
      });
    return true;
  }

  if (message?.type === 'RAW_RESPONSE') {
    console.log('Raw response received', message.payload);
    sendResponse({ ok: true });
    return true;
  }

  sendResponse({ ok: false, error: 'Unknown message type' });
  return false;
});
