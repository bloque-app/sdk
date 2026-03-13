import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { PersistedSession } from './types.ts';

export class SessionStore {
  static SESSION_DIR = path.join(os.homedir(), '.bloque');
  static SESSION_PATH = path.join(SessionStore.SESSION_DIR, 'session.json');

  save(session: PersistedSession): void {
    fs.mkdirSync(SessionStore.SESSION_DIR, { recursive: true, mode: 0o700 });
    fs.writeFileSync(
      SessionStore.SESSION_PATH,
      JSON.stringify(session, null, 2),
      { mode: 0o600 },
    );
  }

  load(): PersistedSession | null {
    try {
      const data = fs.readFileSync(SessionStore.SESSION_PATH, 'utf-8');
      return JSON.parse(data) as PersistedSession;
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      fs.unlinkSync(SessionStore.SESSION_PATH);
    } catch {
      // file doesn't exist
    }
  }

  exists(): boolean {
    return fs.existsSync(SessionStore.SESSION_PATH);
  }
}
