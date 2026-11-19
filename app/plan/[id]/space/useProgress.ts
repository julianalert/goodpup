'use client'

import { useCallback, useRef, useState } from 'react'
import { progressId, type ProgressKind, type ProgressMap } from '@/lib/plan-types'

interface Item {
  kind: ProgressKind
  key: string
  value: unknown
}

export interface ProgressStore {
  progress: ProgressMap
  /** Record a piece of progress: shown at once, saved in the background */
  save: (kind: ProgressKind, key: string, value: unknown) => void
  /** How many changes have not reached the server */
  unsaved: number
  retry: () => void
}

/**
 * The customer's progress, kept in memory and written through to the server.
 * The page never waits for a save: a tick shows immediately, and a save that fails
 * (no signal on a walk, say) is kept and can be sent again.
 */
export function useProgress(sessionId: string, initial: ProgressMap): ProgressStore {
  const [progress, setProgress] = useState<ProgressMap>(initial)
  const [unsaved, setUnsaved] = useState(0)
  // Latest change per item, and the ones still to send. A slow, older request must
  // never overwrite or re-queue over a newer change to the same item.
  const latest = useRef(new Map<string, Item>())
  const failed = useRef(new Map<string, Item>())

  const send = useCallback(async (item: Item) => {
    const id = progressId(item.kind, item.key)
    let ok = false
    try {
      const res = await fetch('/api/plan-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, ...item }),
        keepalive: true,
      })
      ok = res.ok
    } catch { /* offline */ }

    if (latest.current.get(id) === item) {
      if (ok) failed.current.delete(id)
      else failed.current.set(id, item)
    }
    setUnsaved(failed.current.size)
  }, [sessionId])

  const save = useCallback((kind: ProgressKind, key: string, value: unknown) => {
    const item: Item = { kind, key, value }
    latest.current.set(progressId(kind, key), item)
    setProgress((prev) => ({ ...prev, [progressId(kind, key)]: value }))
    void send(item)
  }, [send])

  const retry = useCallback(() => {
    for (const item of [...failed.current.values()]) void send(item)
  }, [send])

  return { progress, save, unsaved, retry }
}
