export interface RawResponse {
  raw: string;
}

export interface PlatformAdapter {
  detect(): boolean;
  injectPrompt(prompt: string, jobId: string): Promise<void>;
  submit(): Promise<void>;
  observeCompletion(jobId: string): Promise<RawResponse>;
}
