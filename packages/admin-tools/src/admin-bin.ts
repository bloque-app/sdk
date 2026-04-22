import fs from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import { AdminConfigError, DEFAULT_CONFIG_PATH, loadConfig } from './config.ts';
import { JwtScopeError, verifyJwtScopes } from './startup.ts';

const program = new Command();

program
  .name('bloque-admin')
  .description(
    'Bloque admin tools — chain signing + polygon swap diagnostics (internal)',
  )
  .version('0.0.1');

const notYetImplemented = (name: string) => () => {
  console.error(`bloque-admin ${name}: not yet implemented`);
  process.exit(2);
};

program
  .command('start')
  .description('Run the admin daemon (REST + MCP over HTTP) — used by launchd')
  .option('--config <path>', 'Path to admin config TOML')
  .action(notYetImplemented('start'));

program
  .command('mcp')
  .description('Run the admin MCP server over stdio (for Claude Code)')
  .option('--config <path>', 'Path to admin config TOML')
  .action(notYetImplemented('mcp'));

program
  .command('install')
  .description('Interactive setup: collect config + install launchd agent')
  .action(notYetImplemented('install'));

program
  .command('uninstall')
  .description('Remove the bloque-admin launchd agent')
  .action(notYetImplemented('uninstall'));

program
  .command('status')
  .description('Show launchd status and probe the /health endpoint')
  .action(notYetImplemented('status'));

const configCmd = program
  .command('config')
  .description('Manage admin-tools config');

configCmd
  .command('init')
  .description('Scaffold ~/.bloque/admin-tools.toml from the example')
  .option('--force', 'Overwrite an existing config file')
  .action((opts: { force?: boolean }) => {
    if (fs.existsSync(DEFAULT_CONFIG_PATH) && !opts.force) {
      console.error(
        `${DEFAULT_CONFIG_PATH} already exists. Pass --force to overwrite.`,
      );
      process.exit(1);
    }
    const example = fs.readFileSync(
      path.join(import.meta.dirname, '..', 'config.example.toml'),
      'utf-8',
    );
    fs.mkdirSync(path.dirname(DEFAULT_CONFIG_PATH), {
      recursive: true,
      mode: 0o700,
    });
    fs.writeFileSync(DEFAULT_CONFIG_PATH, example, { mode: 0o600 });
    console.log(
      `Wrote ${DEFAULT_CONFIG_PATH}. Edit it before running \`bloque-admin config check\`.`,
    );
  });

configCmd
  .command('check')
  .description('Validate the admin config and JWT scopes')
  .option('--config <path>', 'Path to admin config TOML')
  .action((opts: { config?: string }) => {
    try {
      const config = loadConfig(opts.config);
      verifyJwtScopes(config.api.jwt);
      console.log('ok: config parses, required scopes present on JWT.');
    } catch (err) {
      if (err instanceof AdminConfigError || err instanceof JwtScopeError) {
        console.error(err.message);
        process.exit(1);
      }
      throw err;
    }
  });

program.parse();
