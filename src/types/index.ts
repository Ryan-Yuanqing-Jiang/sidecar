export type NodeStatus =
  | 'waiting'
  | 'processing'
  | 'ok'
  | 'partial'
  | 'parse_failed'
  | 'timeout';

export interface KnowledgeNode {
  id: string;
  jobId: string;
  topic: string;
  content?: {
    simple: string;
    technical: string;
  };
  raw?: string;
  status: NodeStatus;
  promptVersion: number;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  platform: 'chatgpt' | 'gemini';
  title: string;
  originUrl: string;
  tabId?: number;
  lastActive: number;
}

export interface SelectorConfig {
  version: string;
  platforms: Record<'chatgpt' | 'gemini', PlatformConfig>;
}

export interface PlatformConfig {
  promptInputSelector: string;
  submitSelector: string;
  assistantMessageSelector: string;
}

export interface ExpandConceptRequest {
  jobId: string;
  concept: string;
  promptVersion: number;
}

export interface ExpandConceptResponse {
  jobId: string;
  raw: string;
}
