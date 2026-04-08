"use client";

import { useState } from "react";

interface DxEntry {
  id: string;
  timestamp: number;
  api: string;
  note: string;
}

export default function DxNotes() {
  const [entries, setEntries] = useState<DxEntry[]>([]);
  const [api, setApi] = useState("Price");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setEntries((prev) => [
      { id: crypto.randomUUID(), timestamp: Date.now(), api, note: note.trim() },
      ...prev,
    ]);
    setNote("");
  }

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-text-muted hover:text-text-secondary transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-mint">●</span>
          <span>DX Notes ({entries.length})</span>
        </div>
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-4 space-y-3 border-t border-border-subtle pt-3 animate-slideDown">
          <form onSubmit={addEntry} className="flex gap-2">
            <select value={api} onChange={(e) => setApi(e.target.value)} className="text-sm w-20 py-1.5">
              <option>Price</option>
              <option>Lend</option>
              <option>Trigger</option>
              <option>Swap</option>
              <option>Tokens</option>
              <option>General</option>
            </select>
            <input
              type="text"
              placeholder="Log a DX observation..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1 py-1.5"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-mint/10 text-mint text-sm font-medium border border-mint/20
                         hover:bg-mint/20 transition-colors"
            >
              Add
            </button>
          </form>

          {entries.length === 0 ? (
            <p className="text-sm text-text-dim text-center py-3">
              No notes yet. Log API friction points as you build.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {entries.map((entry) => (
                <div key={entry.id} className="text-sm bg-bg-inset border border-border-subtle rounded-lg p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.5 rounded bg-mint/10 text-mint text-sm font-semibold">
                      {entry.api}
                    </span>
                    <span className="text-text-dim text-sm">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-text-secondary">{entry.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
