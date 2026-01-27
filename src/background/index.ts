import { db } from '../db';
import type { KnowledgeNode } from '../types';
import { parseResponse } from './parser';

const MENU_ID = 'knowledge-sidecar-explain';
const PROMPT_VERSION = 1;
const TIMEOUT_PREFIX = 'ks-timeout-';

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Explain with Knowledge-Sidecar',
      contexts: ['selection'],
    });
  });
});

chrome.contextMenus.onClicked.addListener(handleContextMenuClick);
chrome.runtime.onMessage.addListener(handleMessage);
chrome.alarms.onAlarm.addListener(handleAlarm);

export async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) {
  if (info.menuItemId !== MENU_ID) {
    return;
  }

  const selection = info.selectionText?.trim();
  if (!selection) {
    return;
  }

  const jobId = crypto.randomUUID();
  const createdAt = Date.now();
  console.log('Knowledge Sidecar: creating job', { jobId, selection });
  const node: KnowledgeNode = {
    id: jobId,
    jobId,
    topic: selection,
    status: 'waiting',
    promptVersion: PROMPT_VERSION,
    createdAt,
  };

  await db.nodes.put(node);
  scheduleTimeout(jobId);

  if (!tab?.id) {
    await markFailed(jobId, 'No active tab to send the job.');
    return;
  }

  try {
    console.log('Knowledge Sidecar: dispatching job to tab', tab.id);
    await db.nodes.update(jobId, { status: 'processing' });

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'RUN_EXPAND_CONCEPT',
      payload: {
        jobId,
        concept: selection,
        promptVersion: PROMPT_VERSION,
      },
    });

    if (response && !response.ok) {
      throw new Error(response.error || 'Content script reported failure');
    }
    console.log('Knowledge Sidecar: job sent successfully', jobId);
  } catch (error) {
    await markFailed(jobId, String(error));
  }
}

export function handleMessage(
  message: any,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  if (message?.type === 'RAW_RESPONSE') {
    console.log('Knowledge Sidecar: raw response received', message.payload?.jobId);
    handleRawResponse(message.payload)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.error('Raw response handling failed', error);
        sendResponse({ ok: false, error: String(error) });
      });
    return true;
  }

  sendResponse({ ok: false, error: 'Unknown message type' });
  return false;
}

export async function handleAlarm(alarm: chrome.alarms.Alarm) {
  if (!alarm.name.startsWith(TIMEOUT_PREFIX)) {
    return;
  }

  const jobId = alarm.name.replace(TIMEOUT_PREFIX, '');
  const node = await db.nodes.get(jobId);
  if (!node) {
    return;
  }

  if (node.status === 'waiting' || node.status === 'processing') {
    await db.nodes.update(jobId, { status: 'timeout' });
  }
}

async function handleRawResponse(payload: { jobId: string; raw: string }) {
  const parsed = parseResponse(payload.raw);
  console.log('Knowledge Sidecar: parsed response', payload.jobId, parsed.status);
  await db.nodes.update(payload.jobId, {
    status: parsed.status,
    content: parsed.content,
    raw: parsed.raw,
  });
  await clearTimeout(payload.jobId);
}

function scheduleTimeout(jobId: string) {
  chrome.alarms.create(`${TIMEOUT_PREFIX}${jobId}`, { delayInMinutes: 0.5 });
}

async function clearTimeout(jobId: string) {
  await chrome.alarms.clear(`${TIMEOUT_PREFIX}${jobId}`);
}

async function markFailed(jobId: string, raw: string) {
  console.warn('Knowledge Sidecar: job failed', jobId, raw);
  await db.nodes.update(jobId, { status: 'parse_failed', raw });
  await clearTimeout(jobId);
}
