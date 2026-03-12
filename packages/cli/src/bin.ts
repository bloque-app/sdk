import { Command } from 'commander';
import { loginCommand } from './commands/login.ts';
import { logoutCommand } from './commands/logout.ts';
import { whoamiCommand } from './commands/whoami.ts';
import { mcpCommand } from './commands/mcp.ts';

const program = new Command();

program
  .name('bloque')
  .description('Bloque CLI — manage accounts and cards via MCP')
  .version('0.0.1');

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(whoamiCommand);
program.addCommand(mcpCommand);

program.parse();
