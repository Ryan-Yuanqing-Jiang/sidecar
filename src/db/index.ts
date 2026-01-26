import Dexie, { type Table } from 'dexie';
import type { ChatSession, KnowledgeNode } from '../types';

export class KnowledgeSidecarDB extends Dexie {
  sessions!: Table<ChatSession, string>;
  nodes!: Table<KnowledgeNode, string>;

  constructor() {
    super('knowledge-sidecar');

    this.version(1).stores({
      sessions: 'id, platform, lastActive',
      nodes: 'id, sessionId, parentId, topic, status, depth, createdAt',
    });
  }
}

export const db = new KnowledgeSidecarDB();
