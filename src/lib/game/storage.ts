import { type GameState, gameStateSchema } from './schema';

/**
 * The whole campaign lives in this browser: no accounts, no database.
 * Survives refreshes; export/import as JSON is the backup.
 */
const KEY = 'role-master:game:v2';

const loadGame = (): GameState | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = gameStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

const saveGame = (state: GameState) => {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
    );
  } catch {
    /* quota or private mode: the game keeps running in memory */
  }
};

const clearGame = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};

export { clearGame, loadGame, saveGame };
