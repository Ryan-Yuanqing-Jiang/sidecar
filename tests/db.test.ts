import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/db';
import type { KnowledgeNode } from '../types';

describe('KnowledgeSidecarDB', () => {
  beforeEach(async () => {
    await db.nodes.clear();
  });

  it('should store and retrieve a node', async () => {
    const node: KnowledgeNode = {
      id: 'test-id',
      jobId: 'test-job-id',
      topic: 'Test Topic',
      status: 'waiting',
      promptVersion: 1,
      createdAt: Date.now(),
    };

    await db.nodes.put(node);
    const retrieved = await db.nodes.get('test-id');

    expect(retrieved).toBeDefined();
    expect(retrieved?.topic).toBe('Test Topic');
  });

  it('should update node status', async () => {
    const node: KnowledgeNode = {
      id: 'update-id',
      jobId: 'update-id',
      topic: 'Update Test',
      status: 'waiting',
      promptVersion: 1,
      createdAt: Date.now(),
    };

    await db.nodes.put(node);
    await db.nodes.update('update-id', { status: 'ok' });

    const updated = await db.nodes.get('update-id');
    expect(updated?.status).toBe('ok');
  });
});
