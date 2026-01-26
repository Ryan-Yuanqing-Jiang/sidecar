import type { NodeStatus } from '../types';

export interface ParsedResponse {
  status: NodeStatus;
  content?: { simple: string; technical: string };
  raw: string;
}

export function parseResponse(raw: string): ParsedResponse {
  const trimmed = raw.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    return { status: 'parse_failed', raw };
  }

  const candidate = trimmed.slice(start, end + 1);
  try {
    const parsed = JSON.parse(candidate) as {
      simple?: string;
      technical?: string;
    };

    if (parsed.simple && parsed.technical) {
      return {
        status: 'ok',
        content: { simple: parsed.simple, technical: parsed.technical },
        raw,
      };
    }

    return { status: 'partial', raw };
  } catch (error) {
    return { status: 'parse_failed', raw };
  }
}
