import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlertCircle, Clock, FileText, Loader2 } from 'lucide-react';
import { db } from '../db';
import type { KnowledgeNode } from '../types';

function StatusBadge({ status }: { status: KnowledgeNode['status'] }) {
  const styles: Record<KnowledgeNode['status'], string> = {
    waiting: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
    processing: 'bg-sky-500/15 text-sky-200 border-sky-400/30',
    ok: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
    partial: 'bg-yellow-500/15 text-yellow-200 border-yellow-400/30',
    parse_failed: 'bg-red-500/15 text-red-200 border-red-400/30',
    timeout: 'bg-red-500/15 text-red-200 border-red-400/30',
  };

  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.24em] ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function StatusIcon({ status }: { status: KnowledgeNode['status'] }) {
  if (status === 'ok') {
    return <FileText size={16} className="text-emerald-200" />;
  }
  if (status === 'parse_failed' || status === 'timeout') {
    return <AlertCircle size={16} className="text-red-200" />;
  }
  if (status === 'processing') {
    return <Loader2 size={16} className="animate-spin text-sky-200" />;
  }
  return <Clock size={16} className="text-amber-200" />;
}

export default function App() {
  const nodes = useLiveQuery(async () => {
    return db.nodes.orderBy('createdAt').reverse().toArray();
  }, []);

  async function handleClearAll() {
    await db.nodes.clear();
  }

  return (
    <div className="min-h-screen bg-ink-900 text-white">
      <div className="px-6 pb-10 pt-8">
        <header className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-accent-400/70">
                Knowledge Sidecar
              </p>
              <h1 className="font-display text-2xl font-semibold text-white">
                Instant Explainer
              </h1>
              <p className="text-sm text-ink-600">
                The side panel renders solely from IndexedDB. Trigger an explanation from the page to
                begin.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-full border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/80 hover:border-white/40 hover:text-white"
            >
              Clear All
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-4">
          {nodes && nodes.length === 0 && (
            <div className="sidecard rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-accent-400/70">No explanations yet</p>
              <p className="mt-2 text-sm text-ink-600">
                Select a term in ChatGPT or Gemini and use the context menu to explain it.
              </p>
            </div>
          )}

          {nodes?.map((node) => (
            <article key={node.id} className="sidecard rounded-2xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-accent-400/70">Concept</p>
                  <h2 className="mt-2 font-display text-lg text-white">{node.topic}</h2>
                  <p className="mt-1 text-xs text-ink-600">
                    {new Date(node.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon status={node.status} />
                  <StatusBadge status={node.status} />
                </div>
              </div>
              <div className="mt-4 text-sm text-ink-600">
                {node.status === 'ok' && node.content?.simple}
                {(node.status === 'waiting' || node.status === 'processing') && (
                  <p>Waiting for the response to arrive...</p>
                )}
                {node.status === 'parse_failed' && (
                  <p>We could not parse the response. Retry or inspect raw output.</p>
                )}
                {node.status === 'partial' && (
                  <p>Response was incomplete. Retry to fetch a full explanation.</p>
                )}
                {node.status === 'timeout' && (
                  <p>Timed out waiting for a response. Please retry.</p>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
