import { Command } from 'commander';

import { CURRENT_VERSION } from './core/version.ts';
import { loginCommand } from './commands/login.ts';
import { logoutCommand } from './commands/logout.ts';
import { mcpCommand } from './commands/mcp.ts';
import { selfUpdateCliCommand } from './commands/self-update.ts';
import { setupCommand } from './commands/setup.ts';
import { whoamiCommand } from './commands/whoami.ts';

export function createCli() {
  const program = new Command();

  program
    .name('bloque')
    .description('Bloque CLI — manage accounts and cards via MCP')
    .version(CURRENT_VERSION);

  program.addCommand(setupCommand);
  program.addCommand(loginCommand);
  program.addCommand(logoutCommand);
  program.addCommand(whoamiCommand);
  program.addCommand(mcpCommand);
  program.addCommand(selfUpdateCliCommand);

  program.parse();

  return program;
}
