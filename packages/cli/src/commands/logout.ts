import { Command } from 'commander';

import { SessionStore } from '../session/store.ts';

const store = new SessionStore();

export const logoutCommand = new Command('logout')
  .description('Clear local Bloque session')
  .action(() => {
    store.clear();
    console.log('Logged out.');
  });
