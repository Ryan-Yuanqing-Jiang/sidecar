import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../src/content/injector';

describe('buildPrompt', () => {
  it('should include SIDECAR_JOB_ID and PROMPT_VERSION', () => {
    const concept = 'Vector DB';
    const jobId = 'test-job-id';
    const promptVersion = 1;

    const result = buildPrompt(concept, jobId, promptVersion);

    expect(result).toContain(`SIDECAR_JOB_ID=${jobId}`);
    expect(result).toContain(`PROMPT_VERSION=${promptVersion}`);
  });

  it('should include the concept', () => {
    const concept = 'Quantum Entanglement';
    const result = buildPrompt(concept, 'job-id', 1);

    expect(result).toContain(`"concept": "${concept}"`);
  });

  it('should request valid JSON output', () => {
    const result = buildPrompt('Test', 'job-id', 1);

    expect(result).toContain('Return ONLY valid JSON');
    expect(result).toContain('"simple":');
    expect(result).toContain('"technical":');
  });
});
