import { Command } from 'commander';

import { SessionStore } from '../session/store.ts';

const store = new SessionStore();

export const whoamiCommand = new Command('whoami')
  .description('Show current session info')
  .action(() => {
    const session = store.load();
    if (!session) {
      console.error('No active session. Run `bloque login` first.');
      process.exit(1);
    }
    console.log(`URN:       ${session.urn}`);
    console.log(`Origin:    ${session.origin}`);
    console.log(`Mode:      ${session.mode}`);
    console.log(`Auth type: ${session.authType}`);
    console.log(`Created:   ${session.createdAt}`);
  });
