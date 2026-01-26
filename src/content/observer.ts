import type { RawResponse } from './types';

export async function observeForResponse(jobId: string): Promise<RawResponse> {
  console.log('Observing for job', jobId);
  return { raw: '' };
}
