import { describe, it, expect } from 'vitest';
import { parseResponse } from '../src/background/parser';

describe('parseResponse', () => {
  it('should parse valid JSON', () => {
    const validJson = JSON.stringify({
      simple: 'Simple explanation',
      technical: 'Technical explanation',
    });
    const result = parseResponse(validJson);

    expect(result.status).toBe('ok');
    expect(result.content).toEqual({
      simple: 'Simple explanation',
      technical: 'Technical explanation',
    });
  });

  it('should strip code fences and parse', () => {
    const raw = '```json\n{"simple": "A", "technical": "B"}\n```';
    const result = parseResponse(raw);

    expect(result.status).toBe('ok');
    expect(result.content).toEqual({
      simple: 'A',
      technical: 'B',
    });
  });

  it('should handle messy markdown around JSON', () => {
    const raw = 'Here is the JSON:\n```\n{"simple": "A", "technical": "B"}\n```\nHope that helps!';
    const result = parseResponse(raw);

    expect(result.status).toBe('ok');
    expect(result.content).toEqual({
      simple: 'A',
      technical: 'B',
    });
  });

  it('should return parse_failed for invalid JSON', () => {
    const raw = '{ invalid json }';
    const result = parseResponse(raw);

    expect(result.status).toBe('parse_failed');
    expect(result.raw).toBe(raw);
  });

  it('should return partial if required keys are missing', () => {
    const raw = JSON.stringify({ simple: 'Only simple' });
    const result = parseResponse(raw);

    expect(result.status).toBe('partial');
    expect(result.content).toBeUndefined();
  });
});
