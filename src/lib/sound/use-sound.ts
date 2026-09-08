'use client';

import { useSyncExternalStore } from 'react';
import { type Snapshot, soundEngine } from './engine';

const SERVER_SNAPSHOT: Snapshot = {
  status: 'idle',
  mix: { enabled: true, music: 0.7, ambience: 0.8, effects: 0.9, ui: 0.6 },
  musicId: null,
  bedIds: [],
  lastCue: null,
};

/** Live view of the sound desk for React components. */
const useSound = () => {
  const engine = soundEngine();
  const snapshot = useSyncExternalStore(
    engine.subscribe,
    engine.getSnapshot,
    () => SERVER_SNAPSHOT,
  );
  return { engine, ...snapshot };
};

export { useSound };
