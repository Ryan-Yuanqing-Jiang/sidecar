import React from 'react';
import { Copy, Network, RefreshCw } from 'lucide-react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';

const sampleNodes = [
  {
    id: 'root',
    position: { x: 0, y: 0 },
    data: { label: 'AI Architectures' },
    style: {
      padding: 12,
      borderRadius: 12,
      border: '1px solid rgba(242, 204, 143, 0.5)',
      background: 'rgba(27, 38, 59, 0.85)',
      color: '#f8f9fa',
    },
  },
  {
    id: 'child',
    position: { x: 180, y: 120 },
    data: { label: 'Embeddings' },
    style: {
      padding: 12,
      borderRadius: 12,
      border: '1px solid rgba(120, 141, 169, 0.6)',
      background: 'rgba(13, 27, 42, 0.7)',
      color: '#e0e1dd',
    },
  },
];

const sampleEdges = [
  {
    id: 'root-child',
    source: 'root',
    target: 'child',
    animated: true,
    style: { stroke: '#e07a5f', strokeWidth: 2 },
  },
];

export default function App() {
  return (
    <div className="min-h-screen bg-ink-900 text-white">
      <div className="px-6 pb-10 pt-8">
        <header className="space-y-3">
          <div className="flex items-center gap-3 text-accent-400">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/20">
              <Network size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent-400/70">Knowledge Sidecar</p>
              <h1 className="font-display text-2xl font-semibold text-white">
                Recursive Knowledge Navigator
              </h1>
            </div>
          </div>
          <p className="text-sm text-ink-600">
            Local-first graph state. Waiting for your first concept expansion.
          </p>
        </header>

        <section className="mt-6 grid gap-4">
          <div className="sidecard rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-accent-400/70">Status</p>
                <p className="font-display text-lg text-white">Idle • No active jobs</p>
              </div>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-accent-400/40 px-3 py-2 text-xs text-accent-400 hover:border-accent-400 hover:text-white"
              >
                <RefreshCw size={14} />
                Retry Parsing
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="sidecard rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-accent-400/70">Manual Fallback</p>
              <p className="mt-2 text-sm text-ink-600">
                Use when automation fails. Copy the prompt and paste the JSON here.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full bg-accent-500 px-4 py-2 text-xs font-semibold text-ink-900"
                >
                  <Copy size={14} />
                  Copy Prompt
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/80"
                >
                  Paste JSON
                </button>
              </div>
            </div>

            <div className="sidecard rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-accent-400/70">Current Focus</p>
              <h2 className="mt-2 font-display text-lg text-white">AI Architectures</h2>
              <p className="mt-2 text-sm text-ink-600">
                Select a node to see simple + technical explanations. Every card is cached locally.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.28em] text-accent-400/70">Knowledge Graph</p>
            <p className="text-xs text-ink-600">Local preview</p>
          </div>
          <div className="mt-3 h-[320px] rounded-2xl border border-white/10 bg-ink-800/40">
            <ReactFlow
              nodes={sampleNodes}
              edges={sampleEdges}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <MiniMap pannable zoomable />
              <Controls />
              <Background gap={24} color="#415a77" />
            </ReactFlow>
          </div>
        </section>
      </div>
    </div>
  );
}
