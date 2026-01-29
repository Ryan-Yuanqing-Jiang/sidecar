export function buildPrompt(concept: string, jobId: string, promptVersion: number) {
  return [
    'You are generating structured output for a learning tool.',
    '',
    `SIDECAR_JOB_ID=${jobId}`,
    `PROMPT_VERSION=${promptVersion}`,
    '',
    'Return ONLY valid JSON matching this schema:',
    '{',
    '  "v": 1,',
    `  "concept": "${concept}",`,
    '  "simple": "High-level explanation using analogy. Keep it in 1-2 sentence.",',
    '  "technical": "Detailed technical explanation with math/code. Keep it in 3-5 sentences.",',
    '}',
  ].join('\n');
}
