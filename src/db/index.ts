import Dexie, { type Table } from 'dexie';
import type { ChatSession, KnowledgeNode } from '../types';
import { DB_VERSION } from './migrations';

export class KnowledgeSidecarDB extends Dexie {
  sessions!: Table<ChatSession, string>;
  nodes!: Table<KnowledgeNode, string>;

  constructor() {
    super('knowledge-sidecar');

    this.version(DB_VERSION).stores({
      sessions: 'id, platform, lastActive',
      nodes: 'id, jobId, topic, status, createdAt',
    });
  }
}

export const db = new KnowledgeSidecarDB();
