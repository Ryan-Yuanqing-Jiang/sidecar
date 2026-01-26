import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleContextMenuClick, handleMessage, handleAlarm } from '../src/background/index';
import { db } from '../src/db';

describe('Background Script Handlers', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await db.nodes.clear();
  });

  describe('handleContextMenuClick', () => {
    it('should create a job and dispatch to content script', async () => {
      const info = {
        menuItemId: 'knowledge-sidecar-explain',
        selectionText: 'Vector DB',
        editable: false,
        pageUrl: 'http://test.com',
        frameId: 0,
      } as chrome.contextMenus.OnClickData;

      const tab = { id: 123 } as chrome.tabs.Tab;

      // Mock successful send
      (chrome.tabs.sendMessage as any).mockResolvedValue({ ok: true });

      await handleContextMenuClick(info, tab);

      // Verify DB insertion
      const nodes = await db.nodes.toArray();
      expect(nodes).toHaveLength(1);
      expect(nodes[0].topic).toBe('Vector DB');
      // Status should be processing because we await the sendMessage
      expect(nodes[0].status).toBe('processing');

      // Verify message sent
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, expect.objectContaining({
        type: 'RUN_EXPAND_CONCEPT',
        payload: expect.objectContaining({
          concept: 'Vector DB'
        })
      }));

      // Verify alarm created
      expect(chrome.alarms.create).toHaveBeenCalled();
    });

    it('should handle injection failure', async () => {
        const info = {
          menuItemId: 'knowledge-sidecar-explain',
          selectionText: 'Fail Me',
          editable: false,
          pageUrl: 'http://test.com',
          frameId: 0,
        } as chrome.contextMenus.OnClickData;
  
        const tab = { id: 123 } as chrome.tabs.Tab;
  
        // Mock failed send
        (chrome.tabs.sendMessage as any).mockResolvedValue({ ok: false, error: 'Injection failed' });
  
        await handleContextMenuClick(info, tab);
  
        const nodes = await db.nodes.toArray();
        expect(nodes[0].status).toBe('parse_failed');
        expect(nodes[0].raw).toContain('Injection failed');
    });
  });

  describe('handleMessage', () => {
    it('should handle RAW_RESPONSE and update DB', async () => {
      // Setup initial node
      const jobId = 'test-job';
      await db.nodes.put({
        id: jobId,
        jobId,
        topic: 'Test',
        status: 'processing',
        promptVersion: 1,
        createdAt: Date.now(),
      });

      const message = {
        type: 'RAW_RESPONSE',
        payload: {
          jobId,
          raw: JSON.stringify({ simple: 'S', technical: 'T' }),
        },
      };

      const sendResponse = vi.fn();

      // We need to wait for the async promise inside handleMessage to resolve
      // handleMessage returns true immediately, but does work in background
      // For this test, we can just call the extracted logic or rely on handleMessage returning true
      // But handleMessage is not async itself, it launches a promise.
      
      // Actually, handleMessage calls handleRawResponse. 
      // We can wait for a small tick or modify handleMessage to return the promise if possible, 
      // but strictly it returns boolean.
      // A better way for test is to wait for DB condition.
      
      handleMessage(message, {} as any, sendResponse);
      
      // Wait for DB update
      await new Promise(resolve => setTimeout(resolve, 50));

      const node = await db.nodes.get(jobId);
      expect(node?.status).toBe('ok');
      expect(node?.content?.simple).toBe('S');
      
      expect(chrome.alarms.clear).toHaveBeenCalledWith(`ks-timeout-${jobId}`);
      expect(sendResponse).toHaveBeenCalledWith({ ok: true });
    });
  });

  describe('handleAlarm', () => {
    it('should timeout a waiting job', async () => {
      const jobId = 'timeout-job';
      await db.nodes.put({
        id: jobId,
        jobId,
        topic: 'Test',
        status: 'waiting',
        promptVersion: 1,
        createdAt: Date.now(),
      });

      const alarm = { name: `ks-timeout-${jobId}` } as chrome.alarms.Alarm;
      await handleAlarm(alarm);

      const node = await db.nodes.get(jobId);
      expect(node?.status).toBe('timeout');
    });

    it('should not timeout a finished job', async () => {
      const jobId = 'finished-job';
      await db.nodes.put({
        id: jobId,
        jobId,
        topic: 'Test',
        status: 'ok',
        promptVersion: 1,
        createdAt: Date.now(),
      });

      const alarm = { name: `ks-timeout-${jobId}` } as chrome.alarms.Alarm;
      await handleAlarm(alarm);

      const node = await db.nodes.get(jobId);
      expect(node?.status).toBe('ok');
    });
  });
});
